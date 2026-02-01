import { useEffect, useMemo, useRef, useState } from "react";

/** -----------------------------
 *  Defaults + Actions
 *  ---------------------------- */
const DEFAULT_ACTIVITIES = [
  { key: "work", label: "Work", emoji: "🧠" },
  { key: "gym", label: "Gym", emoji: "🏋️" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "social", label: "Social", emoji: "👥" },
  { key: "class", label: "Class", emoji: "📚" },
  { key: "transportation", label: "Transit", emoji: "🚗" },
];

const ACTIONS = [
  { key: "add", label: "Add", emoji: "✚" },
  { key: "delete", label: "Delete", emoji: "🗑️" },
];

/** -----------------------------
 *  Utils
 *  ---------------------------- */
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

/** -----------------------------
 *  Totals persistence (per day)
 *  ---------------------------- */
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

/** -----------------------------
 *  Activities persistence
 *  ---------------------------- */
function loadActivities() {
  const key = "activities:v1";
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(arr) ? arr : DEFAULT_ACTIVITIES;
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}

function saveActivities(activities) {
  const key = "activities:v1";
  localStorage.setItem(key, JSON.stringify(activities));
}

// makes unique key from label
function makeActivityKey(label, existingKeys) {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  let key = base || "activity";
  let i = 2;
  while (existingKeys.has(key)) {
    key = `${base || "activity"}_${i}`;
    i++;
  }
  return key;
}

/** -----------------------------
 *  UI Components
 *  ---------------------------- */
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

/** -----------------------------
 *  Main Component
 *  ---------------------------- */
export default function Stopwatch() {
  // activities are now stateful
  const [activities, setActivities] = useState(() => loadActivities());

  // Add modal state + inputs
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("");

  // Delete modal state + selection
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteKey, setDeleteKey] = useState("");

  // timer state
  const [selected, setSelected] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const startRef = useRef(null);
  const intervalRef = useRef(null);

  const [totals, setTotals] = useState(() => loadTotals());

  /** persist activities */
  useEffect(() => {
    saveActivities(activities);
  }, [activities]);

  /** timer loop */
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  /** persist totals */
  useEffect(() => {
    saveTotals(totals);
  }, [totals]);

  function openAddModal() {
    setNewLabel("");
    setNewEmoji("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
  }

  function addActivity() {
    const label = newLabel.trim();
    const emoji = newEmoji.trim();
    if (!label || !emoji) return;

    setActivities((prev) => {
      const existingKeys = new Set(prev.map((a) => a.key));
      const key = makeActivityKey(label, existingKeys);
      const next = [...prev, { key, label, emoji }];
      setSelected(key);
      return next;
    });

    closeAddModal();
  }

  function openDeleteModal() {
    const firstKey = activities[0]?.key || "";
    setDeleteKey(firstKey);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
  }

  function deleteActivity() {
    if (!deleteKey) return;

    // remove from activities list
    setActivities((prev) => prev.filter((a) => a.key !== deleteKey));

    // remove from today's totals
    setTotals((prev) => {
      const next = { ...prev };
      delete next[deleteKey];
      return next;
    });

    // clear selection if you deleted the selected activity
    if (selected === deleteKey) setSelected(null);

    closeDeleteModal();
  }

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
    const vals = activities.map((a) => totals[a.key] || 0);
    return Math.max(1, ...vals);
  }, [totals, activities]);

  const canStart = !!selected && !running;

  return (
    <div className="page">
      <h1 className="page__title">Tracker</h1>
      <p className="page__subtitle">Pick an activity | Start the Timer | Learn to Optimize your day!</p>

      <div className="tileRow tileRow--tight">
        {activities.map((a) => (
          <ActivityTile
            key={a.key}
            emoji={a.emoji}
            label={a.label}
            selected={selected === a.key}
            disabled={running}
            onClick={() => setSelected(a.key)}
          />
        ))}

        {ACTIONS.map((a) => (
          <ActivityTile
            key={a.key}
            emoji={a.emoji}
            label={a.label}
            selected={false}
            disabled={running}
            onClick={() => {
              if (a.key === "add") openAddModal();
              if (a.key === "delete") openDeleteModal();
            }}
          />
        ))}
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="modalOverlay" onClick={closeAddModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h3>Add Activity</h3>

            <label className="modalField">
              <div className="modalLabel">Activity name</div>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Study"
              />
            </label>

            <label className="modalField">
              <div className="modalLabel">Emoji (paste one)</div>
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                placeholder="e.g., 📖"
              />
            </label>

            <div className="modalActions">
              <button type="button" className="btn btn--ghost" onClick={closeAddModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={addActivity}
                disabled={!newLabel.trim() || !newEmoji.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Activity Modal */}
      {showDeleteModal && (
        <div className="modalOverlay" onClick={closeDeleteModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Activity</h3>

            <label className="modalField">
              <div className="modalLabel">Choose an activity</div>
              <select value={deleteKey} onChange={(e) => setDeleteKey(e.target.value)}>
                {activities.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.emoji} {a.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="modalActions">
              <button type="button" className="btn btn--ghost" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={deleteActivity}
                disabled={!deleteKey || activities.length === 0}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card__meta">{running ? "Running" : selected ? "Ready" : "Select an activity to start"}</div>

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
          {activities.map((a) => {
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
      </div>
    </div>
  );
}
