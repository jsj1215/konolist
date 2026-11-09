"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { PlaylistCard } from "@/components/PlaylistCard";
import { authFetch } from "@/lib/api";

interface Playlist {
  id: number;
  title: string;
  description?: string;
  songCount: number;
  isPublic: boolean;
}

export default function PlaylistsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !session) return;
    setCreating(true);
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (!res.ok) {
      setCreating(false);
      if (res.status !== 401) alert("플레이리스트를 만들지 못했습니다.");
      return;
    }
    const created = await res.json();
    setPlaylists((prev) => [created, ...prev]);
    setNewTitle("");
    setShowForm(false);
    setCreating(false);
  }

  async function handleDelete(id: number) {
    if (!session) return;
    const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (!res.ok) {
      if (res.status !== 401) alert("플레이리스트를 삭제하지 못했습니다.");
      return;
    }
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavBar />
        <div className="flex flex-1 items-center justify-center text-sm text-muted">
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-base font-semibold">내 플레이리스트</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5
              text-xs font-semibold text-primary-foreground
              hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            새 플레이리스트
          </button>
        </div>

        {/* 생성 폼 */}
        {showForm && (
          <form onSubmit={handleCreate} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="플레이리스트 이름"
              maxLength={50}
              autoFocus
              className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm
                placeholder:text-muted outline-none
                focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            />
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold
                hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              만들기
            </button>
          </form>
        )}

        {/* 리스트 */}
        <div className="flex flex-col gap-2">
          {playlists.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">
              아직 플레이리스트가 없습니다.
            </div>
          ) : (
            playlists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} onDelete={handleDelete} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
