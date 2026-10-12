# Startup Responsiveness — Memory, Link, Triple

Kế hoạch active, được giao ngày 2026-09-30. Phạm vi: cả ba game, giữ luật chơi, save/schema, ID asset/effect và renderer incremental hiện hành. Người dùng tự nghiệm thu thủ công trên Galaxy S22 Ultra; agent thực hiện mọi gate tự động.

## Phương án

- Chọn: startup theo pha, readiness/cancellation theo lifecycle scope, chuẩn bị ảnh của round với concurrency giới hạn. Popup đầu màn xuất hiện ngay sau khi board DOM/HUD sẵn sàng; decode tiếp tục nền khi popup hiển thị. Không có nhãn loading và board không bị che, nhưng input vẫn khóa cho tới khi ảnh sẵn sàng. Giữ Worker Triple; tránh thêm Worker khi chưa có CPU hotspot đủ lớn.
- Loại: chỉ trả lệnh sớm nhưng dồn nguyên long task sang frame tiếp theo; preload toàn bộ theme; chia nhỏ DOM một cách máy móc khi chưa có bằng chứng.
- Entry point giữ tên/tham số; Memory/Link sẽ trả promise readiness để caller có thể await (trước đây trả undefined), thao tác UI vẫn fire-and-forget với lỗi được xử lý tại owner. Triple giữ promise start và các hook development đồng bộ. Đây là thay đổi timing phục vụ async boundary đã được người dùng giao, không đổi save hay luật.

## Gate

- [x] 0. Baseline ba game qua probe 60 mẫu: 5 lượt mỗi game × cold/warm × CPU 1×/6×; import/navigation tách khỏi start command; ghi riêng command, phản hồi đầu, DOM, decode, board-ready và long task.
- [x] 1. Thêm startup owner theo scope/phase với settle success/failure/cancel; Memory/Link nhường main thread và batch DOM; stale round không được commit timer/preview/persistence.
- [x] 2. Decode đúng ảnh trong round với concurrency tối đa 4, fallback ảnh lỗi, không giữ cache node dài hạn; cancel không đợi decode cũ; giữ nguyên điều kiện DOM thẻ ẩn Triple.
- [x] 3. Regression cho new/restart/resume, cancel/stale decode, ảnh lỗi, generated theme và nhiều chu kỳ cleanup đã pass: `tests/ui/game-shell.startup.spec.js` 9/9. Có thêm case giữ request ảnh để xác nhận popup đầu màn vẫn hiện, board không bị che, input còn khóa và không xuất hiện nhãn loading.
- [ ] 4. Phép đo sau thay đổi đạt start command p95 <100 ms ở CPU 6× cho cả ba game. Kết quả 5 mẫu mỗi điều kiện: Memory 18.7 ms cold / 7.5 ms warm; Link 55.5 / 11.7 ms; Triple 55.3 / 7.4 ms. Board-ready lạnh còn long task median 261 / 273 / 323 ms; profile bị nhiễu do tracing nên chưa đủ bằng chứng để quy nguyên nhân và không áp dụng tối ưu mù. `npm run check` pass. `npm run build` và Playwright mục tiêu chưa xác minh được do sandbox chặn esbuild; không thử vượt quyền.
- [ ] 5. Còn nghiệm thu tay trên Galaxy S22 Ultra và lặp lại browser suite/build khi môi trường build được. Không tuyên bố 60 FPS vật lý.

## Ghi nhận

- Baseline ban đầu là worktree đang có thay đổi HUD/render của người dùng; không reset các thay đổi đó.
- Thay đổi CSS HUD, luật Xu và mỹ thuật không thuộc task.
- Benchmark browser trên máy phát triển với throttling là phép so sánh có kiểm soát, không đại diện chính xác phần cứng điện thoại.
- 2026-09-30: hoàn tất startup implementation và nội dung tên/tagline. Lệnh bắt đầu đạt budget; long task khi board-ready lạnh vẫn còn, nhưng trace hiện có bị overhead profiler nên chưa có hotspot đủ tin cậy để chỉnh tiếp. `npm run check` hoàn tất exit 0. Build và Playwright thử lại bằng sandbox mặc định đều dừng ở esbuild `Cannot read directory "../..": Access is denied`; Playwright cũng từng gặp cổng 4173 đã có tiến trình trước khi thử cổng riêng. Không dùng escalation do approval service báo không thể review vì giới hạn sử dụng.
- 2026-10-03: theo yêu cầu mới, bỏ nhãn loading và chuyển decode sang song song với popup đầu màn. Memory chỉ bắt đầu preview sau decode; Link và Triple chỉ mở khóa/tick timer khi cả popup lẫn decode đã hoàn thành. Người dùng tự nghiệm thu trên Galaxy S22 Ultra.
- 2026-10-12: xác minh tự động sau đổi luồng: startup 9/9, contract popup/timer Triple 1/1, `npm run check` và production build đều pass. Probe 60 mẫu vẫn cần lặp lại riêng nếu cần số đo mới; runner hiện bị giới hạn thời gian trước khi tạo artifact.
