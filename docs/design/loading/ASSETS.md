# Loading garden — 19/10/2026

Approved scope: application open/reload only; static gate, live title/progress, real startup phases without a displayed percentage. Latest feedback adds a bounded activity strip while code readiness is unknown and a180ms opacity handoff (none in reduced motion). No door-opening effect or minimum display delay; Home art no longer blocks readiness.

- Runtime: `public/assets/images/loading/garden-gate-v1.webp`, 960×1440, 122606 bytes, quality82/method6.
- Master: `docs/design/loading/masters/garden-gate-v1.png`, generated with the built-in imagegen tool (not API/CLI fallback). The user's supplied loading reference was a style/composition input, not a production sprite sheet.
- Typography, small ornament and progress track/fill are native HTML/SVG/CSS. The background contains no text or loading bar. No other artwork replaced.
- Reproduce compression: `python scripts/prepare-loading-assets.py`; Pillow, resize master to960×1440 with LANCZOS; WebP quality82, method6. Keep source outside public assets.
- Common evidence/acceptance: `docs/design/ui-consistency/RECEIPT.md`. Source startup before this task is preserved under `docs/design/loading/baseline/`; historical QA is not overwritten.

## Final imagegen prompt

Use case: stylized-concept. Create one finished portrait 2:3 game loading BACKGROUND asset, not an asset sheet or UI mockup. Input image is a style/composition reference ONLY: use the RIGHT HAND garden doorway scene, ignore the entire left-hand asset sheet. A beautiful painterly enchanted garden gate at night: dark teal wooden doors already opened to both edges, delicate aged gold trim, ivy and tiny ivory flowers framing an arch across the top, mossy stone threshold below, subtle diagonal moonlight from upper right. Muted deep teal, forest greens and soft antique gold, premium storybook game art, elegant and restrained, no neon. Central65% of canvas between18% and72% height must be dark, calm low-detail teal negative space for live title and loading bar which will be added by code. Doors, leaves and flowers must stay near edges. Stone floor lower20%. Seamless full-bleed portrait single scene. Absolutely NO text, letters, numbers, logos, loading bars, UI frames, labels, asset grid, watermark, characters, or floating particles. Crisp professional painted edge detail, quiet center.
