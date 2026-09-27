# TASK — Triple Connect Milestone 10/30 Rebalance

## Status

- Quyết định sản phẩm đã chốt: chuyển 15 mốc/45 bộ ba về 10 mốc/30 bộ ba.
- Bảng phân bổ thưởng bên dưới là đề xuất bảo toàn tổng kinh tế cũ và cần người dùng duyệt trước Gate 1.
- Thực hiện sau các thay đổi board/pile để playtest cadence cuối; độc lập với Effect V2.

## Goal

Hiển thị và vận hành đúng 10 mốc, mỗi 3 bộ ba một mốc, chu kỳ 30 bộ ba; giữ tổng giá trị chu kỳ gần bằng cấu hình 15/45 hiện tại và không cấp thưởng lặp khi migrate save.

## Problem

- Config hiện đặt target 45 với 15 rewards.
- `normalizeTripleMilestones()` đã dùng `% 30`, tạo mất đồng bộ và có thể biến progress 30–44 thành giá trị thấp sau reload.
- Shell/HUD dựng marker từ reward table nên không được chỉ ẩn 5 marker bằng CSS.

## Files to inspect

- `js/tripleConnect/tripleConfig.js`
- `js/tripleConnect/tripleMilestones.js`
- `js/tripleConnect/tripleShell.js`
- `js/tripleConnect/tripleHudAdapter.js`
- `js/gameState.js`
- milestone transaction/UI/tests

## Proposed reward table — pending approval

| Mốc | Phần thưởng |
|---:|---|
| 1 | 2 Xu |
| 2 | 1 Gợi ý |
| 3 | 3 Xu + 1 Gợi ý |
| 4 | +2 giây; Endless nhận 2 Xu |
| 5 | 1 Hoàn tác |
| 6 | 5 Xu + 1 Gợi ý |
| 7 | 1 Xáo trộn |
| 8 | +3 giây + 1 Gợi ý; Endless thay thời gian bằng 3 Xu |
| 9 | 8 Xu |
| 10 | 25 Xu + 1 Gợi ý + 1 Hoàn tác |

Tổng chu kỳ chuẩn: 43 Xu, 5 Gợi ý, 2 Hoàn tác, 1 Xáo trộn, 5 giây. Endless nhận thêm 5 Xu thay thời gian, tương đương tổng kinh tế cũ.

## Required changes

### Gate 0 — Contract/migration design

1. Khóa hành vi transaction chống claim lặp.
2. Thêm milestone schema/version để phân biệt save 15/45 và 10/30.
3. Migration ánh xạ tiến độ theo tỷ lệ `floor(oldProgress * 30 / 45)` và ánh xạ claimed milestone xuống mốc đã đi qua, không phát thưởng retroactive.
4. `cycleId` giữ nguyên; migration idempotent; dữ liệu hỏng fallback an toàn.

### Gate 1 — Single source of truth

1. Config target 30, step 3 và đúng 10 rewards.
2. Normalizer không chứa magic `% 30` độc lập; lấy target/version từ owner chung mà không tạo import cycle.
3. Shell/HUD sinh đúng 10 marker từ config.
4. Tooltip, copy, progress fill và accessibility dùng cùng contract.

### Gate 2 — Economy/transaction

1. Áp đúng bảng thưởng đã duyệt, Endless thay time bằng coins.
2. Inventory full tiếp tục dùng fallback coin hiện có.
3. Claim ID vẫn unique theo cycle/milestone; reset claim set đúng khi qua 30.
4. Undo/Continue/reload không cấp lại thưởng.

### Gate 3 — QA

1. Test đi qua đủ mốc 1–10 và rollover 30 → 0/cycle+1.
2. Test migration progress 0, 1, 29, 30, 44 và malformed save.
3. Visual HUD tại viewport mục tiêu; không overflow hoặc marker sai vị trí.
4. Check/build và Triple progression regression.

## Edge cases

- Save cũ progress 30–44 đã từng bị normalizer `%30` trước migration.
- Claim tại mốc cuối rồi reload; inventory full; Endless.
- Nhiều match event hoặc callback cũ cố commit cùng claim ID.

## Acceptance criteria

- [ ] Có đúng 10 marker và chu kỳ 30/step 3.
- [ ] Reward đúng bảng, tổng kinh tế được bảo toàn.
- [ ] Save cũ migrate một lần, không nhận lại hoặc mất claim đã commit.
- [ ] Config/normalizer/HUD không còn 45/15 hoặc `%30` rải rác.
- [ ] Check/build/test pass.

## Do not do

- Không chỉ ẩn marker bằng CSS.
- Không cấp thưởng retroactive trong migration.
- Không sửa board, tray, pile hoặc effect.
