from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer, UserProfileSerializer
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from rest_framework.decorators import api_view, permission_classes
from trading.models import UserProfile

logger = logging.getLogger(__name__)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info(f"New user registered: {user.username} ({user.email})")
        
        # Generate a verification token and build the verification URL
        token = default_token_generator.make_token(user)
        uid = user.pk
        verify_url = request.build_absolute_uri(
            reverse('verify_email') + f"?uid={uid}&token={token}"
        )
        
        subject = "Welcome to Fake Trading - Verify Your Email"
        plain_message = (
            f"Hi {user.username},\n\n"
            "Thank you for registering with Fake Trading. Please verify your email by visiting the following link:\n"
            f"{verify_url}\n\n"
            "If the link doesn't work, copy and paste the URL into your browser."
        )
        
        # HTML email content with a styled verification button
        html_message = f"""
        <html>
          <body style="background-color: #f4f4f4; font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Welcome to Fake Trading, {user.username}!</h2>
              <p style="color: #555;">Thank you for signing up. Please verify your email address to activate your account.</p>
              <a href="{verify_url}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; color: #fff; background-color: #1a73e8; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
              <p style="margin-top: 20px; color: #777; font-size: 12px;">
                If the button doesn't work, please copy and paste the following URL into your browser:<br/>
                <a href="{verify_url}" style="color: #1a73e8;">{verify_url}</a>
              </p>
            </div>
          </body>
        </html>
        """
        
        # Try sending the email
        try:
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
            )
        except Exception as e:
            logger.error(f"Error sending verification email to {user.email}: {e}")
        
        return Response({
            "user": RegisterSerializer(user, context=self.get_serializer_context()).data,
            "message": "User registered successfully. Please check your email to verify your account."
        }, status=status.HTTP_201_CREATED)

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        uid = request.query_params.get('uid')
        token = request.query_params.get('token')
        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response({"error": "Invalid user ID."}, status=status.HTTP_400_BAD_REQUEST)
        
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({"message": "Email verified successfully. You can now log in."})
        else:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def profile_by_username(request):
    """Get user profile by username"""
    username = request.query_params.get('username')
    if not username:
        return Response({"error": "Username parameter required."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username=username)
        # Get or create a UserProfile for this user
        user_profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'balance': 100000.00}
        )
        serializer = UserProfileSerializer(user_profile)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get the profile of the authenticated user"""
    try:
        user_profile, created = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={'balance': 100000.00}
        )
        serializer = UserProfileSerializer(user_profile)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        return Response({"error": "Failed to retrieve user profile."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)