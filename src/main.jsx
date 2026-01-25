import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App.jsx";
import Stopwatch from "./Stopwatch.jsx";

function DrawerNav() {
  const [open, setOpen] = useState(false);

  const linkStyle = {
    padding: "12px 14px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#111",
    display: "block",
  };

  return (
    <>
      {/* Top bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "white",
          borderBottom: "3px solid #cf7105",
          padding: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "system-ui",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "2px solid #000000",
            background: "white",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            background: "#ff8800",
          }}
        >
          {/* hamburger icon */}
          <div style={{ display: "grid", gap: 4 }}>
            <span style={{ width: 18, height: 2, background: "#111", display: "block" }} />
            <span style={{ width: 18, height: 2, background: "#111", display: "block" }} />
            <span style={{ width: 18, height: 2, background: "#111", display: "block" }} />
          </div>
        </button>

        <div style={{ fontWeight: 800 }}>Dopamine Controller</div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 60,
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 280,
          background: "white",
          zIndex: 70,
          transform: open ? "translateX(0)" : "translateX(-110%)",
          transition: "transform 200ms ease",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          padding: 14,
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Menu</div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <Link to="/" style={linkStyle} onClick={() => setOpen(false)}>
            Launcher
          </Link>
          <Link to="/stopwatch" style={linkStyle} onClick={() => setOpen(false)}>
            Stopwatch
          </Link>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: "#666" }}>
          Tip: Add more pages here anytime.
        </div>
      </aside>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DrawerNav />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/stopwatch" element={<Stopwatch />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
