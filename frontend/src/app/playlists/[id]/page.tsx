"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { NavBar } from "@/components/NavBar";
import { RecordingButton } from "@/components/RecordingButton";
import { authFetch } from "@/lib/api";

interface PlaylistSong {
  id: number;
  tjNumber: string;
  title: string;
  artist: string;
  memo?: string;
  sortOrder: number;
  hasRecording: boolean;
}

interface Playlist {
  id: number;
  title: string;
  description?: string;
  isPublic: boolean;
  shareToken: string;
  songs: PlaylistSong[];
}

function SortableRow({
  song,
  onRemove,
  onMemoSave,
  playlistId,
  apiBase,
  accessToken,
  onRecordingChange,
}: {
  song: PlaylistSong;
  onRemove: (id: number) => void;
  onMemoSave: (id: number, memo: string) => void;
  playlistId: number;
  apiBase: string;
  accessToken: string;
  onRecordingChange: (songId: number, hasRecording: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editing, setEditing] = useState(false);
  const [memo, setMemo] = useState(song.memo ?? "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
    >
      {/* 드래그 핸들 */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-muted active:cursor-grabbing touch-none"
        aria-label="순서 변경"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5h2M9 12h2M9 19h2M13 5h2M13 12h2M13 19h2" />
        </svg>
      </button>

      {/* TJ 번호 */}
      <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tabular-nums">
        {song.tjNumber}
      </span>

      {/* 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{song.title}</p>
        {editing ? (
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => { onMemoSave(song.id, memo); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onMemoSave(song.id, memo); setEditing(false); } }}
            placeholder="메모 (예: 2키 낮춰서)"
            maxLength={100}
            autoFocus
            className="mt-0.5 w-full rounded-md border border-border bg-surface-muted
              px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        ) : (
          <p
            onClick={() => setEditing(true)}
            className="cursor-text text-xs text-muted hover:text-foreground transition-colors mt-0.5"
          >
            {memo || song.artist}
          </p>
        )}
      </div>

      {/* 녹음 */}
      <RecordingButton
        playlistId={playlistId}
        songId={song.id}
        hasRecording={song.hasRecording}
        accessToken={accessToken}
        apiBase={apiBase}
        onRecordingChange={(has) => onRecordingChange(song.id, has)}
      />

      {/* 삭제 */}
      <button
        onClick={() => onRemove(song.id)}
        className="shrink-0 rounded-lg p-1.5 text-muted
          hover:bg-red-500/10 hover:text-red-500 transition-colors"
        aria-label="삭제"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function PlaylistDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = { Authorization: `Bearer ${session?.accessToken}` };

  useEffect(() => {
    if (!session) return;
    authFetch(`${apiBase}/api/playlists/${id}`, { headers: authHeader })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setPlaylist(data);
        setSongs(data.songs ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, id]);

  const sensors = useSensors(useSensor(PointerSensor));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const previous = songs;
    const oldIndex = previous.findIndex((s) => s.id === active.id);
    const newIndex = previous.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(previous, oldIndex, newIndex);
    setSongs(reordered);

    // 서버에 순서 저장, 실패하면 원래 순서로 되돌림
    const res = await authFetch(`${apiBase}/api/playlists/${id}/songs/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ songIds: reordered.map((s) => s.id) }),
    });
    if (!res.ok) {
      setSongs(previous);
      if (res.status !== 401) alert("순서를 저장하지 못했습니다.");
    }
  }

  const handleRemove = useCallback(async (songId: number) => {
    const res = await authFetch(`${apiBase}/api/playlists/${id}/songs/${songId}`, {
      method: "DELETE",
      headers: authHeader,
    });
    if (!res.ok) {
      if (res.status !== 401) alert("곡을 삭제하지 못했습니다.");
      return;
    }
    setSongs((prev) => prev.filter((s) => s.id !== songId));
  }, [id, session]);

  const handleMemoSave = useCallback(async (songId: number, memo: string) => {
    const res = await authFetch(`${apiBase}/api/playlists/${id}/songs/${songId}/memo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ memo }),
    });
    if (!res.ok && res.status !== 401) alert("메모를 저장하지 못했습니다.");
  }, [id, session]);

  const handleRecordingChange = useCallback((songId: number, hasRecording: boolean) => {
    setSongs((prev) => prev.map((s) => s.id === songId ? { ...s, hasRecording } : s));
  }, []);

  async function handleTogglePublic() {
    if (!playlist) return;
    const res = await authFetch(`${apiBase}/api/playlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ isPublic: !playlist.isPublic }),
    });
    if (!res.ok) {
      if (res.status !== 401) alert("공개 설정을 바꾸지 못했습니다.");
      return;
    }
    const updated = await res.json();
    setPlaylist((prev) => prev ? { ...prev, isPublic: updated.isPublic } : prev);
  }

  async function copyShareLink() {
    if (!playlist) return;
    const url = `${window.location.origin}/playlists/${playlist.shareToken}/share`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavBar />
        <div className="flex flex-1 items-center justify-center text-sm text-muted">불러오는 중...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <NavBar />
        <div className="flex flex-1 items-center justify-center text-sm text-muted">플레이리스트를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        {/* 헤더 */}
        <div className="mb-1 flex items-center gap-2">
          <button onClick={() => router.back()} className="text-muted hover:text-foreground transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-base font-semibold truncate flex-1">{playlist.title}</h1>
        </div>

        {/* 공개/공유 액션 */}
        <div className="mb-5 flex gap-2 pl-7">
          <button
            onClick={handleTogglePublic}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
              ${playlist.isPublic
                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                : "bg-surface-muted text-muted hover:text-foreground"
              }`}
          >
            {playlist.isPublic ? "🌐 공개중" : "🔒 비공개"}
          </button>

          {playlist.isPublic && (
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5
                text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              {copied ? "✓ 복사됨" : "🔗 링크 복사"}
            </button>
          )}
        </div>

        {/* 곡 목록 */}
        {songs.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">
            곡을 추가해보세요. 홈에서 검색 후 + 버튼을 누르세요.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {songs.map((song) => (
                  <SortableRow
                    key={song.id}
                    song={song}
                    onRemove={handleRemove}
                    onMemoSave={handleMemoSave}
                    playlistId={Number(id)}
                    apiBase={apiBase ?? ""}
                    accessToken={session?.accessToken ?? ""}
                    onRecordingChange={handleRecordingChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <p className="mt-4 text-center text-xs text-muted">{songs.length}곡</p>
      </main>
    </div>
  );
}
