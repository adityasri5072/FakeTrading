"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { getStocks, buyStock, sellStock, simulateRealisticPriceChanges, getStockPriceHistory, getWatchlist, addToWatchlist, removeFromWatchlist } from "../utils/api";
import PortfolioPerformanceChart from "../components/PortfolioPerformanceChart";
import { FiArrowRight, FiTrendingUp, FiDollarSign, FiActivity, FiX, FiRefreshCw, FiInfo, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { checkAuthState } from "../utils/auth";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components we need
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Function to check auth status
    const checkAuthStatus = () => {
      const isAuth = checkAuthState();
      setIsLoggedIn(isAuth);
    };
    
    // Initial check
    checkAuthStatus();
    
    // Listen for auth state changes
    window.addEventListener("authStateChanged", checkAuthStatus);
    
    // Clean up
    return () => {
      window.removeEventListener("authStateChanged", checkAuthStatus);
    };
  }, []);
  
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Toaster />
      <HeroSection isLoggedIn={isLoggedIn} />
      <TradingSection isLoggedIn={isLoggedIn} />
      <StocksListSection />
      <MarketInsightsSection />
      {isLoggedIn && <PortfolioPerformanceChart userId={localStorage.getItem("userId")} />}
      <FooterSection />
    </div>
  );
}

function HeroSection({ isLoggedIn }) {
  const router = useRouter();
  const username = localStorage.getItem("username") || "Guest";
  
  const handleGetStarted = () => {
    if (isLoggedIn) {
      document.getElementById("trading").scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/login");
    }
  };
  
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative overflow-hidden py-20"
    >
      {/* Background gradient with animation */}
      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 bg-gradient-to-r from-purple-800 via-violet-600 to-indigo-800 z-0"
      />
      
      {/* Animated particles */}
      <div className="absolute inset-0 z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 10 + 5 + "px",
              height: Math.random() * 10 + 5 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto text-center px-4 relative z-20">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200"
        >
          {isLoggedIn ? `Welcome back, ${username}!` : "Welcome to FakeTrading"}
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xl mb-10 text-indigo-100 max-w-2xl mx-auto"
        >
          {isLoggedIn 
            ? "Continue building your portfolio with virtual funds. Track your investments in real-time."
            : "Experience real stock trading with $100K in virtual funds. Track your performance with real-time data and advanced analytics."}
        </motion.p>
        
        <motion.button
          onClick={handleGetStarted}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="inline-flex items-center bg-white text-purple-800 font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl hover:bg-indigo-100 transition-all"
        >
          {isLoggedIn ? "Trade Now" : "Get Started"} <FiArrowRight className="ml-2" />
        </motion.button>
      </div>
    </motion.section>
  );
}

function TradingSection({ isLoggedIn }) {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [stockSymbol, setStockSymbol] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState("buy");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(null);

  useEffect(() => {
    // Check authentication and get user information
    const checkAuthAndGetUser = () => {
      const isAuth = checkAuthState();
      const storedUserId = localStorage.getItem("userId");
      
      if (isAuth && storedUserId) {
        setUserId(storedUserId);
        fetchUserBalance(storedUserId);
      } else {
        setUserId(null);
        setUserBalance(null);
      }
    };
    
    // Initial check
    checkAuthAndGetUser();

    // Check for pre-filled symbol from watchlist
    const tradeSymbol = sessionStorage.getItem("tradeSymbol");
    if (tradeSymbol) {
      setStockSymbol(tradeSymbol);
      // Clear after using it
      sessionStorage.removeItem("tradeSymbol");
      
      // Focus the stock input field
      setTimeout(() => {
        const stockInput = document.getElementById("stockSymbolInput");
        if (stockInput) {
          stockInput.focus();
        }
      }, 100);
    }

    // Listen for auth changes
    window.addEventListener("authStateChanged", checkAuthAndGetUser);

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      if (userId) {
        fetchUserBalance(userId);
      }
    };

    // Listen for trade symbol selection events
    const handleTradeSymbolSelected = (event) => {
      if (event.detail && event.detail.symbol) {
        setStockSymbol(event.detail.symbol);
      }
    };

    window.addEventListener("balanceUpdated", handleBalanceUpdate);
    window.addEventListener("tradeSymbolSelected", handleTradeSymbolSelected);

    return () => {
      window.removeEventListener("authStateChanged", checkAuthAndGetUser);
      window.removeEventListener("balanceUpdated", handleBalanceUpdate);
      window.removeEventListener("tradeSymbolSelected", handleTradeSymbolSelected);
    };
  }, [userId]);

  const fetchUserBalance = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/profile/${id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserBalance(parseFloat(data.balance));
      }
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      toast.error("Please log in to trade stocks");
      setTimeout(() => router.push("/login"), 1500);
      return;
    }

    if (!stockSymbol) {
      toast.error("Please enter a stock symbol");
      return;
    }

    if (quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }
    
    setIsLoading(true);
    setMessage("");
    
    try {
      let result;
      if (action === "buy") {
        result = await buyStock(userId, stockSymbol, quantity);
        toast.success(`Successfully purchased ${quantity} shares of ${stockSymbol}!`);
      } else {
        result = await sellStock(userId, stockSymbol, quantity);
        toast.success(`Successfully sold ${quantity} shares of ${stockSymbol}!`);
      }
      
      setMessage(result.message || `Transaction successful!`);
      
      // Dispatch an event to update the user balance
      window.dispatchEvent(new CustomEvent("balanceUpdated"));
      
      // Reset form after successful transaction
      setStockSymbol("");
      setQuantity(1);
    } catch (error) {
      const errorMsg = error.message || "Transaction failed";
      toast.error(errorMsg);
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section
      id="trading"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="container mx-auto py-16 px-4"
    >
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 backdrop-filter backdrop-blur-sm bg-opacity-90 border border-gray-700">
        <motion.h2 
          initial={{ y: -20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
        >
          Trade Stocks
        </motion.h2>
        
        {userBalance !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 rounded-lg bg-gray-800/50 border border-gray-700 text-center"
          >
            <span className="text-gray-400">Available Balance:</span> 
            <span className="ml-2 text-xl font-bold text-green-400">
              ${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <label className="block mb-2 text-white font-medium">Stock Symbol</label>
            <input
              id="stockSymbolInput"
              type="text"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., AAPL"
              className="w-full p-4 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </motion.div>
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <label className="block mb-2 text-white font-medium">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              placeholder="Number of shares"
              className="w-full p-4 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </motion.div>
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <label className="block mb-2 text-white font-medium">Action</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAction("buy")}
                className={`p-4 rounded-lg font-bold flex items-center justify-center transition-all ${
                  action === "buy"
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <FiTrendingUp className="mr-2" /> Buy
              </button>
              <button
                type="button"
                onClick={() => setAction("sell")}
                className={`p-4 rounded-lg font-bold flex items-center justify-center transition-all ${
                  action === "sell"
                    ? "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <FiDollarSign className="mr-2" /> Sell
              </button>
            </div>
          </motion.div>
          
          <motion.button
            type="submit"
            disabled={isLoading || !isLoggedIn}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: isLoggedIn ? 1.03 : 1 }}
            whileTap={{ scale: isLoggedIn ? 0.97 : 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`w-full bg-gradient-to-r ${
              isLoggedIn 
                ? "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                : "from-gray-600 to-gray-700 cursor-not-allowed"
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : !isLoggedIn ? (
              "Log in to Trade"
            ) : action === "buy" ? (
              "Buy Stock"
            ) : (
              "Sell Stock"
            )}
          </motion.button>
        </form>
        
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 p-4 rounded-lg text-center ${
                message.includes("successful") 
                  ? "bg-green-900/20 text-green-400 border border-green-900" 
                  : "bg-red-900/20 text-red-400 border border-red-900"
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function StocksListSection() {
  const [stocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("symbol");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [priceChanges, setPriceChanges] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  
  // Stock history modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockHistory, setStockHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuthStatus = () => {
      const accessToken = localStorage.getItem("accessToken");
      setIsLoggedIn(!!accessToken);
      
      if (!!accessToken) {
        fetchWatchlist();
      }
    };
    
    checkAuthStatus();
    window.addEventListener("authStateChanged", checkAuthStatus);
    
    return () => {
      window.removeEventListener("authStateChanged", checkAuthStatus);
    };
  }, []);

  // Fetch user's watchlist
  const fetchWatchlist = async () => {
    if (!isLoggedIn) return;
    
    setLoadingWatchlist(true);
    try {
      const watchlistData = await getWatchlist();
      if (Array.isArray(watchlistData)) {
        setWatchlist(watchlistData.map(stock => stock.symbol));
      } else {
        console.error("Invalid watchlist data format:", watchlistData);
        setWatchlist([]);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      toast.error("Failed to load watchlist");
      setWatchlist([]);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  // Handle adding to watchlist
  const handleAddToWatchlist = async (symbol) => {
    if (!isLoggedIn) {
      toast.error("Please log in to add stocks to your watchlist");
      return;
    }
    
    try {
      await addToWatchlist(symbol);
      setWatchlist([...watchlist, symbol]);
      toast.success(`${symbol} added to watchlist`);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error(`Error adding to watchlist: ${error.message || "Unknown error"}`);
    }
  };

  // Handle removing from watchlist
  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlist(watchlist.filter(s => s !== symbol));
      toast.success(`${symbol} removed from watchlist`);
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error(`Error removing from watchlist: ${error.message || "Unknown error"}`);
    }
  };

  // Simulate realistic price changes and fetch updated stocks
  async function updateStockPrices() {
    try {
      // Simulate price changes in the backend
      await simulateRealisticPriceChanges();
      
      // Fetch the updated stocks
      await fetchStocks();
    } catch (error) {
      console.error("Error updating stock prices:", error);
      // Don't show error toast to avoid spamming the user during automatic updates
    }
  }
  
  // Fetch all stocks
  async function fetchStocks() {
    try {
      const data = await getStocks();
      
      // Calculate price changes
      const newPriceChanges = {};
      data.forEach(newStock => {
        const oldStock = stocks.find(s => s.symbol === newStock.symbol);
        if (oldStock) {
          const oldPrice = parseFloat(oldStock.price);
          const newPrice = parseFloat(newStock.price);
          if (oldPrice !== newPrice) {
            newPriceChanges[newStock.symbol] = {
              oldPrice,
              newPrice,
              timestamp: Date.now()
            };
          }
        }
      });
      
      setPriceChanges(newPriceChanges);
      setStocks(data);
      
      // Clear price change indicators after 3 seconds
      setTimeout(() => {
        setPriceChanges({});
      }, 3000);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      toast.error("Failed to load stocks");
    } finally {
      setLoading(false);
    }
  }

  // Function to load stock price history
  async function loadStockHistory(stockSymbol) {
    setLoadingHistory(true);
    try {
      const historyData = await getStockPriceHistory(stockSymbol);
      if (historyData) {
        setStockHistory(historyData);
      } else {
        toast.error(`Failed to load history for ${stockSymbol}`);
      }
    } catch (error) {
      console.error(`Error loading history for ${stockSymbol}:`, error);
      toast.error("Failed to load stock history");
    } finally {
      setLoadingHistory(false);
    }
  }

  // Handle opening the stock history modal
  const handleOpenStockHistory = async (stock) => {
    setSelectedStock(stock);
    setShowModal(true);
    await loadStockHistory(stock.symbol);
  };

  // Handle closing the stock history modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStock(null);
    setStockHistory(null);
  };

  // Initialize price updates on component mount
  useEffect(() => {
    // First fetch stocks
    fetchStocks();
    
    // Then set up interval for automatic updates with simulated price changes
    const intervalId = setInterval(updateStockPrices, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredStocks = stocks
    .filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "price") {
        // Ensure we're comparing numbers and handle missing/invalid data
        const priceA = parseFloat(a.current_price || a.price || "0");
        const priceB = parseFloat(b.current_price || b.price || "0");
        comparison = priceA - priceB;
      } else if (sortField === "symbol") {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Generate loading skeletons
  const skeletons = Array(9).fill().map((_, i) => (
    <div key={`skeleton-${i}`} className="bg-gray-800 rounded-lg p-6 shadow-lg animate-pulse">
      <div className="h-6 bg-gray-700 rounded mb-3 w-1/3"></div>
      <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
      <div className="h-5 bg-gray-700 rounded w-1/4"></div>
    </div>
  ));

  // Prepare chart data for the stock history modal
  const getChartData = () => {
    if (!stockHistory || !stockHistory.history || stockHistory.history.length === 0) {
      return null;
    }

    // Sort history by timestamp (oldest first)
    const sortedHistory = [...stockHistory.history].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Extract dates and prices
    const dates = sortedHistory.map(item => {
      const date = new Date(item.timestamp);
      return `${date.getMonth()+1}/${date.getDate()}`;
    });
    
    const prices = sortedHistory.map(item => item.price);

    // Determine if the overall trend is up or down
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const borderColor = lastPrice >= firstPrice ? 'rgba(52, 211, 153, 1)' : 'rgba(239, 68, 68, 1)';
    const backgroundColor = lastPrice >= firstPrice ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    return {
      labels: dates,
      datasets: [
        {
          label: `${stockHistory.symbol} Price`,
          data: prices,
          fill: true,
          borderColor: borderColor,
          backgroundColor: backgroundColor,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: borderColor,
          tension: 0.2,
        },
      ],
    };
  };

  // Chart options for the stock history chart
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          },
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      }
    },
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="container mx-auto py-16 px-4"
    >
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 backdrop-filter backdrop-blur-sm bg-opacity-90 border border-gray-700">
        <motion.h2 
          initial={{ y: -20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
        >
          Available Stocks
        </motion.h2>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 rounded-lg border border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </motion.div>
        
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-gray-400 mb-4 md:mb-0"
          >
            {loading ? "Loading stocks..." : `Showing ${filteredStocks.length} stocks`}
          </motion.div>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex space-x-2 text-sm"
          >
            <span className="text-gray-400">Sort by:</span>
            <button
              onClick={() => handleSort("symbol")}
              className={`px-2 py-1 rounded ${
                sortField === "symbol" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Symbol {sortField === "symbol" && (sortDirection === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSort("name")}
              className={`px-2 py-1 rounded ${
                sortField === "name" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSort("price")}
              className={`px-2 py-1 rounded ${
                sortField === "price" ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Price {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
            </button>
          </motion.div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletons}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredStocks.map((stock, index) => {
                const priceChange = priceChanges[stock.symbol];
                const price = parseFloat(stock.price);
                const priceColor = priceChange 
                  ? priceChange.newPrice > priceChange.oldPrice 
                    ? "text-green-400" 
                    : "text-red-400"
                  : "text-green-400";
                
                return (
                  <motion.div
                    key={stock.id || stock.symbol}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold">{stock.symbol}</h3>
                        <p className="text-sm text-gray-400 truncate max-w-[200px]">{stock.name}</p>
                      </div>
                      <div className="bg-purple-900/30 p-2 rounded-lg">
                        <FiActivity className="text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-2xl font-semibold ${priceColor}`}>
                          ${price.toFixed(2)}
                        </span>
                        {priceChange && (
                          <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={`text-sm ${priceColor}`}
                          >
                            {priceChange.newPrice > priceChange.oldPrice ? "↑" : "↓"}
                            ${Math.abs(priceChange.newPrice - priceChange.oldPrice).toFixed(2)}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex space-x-2">
                      <button
                        onClick={() => handleOpenStockHistory(stock)}
                        className="w-1/2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-medium py-2 px-4 rounded transition-colors"
                      >
                        Trade
                      </button>
                      
                      {isLoggedIn && (
                        watchlist.includes(stock.symbol) ? (
                          <button
                            onClick={() => handleRemoveFromWatchlist(stock.symbol)}
                            className="w-1/2 bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 font-medium py-2 px-4 rounded transition-colors"
                          >
                            Unwatch
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToWatchlist(stock.symbol)}
                            className="w-1/2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-medium py-2 px-4 rounded transition-colors"
                          >
                            Watch
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {/* Stock Price History Modal */}
        {showModal && selectedStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto mx-4 border border-gray-800 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedStock.symbol}</h3>
                  <p className="text-gray-400">{selectedStock.name}</p>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="bg-gray-800 hover:bg-gray-700 rounded-full p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6 bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Current Price</span>
                  <span className="text-2xl font-bold text-white">${parseFloat(selectedStock.price).toFixed(2)}</span>
                </div>
                
                {loadingHistory ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="loader"></div>
                  </div>
                ) : stockHistory ? (
                  <div className="h-64">
                    {getChartData() && (
                      <Line data={getChartData()} options={chartOptions} />
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 text-gray-500">
                    No price history available
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    handleCloseModal();
                    document.getElementById("trading").scrollIntoView({ behavior: "smooth" });
                    sessionStorage.setItem("tradeSymbol", selectedStock.symbol);
                    window.dispatchEvent(new CustomEvent("tradeSymbolSelected", { 
                      detail: { symbol: selectedStock.symbol } 
                    }));
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded transition-colors"
                >
                  Buy {selectedStock.symbol}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {!loading && filteredStocks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 text-gray-400"
          >
            No stocks found matching "{searchTerm}"
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

function MarketInsightsSection() {
  const insights = [
    {
      id: 1,
      title: "Market Trends",
      icon: <FiTrendingUp className="w-6 h-6" />,
      description:
        "Tech stocks showing strong momentum. Energy sector continues to face challenges due to global policy shifts.",
    },
    {
      id: 2,
      title: "Trading Strategies",
      icon: <FiActivity className="w-6 h-6" />,
      description:
        "Dollar-cost averaging proves effective in volatile markets. Consider diversifying across multiple sectors.",
    },
    {
      id: 3,
      title: "Financial News",
      icon: <FiDollarSign className="w-6 h-6" />,
      description:
        "Fed signals potential rate adjustments in coming months. Global supply chain issues beginning to resolve.",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="container mx-auto py-16 px-4"
    >
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 backdrop-filter backdrop-blur-sm bg-opacity-90 border border-gray-700">
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
        >
          Market Insights
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-purple-500/30 transition-all shadow-lg"
            >
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-14 h-14 rounded-lg flex items-center justify-center mb-4 shadow-lg">
                {insight.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{insight.title}</h3>
              <p className="text-gray-400">{insight.description}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-6 text-purple-400 font-medium flex items-center hover:text-purple-300 transition-colors"
              >
                Learn more
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function FooterSection() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-16">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <motion.h3 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
            >
              FakeTrading
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mb-6"
            >
              Experience the thrill of stock trading with none of the financial risk. Practice and perfect your trading strategies in a realistic environment.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex space-x-4"
            >
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                </svg>
              </a>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-lg font-bold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="#trading" className="text-gray-400 hover:text-white transition-colors">Trading</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Portfolio</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
            </ul>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-lg font-bold mb-4 text-white">Stay Updated</h4>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest updates and insights.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-lg transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500"
        >
          <p>&copy; {currentYear} FakeTrading. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
}
