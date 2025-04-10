"use client";

import Link from "next/link";

export default function PublicLanding() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-5xl font-bold text-white mb-4">Welcome to FakeTrading</h1>
      <p className="text-xl text-gray-300 mb-8">
        Explore the platform and see live stock data before signing up.
      </p>
      <div className="space-x-4">
        <Link href="/login">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
            Login
          </button>
        </Link>
        <Link href="/register">
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition">
            Register
          </button>
        </Link>
      </div>
    </div>
  );
}
