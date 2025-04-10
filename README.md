# FakeTrading - Stock Portfolio Simulator

A full-stack web application that allows users to practice stock trading with virtual money. Users can create portfolios, track stocks, manage watchlists, and simulate trading activities in a risk-free environment.

## Features

- User authentication and profile management
- Real-time stock price simulation
- Portfolio tracking and management
- Watchlist functionality
- Transaction history
- Interactive charts and market insights

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Django REST Framework
- Database: SQLite (Development)

## Getting Started

1. Clone the repository
2. Start the backend server:
   ```bash
   cd backend
   python manage.py runserver
   ```
3. Start the frontend server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Access the application at http://localhost:3000

## Development

The application runs on two servers:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

Use the provided `start_servers.bat` script to start both servers simultaneously.
