# Thêm một trò vào Game Shell

Tài liệu này hướng dẫn tích hợp, không triển khai Triple Connect.

## Phân chia trách nhiệm

| Phần | Chủ sở hữu |
| --- | --- |
| Luật, state, điểm/thưởng, đồng hồ, phiên và kho | Module của trò |
| Tile/card identity, chọn thẻ, đường nối, shift, canvas | Renderer của trò |
| Mount/unmount, vùng semantic, scope tài nguyên | `js/gameShell/gameShell.js` và `gameShellLifecycle.js` |
| Fit bàn theo viewport và safe area | `gameShellLayout.js` |
| Patch chỉ số, sao, Xu, tools, mốc, timer | `gameShellHud.js` |
| Giới hạn, animation và cleanup hình ảnh tạm | `gameShellEffects.js`; loot dùng `js/lootEffects.js` |

## Quy trình tích hợp

1. Khai báo metadata trong `js/gameCatalog.js`, namespace tiến trình/kho và migration tương ứng. Không dùng dữ liệu hoặc ID của trò khác.
2. Dựng markup một lần trong module riêng, theo mẫu `memoryMatch/memoryShell.js` hoặc `linkConnect/linkShell.js`. Cấp đúng sáu vùng `title`, `progress`, `hud`, `milestones`, `frame`, `board` cho `createGameShell`. Frame chứa board; renderer giữ quyền sở hữu nội dung board. ID phải duy nhất, `aria-controls` phải trỏ tới node có thật.
3. Khi bắt đầu/khôi phục/chơi lại, gọi `shell.mount({ cleanup })`. Gắn listener/timer/RAF vào scope; dùng `scope.guard` cho callback bất đồng bộ. Cleanup phải hủy lượt cũ mà không ghi đè trạng thái lượt mới. Listener ứng dụng cố định có chủ sở hữu riêng, không đăng ký lại mỗi lượt.
4. Truyền shape và cấu hình trình bày tới layout engine. Override chỉ dùng key trong `GAME_SHELL_SCHEMA`; không sửa luật tileCount/timing để khớp layout. Không dựng lại board khi HUD hoặc viewport đổi.
5. Khai báo reference/formatter/tooltip cho `createGameShellHud`. Controller truyền giá trị đã tính; formatter không cấp thưởng hoặc đổi state. Giữ một nguồn dữ liệu kho và không khôi phục kho từ snapshot phiên.
6. Gọi hiệu ứng bằng source/target/preset/thời lượng. Luật thưởng không phụ thuộc số node hình ảnh được tạo. Khi bị giới hạn hoặc reduced motion, thưởng vẫn được xử lý một lần; khi hủy lượt, callback cũ không chạy. Canvas vẫn ở renderer nhưng đăng ký cleanup vào scope/registry.
7. Nối menu, cửa hàng và hướng dẫn vào cơ chế điều hướng chung. Chỉ thêm stylesheet riêng cho hình học/phong cách có chủ đích; không copy toàn bộ shell CSS. Không thêm dependency runtime nếu chưa cần thiết.

## Kiểm chứng và duyệt

- Chạy `npm run check`: có kiểm import, ownership, vùng semantic, token/layout/lifecycle, migration và luật trò hiện có. Thêm kiểm thử luật trò mới độc lập khỏi DOM.
- Kiểm UI có chọn lọc: node stable sau patch; không đổi board khi cập nhật HUD; mount/unmount lặp, callback cũ bị chặn, dùng/mua kho, normal/reduced motion và giới hạn hiệu ứng.
- Kiểm hai chuẩn mobile của dự án ở cả hai chiều: `360x640`/`640x360` và `411x914`/`914x411`, cùng desktop khi thay đổi có tác động desktop; bàn nhỏ/lớn, orientation, modal và fullscreen. Không thêm profile thiết bị quá nhỏ nếu không có lỗi cụ thể cần tái hiện. Không coi baseline không có fullscreen là xác nhận cho fullscreen.
- Chạy `npm run test:ui:visual` để so ảnh hiện có. Các file trong `tests/ui/visual-candidates` là bộ chờ duyệt, chưa phải phê duyệt phát hành. Không dùng `--update-snapshots` để che lỗi; phải xem diff và ghi rõ lý do thay đổi trước khi cập nhật.
- Nếu cần tạo/cập nhật ảnh đã được phép: `npx playwright test --config=playwright.visual.config.js --update-snapshots`. Snapshot hiện tại tách fullscreen khỏi baseline; khi duyệt tích hợp fullscreen phải tạo baseline riêng hoặc cập nhật có chủ đích.
- Build một lần sau thay đổi cuối. Ghi ngân sách bundle/DOM/layout và những tính năng ngoài phạm vi có trong workspace. Không tự xóa công việc khác để làm worktree sạch.
- Chơi thử ít nhất một điện thoại thật trước khi khóa phiên bản; đánh dấu các gate chưa kiểm tra, không coi mô phỏng trình duyệt là thiết bị thật.
