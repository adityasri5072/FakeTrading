"use client";

import { useState, useEffect } from "react";

export default function UserBalance() {
  const [profile, setProfile] = useState({ username: "", balance: null });
  const [error, setError] = useState(null);

  // Retrieve userId from localStorage
  const userId = localStorage.getItem("userId");

  async function fetchProfile() {
    try {
      const res = await fetch(`http://localhost:8000/api/profile/${userId}/`);
      if (!res.ok) {
        setError("Failed to fetch profile");
        return;
      }
      const data = await res.json();
      setProfile({ username: data.username, balance: data.balance });
    } catch (error) {
      console.error(error);
      setError("Error fetching profile");
    }
  }

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  return (
    <div className="text-sm text-white">
      Welcome, {profile.username || "User"}! | Balance: $
      {profile.balance !== null ? parseFloat(profile.balance).toFixed(2) : "Loading..."}
    </div>
  );
}
