import { useEffect, useMemo, useRef, useState } from "react";

const ACTIVITIES = [
  { key: "work", label: "Work", emoji: "🧠" },
  { key: "gym", label: "Gym", emoji: "🏋️" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "social", label: "Social", emoji: "👥" }, // friends/family
];

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatHMS(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatMinutes(ms) {
  const mins = ms / 60000;
  return mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${Math.round(mins)}m`;
}

function loadTotals() {
  const key = `totals:${todayKey()}`;
  try {
    const obj = JSON.parse(localStorage.getItem(key) || "{}");
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function saveTotals(totals) {
  const key = `totals:${todayKey()}`;
  localStorage.setItem(key, JSON.stringify(totals));
}

function ActivityTile({ emoji, label, selected, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 92,
        height: 92,
        borderRadius: 22,
        border: selected ? "2px solid #111" : "1px solid #ddd",
        background: selected ? "#f2f2f2" : "white",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: selected ? "0 12px 26px rgba(0,0,0,0.12)" : "0 10px 22px rgba(0,0,0,0.06)",
        display: "grid",
        placeItems: "center",
      }}
      aria-label={label}
      title={label}
    >
      <div style={{ display: "grid", gap: 6, placeItems: "center" }}>
        <div style={{ fontSize: 34, lineHeight: 1 }}>{emoji}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#222" }}>{label}</div>
      </div>
    </button>
  );
}

export default function Stopwatch() {
  const [selected, setSelected] = useState(null); // "work" | "gym" | "gaming" | "social"
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startRef = useRef(null);
  const intervalRef = useRef(null);

  const [totals, setTotals] = useState(() => loadTotals());

  // tick stopwatch while running (UI update)
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // keep totals persisted
  useEffect(() => {
    saveTotals(totals);
  }, [totals]);

  function start() {
    if (!selected || running) return;
    startRef.current = Date.now();
    setElapsedMs(0);
    setRunning(true);
  }

  function stopAndSave() {
    if (!running) return;

    setRunning(false);
    clearInterval(intervalRef.current);

    // lock in final elapsed time accurately
    const finalMs = Date.now() - startRef.current;

    setElapsedMs(finalMs);

    // add to today's totals
    setTotals((prev) => {
      const next = { ...prev };
      next[selected] = (next[selected] || 0) + finalMs;
      return next;
    });

    // reset for next activity
    startRef.current = null;
    setElapsedMs(0);
    setSelected(null);
  }

  function resetToday() {
    if (running) return; // keep it simple
    setTotals({});
    saveTotals({});
  }

  // bar chart scaling (auto adjusts to your max activity time)
  const maxMs = useMemo(() => {
    const vals = ACTIVITIES.map((a) => totals[a.key] || 0);
    return Math.max(1, ...vals);
  }, [totals]);

  const canStart = !!selected && !running;

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Tracker</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Pick an activity → Start. You can’t switch activities while the timer is running.
      </p>

      {/* Activity selection */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 16 }}>
        {ACTIVITIES.map((a) => (
          <ActivityTile
            key={a.key}
            emoji={a.emoji}
            label={a.label}
            selected={selected === a.key}
            disabled={running} // clicking while running does nothing (disabled)
            onClick={() => setSelected(a.key)}
          />
        ))}
      </div>

      {/* Stopwatch display */}
      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          padding: 18,
          border: "1px solid #e8e8e8",
          boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>
          {running ? "Running" : selected ? "Ready" : "Select an activity to start"}
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatHMS(elapsedMs)}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button
            onClick={start}
            disabled={!canStart}
            style={{ padding: "10px 14px", borderRadius: 12 }}
          >
            Start
          </button>

          <button
            onClick={stopAndSave}
            disabled={!running}
            style={{ padding: "10px 14px", borderRadius: 12 }}
          >
            Stop & Save
          </button>

          <button
            onClick={resetToday}
            disabled={running}
            style={{ padding: "10px 14px", borderRadius: 12 }}
            title="Clears today’s totals"
          >
            Reset Today
          </button>
        </div>
      </div>

      {/* Bar chart summary */}
      <div style={{ marginTop: 22 }}>
        <h2 style={{ marginBottom: 10 }}>Today’s totals</h2>

        <div style={{ display: "grid", gap: 12 }}>
          {ACTIVITIES.map((a) => {
            const ms = totals[a.key] || 0;
            const pct = Math.max(0, Math.min(100, (ms / maxMs) * 100));

            return (
              <div
                key={a.key}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                    <span style={{ fontSize: 18 }}>{a.emoji}</span>
                    <span>{a.label}</span>
                  </div>
                  <div style={{ color: "#333", fontVariantNumeric: "tabular-nums" }}>
                    {ms > 0 ? formatMinutes(ms) : "0m"}
                  </div>
                </div>

                <div
                  style={{
                    height: 14,
                    borderRadius: 999,
                    background: "#f0f0f0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: "#111",
                      borderRadius: 999,
                      transition: "width 200ms ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ color: "#666", fontSize: 12, marginTop: 10 }}>
          Bars auto-scale to your longest activity today (so 5m or 2h both work).
        </p>
      </div>
    </div>
  );
}
