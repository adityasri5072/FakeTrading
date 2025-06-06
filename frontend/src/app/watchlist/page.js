'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { Loader2, X, TrendingUp } from 'lucide-react';
import { getWatchlist, removeFromWatchlist } from '@/utils/api';
import { checkAuthState } from '@/utils/auth';

/**
 * WatchlistPage component - Displays the user's watchlisted stocks
 * with options to trade or remove from watchlist
 */
export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authState = await checkAuthState();
      setIsLoggedIn(authState.isAuthenticated);
      
      if (authState.isAuthenticated) {
        fetchWatchlist();
      } else {
        setLoading(false);
        toast.error('Please log in to view your watchlist');
      }
    };
    
    checkAuth();
  }, []);

  /**
   * Fetches the user's watchlist from the API
   * Includes error handling for failed requests and invalid data
   */
  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const data = await getWatchlist();
      
      // Validate that the data is an array
      if (Array.isArray(data)) {
        setWatchlist(data);
      } else {
        console.error('Invalid watchlist data format:', data);
        toast.error('Failed to load watchlist data');
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load your watchlist');
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles removing a stock from the watchlist
   * @param {string} symbol - The stock symbol to remove
   */
  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlist(watchlist.filter(stock => stock.symbol !== symbol));
      toast.success(`${symbol} removed from watchlist`);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error(`Failed to remove ${symbol} from watchlist`);
    }
  };

  /**
   * Navigates to trading section with selected stock
   * @param {string} symbol - The stock symbol to trade
   */
  const handleTrade = (symbol) => {
    router.push(`/?symbol=${symbol}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Watchlist</h1>
        <p className="text-gray-600 mb-4">Please log in to view your watchlist</p>
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Watchlist</h1>
      
      {watchlist.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">You haven't added any stocks to your watchlist yet.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Browse Stocks
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((stock) => (
            <div key={stock.symbol} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold">{stock.symbol}</h3>
                  <p className="text-sm text-gray-600">{stock.name}</p>
                </div>
                <button 
                  onClick={() => handleRemoveFromWatchlist(stock.symbol)}
                  className="text-gray-400 hover:text-red-500 transition"
                  aria-label="Remove from watchlist"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="flex items-center mb-3">
                <span className="text-lg font-medium">${stock.price?.toFixed(2) || 'N/A'}</span>
                {stock.change !== undefined && (
                  <span className={`ml-2 text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </span>
                )}
              </div>
              
              <button
                onClick={() => handleTrade(stock.symbol)}
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center"
              >
                <TrendingUp size={16} className="mr-1" />
                Trade
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
