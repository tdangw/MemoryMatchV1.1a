import { rm } from "node:fs/promises";
import { resolve } from "node:path";

await rm(
  resolve("dist", "assets", "sounds", "victory-flower-theme.mp3"),
  { force: true },
);
