"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage("🎉 Registration successful! Check your terminal console for the verification link.");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
      <h1 style={{ marginBottom: 20 }}>Create Account</h1>
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={{ padding: 8 }} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input style={{ padding: 8 }} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={{ padding: 8 }} type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button style={{ padding: 10, background: "#0070f3", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }} type="submit" disabled={loading}>
          {loading ? "Registering..." : "Sign Up"}
        </button>
      </form>

      <div style={{ margin: "15px 0", textAlign: "center" }}>OR</div>

      <button 
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
        style={{ width: "100%", padding: 10, background: "#db4437", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        Continue with Google
      </button>

      <p style={{ marginTop: 15, textAlign: "center" }}>
        Already have an account? <Link href="/login">Login</Link>
      </p>
      {message && <p style={{ marginTop: 15, fontWeight: "bold", textAlign: "center" }}>{message}</p>}
    </div>
  );
}