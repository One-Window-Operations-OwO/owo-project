"use client";

import { useState } from "react";

interface LoginComponentProps {
  onLoginSuccess: () => void;
}

export default function LoginComponent({ onLoginSuccess }: LoginComponentProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.phpsessid) {
        localStorage.setItem("hisense_username", username);
        localStorage.setItem("hisense_password", password);
        localStorage.setItem("hisense_cookie", data.phpsessid);
        onLoginSuccess();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred during login.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-900">Login Hisense</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="border px-2 py-1 rounded w-full text-black"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border px-2 py-1 rounded w-full text-black"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
