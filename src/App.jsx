import { useEffect, useRef, useState } from "react";
import { FaTiktok, FaTwitter, FaFacebook } from "react-icons/fa";

function IconTile({ label, onClick, bg, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 92,
        height: 92,
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.35)",
        background: bg,
        display: "grid",
        placeItems: "center",
        boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
        cursor: "pointer",
      }}
      aria-label={label}
      title={label}
    >
      <div style={{ display: "grid", gap: 8, placeItems: "center" }}>
        <div
          style={{
            fontSize: 40,
            lineHeight: 1,
            color,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
          }}
        >
          {children}
        </div>
        <div style={{ fontSize: 12, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
          {label}
        </div>
      </div>
    </button>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [targetUrl, setTargetUrl] = useState("");
  const timerRef = useRef(null);

  function openWithFriction(url) {
    setTargetUrl(url);
    setSecondsLeft(10);
    setOpen(true);
  }

  function cancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setOpen(false);
  }

  function go() {
    window.location.href = targetUrl;
  }

  useEffect(() => {
    if (!open) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [open]);

  const canContinue = secondsLeft === 0;

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Dopamine Controller</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        Tap an app → wait 10s → then you can continue.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 18 }}>
        <IconTile
          label="TikTok"
          onClick={() => openWithFriction("https://www.tiktok.com/")}
          bg="linear-gradient(135deg, #111 0%, #2a2a2a 100%)"
          color="#ffffff"
        >
          <FaTiktok />
        </IconTile>

        <IconTile
          label="Twitter"
          onClick={() => openWithFriction("https://twitter.com/")}
          bg="linear-gradient(135deg, #1DA1F2 0%, #0b63a5 100%)"
          color="#ffffff"
        >
          <FaTwitter />
        </IconTile>

        <IconTile
          label="Facebook"
          onClick={() => openWithFriction("https://www.facebook.com/")}
          bg="linear-gradient(135deg, #1877F2 0%, #0b3c88 100%)"
          color="#ffffff"
        >
          <FaFacebook />
        </IconTile>
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 18,
              width: 340,
              borderRadius: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Wait…</h2>
            <p style={{ marginBottom: 12 }}>
              {canContinue
                ? "You can continue now."
                : `You can continue in ${secondsLeft}s`}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancel} style={{ padding: "10px 12px" }}>
                Cancel
              </button>
              <button
                onClick={go}
                disabled={!canContinue}
                style={{ padding: "10px 12px" }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
