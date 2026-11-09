"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", nickname: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "회원가입에 실패했습니다.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 로고 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">🎤 코노리스트</h1>
        <p className="mt-1 text-sm text-muted">회원가입</p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nickname" className="text-sm font-medium">
            닉네임
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            value={form.nickname}
            onChange={handleChange}
            placeholder="노래방에서 불릴 이름"
            required
            minLength={2}
            maxLength={20}
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm
              placeholder:text-muted outline-none
              focus:ring-2 focus:ring-primary focus:border-transparent
              transition-shadow"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
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
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="8자 이상"
            required
            minLength={8}
            autoComplete="new-password"
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
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      {/* 로그인 링크 */}
      <p className="text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
