"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 2500 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), duration - 400);
    const close = setTimeout(onClose, duration);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
      clearTimeout(close);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5
        rounded-2xl border border-border/60 bg-surface px-4 py-3 shadow-lg
        transition-all duration-300 ease-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          className="text-green-500">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
