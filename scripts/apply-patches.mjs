/**
 * Применяет патчи к node_modules после npm install.
 * Использует файлы .original и .patched для точного совпадения.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PATCHES = [
  {
    file: "node_modules/@vbirukov/player/src/lib/catalogSections.ts",
    original: "patches/catalogSections.original",
    patched: "patches/catalogSections.patched",
  },
];

for (const { file, original: origFile, patched: patchedFile } of PATCHES) {
  const absFile = resolve(root, file);
  const absOriginal = resolve(root, origFile);
  const absPatched = resolve(root, patchedFile);

  if (!existsSync(absFile)) {
    console.warn(`[patches] file not found (skip): ${file}`);
    continue;
  }

  const content = readFileSync(absFile, "utf8");
  const expected = readFileSync(absOriginal, "utf8");
  const replacement = readFileSync(absPatched, "utf8");

  // Normalize line endings for comparison
  const norm = (s) => s.replace(/\r\n/g, "\n").trim();
  const contentNorm = norm(content);
  const expectedNorm = norm(expected);
  const replacementNorm = norm(replacement);

  if (contentNorm === replacementNorm) {
    console.log(`[patches] already applied: ${file}`);
    continue;
  }

  if (contentNorm !== expectedNorm) {
    console.warn(`[patches] unexpected content (skip): ${file}`);
    console.warn(`  Expected ${expectedNorm.length} chars, got ${contentNorm.length} chars`);
    continue;
  }

  // Preserve original line endings
  const hasCRLF = content.includes("\r\n");
  const final = hasCRLF ? replacementNorm.replace(/\n/g, "\r\n") : replacementNorm;

  writeFileSync(absFile, final, "utf8");
  console.log(`[patches] applied: ${file}`);
}

console.log("[patches] done");