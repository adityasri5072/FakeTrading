from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_homepage(request):
    return JsonResponse({
        "message": "Welcome to the Fake Trading API!",
        "endpoints": [
            "/api/stocks/",
            "/api/transactions/<user_id>/",
            "/api/buy/<user_id>/<stock_symbol>/<quantity>/",
            "/api/sell/<user_id>/<stock_symbol>/<quantity>/",
            "/api/portfolio/<user_id>/",
            "/api/profile/<user_id>/",
            "/api/portfolio_history/<user_id>/",
            "/api/users/register/",
            "/api/users/login/",
            "/api/users/token/refresh/"
        ]
    })

urlpatterns = [
    path('', api_homepage, name="api-home"),
    path('admin/', admin.site.urls),
    path('api/', include('trading.urls')),
    path('api/users/', include('users.urls')),
]
