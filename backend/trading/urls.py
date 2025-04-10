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
    get_watchlist,
    add_to_watchlist,
    remove_from_watchlist,
    simulate_realistic_price_changes,
    get_stock_price_history,
)

urlpatterns = [
    path('stocks/', get_stocks, name="stock-list"),
    path('transactions/', get_transactions, name="transaction-list"),
    path('transactions/<int:user_id>/', get_transactions, name="transaction-list-user"),
    path('buy/<int:user_id>/<str:stock_symbol>/<int:quantity>/', buy_stock, name="buy-stock"),
    path('sell/<int:user_id>/<str:stock_symbol>/<int:quantity>/', sell_stock, name="sell-stock"),
    path('portfolio/<int:user_id>/', get_portfolio, name="portfolio"),
    path('profile/<int:user_id>/', get_user_profile, name="profile"),
    path('stock-detail/<int:user_id>/<str:stock_symbol>/', get_stock_detail, name="stock-detail"),
    path('portfolio_history/<int:user_id>/', get_portfolio_history, name="portfolio-history"),
    path('watchlist/', get_watchlist, name="watchlist"),
    path('watchlist/add/<str:stock_symbol>/', add_to_watchlist, name="add_to_watchlist"),
    path('watchlist/remove/<str:stock_symbol>/', remove_from_watchlist, name="remove_from_watchlist"),
    path('simulate-price-changes/', simulate_realistic_price_changes, name="simulate-price-changes"),
    path('stock-history/<str:stock_symbol>/', get_stock_price_history, name="stock-price-history"),
]
