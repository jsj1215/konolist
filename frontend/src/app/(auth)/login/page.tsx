"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 로고 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">🎤 코노리스트</h1>
        <p className="mt-1 text-sm text-muted">코인 노래방 플레이리스트 관리</p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm
              placeholder:text-muted outline-none
              focus:ring-2 focus:ring-primary focus:border-transparent
              transition-shadow"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm
              placeholder:text-muted outline-none
              focus:ring-2 focus:ring-primary focus:border-transparent
              transition-shadow"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary text-primary-foreground
            py-2.5 text-sm font-semibold
            hover:opacity-90 active:opacity-80
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-opacity mt-1"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {/* 회원가입 링크 */}
      <p className="text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
