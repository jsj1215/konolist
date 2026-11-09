"use client";

import Link from "next/link";

interface Playlist {
  id: number;
  title: string;
  description?: string;
  songCount: number;
  isPublic: boolean;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete?: (id: number) => void;
}

export function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3
        hover:bg-surface-muted transition-colors active:scale-[0.99]"
    >
      {/* 아이콘 */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center
        rounded-lg bg-primary/10 text-xl">
        🎵
      </div>

      {/* 정보 */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{playlist.title}</p>
        <p className="text-xs text-muted">
          {playlist.songCount}곡 {playlist.isPublic && "· 공개"}
        </p>
      </div>

      {/* 삭제 버튼 */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(playlist.id);
          }}
          aria-label="삭제"
          className="shrink-0 rounded-lg p-1.5 text-muted
            hover:bg-red-500/10 hover:text-red-500
            transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" />
          </svg>
        </button>
      )}
    </Link>
  );
}
