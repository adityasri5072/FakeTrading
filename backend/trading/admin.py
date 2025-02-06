from django.contrib import admin
from .models import UserProfile, Stock, Transaction

admin.site.register(UserProfile)
admin.site.register(Stock)
admin.site.register(Transaction)
