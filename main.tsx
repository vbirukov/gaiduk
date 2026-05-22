import { createRoot } from "react-dom/client";
import { App } from "./src/App";
import { initButtonRipple } from "./src/lib/buttonRipple";
import "./styles.css";
import "./styles-motion.css";
import "./styles-rasta-light.css";
import "./styles-jaipur.css";

initButtonRipple();
createRoot(document.getElementById("root")!).render(<App />);
