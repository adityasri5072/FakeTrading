"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function StockDetailPage() {
  const { stock_symbol } = useParams();
  const router = useRouter();
  const [stockDetail, setStockDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = 1; // For testing

  useEffect(() => {
    async function fetchStockDetail() {
      try {
        const res = await fetch(`http://localhost:8000/api/stock-detail/${userId}/${stock_symbol}/`);
        if (!res.ok) throw new Error("Failed to fetch stock details");
        const data = await res.json();
        setStockDetail(data);
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
    if (stock_symbol) {
      fetchStockDetail();
    }
  }, [stock_symbol]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!stockDetail) return <p className="p-6">No details available</p>;

  const {
    stock_symbol: symbol,
    stock_name,
    total_quantity,
    average_purchase_price,
    current_price,
    percent_change,
  } = stockDetail;

  return (
    <div className="container mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-500 hover:underline"
      >
        ← Back to Portfolio
      </button>
      <h1 className="text-3xl font-bold mb-4">
        {stock_name} ({symbol})
      </h1>
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <p className="mb-2">
          <span className="font-semibold">Total Quantity:</span> {total_quantity}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Average Purchase Price:</span> $
          {average_purchase_price.toFixed(2)}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Current Price:</span> $
          {current_price.toFixed(2)}
        </p>
        <p className="mb-2">
          <span className="font-semibold">Percent Change:</span>{" "}
          <span className={percent_change >= 0 ? "text-green-500" : "text-red-500"}>
            {percent_change.toFixed(2)}%
          </span>
        </p>
      </div>
    </div>
  );
}
