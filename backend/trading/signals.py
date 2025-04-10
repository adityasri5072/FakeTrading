from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile when a new User is created"""
    if created:
        try:
            UserProfile.objects.get_or_create(user=instance, defaults={'balance': 100000.00})
            logger.info(f"Created UserProfile for user {instance.username}")
        except Exception as e:
            logger.error(f"Error creating UserProfile for user {instance.username}: {e}") 