"use client";

interface Song {
  tjNumber: string;
  title: string;
  artist: string;
}

interface SongCardProps {
  song: Song;
  onAdd?: (song: Song) => void;
}

export function SongCard({ song, onAdd }: SongCardProps) {
  return (
    <div
      className="
        group neon-border glass-card animate-slide-up-fade
        flex items-center gap-3
        rounded-2xl px-4 py-3.5
        transition-all duration-250
        hover:bg-surface-muted/60
        hover:shadow-lg
        active:scale-[0.985]
        cursor-default
      "
      style={{
        ["--tw-shadow" as string]: "0 4px 24px var(--accent-glow)",
      }}
    >
      {/* TJ number badge */}
      <div className="shrink-0 flex flex-col items-center">
        <span
          className="
            tj-badge
            font-display text-xs font-bold tracking-wider
            tabular-nums
          "
        >
          {song.tjNumber}
        </span>
        <span
          className="mt-0.5 h-px w-full rounded-full opacity-60"
          style={{ background: "var(--gradient-primary)" }}
          aria-hidden
        />
      </div>

      {/* Divider */}
      <div
        className="shrink-0 w-px h-8 rounded-full opacity-20"
        style={{ background: "var(--gradient-primary)" }}
        aria-hidden
      />

      {/* Song info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight tracking-tight">
          {song.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted font-medium">
          {song.artist}
        </p>
      </div>

      {/* Add button */}
      {onAdd && (
        <button
          onClick={() => onAdd(song)}
          aria-label={`${song.title} 플레이리스트에 추가`}
          className="
            shrink-0
            flex h-8 w-8 items-center justify-center
            rounded-xl
            text-muted
            opacity-60 group-hover:opacity-100
            hover:text-primary-foreground
            active:scale-90
            transition-all duration-200
          "
          style={{
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--gradient-primary)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 12px var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
    </div>
  );
}
