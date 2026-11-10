# MAP_VISUAL_REFRESH_PLAN — 07/11/2026

Scope: Main menu responsive PC fix; three adventure-map backgrounds and surrounding decoration/motion. Other functional tabs, gameplay, node geometry, APIs, save schema and catalog IDs stay unchanged. Preserve existing uncommitted Home work.

Approach: per-game static WebP scenery plus data-driven native ambient regions using existing singleton/lifecycle/budgets. Rejected: animating the full background or adding a second particle scheduler (large repaint, duplicate lifecycle and unnecessary layers).

Animation: ambient only, no gameplay timing dependency. Leaves drift, fireflies pulse/drift, small lamps glow in 7–24 second cycles; transform/opacity only. At most 5 native timelines, 24 nodes, 6 layers; no new RAF loop. Permit overlap with route and level cells, pointer-events:none, low-opacity small envelopes. Keep fixed shortcuts/dock/ad exclusions. Existing scroll/modal/hidden/reduced-motion teardown applies; static art is fallback.

Gates:
1. Inventory owners and establish baseline mobile/desktop diagnostics/frame samples.
2. Generate/compress three separate map textures; wire scoped theme configuration and adjust decoration palette without node geometry changes. Add visible bounded ambient accents near route.
3. Preserve Home artwork ratio on PC/landscape; fill wide backdrop without stretching foreground.
4. Verify map interaction, responsive layout, reduced-motion, scroll/modal/rapid navigation cleanup, bounded nodes/handles and frame/long-task measurements; check/build and final diff review. Store evidence in this file; no APK/deploy.

Acceptance: distinct three map identities; unchanged level/chest controls and save/API; no stretched Home artwork on PC; bounded animation resources released on navigation and accessibility/visibility transitions; measured local browser evidence with hardware limitations stated.

Status: All four gates completed for the visual scope. Existing unrelated regression limitations are recorded below.

Art: built-in image generation, 3 separate portrait 1024×1536 masters retained under Codex generated_images. Product exports 768×1152 WebP quality85: memory188552B, link127008B, triple143004B. Prompts: explorer treehouse forest / sunny fruit orchard with creek / lavender flower-crystal floating-island garden; all top-down oblique, quiet central65%, no text/UI/path/characters, green or lavender repeat edges. Small vector accents authored as SVG; existing level/chest artwork unchanged.

Measurement: local Chromium, 412×915, native motion enabled, CPU6x, 2.5s idle samples per map after preparation; p95/max RAF interval ms and long tasks:
| Map | Before p95/max | After p95/max | Long tasks before/after |
| --- | --- | --- | --- |
| Memory | 14.0/159.6 | 7.1/34.7 | 3/0 |
| Link | 7.1/97.2 | 7.1/14.0 | 1/0 |
| Triple | 13.9/55.5 | 14.0/27.9 | 1/0 |
Old scenes10nodes/4handles; new13nodes/5handles; 1scene/1observer and 0RAF pending. Three static textures add458564B compressed and about10.1MiB decoded RGBA total if all3 retained; only current map is drawn. These short browser samples include scheduling variance and are not real-device FPS certification or proof of speedup. Runtime caches finite3 sources, no per-frame JS allocations introduced.


Final verification (07/11/2026):
- npm run check: PASS (260 JS modules, CSS ownership, runtime/effect, geometry, persistence, game contracts, ads/accounts).
- npm run build: PASS; final build includes scenery seam blending and responsive landscape rule.
- map-visual-refresh + home-cover: 10/10 PASS. Profiles320×740,412×915,844×390,1440×900; Home also320×640,1024×900. Checks pointer events, texture identity, node bounds, opening all three maps, press/audio transition, modal/scroll/pagehide/pageshow/reduced-motion, 12 rapid cross-map mounts and failed-art fallback.
- Adventure regression combined run:31 PASS/10 FAIL; nine failures are old title/first-play expectations, one was an ENOENT trace-file collision. Isolated640×360 Triple retry: PASS. Baseline representative tests using HEAD adventureMap/bindings/scene/primitives also fail with identical title mismatch (Màn1 vs Màn1·Dễ) and first-play tutorial keeping preview open. Existing tests preserved; no product behavior changed to satisfy them. Automatic review rejected a proposed test adjustment; it was not applied. This is not a claim that the full legacy suite passes.
- Final diff review: scenery ownership only in adventureMap (theme marker/import), background config/binding/scene/native renderer, map-themes.css, three WebP+three SVG assets; Home change this phase only adds responsive landscape/PC rule. Other dirty Home/audio files are prior task work; liveops/letter/style edits from another agent were untouched. No API/save/catalog ID changes, deployment, APK or unrelated-tab changes.

Assets saved in public/assets/adventure/map-{memory-match,link-connect,triple-connect}.webp and decor-{memory-match,link-connect,triple-connect}.svg. Final prompt set recorded above; built-in image generation used, no CLI fallback. Raw browser screenshots/metrics remain in ignored test-results and runtime/map-final-qa; baseline comparison retained in runtime/map-baseline-metrics.json and runtime/map-new-metrics.json.

Remaining verification: real Android device frame pacing, GPU memory, thermal/power behavior; no claim of certified60FPS. Static texture remains when motion is disabled or unavailable. Independent read-through performed after implementation; no subagent used for this task.


## Follow-up: seam continuity and glare — completed07/11
Original tile artwork did not join: edge objects were cut; prior broad color fade did not satisfy visual acceptance. Reopened visual correction only. Selected: edit source artwork to keep every tree/rock/water feature inside the tile, use matching quiet grass at both repeat edges plus narrow4% color continuity blend. Rejected: thicker color strips (still hides wrong artwork) or mirrored alternating tiles (upside-down objects). Keep static repeat rendering and existing timelines; no new DOM/RAF/filter.
Orchard and magic garden are toned down at source for clearer route/level labels. Forest retains its original contrast. Original moonlit-garden.webp, garden-sprites.webp, MAP_SCENE/MAP_DETAILS and water/fish/pond/lamp/leaf/firefly renderer remain intact for possible event reuse; no event system or event map added.
Edits generated through built-in image tool from each current map export. Prompt constraints: preserve scene identity, keep all objects inside middle80% vertically; matching shaded grass/plum top/bottom2%, smooth outer8%; orchard/magic brightness ~35% and saturation20–25% lower. Product exports keep same768×1152 dimensions and paths; no API/save/catalog changes. Verification pending.


Follow-up verification: CSS ownership PASS; npm run build PASS. map-seam + map-visual-refresh 7/7 PASS; final forest export rechecked with map-seam2/2 PASS on412×915 and1024×900, three scroll positions around joins for each game. Viewed screenshots at actual joins for all3, plus final forest join after correcting its excessive dark band. Original forest correction was rejected visually and refined: replace dark edge bands with textured grass matching central clearing, no edge vignette; final prompt specifically preserves all interior objects. Matching edge-tone blend narrowed from12% to4%, no extra nodes, timelines, RAF or filters. Images remain768×1152: forest191844B, orchard136032B, magic103108B (total430984B). Runtime budgets and decoded image dimensions unchanged. This follow-up changes only three product WebP images, map-themes.css and task notes; other agents' tab changes untouched.
Original moonlit-garden.webp/garden-sprites.webp/presets.js/mapDetails.js verified unchanged against HEAD with git diff --exit-code. They are preserved for possible event-map use. Current3 themes use leaf/firefly/lamp; water/fish/pond and old coordinates remain available in the legacy renderer and descriptors, but require deliberate event wiring/placement rather than being mapped blindly onto different artwork. No event map was created.
Known limitation: scenery motifs repeat by design; this correction removes clipped objects and abrupt border joins, not repetition of the same authored scenery. Real Android device performance remains unverified; no runtime resource increase introduced. No APK/deploy.
