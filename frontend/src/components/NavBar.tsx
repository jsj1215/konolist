"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

interface NavBarProps {
  /**
   * 로고를 눌렀을 때 추가로 실행할 동작.
   * 홈 화면에서는 같은 주소("/")로 이동해도 화면이 다시 그려지지 않으므로,
   * 홈이 검색 상태를 초기화하는 함수를 넘겨줌
   */
  onHomeClick?: () => void;
}

export function NavBar({ onHomeClick }: NavBarProps = {}) {
  const { data: session } = useSession();

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Cmd/Ctrl/Shift 클릭이나 휠 클릭은 새 탭·창으로 열리므로 현재 화면은 그대로 둠
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    onHomeClick?.();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl backdrop-saturate-150">
      {/* Subtle top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "var(--gradient-primary)" }}
        aria-hidden
      />

      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="group flex items-center gap-2 select-none"
          aria-label="코노리스트 홈"
        >
          {/* Mic icon with neon glow */}
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-base leading-none"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 0 12px var(--accent-glow)",
            }}
            aria-hidden
          >
            🎤
          </span>

          <span
            className="logo-neon text-base font-bold tracking-tight"
            style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif" }}
          >
            코노리스트
          </span>
        </Link>

        {/* Nav actions */}
        <nav className="flex items-center gap-1">
          {session ? (
            <>
              <NavLink href="/playlists">내 플리</NavLink>
              <NavLink href="/calendar">캘린더</NavLink>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted
                  hover:bg-surface-muted hover:text-foreground
                  transition-all duration-200"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary-foreground
                btn-gradient
                transition-all duration-200"
              style={{
                background: "var(--gradient-primary)",
                backgroundSize: "200% 200%",
                padding: "6px 14px",
                borderRadius: "8px",
              }}
            >
              로그인
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative rounded-lg px-3 py-1.5 text-sm font-medium text-muted
        hover:text-foreground
        transition-colors duration-200
        group"
    >
      {children}
      {/* Active/hover underline dot */}
      <span
        className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full
          opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "var(--accent-neon)" }}
        aria-hidden
      />
    </Link>
  );
}
