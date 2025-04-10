"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiBarChart2 } from 'react-icons/fi';
import { getPortfolio } from '../../utils/api';
import { checkAuthState } from '../../utils/auth';

/**
 * PortfolioPage Component
 * Displays the user's stock portfolio and performance metrics
 * @returns {JSX.Element} Portfolio page component
 */
export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchPortfolio = async () => {
      setIsLoading(true);
      const isAuth = checkAuthState();
      setIsLoggedIn(isAuth);
      
      if (isAuth) {
        try {
          await fetchPortfolio();
        } catch (error) {
          console.error('Error fetching portfolio:', error);
          toast.error('Failed to load your portfolio');
        }
      } else {
        setTimeout(() => {
          toast.info('Please log in to view your portfolio');
          router.push('/login');
        }, 1500);
      }
      setIsLoading(false);
    };
    
    checkAuthAndFetchPortfolio();
    
    // Listen for authentication changes
    const handleAuthChange = () => {
      checkAuthAndFetchPortfolio();
    };
    
    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [router]);
  
  /**
   * Fetch the user's portfolio from the API
   */
  const fetchPortfolio = async () => {
    try {
      const portfolioData = await getPortfolio();
      
      if (Array.isArray(portfolioData)) {
        console.log("Portfolio data loaded successfully:", portfolioData);
        // Transform the data to ensure all required fields are present
        const transformedData = portfolioData.map(holding => ({
          ...holding,
          current_price: parseFloat(holding.current_price) || 0,
          average_price: parseFloat(holding.average_price) || 0,
          quantity: parseInt(holding.quantity) || 0,
          name: holding.name || holding.symbol || 'Unknown',
          // Use the gain_loss from API if available, otherwise calculate it
          gain_loss: holding.gain_loss !== undefined ? 
            parseFloat(holding.gain_loss) : 
            (parseFloat(holding.current_price) - parseFloat(holding.average_price)) * parseInt(holding.quantity),
          // Use the gain_loss_percentage from API if available, otherwise calculate it
          gain_loss_percentage: holding.gain_loss_percentage !== undefined ?
            parseFloat(holding.gain_loss_percentage) :
            holding.average_price ? 
              ((parseFloat(holding.current_price) - parseFloat(holding.average_price)) / parseFloat(holding.average_price)) * 100 : 0
        }));
        setPortfolio(transformedData);
      } else {
        console.error("Portfolio data is not an array:", portfolioData);
        toast.error("Failed to load portfolio data");
        setPortfolio([]);
      }
    } catch (error) {
      console.error("Error in portfolio fetch:", error);
      toast.error("Could not load your portfolio");
      setPortfolio([]);
    }
  };
  
  /**
   * Calculate total portfolio value
   * @returns {number} Total value of all holdings
   */
  const calculateTotalValue = () => {
    return portfolio.reduce((total, holding) => {
      return total + (holding.quantity * holding.current_price);
    }, 0);
  };
  
  /**
   * Calculate total portfolio gain/loss
   * @returns {number} Total gain/loss amount
   */
  const calculateTotalGainLoss = () => {
    return portfolio.reduce((total, holding) => {
      return total + (holding.gain_loss || 0);
    }, 0);
  };
  
  /**
   * Navigate to trading section with pre-selected stock
   * @param {string} symbol - Stock symbol to trade
   */
  const handleTrade = (symbol) => {
    sessionStorage.setItem('tradeSymbol', symbol);
    router.push('/#trading');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md mx-auto border border-gray-700"
        >
          <FiDollarSign className="text-5xl text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Portfolio</h1>
          <p className="text-gray-400 mb-6">Please log in to view your portfolio.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Log In
          </button>
        </motion.div>
      </div>
    );
  }

  const totalValue = calculateTotalValue();
  const totalGainLoss = calculateTotalGainLoss();
  // Calculate the overall percentage gain/loss based on the current total value and the gain/loss
  const totalCostBasis = totalValue - totalGainLoss;
  const gainLossPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Your Portfolio</h1>
        <p className="text-gray-400">Track your investments and performance.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700"
        >
          <h3 className="text-gray-400 mb-2">Total Value</h3>
          <p className="text-2xl font-bold text-white flex items-center">
            <FiDollarSign className="mr-2" />
            {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700"
        >
          <h3 className="text-gray-400 mb-2">Total Gain/Loss</h3>
          <p className={`text-2xl font-bold flex items-center ${
            totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalGainLoss >= 0 ? <FiTrendingUp className="mr-2" /> : <FiTrendingDown className="mr-2" />}
            {totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700"
        >
          <h3 className="text-gray-400 mb-2">Return</h3>
          <p className={`text-2xl font-bold flex items-center ${
            gainLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {gainLossPercentage >= 0 ? <FiTrendingUp className="mr-2" /> : <FiTrendingDown className="mr-2" />}
            {gainLossPercentage.toFixed(2)}%
          </p>
        </motion.div>
      </div>

      {portfolio.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 p-8 rounded-lg shadow-xl text-center border border-gray-700"
        >
          <FiDollarSign className="text-5xl text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Your portfolio is empty</h2>
          <p className="text-gray-400 mb-6">
            Start investing by buying stocks from the home page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Browse Stocks
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolio.map((holding, index) => (
            <motion.div
              key={holding.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{holding.symbol}</h3>
                    <p className="text-gray-400 text-sm">{holding.name}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    holding.gain_loss >= 0 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {holding.gain_loss >= 0 ? (
                      <span className="flex items-center">
                        <FiTrendingUp className="mr-1" />
                        +{(holding.gain_loss_percentage || 0).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiTrendingDown className="mr-1" />
                        {(holding.gain_loss_percentage || 0).toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Shares</span>
                    <span className="text-white">{holding.quantity}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Avg. Price</span>
                    <span className="text-white flex items-center">
                      <FiDollarSign className="mr-1" />
                      {holding.average_price.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-white flex items-center">
                      <FiDollarSign className="mr-1" />
                      {holding.current_price.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Value</span>
                    <span className="text-white flex items-center">
                      <FiDollarSign className="mr-1" />
                      {(holding.quantity * holding.current_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleTrade(holding.symbol)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded transition-all flex items-center justify-center"
                >
                  <FiBarChart2 className="mr-2" />
                  Trade
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
