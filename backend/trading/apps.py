from django.apps import AppConfig
from django.db.models.signals import post_migrate

class TradingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'trading'

    def ready(self):
        # Import and start the scheduler only if not in a management command.
        if not hasattr(self, 'scheduler_started'):
            try:
                from .scheduler import start
                start()
                self.scheduler_started = True  # Prevent multiple startups
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to start scheduler: {e}")

        # Import signal handlers
        from . import signals
        # Connect signals
        post_migrate.connect(self.create_initial_stocks, sender=self)

    def create_initial_stocks(self, sender, **kwargs):
        # Delay import to avoid circular imports
        from django.db import connection
        
        # Check if migrations have been applied before creating stocks
        with connection.cursor() as cursor:
            tables = connection.introspection.table_names()
            if 'trading_stock' not in tables:
                return
                
        # Now it's safe to import models and create stocks
        from .models import Stock
        
        # Sample stocks to add if the table is empty
        if Stock.objects.count() == 0:
            initial_stocks = [
                {'symbol': 'AAPL', 'name': 'Apple Inc.', 'price': 150.00},
                {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'price': 300.00},
                {'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'price': 120.00},
                {'symbol': 'AMZN', 'name': 'Amazon.com Inc.', 'price': 130.00},
                {'symbol': 'META', 'name': 'Meta Platforms, Inc.', 'price': 330.00},
                {'symbol': 'TSLA', 'name': 'Tesla, Inc.', 'price': 190.00},
                {'symbol': 'NVDA', 'name': 'NVIDIA Corporation', 'price': 210.00},
                {'symbol': 'JPM', 'name': 'JPMorgan Chase & Co.', 'price': 150.00},
                {'symbol': 'V', 'name': 'Visa Inc.', 'price': 240.00}
            ]
            
            for stock_data in initial_stocks:
                Stock.objects.create(**stock_data)
