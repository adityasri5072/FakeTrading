"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
} from "recharts";

export default function PortfolioPerformanceChart({ userId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("1M"); // Default to 1 month
  const [chartType, setChartType] = useState("line");
  const [hoverValue, setHoverValue] = useState(null);

  async function fetchPortfolioHistory() {
    try {
      // In a real app, we would use the timeRange to fetch the appropriate data
      const res = await fetch(`http://localhost:8000/api/portfolio_history/${userId}/`);
      if (!res.ok) {
        throw new Error("Failed to fetch portfolio history");
      }
      const historyData = await res.json();
      
      // Sort data by time
      const sortedData = [...historyData].sort((a, b) => 
        new Date(a.time) - new Date(b.time)
      );
      
      // Calculate percent change
      if (sortedData.length > 0) {
        const initialValue = sortedData[0].value;
        sortedData.forEach(item => {
          item.percentChange = ((item.value - initialValue) / initialValue) * 100;
        });
      }
      
      setData(sortedData);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPortfolioHistory();
    // Refresh every minute
    const intervalId = setInterval(fetchPortfolioHistory, 60000);
    return () => clearInterval(intervalId);
  }, [userId, timeRange]);

  // If we don't have real data, create some mock data for demonstration
  useEffect(() => {
    if (data.length === 0 && !loading) {
      const mockData = generateMockData(timeRange);
      setData(mockData);
    }
  }, [loading, data.length, timeRange]);

  const generateMockData = (range) => {
    const mockData = [];
    const now = new Date();
    let days = 30;
    
    switch (range) {
      case "1W":
        days = 7;
        break;
      case "1M":
        days = 30;
        break;
      case "3M":
        days = 90;
        break;
      case "1Y":
        days = 365;
        break;
      default:
        days = 30;
    }
    
    let value = 100000;
    const volatility = 0.02; // 2% daily volatility
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Random walk with trend
      const change = (Math.random() - 0.45) * volatility;
      value = value * (1 + change);
      
      mockData.push({
        time: date.toLocaleDateString(),
        value: value,
        percentChange: ((value - 100000) / 100000) * 100
      });
    }
    
    return mockData;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getChartColor = () => {
    if (data.length === 0) return "#48bb78";
    
    const initialValue = data[0].value;
    const currentValue = data[data.length - 1].value;
    return currentValue >= initialValue ? "#48bb78" : "#f56565";
  };

  const handleTooltipChange = (payload) => {
    if (payload && payload.active && payload.payload && payload.payload.length > 0) {
      setHoverValue(payload.payload[0].payload);
    } else {
      setHoverValue(null);
    }
  };

  const renderChart = () => {
    const color = getChartColor();
    
    if (chartType === "area") {
      return (
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="time" stroke="#a0aec0" />
          <YAxis stroke="#a0aec0" />
          <Tooltip 
            contentStyle={{ backgroundColor: "#2d3748", border: "none", color: "white" }}
            formatter={(value) => [formatCurrency(value), "Portfolio Value"]}
            labelFormatter={(label) => `Date: ${label}`}
            cursor={{ stroke: "#a0aec0", strokeWidth: 1 }}
            onValueChange={handleTooltipChange}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            strokeWidth={3}
          />
        </AreaChart>
      );
    } else if (chartType === "bar") {
      return (
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="time" stroke="#a0aec0" />
          <YAxis stroke="#a0aec0" />
          <Tooltip 
            contentStyle={{ backgroundColor: "#2d3748", border: "none", color: "white" }}
            formatter={(value) => [formatCurrency(value), "Portfolio Value"]}
            labelFormatter={(label) => `Date: ${label}`}
            cursor={{ stroke: "#a0aec0", strokeWidth: 1 }}
            onValueChange={handleTooltipChange}
          />
          <Bar 
            dataKey="value" 
            fill={color} 
            opacity={0.8} 
            barSize={20}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#a0aec0" 
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      );
    }
    
    return (
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
        <XAxis dataKey="time" stroke="#a0aec0" />
        <YAxis stroke="#a0aec0" />
        <Tooltip 
          contentStyle={{ backgroundColor: "#2d3748", border: "none", color: "white" }}
          formatter={(value) => [formatCurrency(value), "Portfolio Value"]}
          labelFormatter={(label) => `Date: ${label}`}
          cursor={{ stroke: "#a0aec0", strokeWidth: 1 }}
          onValueChange={handleTooltipChange}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={{ r: 4, fill: color }}
          activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
        />
      </LineChart>
    );
  };

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
  const initialValue = data.length > 0 ? data[0].value : 0;
  const percentChange = ((currentValue - initialValue) / initialValue) * 100;
  const isPositive = percentChange >= 0;

  const timeRangeOptions = [
    { label: "1W", value: "1W" },
    { label: "1M", value: "1M" },
    { label: "3M", value: "3M" },
    { label: "1Y", value: "1Y" },
  ];

  const chartTypeOptions = [
    { label: "Line", value: "line" },
    { label: "Area", value: "area" },
    { label: "Bar", value: "bar" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-8 my-16 border border-gray-700"
    >
      <motion.h2 
        initial={{ y: -20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
      >
        Your Portfolio Performance
      </motion.h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-t-purple-500 border-gray-700 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading portfolio data...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="mb-4 md:mb-0">
              <h3 className="text-gray-400 text-sm">Current Value</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(currentValue)}
                </span>
                <span className={`ml-2 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '↑' : '↓'} {formatPercent(Math.abs(percentChange))}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap space-x-2">
              <div className="flex bg-gray-700 rounded-lg p-1">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      timeRange === option.value
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex bg-gray-700 rounded-lg p-1">
                {chartTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setChartType(option.value)}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      chartType === option.value
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Details - Shows when hovering over the chart */}
          {hoverValue && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 bg-gray-700/50 backdrop-blur-sm rounded-lg"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-gray-400 text-xs">Date</h4>
                  <p className="text-white font-medium">{hoverValue.time}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-xs">Portfolio Value</h4>
                  <p className="text-white font-medium">{formatCurrency(hoverValue.value)}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-xs">Change</h4>
                  <p className={`font-medium ${hoverValue.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {hoverValue.percentChange >= 0 ? '+' : ''}{formatPercent(hoverValue.percentChange)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center mt-8 text-sm text-gray-400">
            <div>Starting: {formatCurrency(initialValue)}</div>
            <div>
              <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                {isPositive ? '↑' : '↓'} {formatPercent(Math.abs(percentChange))}
              </span>
              {" "}since {timeRange}
            </div>
            <div>Current: {formatCurrency(currentValue)}</div>
          </div>
        </>
      )}
    </motion.div>
  );
}
