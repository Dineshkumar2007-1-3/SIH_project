"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      localStorage.setItem("token", "fake-jwt-token");
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
      <div
        className="w-full max-w-md space-y-6 p-8 rounded-2xl"
        style={{
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <h2 className="text-xl font-semibold text-white text-center">
          Login to Sentinel AI
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm" style={{ color: "var(--color-risk-critical)" }}>{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Login
          </Button>
        </form>

        <div className="text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          Don&apos;t have an account?{" "}
          <span style={{ color: "var(--color-accent-blue)" }} className="cursor-pointer hover:underline">
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}
