from django.urls import path
from .views import RegisterView, VerifyEmailView, profile_by_username, get_user_profile
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', VerifyEmailView.as_view(), name='verify_email'),
    path('profile_by_username/', profile_by_username, name='profile_by_username'),
    path('profile/', get_user_profile, name='user_profile'),
]
