import logging
import requests
import datetime
import random
from django.db.models import Sum
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UserProfile, Transaction, Stock, Watchlist, StockPriceHistory

from decouple import config
from django.contrib.auth.models import User
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
@permission_classes([IsAuthenticated])
def get_transactions(request, user_id=None):
    """
    Retrieve all transactions for a given user, ordered by most recent.
    If no user_id is provided, use the authenticated user's ID.
    """
    try:
        # If no user_id is provided, use the authenticated user
        if user_id is None:
            user_id = request.user.id
        # Only allow users to see their own transactions unless they're staff
        elif user_id != request.user.id and not request.user.is_staff:
            return Response(
                {"error": "You are not authorized to view these transactions"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        transactions = Transaction.objects.filter(user__id=user_id).order_by('-timestamp')
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching transactions for user {user_id}: {e}")
        return Response({"error": "Failed to retrieve transactions"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    Returns stock symbol, total quantity, average buy price, current price,
    total value, gain/loss and gain/loss percentage.
    """
    portfolio = Transaction.objects.filter(user__id=user_id) \
        .values('stock__symbol') \
        .annotate(total_quantity=Sum('quantity')) \
        .order_by('stock__symbol')
    
    portfolio_data = []
    for item in portfolio:
        stock_symbol = item['stock__symbol']
        total_quantity = item['total_quantity']
        
        # Skip stocks that are no longer held
        if total_quantity <= 0:
            continue
            
        try:
            stock = Stock.objects.get(symbol=stock_symbol)
        except Stock.DoesNotExist:
            continue
            
        # Get all transactions for this stock to calculate average buy price
        transactions = Transaction.objects.filter(
            user__id=user_id, 
            stock__symbol=stock_symbol
        )
        
        # Calculate weighted average buy price based only on buy transactions
        total_buy_cost = 0
        total_buy_quantity = 0
        
        for tx in transactions:
            if tx.quantity > 0:  # Only consider buy transactions
                total_buy_cost += float(tx.price_at_purchase) * tx.quantity
                total_buy_quantity += tx.quantity
        
        # Calculate average buy price (avoid division by zero)
        avg_buy_price = total_buy_cost / total_buy_quantity if total_buy_quantity > 0 else 0
        
        # Current value and gain/loss calculations
        current_price = float(stock.price)
        current_value = current_price * total_quantity
        buy_value = avg_buy_price * total_quantity
        gain_loss = current_value - buy_value
        gain_loss_percentage = (gain_loss / buy_value * 100) if buy_value > 0 else 0
        
        portfolio_data.append({
            "stock_symbol": stock_symbol,
            "name": stock.name,
            "total_quantity": total_quantity,
            "average_buy_price": round(avg_buy_price, 2),
            "current_price": round(current_price, 2),
            "total_value": round(current_value, 2),
            "gain_loss": round(gain_loss, 2),
            "gain_loss_percentage": round(gain_loss_percentage, 2)
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

# Watchlist endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_watchlist(request):
    """
    Get the authenticated user's watchlist
    """
    try:
        watchlist_items = Watchlist.objects.filter(user=request.user).select_related('stock')
        watched_stocks = [item.stock for item in watchlist_items]
        serializer = StockSerializer(watched_stocks, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching watchlist for user {request.user.id}: {e}")
        return Response(
            {"error": "Failed to retrieve watchlist"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_watchlist(request, stock_symbol):
    """
    Add a stock to the user's watchlist
    """
    try:
        # Check if stock exists
        try:
            stock = Stock.objects.get(symbol=stock_symbol)
        except Stock.DoesNotExist:
            return Response(
                {"error": f"Stock with symbol {stock_symbol} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already in watchlist
        if Watchlist.objects.filter(user=request.user, stock=stock).exists():
            return Response(
                {"message": f"{stock_symbol} is already in your watchlist"}, 
                status=status.HTTP_200_OK
            )
        
        # Add to watchlist
        Watchlist.objects.create(user=request.user, stock=stock)
        return Response(
            {"message": f"Added {stock_symbol} to your watchlist"},
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        logger.error(f"Error adding {stock_symbol} to watchlist for user {request.user.id}: {e}")
        return Response(
            {"error": "Failed to add stock to watchlist"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_watchlist(request, stock_symbol):
    """
    Remove a stock from the user's watchlist
    """
    try:
        # Check if stock exists
        try:
            stock = Stock.objects.get(symbol=stock_symbol)
        except Stock.DoesNotExist:
            return Response(
                {"error": f"Stock with symbol {stock_symbol} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Try to delete the watchlist entry
        result = Watchlist.objects.filter(user=request.user, stock=stock).delete()
        if result[0] > 0:  # If something was deleted
            return Response(
                {"message": f"Removed {stock_symbol} from your watchlist"},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": f"{stock_symbol} is not in your watchlist"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        logger.error(f"Error removing {stock_symbol} from watchlist for user {request.user.id}: {e}")
        return Response(
            {"error": "Failed to remove stock from watchlist"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def simulate_realistic_price_changes(request):
    """
    Simulate realistic price changes for all stocks.
    This creates more subtle price movements (between -1% and +1%)
    and records price history.
    """
    # Get all stocks
    stocks = Stock.objects.all()
    updated_stocks = []
    
    for stock in stocks:
        # Generate a realistic random change (between -1% and +1%)
        change_percent = random.uniform(-0.01, 0.01)
        old_price = float(stock.price)
        
        # Calculate new price (ensure it stays positive)
        new_price = max(0.01, old_price * (1 + change_percent))
        
        # Apply some slight volatility to well-known stocks
        if stock.symbol in ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA']:
            volatility_factor = random.uniform(0.8, 1.2)
            new_price = new_price * volatility_factor
        
        # Round to 2 decimal places
        new_price = round(new_price, 2)
        
        # Update the stock price
        stock.price = new_price
        stock.save()
        
        # Record in price history
        StockPriceHistory.objects.create(
            stock=stock,
            price=new_price
        )
        
        updated_stocks.append({
            'symbol': stock.symbol,
            'name': stock.name,
            'old_price': old_price,
            'new_price': new_price,
            'change_percent': change_percent * 100  # Convert to percentage
        })
    
    logger.info(f"Simulated realistic price changes for {len(updated_stocks)} stocks")
    return Response({
        'message': f"Updated prices for {len(updated_stocks)} stocks",
        'stocks': updated_stocks
    })

@api_view(['GET'])
def get_stock_price_history(request, stock_symbol):
    """
    Get the price history for a specific stock.
    """
    try:
        stock = Stock.objects.get(symbol=stock_symbol)
    except Stock.DoesNotExist:
        return Response({"error": f"Stock with symbol {stock_symbol} not found"}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    # Get the price history (limited to last 100 entries)
    history = StockPriceHistory.objects.filter(stock=stock).order_by('-timestamp')[:100]
    
    # Format the data for the frontend
    history_data = [
        {
            'price': float(entry.price),
            'timestamp': entry.timestamp.isoformat()
        }
        for entry in history
    ]
    
    # If we don't have enough history, create some fake historical data
    if len(history_data) < 5:
        # Start with current price
        base_price = float(stock.price)
        now = datetime.datetime.now()
        
        # Generate 30 days of historical data
        for i in range(1, 31):
            # Add some randomness to the price (simulate daily changes)
            price_change = random.uniform(-0.02, 0.02)
            historical_price = round(base_price * (1 + price_change), 2)
            
            # Adjust base price for next iteration (trending slightly upward)
            base_price = historical_price * random.uniform(0.998, 1.002)
            
            # Calculate the timestamp (days in the past)
            days_ago = now - datetime.timedelta(days=i)
            
            # Add to history data
            history_data.append({
                'price': historical_price,
                'timestamp': days_ago.isoformat()
            })
    
    return Response({
        'symbol': stock_symbol,
        'name': stock.name,
        'current_price': float(stock.price),
        'history': sorted(history_data, key=lambda x: x['timestamp'])
    })