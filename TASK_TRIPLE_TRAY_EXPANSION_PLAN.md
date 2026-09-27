# TASK — Triple Connect Permanent Tray Expansion

## Status

- Sẵn sàng triển khai sau Shared Random Theme Selection.
- Chỉ áp dụng Triple Connect; không sửa layout, pile, milestone hoặc Effect V2.

## Goal

Giữ khay mặc định 7 ô và cho phép mua một lần để mở vĩnh viễn thêm 3 ô, tổng 10 ô. Giá thử nghiệm 1 Xu; giá chính thức đổi bằng config thành 3000 Xu. Người đã mua ở giá thử nghiệm tiếp tục sở hữu nâng cấp.

## Confirmed decisions

- Entitlement dùng chung mọi mode Triple.
- Mobile dọc: 10 ô hiển thị cố định `5 × 2`.
- Màn đủ rộng: `10 × 1`; nếu không đủ không ép thẻ nhỏ quá ngưỡng tương tác.
- Board luôn phải giải được với khay cơ sở 7; 10 ô chỉ là lợi thế.
- Mua vĩnh viễn trong profile/save hiện tại; xóa dữ liệu khi chưa có cloud vẫn xóa entitlement.

## Problem

- Capacity 7 đang xuất hiện trong config, rule, renderer, shell/accessibility và validation state.
- Chưa có entitlement, transaction mua nâng cấp hoặc migration save.
- Nếu chỉ tăng số DOM slot sẽ làm rule thua, Continue và solver mất đồng bộ.

## Files to inspect

- `js/tripleConnect/tripleConfig.js`
- `js/tripleConnect/tripleRules.js`
- `js/tripleConnect/tripleState.js`
- `js/tripleConnect/tripleRenderer.js`
- `js/tripleConnect/tripleShell.js`
- `js/tripleConnect/tripleTransactions.js`
- `js/gameState.js`, `js/shop.js`, CSS Triple và test liên quan

## Required changes

### Gate 0 — Contract

1. Khóa bằng test hành vi khay 7, full-tray loss và Continue hiện tại.
2. Inventory mọi hardcode `7`; phân loại rule, presentation và copy.

### Gate 1 — Config và persistence

1. Tạo config có owner: base capacity 7, bonus 3, experimental price 1, release price 3000.
2. Save chỉ lưu entitlement boolean/version, không lưu giá.
3. Save cũ mặc định chưa mua; normalize idempotent dữ liệu hỏng.
4. Capacity hiệu lực được dẫn xuất từ entitlement, không lưu rời rạc ở nhiều state.

### Gate 2 — Transaction

1. Thêm một sản phẩm nâng cấp trong Triple Shop.
2. Transaction nguyên tử: kiểm tra sở hữu → kiểm tra Xu → trừ Xu và ghi entitlement → save.
3. Chặn double click/mua lặp; rollback nếu commit thất bại.
4. Sau khi đổi giá config, entitlement cũ vẫn hợp lệ.

### Gate 3 — Rules và session

1. Full-tray loss dùng capacity hiệu lực.
2. State/snapshot cũ vẫn restore; không đổi type/match rule.
3. Mua trong round được áp dụng ngay sau transaction thành công và session được lưu nhất quán.
4. Solver/generator tiếp tục validate board với capacity 7, không dùng entitlement người chơi để sinh board dễ giải giả tạo.

### Gate 4 — UI và responsive

1. Renderer tạo đúng 7 hoặc 10 slot từ capacity hiệu lực.
2. Khay có kích thước ổn định từ đầu round, không co giãn khi nhận thẻ.
3. 10 ô dùng `5 × 2` ở mobile dọc và `10 × 1` khi đủ rộng.
4. Cập nhật aria/copy động; không còn “Khay 7 ô” hardcode.
5. Locked/purchased state trong shop rõ ràng, không che gameplay.

### Gate 5 — Review

1. Kiểm tra purchase/reload/restart/mode switch.
2. Kiểm tra geometry trên 360×640, 411×914, 640×360, 914×411 và desktop.
3. Chạy check, build và Triple regression mục tiêu.

## Edge cases

- Không đủ Xu; nhấn mua liên tiếp; save fail giữa transaction.
- Mua khi round đang có 7 thẻ trong khay.
- Continue save cũ/chưa mua/đã mua.
- Đổi giá 1 → 3000 sau khi người chơi đã mua.
- Responsive đổi orientation khi khay đang có thẻ.

## Performance constraints

- Không rebuild board khi entitlement đổi; chỉ cập nhật tray/shop cần thiết.
- Không thêm listener theo từng render hoặc persistence write theo animation.
- Layout dùng CSS grid/flex ổn định, không đo layout mỗi frame.

## Tests required

- Migration save cũ; purchase success/insufficient/double/rollback.
- Reload giữ entitlement; mọi mode dùng cùng capacity.
- Rule loss đúng ở capacity 7 và 10.
- Board corpus vẫn giải được với capacity 7.
- Responsive/keyboard/touch/accessibility và lifecycle regression.

## Acceptance criteria

- [ ] Mặc định 7 ô; mua một lần thành 10 ô vĩnh viễn trong profile.
- [ ] Giá chỉ đến từ config; người mua giá cũ không mất quyền.
- [ ] Không board nào bắt buộc 10 ô mới giải được.
- [ ] Khay không co giãn và đủ vùng chạm ở viewport mục tiêu.
- [ ] Save/API cũ tương thích; check/build/test pass.

## Do not do

- Không sửa Layout V5, milestone, pile hoặc effect.
- Không hardcode capacity ở renderer/copy.
- Không gắn solvability với entitlement trả Xu.
