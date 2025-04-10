// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Debug API calls
const DEBUG_API = true;

// Import auth utilities
import { checkAuthState } from './auth';

/**
 * Helper function to get authentication headers
 * @returns {Object} Headers object with authentication token if available
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Generic error handler for API responses
 * @param {Error} error - The error object from the API call
 * @returns {Object} Standardized error response
 */
const handleApiError = (error) => {
  // Network errors
  if (error.message === 'Failed to fetch') {
    return { 
      success: false, 
      error: 'Network error. Please check your connection and try again.',
      status: 0
    };
  }
  
  // Server errors
  if (error.status) {
    if (error.status === 401) {
      // Clear token and trigger auth state change
      localStorage.removeItem('accessToken');
      window.dispatchEvent(new Event('authStateChanged'));
      
      return { 
        success: false, 
        error: 'Session expired. Please log in again.',
        status: 401
      };
    }
    
    // Other status codes
    return { 
      success: false, 
      error: error.message || `Server error (${error.status})`,
      status: error.status
    };
  }
  
  // Unknown errors
  return { 
    success: false, 
    error: error.message || 'Unknown error occurred',
    status: 500
  };
};

// API utility functions
export const api = {
  /**
   * Perform a GET request to the API
   * @param {string} endpoint - The API endpoint to call
   * @returns {Promise<Object>} The API response
   */
  async get(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    if (DEBUG_API) console.log(`API GET: ${url}`);
    
    try {
      const headers = getAuthHeaders();
      if (DEBUG_API && headers.Authorization) {
        console.log(`Authorization header: ${headers.Authorization.substring(0, 15)}...`);
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const errorResult = handleApiError({ 
          status: response.status, 
          message: `Request failed: ${response.statusText}` 
        });
        if (DEBUG_API) console.log(`API GET Error:`, errorResult, `Status: ${response.status} ${response.statusText}`);
        return errorResult;
      }
      
      const data = await response.json();
      if (DEBUG_API) console.log(`API GET Success:`, data);
      return { success: true, data };
    } catch (error) {
      const errorResult = handleApiError(error);
      if (DEBUG_API) console.log(`API GET Exception:`, errorResult, error);
      return errorResult;
    }
  },
  
  /**
   * Perform a POST request to the API
   * @param {string} endpoint - The API endpoint to call
   * @param {Object} body - The request body
   * @returns {Promise<Object>} The API response
   */
  async post(endpoint, body) {
    const url = `${API_BASE_URL}${endpoint}`;
    if (DEBUG_API) console.log(`API POST: ${url}`, body);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      
  if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorResult = handleApiError({ 
          status: response.status, 
          message: errorData.detail || 'Request failed' 
        });
        if (DEBUG_API) console.log(`API POST Error:`, errorResult);
        return errorResult;
      }
      
      const data = await response.json();
      if (DEBUG_API) console.log(`API POST Success:`, data);
      return { success: true, data };
    } catch (error) {
      const errorResult = handleApiError(error);
      if (DEBUG_API) console.log(`API POST Exception:`, errorResult);
      return errorResult;
    }
  },
  
  /**
   * Perform a PUT request to the API
   * @param {string} endpoint - The API endpoint to call
   * @param {Object} body - The request body
   * @returns {Promise<Object>} The API response
   */
  async put(endpoint, body) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return handleApiError({ 
          status: response.status, 
          message: errorData.detail || 'Update failed' 
        });
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  /**
   * Perform a DELETE request to the API
   * @param {string} endpoint - The API endpoint to call
   * @returns {Promise<Object>} The API response
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
  if (!response.ok) {
        return handleApiError({ status: response.status, message: 'Delete failed' });
      }
      
      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { success: true, data };
      }
      
      return { success: true };
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Auth-related methods
  auth: {
    /**
     * Login user with username and password
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @returns {Promise<Object>} Login response
     */
    async login(username, password) {
      // First try the /token/ endpoint
      let result = await api.post('/token/', { username, password });
      
      // If that fails, try the /users/login/ endpoint
      if (!result.success) {
        result = await api.post('/users/login/', { username, password });
      }
      
      if (result.success) {
        // Save the tokens
        localStorage.setItem('accessToken', result.data.access);
        localStorage.setItem('refreshToken', result.data.refresh);
        
        // Try to get user profile data
        try {
          // First try the /users/profile/ endpoint
          let profileResult = await api.get('/users/profile/');
          
          // If that fails, try getting by username
          if (!profileResult.success) {
            profileResult = await api.get(`/users/profile_by_username/?username=${username}`);
          }
          
          if (profileResult.success) {
            // Structure might be different depending on the endpoint
            const userId = profileResult.data.id || profileResult.data.user?.id;
            const profileUsername = profileResult.data.username || profileResult.data.user?.username;
            
            if (userId) localStorage.setItem('userId', userId);
            if (profileUsername) localStorage.setItem('username', profileUsername);
          }
        } catch (error) {
          console.error("Error fetching user profile after login:", error);
          // Still consider login successful even if profile fetch fails
          localStorage.setItem('username', username); // At least store the username
        }
        
        // Dispatch the event to notify components
        window.dispatchEvent(new Event('authStateChanged'));
        console.log("Login successful, dispatched authStateChanged event");
        console.log("Storage items:", {
          accessToken: !!localStorage.getItem('accessToken'),
          userId: localStorage.getItem('userId'),
          username: localStorage.getItem('username')
        });
      }
      
      return result;
    },
    
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration response
     */
    async register(userData) {
      return await api.post('/users/register/', userData);
    },
    
    /**
     * Logout the current user
     * @returns {Object} Logout response
     */
    logout() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      
      // Trigger auth state change
      window.dispatchEvent(new Event('authStateChanged'));
      
      return { success: true };
    },
    
    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in
     */
    isLoggedIn() {
      return !!localStorage.getItem('accessToken');
    },
    
    /**
     * Get current user ID
     * @returns {string|null} User ID or null if not logged in
     */
    getUserId() {
      return localStorage.getItem('userId');
    }
  }
};

export default api;

/**
 * Get all available stocks
 * @returns {Promise<Array>} List of stocks
 */
export const getStocks = async () => {
  const result = await api.get('/stocks/');
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch stocks');
  }
  return result.data;
};

/**
 * Buy a stock
 * @param {string} userId - User ID
 * @param {string} stockSymbol - Symbol of stock to buy
 * @param {number} quantity - Number of shares to buy
 * @returns {Promise<Object>} API response
 */
export const buyStock = async (userId, stockSymbol, quantity) => {
  try {
    // Check if user is authenticated
    const isAuth = checkAuthState();
    if (!isAuth) {
      throw new Error("Authentication required to buy stock");
    }
    
    if (!userId || !stockSymbol || !quantity) {
      throw new Error("Missing required parameters for buy operation");
    }
    
    // Try multiple possible endpoint formats
    let result;
    
    // First try the most likely format
    result = await api.post(`/buy/${userId}/${stockSymbol}/${quantity}/`);
    
    // If that fails, try alternatives
    if (!result.success) {
      console.log("First buy endpoint failed, trying alternative");
      result = await api.post(`/trading/buy/`, { 
        user_id: userId, 
        stock_symbol: stockSymbol, 
        quantity: quantity 
      });
    }
    
    if (!result.success) {
      console.log("Second buy endpoint failed, trying alternative");
      result = await api.post(`/stocks/buy/`, { 
        user_id: userId, 
        symbol: stockSymbol, 
        quantity: quantity 
      });
    }
    
    if (!result.success) {
      console.error("All buy endpoints failed:", result.error);
      throw new Error(result.error || 'Failed to buy stock');
    }
    
    // Trigger a balance update event
    window.dispatchEvent(new Event('balanceUpdated'));
    
    return result.data;
  } catch (error) {
    console.error("Buy stock exception:", error);
    throw error;
  }
};

/**
 * Sell a stock
 * @param {string} userId - User ID
 * @param {string} stockSymbol - Symbol of stock to sell
 * @param {number} quantity - Number of shares to sell
 * @returns {Promise<Object>} API response
 */
export const sellStock = async (userId, stockSymbol, quantity) => {
  try {
    // Check if user is authenticated
    const isAuth = checkAuthState();
    if (!isAuth) {
      throw new Error("Authentication required to sell stock");
    }
    
    if (!userId || !stockSymbol || !quantity) {
      throw new Error("Missing required parameters for sell operation");
    }
    
    // Try multiple possible endpoint formats
    let result;
    
    // First try the most likely format
    result = await api.post(`/sell/${userId}/${stockSymbol}/${quantity}/`);
    
    // If that fails, try alternatives
    if (!result.success) {
      console.log("First sell endpoint failed, trying alternative");
      result = await api.post(`/trading/sell/`, { 
        user_id: userId, 
        stock_symbol: stockSymbol, 
        quantity: quantity 
      });
    }
    
    if (!result.success) {
      console.log("Second sell endpoint failed, trying alternative");
      result = await api.post(`/stocks/sell/`, { 
        user_id: userId, 
        symbol: stockSymbol, 
        quantity: quantity 
      });
    }
    
    if (!result.success) {
      console.error("All sell endpoints failed:", result.error);
      throw new Error(result.error || 'Failed to sell stock');
    }
    
    // Trigger a balance update event
    window.dispatchEvent(new Event('balanceUpdated'));
    
    return result.data;
  } catch (error) {
    console.error("Sell stock exception:", error);
    throw error;
  }
};

/**
 * Get user profile information
 * @param {string} userId - User ID to fetch profile for
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await api.get(`/profile/${userId}/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error("Get user profile error:", error.response?.data?.error || error.message);
    throw error;
  }
};

/**
 * Get user's transaction history
 * @returns {Promise<Array>} List of transactions
 */
export const getTransactions = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.error("No access token found");
      return [];
    }

    const response = await api.get('/transactions/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.data) {
      console.error("No data received from transactions API");
      return [];
    }

    // Transform the transaction data to match the expected format in the UI
    return response.data.map(tx => ({
      id: tx.id || Math.random().toString(36).substr(2, 9),
      transaction_date: tx.timestamp || new Date().toISOString(),
      transaction_type: tx.quantity > 0 ? 'buy' : 'sell',
      stock_symbol: tx.stock_symbol || "",
      quantity: Math.abs(parseInt(tx.quantity) || 0),
      price: parseFloat(tx.price_at_purchase) || 0
    }));
  } catch (error) {
    console.error("Transactions API error:", error.response?.data?.error || error.message);
    return [];
  }
};

/**
 * Get user's portfolio
 * @returns {Promise<Array>} List of stocks in portfolio
 */
export const getPortfolio = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.error("No access token found");
      return [];
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error("User ID not found");
      return [];
    }

    const response = await api.get(`/portfolio/${userId}/`);

    if (!response.success || !response.data) {
      console.error("No data received from portfolio API");
      return [];
    }

    console.log("Portfolio API response:", response.data);

    // Transform the portfolio data to match the expected format in the UI
    return response.data.map(item => {
      // Extract values directly from backend data, using proper field names
      const quantity = parseInt(item.total_quantity) || 0;
      const currentPrice = parseFloat(item.current_price) || 0;
      const averageBuyPrice = parseFloat(item.average_buy_price) || 0;
      const totalValue = parseFloat(item.total_value) || 0;
      const gainLoss = parseFloat(item.gain_loss) || 0;
      const gainLossPercentage = parseFloat(item.gain_loss_percentage) || 0;
      
      return {
        symbol: item.stock_symbol || "",
        name: item.name || item.stock_symbol || "",
        quantity: quantity,
        current_price: currentPrice,
        average_price: averageBuyPrice,
        current_value: totalValue,
        gain_loss: gainLoss,
        gain_loss_percentage: gainLossPercentage
      };
    }).filter(item => item.quantity > 0);
  } catch (error) {
    console.error("Portfolio API error:", error.response?.data?.error || error.message);
    return [];
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('accessToken');
};

/**
 * Fetch user's watchlist
 * @returns {Promise<Array>} Array of stocks in user's watchlist
 */
export const getWatchlist = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.error("No access token found for getWatchlist");
      return [];
    }

    console.log("Attempting to fetch user's watchlist");
    
    // Try the primary endpoint
    try {
      const response = await api.get('/watchlist/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log("Watchlist fetch response:", response);
      
      // Ensure we have a valid array response
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.stocks)) {
        return response.data.stocks;
      } else {
        console.warn("Unexpected watchlist data format:", response.data);
        return [];
      }
    } catch (primaryError) {
      console.log("Primary watchlist endpoint failed:", primaryError);
      
      // Try an alternative endpoint format
      try {
        const alternativeResponse = await api.get('/watchlist/list/', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log("Alternative watchlist fetch response:", alternativeResponse);
        
        // Ensure we have a valid array response
        if (Array.isArray(alternativeResponse.data)) {
          return alternativeResponse.data;
        } else if (alternativeResponse.data && Array.isArray(alternativeResponse.data.stocks)) {
          return alternativeResponse.data.stocks;
        } else {
          console.warn("Unexpected alternative watchlist data format:", alternativeResponse.data);
          return [];
        }
      } catch (alternativeError) {
        console.error("All watchlist fetch endpoints failed", alternativeError);
        return [];
      }
    }
  } catch (error) {
    console.error("Fetch watchlist error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    return [];
  }
};

/**
 * Add a stock to user's watchlist
 * @param {string} stockSymbol - Symbol of stock to add
 * @returns {Promise<Object>} API response
 */
export const addToWatchlist = async (stockSymbol) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error("No access token found");
    }

    console.log(`Attempting to add ${stockSymbol} to watchlist`);
    
    // Try the primary endpoint
    try {
      const response = await api.post(`/watchlist/add/${stockSymbol}/`, {}, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log("Watchlist add response:", response);
      return response.data;
    } catch (primaryError) {
      console.log("Primary watchlist endpoint failed:", primaryError);
      
      // Try an alternative endpoint format
      try {
        const alternativeResponse = await api.post(`/watchlist/add/`, {
          stock_symbol: stockSymbol
        }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log("Alternative watchlist add response:", alternativeResponse);
        return alternativeResponse.data;
      } catch (alternativeError) {
        console.error("All watchlist add endpoints failed", alternativeError);
        throw new Error(`Failed to add ${stockSymbol} to watchlist`);
      }
    }
  } catch (error) {
    console.error("Add to watchlist error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

/**
 * Remove a stock from user's watchlist
 * @param {string} stockSymbol - Symbol of stock to remove
 * @returns {Promise<Object>} API response
 */
export const removeFromWatchlist = async (stockSymbol) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error("No access token found");
    }

    console.log(`Attempting to remove ${stockSymbol} from watchlist`);
    
    // Try the primary endpoint
    try {
      const response = await api.delete(`/watchlist/remove/${stockSymbol}/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log("Watchlist remove response:", response);
      return response.data;
    } catch (primaryError) {
      console.log("Primary watchlist removal endpoint failed:", primaryError);
      
      // Try an alternative endpoint format
      try {
        const alternativeResponse = await api.delete(`/watchlist/remove/`, {
          data: {
            stock_symbol: stockSymbol
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        console.log("Alternative watchlist remove response:", alternativeResponse);
        return alternativeResponse.data;
      } catch (alternativeError) {
        console.error("All watchlist remove endpoints failed", alternativeError);
        throw new Error(`Failed to remove ${stockSymbol} from watchlist`);
      }
    }
  } catch (error) {
    console.error("Remove from watchlist error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};

/**
 * Simulate realistic price changes for all stocks
 * @returns {Promise<Array>} List of updated stocks with old and new prices
 */
export const simulateRealisticPriceChanges = async () => {
  try {
    console.log("Simulating realistic stock price changes...");
    const result = await api.post('/simulate-price-changes/');
    
    if (!result.success) {
      console.error("Failed to simulate price changes:", result.error);
      return [];
    }
    
    console.log("Price simulation result:", result.data);
    return result.data.stocks;
  } catch (error) {
    console.error("Price simulation error:", error.message);
    return [];
  }
};

/**
 * Get price history for a specific stock
 * @param {string} stockSymbol - Symbol of the stock
 * @returns {Promise<Object>} Stock price history data
 */
export const getStockPriceHistory = async (stockSymbol) => {
  try {
    console.log(`Fetching price history for ${stockSymbol}...`);
    const result = await api.get(`/stock-history/${stockSymbol}/`);
    
    if (!result.success) {
      console.error(`Failed to fetch price history for ${stockSymbol}:`, result.error);
      return null;
    }
    
    return result.data;
  } catch (error) {
    console.error("Stock history error:", error.message);
    return null;
  }
};