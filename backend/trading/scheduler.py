import logging
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from trading.models import Stock
from trading.views import update_stock_price  # reuse your helper
from django.core.management import call_command

logger = logging.getLogger(__name__)

def update_stock_prices_all():
    """
    Loop through all stocks and update their prices using update_stock_price.
    """
    stocks = Stock.objects.all()
    for stock in stocks:
        update_stock_price(stock)
    logger.info("All stock prices updated.")

def start():
    """
    Start the background scheduler to run update_stock_prices_all every 30 minutes.
    """
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")
    scheduler.add_job(
        func=update_stock_prices_all,
        trigger="interval",
        minutes=30,
        id="update_stock_prices",
        max_instances=1,
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started and will update stock prices every 30 minutes.")
