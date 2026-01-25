import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App.jsx";
import Stopwatch from "./Stopwatch.jsx";

function Nav() {
  return (
    <nav style={{ padding: 16, display: "flex", gap: 12, fontFamily: "system-ui" }}>
      <Link to="/">Launcher</Link>
      <Link to="/stopwatch">Stopwatch</Link>
    </nav>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/stopwatch" element={<Stopwatch />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
