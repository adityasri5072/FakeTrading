"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiUser, FiLogOut, FiBarChart2, FiList } from "react-icons/fi";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(null);
  const router = useRouter();

  // Check authentication status when component mounts and on storage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const accessToken = localStorage.getItem("accessToken");
      const storedUsername = localStorage.getItem("username");
      const userId = localStorage.getItem("userId");
      
      setIsLoggedIn(!!accessToken);
      setUsername(storedUsername || "");
      
      if (accessToken && userId) {
        fetchUserBalance(userId);
      } else {
        setUserBalance(null);
      }
    };

    // Initial check
    checkAuthStatus();

    // Listen for storage events (for multi-tab support)
    window.addEventListener("storage", checkAuthStatus);

    // Custom event for auth state changes within the same tab
    window.addEventListener("authStateChanged", checkAuthStatus);
    
    // Listen for balance updates
    window.addEventListener("balanceUpdated", checkAuthStatus);

    return () => {
      window.removeEventListener("storage", checkAuthStatus);
      window.removeEventListener("authStateChanged", checkAuthStatus);
      window.removeEventListener("balanceUpdated", checkAuthStatus);
    };
  }, []);
  
  const fetchUserBalance = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/profile/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserBalance(parseFloat(data.balance));
      } else {
        // If token expired or invalid
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          setIsLoggedIn(false);
          window.dispatchEvent(new Event("authStateChanged"));
        }
      }
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    
    // Update auth state
    setIsLoggedIn(false);
    setUsername("");
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event("authStateChanged"));
    
    // Redirect to home page
    router.push("/");
    
    // Close mobile menu if open
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              FakeTrading
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
              Home
            </Link>
            <Link href="/#trading" className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
              Trade
            </Link>
            
            {isLoggedIn ? (
              <>
                {userBalance !== null && (
                  <div className="px-3 py-2 text-green-400 font-medium">
                    ${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                <Link href="/portfolio" className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
                  Portfolio
                </Link>
                <Link href="/transactions" className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
                  Transactions
                </Link>
                <div className="relative group px-3 py-2">
                  <button className="text-gray-300 hover:text-white flex items-center focus:outline-none">
                    <FiUser className="mr-1" />
                    <span>{username}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden transform scale-0 group-hover:scale-100 origin-top-right transition-transform duration-100 ease-in-out">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <FiLogOut className="inline mr-2" /> Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-800 border-t border-gray-700"
          >
            <div className="container mx-auto px-2 py-3 space-y-1">
              <Link 
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/#trading"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md transition-colors"
              >
                <FiBarChart2 className="inline mr-2" /> Trade
              </Link>
              
              {isLoggedIn ? (
                <>
                  {userBalance !== null && (
                    <div className="text-green-400 font-medium flex items-center px-3 py-2 hover:bg-gray-700 rounded-md">
                      <span className="inline mr-2">💰</span>
                      ${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  <Link 
                    href="/portfolio"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md transition-colors"
                  >
                    <FiUser className="inline mr-2" /> Portfolio
                  </Link>
                  <Link 
                    href="/transactions"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md transition-colors"
                  >
                    <FiList className="inline mr-2" /> Transactions
                  </Link>
                  <div className="border-t border-gray-700 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 block w-full text-left px-3 py-2 rounded-md transition-colors"
                  >
                    <FiLogOut className="inline mr-2" /> Logout ({username})
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700 block px-3 py-2 rounded-md transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white block px-3 py-2 rounded-md transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 