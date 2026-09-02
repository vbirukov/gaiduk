/**
 * Применяет патчи к node_modules после npm install.
 * Аналог patch-package, но без внешних зависимостей.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const patchesDir = resolve(root, "patches");

const PATCHES = [
  {
    file: "node_modules/@vbirukov/player/src/lib/catalogSections.ts",
    patch: "patches/catalogSections.patch",
  },
];

function applyPatch(filePath, patchPath) {
  const absFile = resolve(root, filePath);
  const absPatch = resolve(root, patchPath);

  if (!existsSync(absFile)) {
    console.warn(`[patches] file not found (skip): ${filePath}`);
    return;
  }
  if (!existsSync(absPatch)) {
    console.warn(`[patches] patch not found (skip): ${patchPath}`);
    return;
  }

  const original = readFileSync(absFile, "utf8");
  const patch = readFileSync(absPatch, "utf8");

  // Parse unified diff
  const hunks = patch.split(/\n(?=@@ )/g);
  let result = original;
  let applied = false;

  for (const hunk of hunks) {
    if (!hunk.startsWith("@@")) continue;
    const lines = hunk.split("\n");
    // Parse @@ -oldStart,oldLen +newStart,newLen @@
    const header = lines[0];
    const hdrMatch = header.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!hdrMatch) continue;

    let oldLine = parseInt(hdrMatch[1], 10);
    const oldLen = hdrMatch[2] ? parseInt(hdrMatch[2], 10) : 1;
    const oldEnd = oldLine + oldLen;

    // Extract the old content from the hunk
    const contextLines = [];
    const newLines = [];
    let hunkOldLine = oldLine;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("-")) {
        contextLines.push({ line: hunkOldLine, text: line.slice(1) });
        hunkOldLine++;
      } else if (line.startsWith("+")) {
        newLines.push(line.slice(1));
      } else {
        contextLines.push({ line: hunkOldLine, text: line.slice(1) });
        hunkOldLine++;
      }
    }

    // Find the old content in the file
    const fileLines = result.split("\n");
    const oldContent = contextLines.map(l => l.text).join("\n");
    const newContent = newLines.join("\n");

    // Try to find the context
    const startIdx = fileLines.findIndex((_, i) => {
      const chunk = fileLines.slice(i, i + contextLines.length).join("\n");
      return chunk === oldContent;
    });

    if (startIdx >= 0) {
      // Replace old content with new content
      const before = fileLines.slice(0, startIdx);
      const after = fileLines.slice(startIdx + contextLines.length);
      result = [...before, ...newLines, ...after].join("\n");
      applied = true;
      console.log(`[patches] applied: ${filePath}`);
    } else {
      // Check if already applied
      const alreadyApplied = fileLines.some((_, i) => {
        const chunk = fileLines.slice(i, i + newLines.length).join("\n");
        return chunk === newContent;
      });
      if (alreadyApplied) {
        console.log(`[patches] already applied: ${filePath}`);
      } else {
        console.warn(`[patches] could not apply: ${filePath} (context not found)`);
      }
    }
  }

  if (applied) {
    writeFileSync(absFile, result, "utf8");
  }
}

for (const { file, patch } of PATCHES) {
  applyPatch(file, patch);
}

console.log("[patches] done");