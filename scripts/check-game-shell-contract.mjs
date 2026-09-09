import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
  ? walk(`${dir}/${entry.name}`) : entry.name.endsWith(".js") ? [`${dir}/${entry.name}`] : []);
const files = walk("js");
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*|\bimport\s*\()(["'])(\.[^"']+)\1/g)) {
    assert.ok(existsSync(resolve(dirname(file), match[2])), `${file}: missing import ${match[2]}`);
  }
  assert.doesNotMatch(source, /legacy(?:Shell|Hud)Adapters|link-energy-flight|link-item-reward-flight/, `${file}: obsolete shell adapter/effect`);
  if (file.startsWith("js/gameShell/") || /(?:memoryShell|linkShell|linkRenderer)\.js$/.test(file)) {
    const body = source.replace(/import[\s\S]*?from\s*["'][^"']+["'];/g, "");
    for (const declaration of source.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
      for (const spec of declaration[1].split(",")) {
        const name = spec.trim().split(/\s+as\s+/).pop();
        if (name) assert.match(body, new RegExp(`\\b${name}\\b`), `${file}: unused named import ${name}`);
      }
    }
  }
  if (file.startsWith("js/gameShell/")) {
    assert.doesNotMatch(source, /(?:from\s*|import\s*\()["'][^"']*(?:gameState|linkState|gameController|linkController|pathfinder|linkBoard|memorySpecial)[^"']*["']/, `${file}: shell must not import gameplay`);
    assert.doesNotMatch(source, /#["']?(?:grid-container|link-board|game-container|link-connect-container)\b/, `${file}: game-specific selector in shared core`);
  }
}
for (const file of ["js/memoryMatch/memoryShellDom.js", "js/linkConnect/linkShell.js"]) {
  const source = readFileSync(file, "utf8");
  for (const region of ["title", "progress", "hud", "milestones", "frame", "board"]) {
    assert.equal([...source.matchAll(new RegExp(`data-shell-region="${region}"`, "g"))].length, 1, `${file}: region ${region}`);
  }
  const ids = [...source.matchAll(/\bid="([^"$]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate literal ID`);
}
const css = readFileSync("styles/link-connect.css", "utf8");
assert.doesNotMatch(css, /link-energy-flight|link-item-reward-flight|--link-energy-|--link-item-reward-/);
assert.doesNotMatch(readFileSync("index.html", "utf8"), /id="(?:game-container|link-connect-container)"/, "game markup belongs to each shell module");
console.log("Game Shell import, ownership, region and legacy cleanup contracts passed.");
