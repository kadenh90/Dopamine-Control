import { useEffect, useMemo, useRef, useState } from "react";

const ACTIVITIES = [
  { key: "work", label: "Work", emoji: "🧠" },
  { key: "gym", label: "Gym", emoji: "🏋️" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "social", label: "Social", emoji: "👥" },
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
      className={`tile tile--activity ${selected ? "is-selected" : ""}`}
      aria-label={label}
      title={label}
      type="button"
    >
      <div className="tile__inner">
        <div className="tile__emoji">{emoji}</div>
        <div className="tile__labelDark">{label}</div>
      </div>
    </button>
  );
}

export default function Stopwatch() {
  const [selected, setSelected] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startRef = useRef(null);
  const intervalRef = useRef(null);

  const [totals, setTotals] = useState(() => loadTotals());

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [running]);

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

    const finalMs = Date.now() - startRef.current;

    setTotals((prev) => {
      const next = { ...prev };
      next[selected] = (next[selected] || 0) + finalMs;
      return next;
    });

    startRef.current = null;
    setElapsedMs(0);
    setSelected(null);
  }

  function resetToday() {
    if (running) return;
    setTotals({});
    saveTotals({});
  }

  const maxMs = useMemo(() => {
    const vals = ACTIVITIES.map((a) => totals[a.key] || 0);
    return Math.max(1, ...vals);
  }, [totals]);

  const canStart = !!selected && !running;

  return (
    <div className="page">
      <h1 className="page__title">Tracker</h1>
      <p className="page__subtitle">
        Pick an activity → Start. You can’t switch activities while the timer is running.
      </p>

      <div className="tileRow tileRow--tight">
        {ACTIVITIES.map((a) => (
          <ActivityTile
            key={a.key}
            emoji={a.emoji}
            label={a.label}
            selected={selected === a.key}
            disabled={running}
            onClick={() => setSelected(a.key)}
          />
        ))}
      </div>

      <div className="card">
        <div className="card__meta">
          {running ? "Running" : selected ? "Ready" : "Select an activity to start"}
        </div>

        <div className="timerText">{formatHMS(elapsedMs)}</div>

        <div className="btnRow">
          <button className="btn btn--primary" onClick={start} disabled={!canStart} type="button">
            Start
          </button>

          <button className="btn btn--ghost" onClick={stopAndSave} disabled={!running} type="button">
            Stop &amp; Save
          </button>

          <button className="btn btn--danger" onClick={resetToday} disabled={running} type="button">
            Reset Today
          </button>
        </div>
      </div>

      <div className="section">
        <h2 className="section__title">Today’s totals</h2>

        <div className="summaryGrid">
          {ACTIVITIES.map((a) => {
            const ms = totals[a.key] || 0;
            const pct = Math.max(0, Math.min(100, (ms / maxMs) * 100));

            return (
              <div className="summaryCard" key={a.key}>
                <div className="summaryHeader">
                  <div className="summaryLeft">
                    <span className="summaryEmoji">{a.emoji}</span>
                    <span className="summaryLabel">{a.label}</span>
                  </div>
                  <div className="summaryValue">{ms > 0 ? formatMinutes(ms) : "0m"}</div>
                </div>

                <div className="bar">
                  <div className="bar__fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <p className="hint">
          Bars auto-scale to your longest activity today (so 5m or 2h both work).
        </p>
      </div>
    </div>
  );
}
