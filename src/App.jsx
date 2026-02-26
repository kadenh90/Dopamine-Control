import { useEffect, useMemo, useRef, useState } from "react";
import { FaTiktok, FaTwitter, FaFacebook } from "react-icons/fa";

function IconTile({ label, onClick, variant, children, locked, lockedText }) {
  return (
    <div className="tileWrap">
      <button
        onClick={onClick}
        className={`tile tile--app tile--${variant} ${locked ? "tile--locked" : ""}`}
        aria-label={label}
        title={label}
        type="button"
        disabled={locked}
      >
        <div className="tile__inner">
          <div className="tile__icon">{children}</div>
          <div className="tile__label">{label}</div>

          {locked && (
            <div className="lockX" aria-hidden="true">
              <span className="lockX__a" />
              <span className="lockX__b" />
            </div>
          )}
        </div>
      </button>

      {locked && <div className="lockTextBelow">{lockedText}</div>}
    </div>
  );
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** -------- Lockout persistence (per app) -------- */
function lockKey(appKey) {
  return `lockUntil:${todayKey()}:${appKey}`;
}

function getLockUntil(appKey) {
  try {
    return Number(localStorage.getItem(lockKey(appKey)) || "0");
  } catch {
    return 0;
  }
}

function setLockUntil(appKey, ts) {
  try {
    localStorage.setItem(lockKey(appKey), String(ts));
  } catch {
    // ignore
  }
}

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/** -------- Math problem generator -------- */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeMathProblem() {
  // Two-digit multiply like 17*19
  const a = randomInt(12, 29);
  const b = randomInt(12, 29);
  return {
    prompt: `${a} × ${b} = ?`,
    answer: a * b,
  };
}

/** -------- Log lines -------- */
function buildPressureLogs(secondsLeft) {
  const lines = [
    "boot: quarantine_kernel v2.4",
    "status: distraction_gate ARMED",
    "warning: dopamine request detected",
    "policy: solve challenge or lockout",
    "monitor: time is ticking…",
  ];

  if (secondsLeft <= 45) lines.push("hint: breathing optional, focus mandatory.");
  if (secondsLeft <= 30) lines.push("ALERT: 30 seconds left.");
  if (secondsLeft <= 20) lines.push("ALERT: time collapsing.");
  if (secondsLeft <= 10) lines.push("ALERT: final 10 seconds.");
  if (secondsLeft <= 5) lines.push("PANIC: last chance.");

  return lines;
}

export default function App() {
  // Overlay open state + target
  const [open, setOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [targetKey, setTargetKey] = useState("");

  // Challenge state
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [problem, setProblem] = useState(() => makeMathProblem());
  const [userAnswer, setUserAnswer] = useState("");
  const [errorText, setErrorText] = useState("");

  // Logs
  const [logLines, setLogLines] = useState([]);

  // Lockouts state (store timestamps)
  const [lockouts, setLockouts] = useState(() => ({
    tiktok: getLockUntil("tiktok"),
    twitter: getLockUntil("twitter"),
    facebook: getLockUntil("facebook"),
  }));

  // Tick for UI countdown under locked icons
  const [now, setNow] = useState(Date.now());

  const timerRef = useRef(null);
  const uiTickRef = useRef(null);

  useEffect(() => {
    uiTickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(uiTickRef.current);
  }, []);

  function isLocked(appKey) {
    return now < (lockouts[appKey] || 0);
  }

  function lockedText(appKey) {
    const until = lockouts[appKey] || 0;
    const diffMs = Math.max(0, until - now);
    const diffSec = Math.ceil(diffMs / 1000);
    return diffSec > 0 ? `Locked • ${formatMMSS(diffSec)}` : "";
  }

  function openWithChallenge(appKey, label, url) {
    if (isLocked(appKey)) return;

    setTargetKey(appKey);
    setTargetLabel(label);
    setTargetUrl(url);

    setSecondsLeft(60);
    setProblem(makeMathProblem());
    setUserAnswer("");
    setErrorText("");

    setLogLines(buildPressureLogs(60));
    setOpen(true);
  }

  function closeOverlay() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setOpen(false);
  }

  function failAndLock() {
    const lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    setLockUntil(targetKey, lockUntil);
    setLockouts((prev) => ({ ...prev, [targetKey]: lockUntil }));
    closeOverlay();
  }

  // NEW: Back/close counts as failing (prevents cheating)
  function backCountsAsFail() {
    if (!open || !targetKey) {
      closeOverlay();
      return;
    }
    failAndLock();
  }

  function submitAnswer() {
    if (secondsLeft <= 0) return;

    const n = Number(userAnswer.trim());
    if (!Number.isFinite(n)) {
      setErrorText("Enter a number.");
      return;
    }

    if (n === problem.answer) {
      window.location.href = targetUrl;
      return;
    }

    // unlimited attempts; only time-out causes lockout
    setErrorText("Wrong. Try again.");
    setUserAnswer("");
  }

  useEffect(() => {
    if (!open) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1;

        const newLogs = buildPressureLogs(next);
        setLogLines((prev) => {
          if (
            prev.length === newLogs.length &&
            prev[prev.length - 1] === newLogs[newLogs.length - 1]
          )
            return prev;
          return newLogs;
        });

        if (next <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setErrorText("Time’s up. Locked out for 5 minutes.");
          setTimeout(() => failAndLock(), 400);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pct = clamp(((60 - secondsLeft) / 60) * 100, 0, 100);

  return (
    <div className="page">
      <h1 className="page__title">Dopamine Controller</h1>
      <p className="page__subtitle">Tap an app → solve the challenge → continue.</p>

      <div className="tileRow">
        <IconTile
          label="TikTok"
          variant="tiktok"
          locked={isLocked("tiktok")}
          lockedText={lockedText("tiktok")}
          onClick={() => openWithChallenge("tiktok", "TikTok", "https://www.tiktok.com/")}
        >
          <FaTiktok />
        </IconTile>

        <IconTile
          label="Twitter"
          variant="twitter"
          locked={isLocked("twitter")}
          lockedText={lockedText("twitter")}
          onClick={() => openWithChallenge("twitter", "Twitter", "https://twitter.com/")}
        >
          <FaTwitter />
        </IconTile>

        <IconTile
          label="Facebook"
          variant="facebook"
          locked={isLocked("facebook")}
          lockedText={lockedText("facebook")}
          onClick={() => openWithChallenge("facebook", "Facebook", "https://www.facebook.com/")}
        >
          <FaFacebook />
        </IconTile>
      </div>

      {open && (
        <div className="qcOverlay" role="dialog" aria-modal="true">
          <div className="qcGlass" onClick={backCountsAsFail} />

          <div className="qcPanel" onClick={(e) => e.stopPropagation()}>
            <div className="qcHeader">
              <div className="qcTitle">QUARANTINE MODE</div>
              <button
                className="qcClose"
                onClick={backCountsAsFail}
                type="button"
                aria-label="Close quarantine"
              >
                ✕
              </button>
            </div>

            <div className="qcSub">
              Target: <span className="qcAccent">{targetLabel}</span>
            </div>

            <div className="qcProgressWrap">
              <div className="qcProgressBar">
                <div className="qcProgressFill" style={{ width: `${pct}%` }} />
              </div>
              <div className="qcProgressText">
                {secondsLeft > 0 ? `TIME LEFT: ${secondsLeft}s` : "TIME EXPIRED"}
              </div>
            </div>

            <div className="qcWindows">
              <div className="qcWindow">
                <div className="qcWindowTitle">SYSTEM LOG</div>
                <div className="qcLog">
                  {logLines.map((line, idx) => (
                    <div className="qcLogLine" key={idx}>
                      <span className="qcMono">{">"}</span>{" "}
                      <span className="qcMono">{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="qcWindow qcWindow--side">
                <div className="qcWindowTitle">WARNING</div>
                <div className="qcSideText">
                  <div className="qcBig qcBig--danger">SOLVE THIS MATH PROBLEM</div>
                  <div className="qcSmall qcSmall--danger">
                    OR YOU WILL BE LOCKED OUT FOR 5 MINUTES.
                  </div>

                  <div className="mathBox">
                    <div className="mathPrompt">{problem.prompt}</div>

                    <input
                      className="mathInput"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Type answer…"
                      inputMode="numeric"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitAnswer();
                      }}
                    />

                    {errorText && <div className="mathError">{errorText}</div>}

                    <button
                      className="qcBtn qcBtn--primary qcBtn--full"
                      onClick={submitAnswer}
                      disabled={secondsLeft <= 0}
                      type="button"
                    >
                      Submit
                    </button>

                    <button
                      className="qcBtn qcBtn--ghost qcBtn--full"
                      onClick={backCountsAsFail}
                      type="button"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* no footer needed */}
          </div>
        </div>
      )}
    </div>
  );
}