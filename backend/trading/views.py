import logging
import requests
import datetime
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import UserProfile, Transaction, Stock

from decouple import config
from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Stock, Transaction, UserProfile
from .serializers import StockSerializer, TransactionSerializer

# Set up a logger for this module.
logger = logging.getLogger(__name__)

def update_stock_price(stock):
    """
    Helper function to update a single stock's price using the Alpha Vantage API.
    """
    api_key = config('ALPHA_VANTAGE_API_KEY', default=None)
    if not api_key:
        logger.error("Alpha Vantage API key is not set in .env")
        return

    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={stock.symbol}&apikey={api_key}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error(f"Error fetching data for {stock.symbol}: {e}")
        return

    data = response.json()
    
    # If the API returns a rate limit note, log it and skip updating.
    if "Note" in data:
        logger.warning(f"Alpha Vantage rate limit reached: {data['Note']}")
        return

    # Check if "Global Quote" is present in the data.
    if "Global Quote" in data:
        global_quote = data["Global Quote"]
        price_str = global_quote.get("05. price")
        if price_str:
            try:
                new_price = float(price_str)
                stock.price = new_price
                stock.save()
                logger.info(f"Updated {stock.symbol} price to {new_price}")
            except ValueError as ve:
                logger.error(f"Invalid price data for {stock.symbol}: {ve}")
        else:
            logger.warning(f"No price data available for {stock.symbol}")
    else:
        logger.warning(f"No 'Global Quote' key in response for {stock.symbol}: {data}")


@api_view(['GET'])
def get_stocks(request):
    """
    Retrieve all stocks from the database.
    Stock prices are updated via the scheduled background job.
    """
    stocks = Stock.objects.all()
    serializer = StockSerializer(stocks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_transactions(request, user_id):
    """
    Retrieve all transactions for a given user, ordered by most recent.
    """
    try:
        transactions = Transaction.objects.filter(user__id=user_id).order_by('-timestamp')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching transactions for user {user_id}: {e}")
        return Response({"error": "Failed to retrieve transactions"}, status=500)

@api_view(['POST'])
def buy_stock(request, user_id, stock_symbol, quantity):
    """
    Handle buying stocks for a user.
    """
    try:
        stock = Stock.objects.get(symbol=stock_symbol)
    except Stock.DoesNotExist:
        return Response({"error": "Stock not found"}, status=404)
    
    try:
        user_profile = UserProfile.objects.get(user__id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    total_cost = stock.price * quantity
    if user_profile.balance < total_cost:
        return Response({"error": "Insufficient funds"}, status=400)
    
    # Deduct cost and save user profile.
    user_profile.balance -= total_cost
    user_profile.save()
    
    # Create the transaction record.
    transaction = Transaction(
        user=user_profile.user,
        stock=stock,
        quantity=quantity,
        price_at_purchase=stock.price
    )
    transaction.save()
    return Response({"message": "Transaction successful", "transaction_id": transaction.id})

@api_view(['POST'])
def sell_stock(request, user_id, stock_symbol, quantity):
    """
    Handle selling stocks for a user.
    """
    try:
        stock = Stock.objects.get(symbol=stock_symbol)
    except Stock.DoesNotExist:
        return Response({"error": "Stock not found"}, status=404)
    
    try:
        user_profile = UserProfile.objects.get(user__id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    total_shares = Transaction.objects.filter(user=user_profile.user, stock=stock).aggregate(Sum('quantity'))['quantity__sum'] or 0
    if total_shares < quantity:
        return Response({"error": "Insufficient shares"}, status=400)
    
    total_value = stock.price * quantity
    user_profile.balance += total_value
    user_profile.save()
    
    # Record the sale with a negative quantity.
    transaction = Transaction(
        user=user_profile.user,
        stock=stock,
        quantity=-quantity,
        price_at_purchase=stock.price
    )
    transaction.save()
    return Response({"message": "Transaction successful", "transaction_id": transaction.id})

@api_view(['GET'])
def get_portfolio(request, user_id):
    """
    Retrieve a user's portfolio by aggregating all transactions.
    Returns stock symbol, total quantity, and total value.
    """
    portfolio = Transaction.objects.filter(user__id=user_id) \
        .values('stock__symbol') \
        .annotate(total_quantity=Sum('quantity')) \
        .order_by('stock__symbol')
    
    portfolio_data = []
    for item in portfolio:
        stock_symbol = item['stock__symbol']
        total_quantity = item['total_quantity']
        if total_quantity == 0:
            continue
        try:
            stock = Stock.objects.get(symbol=stock_symbol)
        except Stock.DoesNotExist:
            continue
        total_value = stock.price * total_quantity
        portfolio_data.append({
            "stock_symbol": stock_symbol,
            "total_quantity": total_quantity,
            "total_value": total_value
        })
    return Response(portfolio_data)

@api_view(['GET'])
def get_user_profile(request, user_id):
    """
    Retrieve user profile details (e.g., username and current balance).
    """
    try:
        user_profile = UserProfile.objects.get(user__id=user_id)
        data = {
            "username": user_profile.user.username,
            "balance": str(user_profile.balance)
        }
        return Response(data)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['GET'])
def get_stock_detail(request, user_id, stock_symbol):
    """
    Retrieve detailed information for a specific stock in the user's portfolio,
    including the average purchase price, current price, and percent change.
    """
    try:
        stock = Stock.objects.get(symbol=stock_symbol)
    except Stock.DoesNotExist:
        return Response({"error": "Stock not found"}, status=404)
    
    transactions = Transaction.objects.filter(user__id=user_id, stock=stock)
    if not transactions.exists():
        return Response({"error": "No transactions for this stock"}, status=404)
    
    total_quantity = transactions.aggregate(total=Sum('quantity'))['total'] or 0

    # Compute the weighted average purchase price considering only buy transactions.
    total_cost = 0
    total_bought = 0
    for tx in transactions:
        if tx.quantity > 0:
            total_cost += tx.quantity * float(tx.price_at_purchase)
            total_bought += tx.quantity
    average_price = total_cost / total_bought if total_bought != 0 else 0

    current_price = float(stock.price)
    percent_change = ((current_price - average_price) / average_price * 100) if average_price != 0 else 0

    data = {
        "stock_symbol": stock.symbol,
        "stock_name": stock.name,
        "total_quantity": total_quantity,
        "average_purchase_price": average_price,
        "current_price": current_price,
        "percent_change": percent_change,
    }
    return Response(data)

@api_view(['GET'])
def get_portfolio_history(request, user_id):
    """
    Simulate historical portfolio data for a user.
    
    For demonstration, we assume:
      - Starting value is $100,000 (at time = now - 30 days).
      - A mid point (now - 15 days) is the average of $100,000 and the current portfolio value.
      - The current portfolio value is computed as: 
            current cash balance + (sum over holdings: (quantity * current stock price))
    """
    # Get the user's profile
    try:
        user_profile = UserProfile.objects.get(user__id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    
    # Aggregate the user's holdings by stock symbol
    portfolio_agg = (
        Transaction.objects.filter(user=user_profile.user)
        .values('stock__symbol')
        .annotate(total_quantity=Sum('quantity'))
    )
    
    holdings_value = 0
    for item in portfolio_agg:
        try:
            stock = Stock.objects.get(symbol=item['stock__symbol'])
            holdings_value += stock.price * item['total_quantity']
        except Stock.DoesNotExist:
            continue
    
    # Convert both to float to avoid mixing float and Decimal types
    current_value = float(user_profile.balance) + float(holdings_value)

    now = datetime.datetime.now()
    history = [
        {
            "time": (now - datetime.timedelta(days=30)).strftime("%Y-%m-%d"),
            "value": 100000  # starting balance
        },
        {
            "time": (now - datetime.timedelta(days=15)).strftime("%Y-%m-%d"),
            "value": (100000 + current_value) / 2  # midpoint value
        },
        {
            "time": now.strftime("%Y-%m-%d"),
            "value": current_value  # current portfolio value
        },
    ]
    return Response(history)