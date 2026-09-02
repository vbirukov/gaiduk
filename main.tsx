import "./src/player/setup"; // ← первым: конфиг плеера до рендера
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./src/App";
import "@vbirukov/player/layout.css";
import "./src/index.css";
import "./styles.css";
import "./styles-motion.css";
import "./styles-material.css";
import "./styles-rasta-light.css";
import "./styles-jaipur.css";
import "./styles-moon-dub.css";
import "./styles-sleep-timer.css";
import "./styles-player-original.css"; // dev-переключатель: рендер плеера «как в ядре»

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
