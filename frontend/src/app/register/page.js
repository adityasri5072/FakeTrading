"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/api/users/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      if (!res.ok) {
        const errorData = await res.json();
        setMessage(errorData.detail || "Registration failed.");
        return;
      }
      const data = await res.json();
      setMessage(data.message);
      setTimeout(() => router.push("/login"), 3000);
    } catch (error) {
      setMessage("An error occurred.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Register</h1>
        {message && <p className="mb-4 text-center text-white">{message}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-white mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 rounded border border-gray-600 bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded border border-gray-600 bg-gray-700 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded border border-gray-600 bg-gray-700 text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
