"use client";

import { useEffect } from 'react';
import Header from './Header';

// This component is deprecated and only kept for backward compatibility
// It forwards all functionality to the new Header component
export default function Navbar() {
  useEffect(() => {
    console.warn('Navbar component is deprecated. Please use Header component instead.');
  }, []);

  // Just render the Header component directly
  return <Header />;
}
