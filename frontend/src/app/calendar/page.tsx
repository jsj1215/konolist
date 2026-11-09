"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { authFetch } from "@/lib/api";

interface CalendarLog {
  id: number;
  date: string;
  playlistId: number;
  playlistTitle: string;
  songCount: number;
}

interface Playlist {
  id: number;
  title: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [logDates, setLogDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayLogs, setDayLogs] = useState<CalendarLog[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [adding, setAdding] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = { Authorization: `Bearer ${session?.accessToken}` };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // 월별 로그 날짜 로드
  useEffect(() => {
    if (!session) return;
    authFetch(`${apiBase}/api/logs/dates?year=${year}&month=${month}`, { headers: authHeader })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((dates: string[]) => setLogDates(new Set(dates)))
      .catch(() => {});
  }, [session, year, month]);

  // 내 플리 목록 로드 (로그 추가용)
  useEffect(() => {
    if (!session) return;
    authFetch(`${apiBase}/api/playlists`, { headers: authHeader })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setPlaylists)
      .catch(() => {});
  }, [session]);

  const loadDayLogs = useCallback(async (date: string) => {
    if (!session) return;
    const res = await authFetch(`${apiBase}/api/logs?date=${date}`, { headers: authHeader });
    if (!res.ok) {
      setDayLogs([]);
      return;
    }
    const data = await res.json();
    setDayLogs(data);
  }, [session]);

  function handleDateClick(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    loadDayLogs(dateStr);
  }

  async function handleAddLog() {
    if (!selectedDate || !selectedPlaylistId || !session) return;
    setAdding(true);
    const res = await authFetch(`${apiBase}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ date: selectedDate, playlistId: Number(selectedPlaylistId) }),
    });
    if (!res.ok) {
      setAdding(false);
      if (res.status !== 401) alert("방문 기록을 추가하지 못했습니다.");
      return;
    }
    // 날짜 dot 갱신
    setLogDates((prev) => new Set([...prev, selectedDate]));
    await loadDayLogs(selectedDate);
    setSelectedPlaylistId("");
    setAdding(false);
  }

  async function handleDeleteLog(logId: number) {
    if (!session) return;
    const res = await authFetch(`${apiBase}/api/logs/${logId}`, { method: "DELETE", headers: authHeader });
    if (!res.ok) {
      if (res.status !== 401) alert("방문 기록을 삭제하지 못했습니다.");
      return;
    }
    setDayLogs((prev) => prev.filter((l) => l.id !== logId));
    // 해당 날짜 로그가 0개면 dot 제거
    if (dayLogs.length <= 1 && selectedDate) {
      setLogDates((prev) => {
        const next = new Set(prev);
        next.delete(selectedDate);
        return next;
      });
    }
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">

        {/* 월 네비게이션 */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-lg p-2 text-muted hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-base font-semibold">{year}년 {month}월</h1>
          <button onClick={nextMonth} className="rounded-lg p-2 text-muted hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-xs font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-muted"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* 빈 칸 */}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}

          {/* 날짜 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasLog = logDates.has(dateStr);
            const dow = (firstDow + i) % 7;

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-sm transition-colors
                  ${isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/15 text-primary font-semibold" : "hover:bg-surface-muted"}
                  ${dow === 0 && !isSelected ? "text-red-400" : ""}
                  ${dow === 6 && !isSelected ? "text-blue-400" : ""}
                `}
              >
                {day}
                {hasLog && (
                  <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* 선택 날짜 로그 패널 */}
        {selectedDate && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold">
              {selectedDate.replace(/-/g, ".")} 방문 기록
            </p>

            {/* 기록 목록 */}
            <div className="flex flex-col gap-2">
              {dayLogs.length === 0 ? (
                <p className="text-sm text-muted">이 날 기록이 없습니다.</p>
              ) : (
                dayLogs.map((log) => (
                  <div key={log.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                    <span className="text-lg">🎵</span>
                    <div className="flex-1 min-w-0">
                      <Link href={`/playlists/${log.playlistId}`}
                        className="truncate text-sm font-medium hover:text-primary transition-colors">
                        {log.playlistTitle}
                      </Link>
                      <p className="text-xs text-muted">{log.songCount}곡</p>
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="shrink-0 rounded-lg p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      aria-label="삭제"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 플리 연결 */}
            <div className="mt-3 flex gap-2">
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm
                  text-foreground outline-none focus:ring-2 focus:ring-primary transition-shadow"
              >
                <option value="">플레이리스트 선택...</option>
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.title}</option>
                ))}
              </select>
              <button
                onClick={handleAddLog}
                disabled={!selectedPlaylistId || adding}
                className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold
                  hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                기록
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
