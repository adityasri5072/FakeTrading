# trading/management/commands/seed_stocks_external.py

import csv
import requests
from django.core.management.base import BaseCommand
from trading.models import Stock
from decouple import config

class Command(BaseCommand):
    help = "Seeds the database with stock data from Alpha Vantage Listing Status API."

    def handle(self, *args, **options):
        api_key = config('ALPHA_VANTAGE_API_KEY')
        if not api_key:
            self.stdout.write(self.style.ERROR("Alpha Vantage API key is not set in .env"))
            return

        # Construct the URL to fetch the listings.
        url = f"https://www.alphavantage.co/query?function=LISTING_STATUS&apikey={api_key}"

        self.stdout.write("Fetching stock listings from Alpha Vantage...")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Failed to fetch data: {e}"))
            return

        csv_data = response.text.splitlines()
        reader = csv.DictReader(csv_data)
        count = 0

        for row in reader:
            # Filter only ACTIVE stocks. You can add more filtering here (e.g., by exchange)
            if row.get("status", "").strip().upper() != "ACTIVE":
                continue

            symbol = row.get("symbol", "").strip().upper()
            name = row.get("name", "").strip()

            if not symbol or not name:
                continue

            # Set a default starting price; you may update it later using the price update command.
            price = 100.00

            stock, created = Stock.objects.update_or_create(
                symbol=symbol,
                defaults={"name": name, "price": price},
            )
            count += 1
            if created:
                self.stdout.write(self.style.SUCCESS(f"Added stock: {symbol} - {name}"))
            else:
                self.stdout.write(f"Updated stock: {symbol} - {name}")
        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {count} stocks."))
