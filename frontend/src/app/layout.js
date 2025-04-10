"use client"; // Required for client-side features

import "./globals.css";
import Header from '../components/Header';
import ErrorBoundary from '../components/ErrorBoundary';
import AnimatedContainer from "../components/AnimatedContainer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-gray-900 text-white">
        <ErrorBoundary>
          <Header />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
          <div className="pt-6">
            <AnimatedContainer>
              {children}
            </AnimatedContainer>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
