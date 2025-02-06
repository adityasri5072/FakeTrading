import requests
from django.core.management.base import BaseCommand
from trading.models import Stock
from decouple import config

class Command(BaseCommand):
    help = 'Update stock prices using the Alpha Vantage API'

    def handle(self, *args, **options):
        api_key = config('ALPHA_VANTAGE_API_KEY', default=None)
        if not api_key:
            self.stdout.write(self.style.ERROR("Alpha Vantage API key not set in .env"))
            return

        stocks = Stock.objects.all()
        for stock in stocks:
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={stock.symbol}&apikey={api_key}"
            response = requests.get(url)
            if response.status_code != 200:
                self.stdout.write(self.style.WARNING(f"Failed to fetch data for {stock.symbol}"))
                continue

            data = response.json()
            if "Global Quote" in data and "05. price" in data["Global Quote"]:
                try:
                    new_price = float(data["Global Quote"]["05. price"])
                    stock.price = new_price
                    stock.save()
                    self.stdout.write(self.style.SUCCESS(f"Updated {stock.symbol} to {new_price}"))
                except ValueError:
                    self.stdout.write(self.style.WARNING(f"Invalid price data for {stock.symbol}"))
            else:
                self.stdout.write(self.style.WARNING(f"No price data for {stock.symbol}"))
