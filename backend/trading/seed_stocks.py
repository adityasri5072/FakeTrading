import os
import sys
import django
import random

# Set up Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fake_trading_site.settings')
django.setup()

from trading.models import Stock

# List of stocks to add with real company names and realistic prices
stocks_to_add = [
    {"symbol": "GOOG", "name": "Alphabet Inc.", "price": 2842.50},
    {"symbol": "MSFT", "name": "Microsoft Corporation", "price": 325.80},
    {"symbol": "AMZN", "name": "Amazon.com, Inc.", "price": 3372.20},
    {"symbol": "TSLA", "name": "Tesla, Inc.", "price": 709.40},
    {"symbol": "FB", "name": "Meta Platforms, Inc.", "price": 333.75},
    {"symbol": "NVDA", "name": "NVIDIA Corporation", "price": 256.80},
    {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "price": 163.05},
    {"symbol": "V", "name": "Visa Inc.", "price": 230.10},
    {"symbol": "JNJ", "name": "Johnson & Johnson", "price": 172.45},
    {"symbol": "WMT", "name": "Walmart Inc.", "price": 148.90},
    {"symbol": "PG", "name": "Procter & Gamble Company", "price": 141.20},
    {"symbol": "DIS", "name": "The Walt Disney Company", "price": 185.30},
    {"symbol": "NFLX", "name": "Netflix, Inc.", "price": 549.60},
    {"symbol": "PYPL", "name": "PayPal Holdings, Inc.", "price": 269.55},
    {"symbol": "ADBE", "name": "Adobe Inc.", "price": 633.85},
    {"symbol": "INTC", "name": "Intel Corporation", "price": 53.70},
    {"symbol": "CRM", "name": "Salesforce, Inc.", "price": 260.40},
    {"symbol": "AMD", "name": "Advanced Micro Devices, Inc.", "price": 109.15}
]

def seed_stocks():
    count = 0
    for stock_data in stocks_to_add:
        # Add slight randomization to prices for realism
        adjusted_price = round(stock_data["price"] * (1 + (random.random() - 0.5) / 10), 2)
        
        # Check if stock already exists
        if not Stock.objects.filter(symbol=stock_data["symbol"]).exists():
            # Create new stock
            Stock.objects.create(
                symbol=stock_data["symbol"],
                name=stock_data["name"],
                price=adjusted_price
            )
            count += 1
            print(f"Added {stock_data['symbol']} - {stock_data['name']} at ${adjusted_price}")
        else:
            print(f"Stock {stock_data['symbol']} already exists, skipping")
    
    print(f"\nAdded {count} new stocks to the database")

if __name__ == "__main__":
    print("Starting stock seeding process...")
    seed_stocks()
    print("Stock seeding completed!") 