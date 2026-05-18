import type { Catalog } from "../types/catalog";

export const fallbackCatalog: Catalog = {
  sourceTitle: "СКАЗКИ АУДИО",
  loaded: false,
  folders: [
    "01 RASTAMANSKIE SKAZKI 1995 - 1997",
    "01 RASTAMANSKIE SKAZKI 1997 - 1999",
    "01 RASTAMANSKIE SKAZKI 2000 - 2004",
    "01 RASTAMANSKIE SKAZKI 2004 - 2008",
    "01 RASTAMANSKIE SKAZKI 2010 - 2020",
    "02 JAH BUDDHA I EGO JAHTAKI",
    "03 SKAZKI NARODOV MIRA",
    "04 POVEST' PRO CHUJIE GLAZA",
    "05 INDIYSKIY POKOYNIK",
    "06 DRUGIE SKAZKI",
    "07 STIKHI I PESNI",
  ],
  tracks: [
    {
      id: "stub-1",
      title: "Демо: Растаманская сказка",
      fileName: "demo.mp3",
      folder: "01 RASTAMANSKIE SKAZKI 1995 - 1997",
      folderPath: "/",
      path: "/demo1",
      url: "",
    },
    {
      id: "stub-2",
      title: "Демо: Jah Buddha",
      fileName: "demo2.mp3",
      folder: "02 JAH BUDDHA I EGO JAHTAKI",
      folderPath: "/",
      path: "/demo2",
      url: "",
    },
    {
      id: "stub-3",
      title: "Демо: Сказка народов мира",
      fileName: "demo3.mp3",
      folder: "03 SKAZKI NARODOV MIRA",
      folderPath: "/",
      path: "/demo3",
      url: "",
    },
  ],
};
