import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App.jsx";
import Stopwatch from "./Stopwatch.jsx";
import "./styles/base.css";
import "./styles/nav.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/modal.css";



function DrawerNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu" type="button">
          <span />
          <span />
          <span />
        </button>

        <div className="topbar__title">Dopamine Controller</div>
      </header>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <aside className={`drawer ${open ? "drawer--open" : ""}`}>
        <div className="drawer__header">
          <div className="drawer__title">Menu</div>
          <button className="drawer__close" onClick={() => setOpen(false)} aria-label="Close menu" type="button">
            ✕
          </button>
        </div>

        <div className="drawer__links">
          <Link to="/" className="drawer__link" onClick={() => setOpen(false)}>
            Launcher
          </Link>
          <Link to="/stopwatch" className="drawer__link" onClick={() => setOpen(false)}>
            Tracker
          </Link>
        </div>

        <div className="drawer__hint">Tip: Add more pages here anytime.</div>
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
