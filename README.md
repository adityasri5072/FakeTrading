# Stock Portfolio Simulator

A full-stack web application that allows users to simulate stock trading with virtual funds, track their investments, and build a portfolio without real financial risk.

## Features

- **User Authentication**: Secure login and registration system
- **Stock Trading**: Buy and sell stocks with virtual currency
- **Watchlist**: Track stocks you're interested in
- **Portfolio Management**: View and analyze your stock holdings
- **Transaction History**: Keep track of all your trading activity
- **Real-time Price Simulation**: Experience realistic stock price changes

## Tech Stack

### Backend
- Django REST Framework
- PostgreSQL 
- JWT Authentication

### Frontend
- Next.js (React)
- Tailwind CSS
- Framer Motion for animations
- Chart.js for data visualization

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Installation

#### Backend Setup
1. Clone the repository:
   ```
   git clone https://github.com/your-username/stock-portfolio-simulator.git
   cd stock-portfolio-simulator
   ```

2. Set up a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

4. Apply migrations:
   ```
   python manage.py migrate
   ```

5. Seed the database with sample stocks:
   ```
   # On Windows, you can use the provided batch file:
   seed_stocks.bat
   
   # Or run the Python module directly:
   cd backend
   python -m trading.seed_stocks
   ```

6. Start the Django server:
   ```
   python manage.py runserver
   ```

#### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install frontend dependencies:
   ```
   npm install
   # or with yarn
   yarn install
   ```

3. Start the development server:
   ```
   npm run dev
   # or with yarn
   yarn dev
   ```

4. Access the application at `http://localhost:3000`

### Running the Application (Windows)

For convenience on Windows, you can use the provided batch file to start both servers at once:
```
start_servers.bat
```

## Usage

- **Register/Login**: Create an account or sign in to start trading
- **Trading**: Select a stock, specify quantity, and buy or sell
- **Watchlist**: Track stocks you're interested in
- **Portfolio**: View your holdings, current value, and performance
- **Transaction History**: Review all your past trades


## Acknowledgements

- Stock data is simulated and intended for educational purposes only
- Built for learning full-stack development and financial concepts