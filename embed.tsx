import { createRoot } from "react-dom/client";
import { EmbedApp } from "./src/EmbedApp";
import "./styles-embed.css";
import "./styles.css";
import "./styles-motion.css";

createRoot(document.getElementById("root")!).render(<EmbedApp />);
