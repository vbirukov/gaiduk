import { createRoot } from "react-dom/client";
import { EmbedApp, setPlayerConfig } from "@vbonline/player";
import { haidukPlayerConfig } from "./src/app/haidukConfig";
import "./styles-embed.css";
import "./styles.css";
import "./styles-motion.css";

setPlayerConfig(haidukPlayerConfig);
createRoot(document.getElementById("root")!).render(<EmbedApp />);
