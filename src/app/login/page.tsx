"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError("סיסמה שגויה, נסה שוב");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm flex flex-col items-center gap-6">
        <Image src="/logo-cropped.png" alt="סיפורי כוכבים" width={180} height={70} className="object-contain" />
        <h1 className="text-xl font-bold text-gray-800">כניסה למערכת</h1>
        <div className="w-full space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="סיסמה"
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={login}
            disabled={loading || !password}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold border-2 border-black bg-white text-black hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {loading ? "נכנס..." : "כניסה"}
          </button>
        </div>
      </div>
    </div>
  );
}
