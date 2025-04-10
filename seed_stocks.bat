@echo off
echo Seeding database with stock data...
cd backend
python -m trading.seed_stocks
pause 