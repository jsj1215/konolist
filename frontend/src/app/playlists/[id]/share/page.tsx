"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { authFetch } from "@/lib/api";

// 공개 공유 API는 메모, 녹음 여부, 내부 id를 내려주지 않음
interface Song {
  tjNumber: string;
  title: string;
  artist: string;
  sortOrder: number;
}

interface Playlist {
  title: string;
  description?: string;
  songCount: number;
  songs: Song[];
}

export default function SharePage() {
  const { id: shareToken } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${apiBase}/api/playlists/${shareToken}/share`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setPlaylist(data); })
      .finally(() => setLoading(false));
  }, [shareToken]);

  async function handleCopy() {
    if (!session) { router.push("/login"); return; }
    setCopying(true);
    try {
      const res = await authFetch(`${apiBase}/api/playlists/${shareToken}/copy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) setCopied(true);
      else if (res.status !== 401) alert("내 보관함에 저장하지 못했습니다.");
    } finally {
      setCopying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavBar />
        <div className="flex flex-1 items-center justify-center text-sm text-muted">불러오는 중...</div>
      </div>
    );
  }

  if (notFound || !playlist) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavBar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-4">
          <p className="text-4xl">🎤</p>
          <p className="text-base font-semibold">플레이리스트를 찾을 수 없습니다.</p>
          <p className="text-sm text-muted">비공개이거나 삭제된 플레이리스트입니다.</p>
          <Link href="/" className="text-sm text-primary hover:underline underline-offset-2">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">

        {/* 헤더 */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              공개 플레이리스트
            </span>
          </div>
          <h1 className="text-xl font-bold">{playlist.title}</h1>
          {playlist.description && (
            <p className="mt-1 text-sm text-muted">{playlist.description}</p>
          )}
          <p className="mt-1 text-xs text-muted">{playlist.songCount}곡</p>

          {/* 내 보관함에 저장 버튼 */}
          <button
            onClick={handleCopy}
            disabled={copying || copied}
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
              ${copied
                ? "bg-green-500/10 text-green-500"
                : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              }`}
          >
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                내 보관함에 저장됨
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {copying ? "저장 중..." : "내 보관함에 저장"}
              </>
            )}
          </button>
          {!session && (
            <p className="mt-2 text-xs text-muted">
              저장하려면{" "}
              <Link href="/login" className="text-primary hover:underline underline-offset-2">
                로그인
              </Link>
              이 필요합니다.
            </p>
          )}
        </div>

        {/* 곡 목록 (읽기 전용) */}
        <div className="flex flex-col gap-2">
          {playlist.songs.map((song) => (
            <div
              key={`${song.sortOrder}-${song.tjNumber}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tabular-nums">
                {song.tjNumber}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{song.title}</p>
                <p className="truncate text-xs text-muted">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 코노리스트 홍보 */}
        <div className="mt-8 rounded-xl border border-border bg-surface-muted p-4 text-center">
          <p className="text-sm font-semibold">🎤 코노리스트</p>
          <p className="mt-1 text-xs text-muted">나만의 코인 노래방 플레이리스트를 만들어보세요</p>
          <Link
            href="/signup"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            무료로 시작하기
          </Link>
        </div>
      </main>
    </div>
  );
}
