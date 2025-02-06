from rest_framework import serializers
from .models import Stock, Transaction

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    stock_symbol = serializers.SerializerMethodField()

    def get_stock_symbol(self, obj):
        return obj.stock.symbol if obj.stock else ""

    class Meta:
        model = Transaction
        fields = '__all__'
