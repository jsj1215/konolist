"use client";

import { useRef, useState, useEffect } from "react";
import { authFetch } from "@/lib/api";

interface RecordingButtonProps {
  playlistId: number;
  songId: number;
  hasRecording: boolean;
  accessToken: string;
  apiBase: string;
  onRecordingChange: (hasRecording: boolean) => void;
}

export function RecordingButton({
  playlistId,
  songId,
  hasRecording,
  accessToken,
  apiBase,
  onRecordingChange,
}: RecordingButtonProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const authHeader = { Authorization: `Bearer ${accessToken}` };
  const recordingEndpoint = `${apiBase}/api/playlists/${playlistId}/songs/${songId}/recording`;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        await uploadRecording(blob, mimeType);
      };

      mr.start(1000);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      alert("마이크 권한이 필요합니다.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function uploadRecording(blob: Blob, mimeType: string) {
    setUploading(true);
    const ext = mimeType.includes("mp4") ? "m4a" : "webm";
    const formData = new FormData();
    formData.append("file", blob, `recording.${ext}`);
    try {
      const res = await authFetch(recordingEndpoint, {
        method: "POST",
        headers: authHeader,
        body: formData,
      });
      if (!res.ok) {
        if (res.status === 413) alert("녹음 파일이 너무 큽니다. 20MB 이하로 녹음해 주세요.");
        else if (res.status !== 401) alert("녹음을 저장하지 못했습니다.");
        return;
      }
      onRecordingChange(true);
    } catch {
      alert("녹음을 저장하지 못했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function loadAndPlay() {
    if (audioUrl) {
      audioRef.current?.play();
      setPlaying(true);
      return;
    }
    const res = await authFetch(recordingEndpoint, { headers: authHeader });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlaying(true);
      }
    }, 50);
  }

  async function deleteRecording() {
    const res = await authFetch(recordingEndpoint, { method: "DELETE", headers: authHeader });
    if (!res.ok) {
      if (res.status !== 401) alert("녹음을 삭제하지 못했습니다.");
      return;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setPlaying(false);
    onRecordingChange(false);
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-red-400">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          {formatTime(seconds)}
        </span>
        <button
          onClick={stopRecording}
          className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
        >
          정지
        </button>
      </div>
    );
  }

  if (uploading) {
    return (
      <span className="text-xs text-muted">저장 중...</span>
    );
  }

  if (hasRecording) {
    return (
      <div className="flex items-center gap-1.5">
        <audio
          ref={audioRef}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
        <button
          onClick={playing ? () => { audioRef.current?.pause(); setPlaying(false); } : loadAndPlay}
          className="rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors"
          aria-label={playing ? "일시정지" : "재생"}
        >
          {playing ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          )}
        </button>
        <button
          onClick={deleteRecording}
          className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
          aria-label="녹음 삭제"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      className="rounded-lg p-1.5 text-muted hover:bg-primary/10 hover:text-primary transition-colors"
      aria-label="녹음 시작"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    </button>
  );
}
