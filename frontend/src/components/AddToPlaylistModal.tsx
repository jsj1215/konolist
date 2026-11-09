"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { authFetch } from "@/lib/api";

interface Song {
  tjNumber: string;
  title: string;
  artist: string;
}

interface Playlist {
  id: number;
  title: string;
  songCount: number;
}

interface AddToPlaylistModalProps {
  song: Song;
  onClose: () => void;
  onAdded?: () => void;
  onError?: (message: string) => void;
}

export function AddToPlaylistModal({ song, onClose, onAdded, onError }: AddToPlaylistModalProps) {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<number | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!session) return;
    authFetch(`${apiBase}/api/playlists`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  async function handleAdd(playlistId: number) {
    setAdding(playlistId);
    const res = await authFetch(`${apiBase}/api/playlists/${playlistId}/songs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: JSON.stringify(song),
    });
    setAdding(null);
    if (res.ok) {
      setDone(playlistId);
      setTimeout(() => { onClose(); onAdded?.(); }, 700);
    } else {
      const body = await res.json().catch(() => ({}));
      onClose();
      onError?.(body.message ?? "곡을 추가하지 못했습니다.");
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch(`${apiBase}/api/playlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() }),
      });
      if (!res.ok) {
        if (res.status !== 401) {
          onClose();
          onError?.("플레이리스트를 만들지 못했습니다.");
        }
        return;
      }
      const created: Playlist = await res.json();
      await handleAdd(created.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{song.title}</p>
            <p className="text-xs text-muted">{song.artist} · {song.tjNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:text-foreground">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 새 플레이리스트 만들기 */}
        {creating ? (
          <div className="mb-3 flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="플레이리스트 이름"
              maxLength={50}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명 (선택)"
              maxLength={200}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 rounded-lg border border-border py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || saving}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? "만드는 중..." : "만들고 추가"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="mb-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            새 플레이리스트 만들고 추가
          </button>
        )}

        <p className="mb-3 text-xs font-medium text-muted uppercase tracking-wider">
          기존 플레이리스트
        </p>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted">불러오는 중...</p>
        ) : playlists.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">플레이리스트가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {playlists.map((pl) => (
              <li key={pl.id}>
                <button
                  onClick={() => handleAdd(pl.id)}
                  disabled={adding !== null || done === pl.id}
                  className="flex w-full items-center gap-3 rounded-xl border border-border
                    bg-surface-muted px-4 py-3 text-left
                    hover:border-primary/50 hover:bg-primary/5
                    disabled:opacity-60 disabled:cursor-not-allowed
                    transition-colors"
                >
                  <span className="text-lg">🎵</span>
                  <span className="flex-1 text-sm font-medium truncate">{pl.title}</span>
                  <span className="text-xs text-muted">{pl.songCount}곡</span>
                  {done === pl.id ? (
                    <span className="text-green-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  ) : adding === pl.id ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
