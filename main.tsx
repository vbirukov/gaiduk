import { createRoot } from "react-dom/client";
import { setPlayerConfig } from "@vbonline/player";
import { App } from "./src/App";
import { haidukPlayerConfig } from "./src/app/haidukConfig";
import { initButtonRipple } from "@vbonline/player/lib/buttonRipple";
import "./styles.css";
import "./styles-motion.css";
import "./styles-material.css";
import "./styles-rasta-light.css";
import "./styles-jaipur.css";
import "./styles-moon-dub.css";

setPlayerConfig(haidukPlayerConfig);
initButtonRipple();
createRoot(document.getElementById("root")!).render(<App />);
