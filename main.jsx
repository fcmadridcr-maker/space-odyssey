import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./style.css";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor("#050914"); tg.setBackgroundColor("#050914"); } catch {}
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);