"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string };
        throw new Error(data?.message || "Đăng nhập thất bại.");
      }

      const data = (await response.json()) as { token: string };
      localStorage.setItem("admin_token", data.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="stripe-card w-full max-w-md p-8">
        <h1 className="text-3xl font-extrabold text-foreground">Admin Login</h1>
        <p className="mt-2 text-sm text-xle-text-secondary">Đăng nhập để xem dữ liệu đăng ký form.</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              className="h-11 w-full rounded-lg border border-black/[0.1] px-3 outline-none focus:ring-2 focus:ring-xle-primary/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Password</label>
            <input
              type="password"
              className="h-11 w-full rounded-lg border border-black/[0.1] px-3 outline-none focus:ring-2 focus:ring-xle-primary/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button type="submit" disabled={isLoading} className="button-primary h-11 w-full">
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </main>
  );
}
