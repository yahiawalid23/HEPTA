import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) router.push("/admin");
    else setError("Invalid username or password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <input
          className="w-full border rounded-lg p-2 mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="w-full border rounded-lg p-2 mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Login
        </button>
      </form>
    </div>
  );
}
