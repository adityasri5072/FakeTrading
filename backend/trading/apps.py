from django.apps import AppConfig

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
