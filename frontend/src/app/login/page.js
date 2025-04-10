"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "react-toastify";
import { api } from "../../utils/api";
import { fixLoginState, checkAuthState } from "../../utils/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting to log in with username:", username);
      const result = await api.auth.login(username, password);
      
      if (!result.success) {
        console.error("Login failed:", result.error);
        toast.error(result.error || "Login failed");
        setIsLoading(false);
        return;
      }
      
      console.log("Login successful!");
      toast.success("Login successful!");
      
      // Verify that auth state was properly set
      const authState = checkAuthState();
      
      // If we don't have a userId, try to fix it
      if (!localStorage.getItem('userId')) {
        fixLoginState();
      }
      
      // Redirect to home page after successful login
      // Use both methods to ensure navigation works
      setTimeout(() => {
        console.log("Navigating to home page...");
        try {
          router.push("/");
        } catch (e) {
          console.error("Router navigation failed:", e);
          // Fallback to direct location change
          window.location.href = "/";
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700"
      >
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : "Login"}
          </button>
        </form>
        
        <div className="mt-8 text-center text-gray-400">
          <p>Don't have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
              Sign up here
            </Link>
          </p>
          
          {/* Add a hidden debug button that only shows in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  checkAuthState();
                  const fixed = fixLoginState();
                  if (fixed) {
                    toast.success("Login state fixed, redirecting...");
                    setTimeout(() => window.location.href = "/", 1000);
                  } else {
                    toast.info("No fixes needed or login state couldn't be fixed automatically");
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-400 bg-gray-700 px-2 py-1 rounded"
              >
                Debug Login
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
