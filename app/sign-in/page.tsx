"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
      <h1 style={{ marginBottom: 20 }}>Sign In</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={{ padding: 8 }} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={{ padding: 8 }} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button style={{ padding: 10, background: "#0070f3", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }} type="submit" disabled={loading}>
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>

      <div style={{ margin: "15px 0", textAlign: "center" }}>OR</div>

      <button 
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })}
        style={{ width: "100%", padding: 10, background: "#db4437", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
      >
        Sign in with Google
      </button>

      <p style={{ marginTop: 15, textAlign: "center" }}>
        Don&apos;t have an account? <Link href="/sign-up">Sign Up</Link>
      </p>
      {message && <p style={{ marginTop: 15, color: "red", textAlign: "center" }}>{message}</p>}
    </div>
  );
}