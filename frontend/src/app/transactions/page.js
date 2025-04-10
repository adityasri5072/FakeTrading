"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FiClock, FiArrowUp, FiArrowDown, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { getTransactions } from '../../utils/api';
import { checkAuthState } from '../../utils/auth';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchTransactions = async () => {
      setIsLoading(true);
      const authState = checkAuthState();
      setIsLoggedIn(authState);
      
      if (authState) {
        try {
          const data = await getTransactions();
          console.log("Transaction data:", data);
          
          if (Array.isArray(data)) {
            // Sort transactions by date, newest first
            const sortedData = [...data].sort((a, b) => {
              return new Date(b.transaction_date) - new Date(a.transaction_date);
            });
            setTransactions(sortedData);
          } else {
            console.error("Transaction data is not an array:", data);
            setTransactions([]);
          }
        } catch (error) {
          console.error('Error fetching transactions:', error);
          toast.error('Failed to load your transaction history');
        }
      } else {
        setTimeout(() => {
          toast.info('Please log in to view your transactions');
          router.push('/login');
        }, 1500);
      }
      setIsLoading(false);
    };
    
    checkAuthAndFetchTransactions();
    
    // Listen for authentication changes
    const handleAuthChange = () => {
      checkAuthAndFetchTransactions();
    };
    
    window.addEventListener('authStateChanged', handleAuthChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [router]);

  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

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
          <FiClock className="text-5xl text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Transaction History</h1>
          <p className="text-gray-400 mb-6">Please log in to view your transaction history.</p>
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

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Transaction History</h1>
        <p className="text-gray-400">View your stock trading activity.</p>
      </motion.div>

      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 p-8 rounded-lg shadow-xl text-center border border-gray-700"
        >
          <FiClock className="text-5xl text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">No transactions yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't made any trades yet. Start trading stocks to see your transaction history.
          </p>
          <button
            onClick={() => router.push('/#trading')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Start Trading
          </button>
        </motion.div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Date</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Type</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Symbol</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Quantity</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Price</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800">
                {transactions.map((transaction, index) => {
                  const isBuy = transaction.transaction_type?.toLowerCase() === 'buy';
                  const quantity = parseInt(transaction.quantity) || 0;
                  const price = parseFloat(transaction.price) || 0;
                  const total = quantity * price;
                  
                  return (
                    <motion.tr 
                      key={transaction.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-t border-gray-700 hover:bg-gray-750"
                    >
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex items-center">
                          <FiCalendar className="mr-2 text-gray-400" />
                          {formatDate(transaction.transaction_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isBuy 
                            ? 'bg-green-900/30 text-green-400' 
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {isBuy ? <FiArrowDown className="mr-1" /> : <FiArrowUp className="mr-1" />}
                          {isBuy ? 'Buy' : 'Sell'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{transaction.stock_symbol}</td>
                      <td className="px-6 py-4 text-gray-300">{quantity}</td>
                      <td className="px-6 py-4 text-gray-300">${price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-white font-medium">
                        <div className="flex items-center">
                          <FiDollarSign className="text-gray-400" />
                          {total.toFixed(2)}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
