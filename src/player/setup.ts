import { setPlayerConfig } from "@vbirukov/player";
import { haidukPlayerConfig } from "../app/haidukConfig";

// Единая точка инициализации плеера. Импортируется ПЕРВОЙ строкой
// в entry-файлах (main.tsx / embed.tsx) ДО рендера — иначе движок
// бросит «Вызови setPlayerConfig() до рендера PlayerApp».
setPlayerConfig(haidukPlayerConfig);
