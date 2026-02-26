import { useEffect, useMemo, useRef, useState } from "react";
import { FaTiktok, FaTwitter, FaFacebook } from "react-icons/fa";

function IconTile({ label, onClick, variant, children }) {
  return (
    <button
      onClick={onClick}
      className={`tile tile--app tile--${variant}`}
      aria-label={label}
      title={label}
      type="button"
    >
      <div className="tile__inner">
        <div className="tile__icon">{children}</div>
        <div className="tile__label">{label}</div>
      </div>
    </button>
  );
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function opensStorageKey(appKey) {
  return `opens:${todayKey()}:${appKey}`;
}

function getOpensToday(appKey) {
  try {
    return Number(localStorage.getItem(opensStorageKey(appKey)) || "0");
  } catch {
    return 0;
  }
}

function incrementOpensToday(appKey) {
  const next = getOpensToday(appKey) + 1;
  try {
    localStorage.setItem(opensStorageKey(appKey), String(next));
  } catch {
    // ignore
  }
  return next;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function buildLogs(appLabel, attempt) {
  const base = [
    "boot: quarantine_kernel v1.0",
    `target: ${appLabel.toLowerCase()}.app`,
    "proc: impulse_detector.exe",
    "scan: dopamine_signature...",
    "scan: attention_hijack_vectors...",
    "firewall: blocking autopilot...",
    "verify: user_intent_checksum...",
    "contain: reward_loop isolated",
    "status: containment stable",
  ];

  if (attempt >= 2) base.splice(4, 0, `alert: repeat attempt detected (${attempt})`);
  if (attempt >= 3) base.splice(6, 0, "lock: hardened mode enabled");

  return base;
}

export default function App() {
  const [open, setOpen] = useState(false);

  // “Target” info for the overlay
  const [targetUrl, setTargetUrl] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [attemptNumber, setAttemptNumber] = useState(1);

  // countdown + logs
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [logLines, setLogLines] = useState([]);

  const timerRef = useRef(null);

  const logs = useMemo(() => {
    return buildLogs(targetLabel || "app", attemptNumber);
  }, [targetLabel, attemptNumber]);

  function openWithFriction(appKey, label, url) {
    // track attempts per day (for escalation later)
    const attempt = incrementOpensToday(appKey);

    setTargetUrl(url);
    setTargetLabel(label);
    setAttemptNumber(attempt);

    // escalation (simple)
    const base = 10;
    const extra = attempt === 1 ? 0 : attempt === 2 ? 5 : 10;
    const secs = base + extra;

    setSecondsLeft(secs);
    setLogLines([logs[0] || "boot: quarantine_kernel v1.0"]);
    setOpen(true);
  }

  function cancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setOpen(false);
  }

  function go() {
    // keep your deep-link behavior
    window.location.href = targetUrl;
  }

  useEffect(() => {
    if (!open) return;

    // reset logs
    setLogLines([logs[0]]);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1;

        // drip logs each second based on elapsed
        setLogLines((prev) => {
          const elapsed = Math.max(0, (secondsLeft - next)); // approx
          const idx = clamp(elapsed, 0, logs.length - 1);
          const desired = logs.slice(0, idx + 1);
          if (prev.length === desired.length) return prev;
          return desired;
        });

        if (next <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
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
  }, [open, logs]);

  const canContinue = secondsLeft === 0;

  // progress based on the starting number for this open
  const startingSeconds = useMemo(() => {
    // attempt 1: 10, attempt 2: 15, attempt 3+: 20 (must match openWithFriction calc)
    const base = 10;
    const extra = attemptNumber === 1 ? 0 : attemptNumber === 2 ? 5 : 10;
    return base + extra;
  }, [attemptNumber]);

  const pct = clamp(((startingSeconds - secondsLeft) / startingSeconds) * 100, 0, 100);

  return (
    <div className="page">
      <h1 className="page__title">Dopamine Controller</h1>
      <p className="page__subtitle">Tap an app → quarantine scan → then you can continue.</p>

      <div className="tileRow">
        <IconTile
          label="TikTok"
          variant="tiktok"
          onClick={() => openWithFriction("tiktok", "TikTok", "https://www.tiktok.com/")}
        >
          <FaTiktok />
        </IconTile>

        <IconTile
          label="Twitter"
          variant="twitter"
          onClick={() => openWithFriction("twitter", "Twitter", "https://twitter.com/")}
        >
          <FaTwitter />
        </IconTile>

        <IconTile
          label="Facebook"
          variant="facebook"
          onClick={() => openWithFriction("facebook", "Facebook", "https://www.facebook.com/")}
        >
          <FaFacebook />
        </IconTile>
      </div>

      {open && (
        <div className="qcOverlay" role="dialog" aria-modal="true">
          <div className="qcGlass" onClick={cancel} />

          <div className="qcPanel" onClick={(e) => e.stopPropagation()}>
            <div className="qcHeader">
              <div className="qcTitle">QUARANTINE MODE</div>
              <button className="qcClose" onClick={cancel} type="button" aria-label="Close quarantine">
                ✕
              </button>
            </div>

            <div className="qcSub">
              Target: <span className="qcAccent">{targetLabel}</span> • Attempt today:{" "}
              <span className="qcAccent">{attemptNumber}</span>
            </div>

            <div className="qcProgressWrap">
              <div className="qcProgressBar">
                <div className="qcProgressFill" style={{ width: `${pct}%` }} />
              </div>
              <div className="qcProgressText">
                {canContinue ? "UNLOCKED — proceed." : `Scanning… ${secondsLeft}s`}
              </div>
            </div>

            <div className="qcWindows">
              <div className="qcWindow">
                <div className="qcWindowTitle">SYSTEM LOG</div>
                <div className="qcLog">
                  {logLines.map((line, idx) => (
                    <div className="qcLogLine" key={idx}>
                      <span className="qcMono">{">"}</span> <span className="qcMono">{line}</span>
                    </div>
                  ))}
                  {canContinue && (
                    <div className="qcLogLine">
                      <span className="qcMono">{">"}</span>{" "}
                      <span className="qcMono qcGood">gate: cleared — continue enabled</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="qcWindow qcWindow--side">
                <div className="qcWindowTitle">WARNING</div>
                <div className="qcSideText">
                  <div className="qcBig">DOPAMINE.EXE</div>
                  <div className="qcSmall">Impulse intercept active.</div>
                  <div className="qcSmall">Break autopilot before continuing.</div>
                </div>
              </div>
            </div>

            <div className="qcActions">
              <button className="qcBtn qcBtn--ghost" onClick={cancel} type="button">
                Back
              </button>

              <button className="qcBtn qcBtn--primary" onClick={go} disabled={!canContinue} type="button">
                Continue to {targetLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}