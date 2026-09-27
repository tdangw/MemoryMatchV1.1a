# TASK — Effect V2 Corrective Completion

## Status

- Thực hiện sau cùng, sau khi gameplay/UI Triple ổn định.
- CSS dedup đã làm; file này chỉ sửa fidelity/runtime effect còn thiếu.
- Nguồn thiết kế hình ảnh chi tiết: `TASK_CSS_DEDUP_EFFECTS_V2_PLAN.md` mục 7–10.

## Goal

Làm cho 21 hiệu ứng nối và 21 hiệu ứng xóa thực sự khác biệt theo catalog/thiết kế, dùng chung cho Link và Triple, vẫn giữ ID/save/ownership và ngân sách mobile.

## Confirmed root cause

- `effectCatalog` có family riêng nhưng `connectionEngine` chủ yếu dùng cùng hai polyline; đa số effect chỉ đổi màu/stroke.
- Canvas exit có trường hợp thất bại rồi rơi về dissolve mặc định.
- Test hiện xác nhận ID/class nhiều hơn là fidelity thị giác.

## Files to inspect

- `js/effects/effectCatalog.js`
- `js/effects/connectionEngine.js`
- `js/effects/exitEngine.js`
- `js/effects/effectRuntime.js`
- `js/linkConnect/linkEffectAdapter.js`
- `js/tripleConnect/tripleEffectAdapter.js`
- `styles/link-connect.css` và effect tests

## Required changes

### Gate 0 — Current-state contract

1. Xác nhận equip truyền đúng path/exit ID ở Link và Triple.
2. Lập coverage matrix 21/21: family, backend, target count, reduced fallback, cleanup.
3. Khóa ID/save/ownership và performance baseline; không chạy lại CSS inventory đã hoàn thành.

### Gate 1 — Connection family dispatch

1. Renderer dispatch theo catalog family, không switch rải rác theo ID.
2. Dùng renderer/preset riêng cho tracer, jagged, dual stroke, sparks, symbols, packets, gradient, wave/rings, helix, motes, ribbon, dash, projectile, charge, links, wavelets và droplets.
3. Persistent SVG surface/node pools; decoration giới hạn theo quality.
4. Geometry/topology vẫn rõ ở đường tối đa hai lần rẽ và Triple ba target.

### Gate 2 — Exit family fidelity/fallback

1. Hoàn thiện WAAPI, mask, particles, fragments, pair/group-aware families theo thiết kế gốc.
2. Canvas fail phải dùng fallback đặc trưng cùng family, không đồng loạt dissolve.
3. Link dùng 2 target; Triple dùng 3 target/centroid với particle budget theo một match.
4. Gameplay removal/score không phụ thuộc animation end.

### Gate 3 — Runtime/cleanup/quality

1. Một handle cancel/finished/dispose idempotent cho mỗi effect.
2. Restart/unmount/visibility/reduced-motion dừng RAF, clear canvas và bỏ reference ảnh/DOM.
3. Quality low/medium/high/reduced giữ signature nhưng giảm decoration/particle.
4. Không allocation object/array mỗi frame; DPR clamp và canvas resize chỉ khi geometry đổi.

### Gate 4 — Visual and performance proof

1. Test mỗi ID resolve đúng family và tạo signature DOM/SVG/canvas riêng.
2. Visual matrix Link/Triple, desktop và hai viewport mobile mục tiêu.
3. Lifecycle 100 chu kỳ cho representative families và interrupt giữa effect.
4. Benchmark p95 frame/draw, long task, heap/DOM delta; check/build/regression.

## Acceptance criteria

- [ ] 21 path và 21 exit giữ nguyên ID nhưng không còn gần như cùng output mặc định.
- [ ] Mọi catalog family có renderer và fallback tương ứng.
- [ ] Link/Triple đúng 2/3 target; reduced motion an toàn.
- [ ] Không RAF/listener/node/reference leak.
- [ ] Performance gate và visual review pass.

## Do not do

- Không đổi gameplay, save key, ownership hoặc giá effect.
- Không mở lại CSS dedup ngoài regression trực tiếp.
- Không thêm WebGL/dependency mới khi chưa có benchmark chứng minh cần thiết.
