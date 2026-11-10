import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Button from "../ui/Button";

const IDLE_MINUTES = 8;
const WARNING_SECONDS = 2 * 60;
const IDLE_MS = IDLE_MINUTES * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "keydown",
  "mousedown",
  "touchstart",
  "scroll",
] as const;

/**
 * Global idle-session watchdog: 8 minutes of inactivity shows a 2-minute
 * countdown warning; ignoring it force-logs-out at the 10-minute mark.
 * Activity while the warning is showing does NOT silently reset the clock —
 * only the explicit "Stay Logged In" click does, so the countdown means what
 * it says.
 */
export default function IdleSessionGuard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const warningRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };
  const clearCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  };
  const closeWarning = () => {
    warningRef.current = false;
    setWarning(false);
  };

  const forceLogout = useCallback(() => {
    clearIdleTimer();
    clearCountdown();
    closeWarning();
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const startWarning = useCallback(() => {
    warningRef.current = true;
    setWarning(true);
    setSecondsLeft(WARNING_SECONDS);
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearCountdown();
          forceLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [forceLogout]);

  const resetIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(startWarning, IDLE_MS);
  }, [startWarning]);

  useEffect(() => {
    if (!user) {
      clearIdleTimer();
      clearCountdown();
      warningRef.current = false;
      return;
    }

    resetIdleTimer();

    const handleActivity = () => {
      if (warningRef.current) return;
      resetIdleTimer();
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity),
    );

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity),
      );
      clearIdleTimer();
      clearCountdown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleStayLoggedIn = () => {
    clearCountdown();
    closeWarning();
    resetIdleTimer();
  };

  if (!warning || !user) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={24} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink">
          Your session is about to expire
        </h2>
        <p className="mt-2 text-sm text-muted">
          You've been inactive for a while. For your security, you'll be logged
          out in
        </p>
        <p className="mt-3 text-3xl font-extrabold tabular-nums text-red-600">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
        <Button
          type="button"
          className="mt-6 w-full"
          onClick={handleStayLoggedIn}
        >
          Stay Logged In
        </Button>
      </div>
    </div>
  );
}
