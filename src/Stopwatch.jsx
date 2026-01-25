import { useEffect, useRef, useState } from "react";

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  function start() {
    // if resuming after stop, keep elapsed time
    startRef.current = Date.now() - elapsedMs;
    setRunning(true);
  }

  function stop() {
    setRunning(false);
    clearInterval(intervalRef.current);
  }

  function reset() {
    stop();
    setElapsedMs(0);
    startRef.current = null;
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>Stopwatch</h1>

      <div
        style={{
          fontSize: 52,
          fontWeight: 800,
          letterSpacing: 1,
          fontVariantNumeric: "tabular-nums",
          margin: "18px 0",
        }}
      >
        {formatTime(elapsedMs)}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={start} disabled={running} style={{ padding: "10px 14px" }}>
          Start
        </button>
        <button onClick={stop} disabled={!running} style={{ padding: "10px 14px" }}>
          Stop
        </button>
        <button onClick={reset} style={{ padding: "10px 14px" }}>
          Reset
        </button>
      </div>
    </div>
  );
}
