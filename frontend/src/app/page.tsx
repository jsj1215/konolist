"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { NavBar } from "@/components/NavBar";
import { SongCard } from "@/components/SongCard";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import { Toast } from "@/components/Toast";

interface Song {
  tjNumber: string;
  title: string;
  artist: string;
}

type SearchState = "idle" | "loading" | "done" | "error";

export default function HomePage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [state, setState] = useState<SearchState>("idle");
  const [modalSong, setModalSong] = useState<Song | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setState("loading");
    setSongs([]);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/songs/search?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error();
      const data: Song[] = await res.json();
      setSongs(data);
      setState("done");
    } catch {
      setState("error");
    }
  }

  function handleAdd(song: Song) {
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setModalSong(song);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <NavBar />

      {modalSong && (
        <AddToPlaylistModal
          song={modalSong}
          onClose={() => setModalSong(null)}
          onAdded={() => setToast("플레이리스트에 추가되었습니다.")}
          onError={(msg) => setToast(msg)}
        />
      )}

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
        />
      )}

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">

        {/* Hero headline — only shown on idle */}
        {state === "idle" && (
          <div className="animate-slide-up-fade mb-8 text-center">
            <h1
              className="text-2xl font-bold tracking-tight leading-snug"
              style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}
            >
              오늘 밤{" "}
              <span className="logo-neon">코인노래방</span>
              <br />
              어떤 곡 부를까요?
            </h1>
            <p className="mt-2 text-sm text-muted">
              TJ 노래방 전곡 검색 · 플레이리스트 저장
            </p>
          </div>
        )}

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="neon-border relative flex items-center gap-2 rounded-2xl"
        >
          {/* Search icon inside input */}
          <div className="pointer-events-none absolute left-4 text-muted" aria-hidden>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="곡명 또는 가수명으로 검색"
            autoComplete="off"
            autoCorrect="off"
            className="
              search-glow glass-card
              flex-1 rounded-2xl
              border border-border/60
              bg-surface/60
              pl-10 pr-4 py-3.5
              text-sm font-medium
              placeholder:text-muted/70
              outline-none
              transition-all duration-250
              focus:border-transparent
            "
          />

          <button
            type="submit"
            disabled={state === "loading" || !query.trim()}
            aria-label="검색"
            className="
              btn-gradient
              absolute right-2
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-xl
              text-white font-semibold
              disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
              disabled:shadow-none
            "
            style={{ background: "var(--gradient-primary)", backgroundSize: "200% 200%" }}
          >
            {state === "loading" ? (
              <span
                className="animate-spin-smooth inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                aria-label="검색 중"
              />
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            )}
          </button>
        </form>

        {/* Login nudge */}
        {!session && state === "done" && songs.length > 0 && (
          <p className="animate-slide-up-fade mt-3 text-center text-xs text-muted">
            플레이리스트에 저장하려면{" "}
            <a
              href="/login"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--accent-neon)" }}
            >
              로그인
            </a>
            이 필요합니다.
          </p>
        )}

        {/* Results area */}
        <div className="mt-4 flex flex-col gap-2">

          {/* Loading skeleton */}
          {state === "loading" && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-card h-[60px] rounded-2xl border border-border/40"
                  style={{
                    animation: `shimmer 1.5s linear infinite`,
                    background: `linear-gradient(
                      90deg,
                      var(--surface) 0%,
                      var(--surface-muted) 50%,
                      var(--surface) 100%
                    )`,
                    backgroundSize: "200% 100%",
                    animationDelay: `${i * 0.1}s`,
                  }}
                  aria-hidden
                />
              ))}
              <p className="mt-2 text-center text-xs text-muted" role="status" aria-live="polite">
                TJ 노래방 검색 중…
              </p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="animate-scale-in glass-card rounded-2xl border border-red-500/20 px-4 py-8 text-center">
              <p className="text-2xl mb-2" aria-hidden>😵</p>
              <p className="text-sm font-medium text-red-400">
                검색 중 오류가 발생했습니다.
              </p>
              <p className="mt-1 text-xs text-muted">잠시 후 다시 시도해주세요.</p>
            </div>
          )}

          {/* Empty state */}
          {state === "done" && songs.length === 0 && (
            <div className="animate-scale-in glass-card rounded-2xl border border-border/40 px-4 py-10 text-center">
              <p className="text-2xl mb-2" aria-hidden>🎵</p>
              <p className="text-sm font-medium">검색 결과가 없습니다.</p>
              <p className="mt-1 text-xs text-muted">
                다른 곡명이나 가수명으로 검색해보세요.
              </p>
            </div>
          )}

          {/* Result count chip */}
          {state === "done" && songs.length > 0 && (
            <p className="animate-slide-up-fade mb-1 text-xs text-muted font-medium">
              <span
                className="font-bold"
                style={{ color: "var(--accent-neon)" }}
              >
                {songs.length}
              </span>
              개의 곡을 찾았습니다
            </p>
          )}

          {/* Song list */}
          {songs.map((song, i) => (
            <SongCard
              key={`${song.tjNumber}-${i}`}
              song={song}
              onAdd={handleAdd}
            />
          ))}
        </div>
      </main>

      {/* Bottom ambient glow — decorative */}
      <div
        className="pointer-events-none fixed bottom-0 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--gradient-primary)" }}
        aria-hidden
      />
    </div>
  );
}
