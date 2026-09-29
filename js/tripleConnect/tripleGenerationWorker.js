import {
  generateEasyTripleBoard,
  generateChallengeTripleBoard,
  generateEndlessTripleBoard,
  generateHardTripleBoard,
  generateNormalTripleBoard,
  generateSuperHardTripleBoard,
} from "./tripleBoard.js";

const generators = Object.freeze({
  easy: generateEasyTripleBoard,
  normal: generateNormalTripleBoard,
  hard: generateHardTripleBoard,
  superHard: generateSuperHardTripleBoard,
  endless: generateEndlessTripleBoard,
  challenge: generateChallengeTripleBoard,
});

self.addEventListener("message", ({ data }) => {
  const { requestId, mode, seed, level } = data || {};
  try {
    const generate = generators[mode];
    if (!generate) throw new TypeError(`Unsupported Triple mode: ${mode}`);
    const generated = generate({ seed, level });
    self.postMessage({ requestId, ok: true, generated });
  } catch (error) {
    self.postMessage({
      requestId,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
