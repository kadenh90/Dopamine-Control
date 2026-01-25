import { useEffect, useRef, useState } from "react";
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
    <div className="page">
      <h1 className="page__title">Dopamine Controller</h1>
      <p className="page__subtitle">Tap an app → wait 10s → then you can continue.</p>

      <div className="tileRow">
        <IconTile
          label="TikTok"
          variant="tiktok"
          onClick={() => openWithFriction("https://www.tiktok.com/")}
        >
          <FaTiktok />
        </IconTile>

        <IconTile
          label="Twitter"
          variant="twitter"
          onClick={() => openWithFriction("https://twitter.com/")}
        >
          <FaTwitter />
        </IconTile>

        <IconTile
          label="Facebook"
          variant="facebook"
          onClick={() => openWithFriction("https://www.facebook.com/")}
        >
          <FaFacebook />
        </IconTile>
      </div>

      {open && (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="modalCard">
            <h2 className="modalTitle">Wait…</h2>
            <p className="modalText">
              {canContinue ? "You can continue now." : `You can continue in ${secondsLeft}s`}
            </p>

            <div className="modalActions">
              <button className="btn btn--ghost" onClick={cancel} type="button">
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={go}
                disabled={!canContinue}
                type="button"
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
