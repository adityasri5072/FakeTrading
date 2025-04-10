'use client';

import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to analytics or monitoring service if available
    if (window.gtag) {
      window.gtag('event', 'error', {
        'event_category': 'Error Boundary',
        'event_label': error.toString(),
        'value': window.location.pathname
      });
    }
  }

  handleRefresh = () => {
    window.location.reload();
  }

  handleHome = () => {
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-xl w-full"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 mb-6 mx-auto">
              <FiAlertTriangle className="text-red-400 text-2xl" />
            </div>
            
            <h1 className="text-3xl font-bold text-center text-white mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-center mb-6">
              We're sorry, but an unexpected error has occurred.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-900 rounded-lg overflow-auto">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-gray-400 cursor-pointer">Stack trace</summary>
                    <pre className="mt-2 text-xs text-gray-500 overflow-auto p-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={this.handleRefresh}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all"
              >
                <FiRefreshCw />
                Refresh Page
              </motion.button>
              
              <motion.button
                onClick={this.handleHome}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all"
              >
                Go to Home
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 