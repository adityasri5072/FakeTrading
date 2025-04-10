/**
 * Authentication debug utilities
 */

// Function to check and log auth state
export const checkAuthState = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  
  const isLoggedIn = !!accessToken && !!userId;
  
  console.log('Auth state:', {
    isLoggedIn,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    userId,
    username
  });
  
  return isLoggedIn;
};

// Function to force auth state change event
export const triggerAuthStateChange = () => {
  console.log('Manually triggering auth state change event');
  window.dispatchEvent(new Event('authStateChanged'));
};

// Function to manually set login state (for testing/debugging)
export const debugSetLoginState = (isLoggedIn, userData = {}) => {
  if (isLoggedIn) {
    const { accessToken, refreshToken, userId, username } = userData;
    
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (userId) localStorage.setItem('userId', userId);
    if (username) localStorage.setItem('username', username);
    
    console.log('Debug: Set login state to logged in');
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    console.log('Debug: Set login state to logged out');
  }
  
  triggerAuthStateChange();
};

// Export a function to manually fix login issues (for user support)
export const fixLoginState = () => {
  // This is a last resort fix for when login state is inconsistent
  const accessToken = localStorage.getItem('accessToken');
  const username = localStorage.getItem('username');
  
  if (accessToken && !localStorage.getItem('userId') && username) {
    // If we have a token and username but no userId, generate a temporary one
    localStorage.setItem('userId', 'temp_' + Math.random().toString(36).substring(2, 9));
    console.log('Applied fix: Generated temporary userId');
    triggerAuthStateChange();
    return true;
  }
  
  return false;
};

export default {
  checkAuthState,
  triggerAuthStateChange,
  debugSetLoginState,
  fixLoginState
}; 