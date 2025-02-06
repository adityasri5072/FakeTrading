from django.urls import path
from .views import (
    get_stocks,
    get_transactions,
    buy_stock,
    sell_stock,
    get_portfolio,
    get_user_profile,
    get_stock_detail,
    get_portfolio_history,
)

urlpatterns = [
     path('stocks/', get_stocks, name="stock-list"),
    path('transactions/<int:user_id>/', get_transactions, name="transaction-list"),
    path('buy/<int:user_id>/<str:stock_symbol>/<int:quantity>/', buy_stock, name="buy-stock"),
    path('sell/<int:user_id>/<str:stock_symbol>/<int:quantity>/', sell_stock, name="sell-stock"),
    path('portfolio/<int:user_id>/', get_portfolio, name="portfolio"),
    path('profile/<int:user_id>/', get_user_profile, name="profile"),
    path('stock-detail/<int:user_id>/<str:stock_symbol>/', get_stock_detail, name="stock-detail"),
    path('portfolio_history/<int:user_id>/', get_portfolio_history, name="portfolio-history"),
]
