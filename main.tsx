import { createRoot } from "react-dom/client";
import { App } from "./src/App";
import { initMetrika } from "./src/lib/metrika";
import "./styles.css";
import "./styles-motion.css";
import "./styles-rasta-light.css";
import "./styles-jaipur.css";

initMetrika();

createRoot(document.getElementById("root")!).render(<App />);
