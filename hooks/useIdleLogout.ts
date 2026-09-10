"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, isAuthed } from "@/lib/api";

const IDLE_LIMIT_MS = 15 * 60 * 1000; // 15 минут
const WARNING_BEFORE_MS = 60 * 1000; // 1 минутын өмнө сануулга харуулна
const LOGIN_PATH = "/login"; // өөрийн login route-той тааруулж солино уу

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export function useIdleLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const active = pathname !== LOGIN_PATH && isAuthed();

  const doLogout = useCallback(() => {
    clearToken();
    router.replace(LOGIN_PATH);
  }, [router]);

  const clearAllTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const startTimers = useCallback(() => {
    if (!active) return;
    clearAllTimers();
    setShowWarning(false);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(WARNING_BEFORE_MS / 1000);
      countdownInterval.current = setInterval(() => {
        setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
      }, 1000);
    }, IDLE_LIMIT_MS - WARNING_BEFORE_MS);

    idleTimer.current = setTimeout(() => {
      doLogout();
    }, IDLE_LIMIT_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, doLogout]);

  const stayActive = useCallback(() => {
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    if (!active) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    startTimers();

    const reset = () => {
      if (!showWarning) startTimers();
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, reset, { passive: true }),
    );

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { showWarning: active && showWarning, secondsLeft, stayActive, logoutNow: doLogout };
}