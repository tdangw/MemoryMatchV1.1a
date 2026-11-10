# Sưu tập huy hiệu — 08/11/2026

## Phạm vi đã chốt

- Bỏ số vòng, thẻ mốc dọc, nút Xem quà/Kho rương, Chơi ngay và đoạn hướng dẫn cuối.
- Huy hiệu bên trái thanh tiến trình; số đếm nằm trong thanh. Phần thưởng phía trên từng mốc, mờ/khóa khi chưa đủ, bấm trực tiếp khi đủ; đã nhận có dấu kiểm.
- Mốc mới: 10→50 Xu; 25→100 Xu; 50→rương C; 75→rương Khung; 100→rương Avatar.
- Giữ lượt đang có theo phiên bản bốn mốc cũ. Chỉ chuyển sang năm mốc mới khi nhận xong lượt hiện tại. Tài khoản mới dùng mốc mới ngay. Tiếp tục lặp mỗi 100, giữ huy hiệu dư và quà đã nhận.
- Bấm rương đủ điều kiện nhận rương vào kho trước, rồi popup hai lựa chọn Xem tỷ lệ / Mở quà. Mở quà chọn đều một trong ba trò nhận hỗ trợ; candidate và lựa chọn phải bền qua retry, không trừ rương/lăn lại khi chỉ xem tỷ lệ.
- Không thay luật rương, ID catalog hoặc dữ liệu khác. Không deploy web/rules hoặc APK trong lượt này.

## Phương án

- Không đổi ý nghĩa bit của bản lưu cũ sang năm mốc: cách đó sẽ đổi quyền nhận giữa lượt, trái lựa chọn của chủ dự án.
- Dùng festival.version 1 cho lượt cũ và version 2 cho lượt mới; đổi phiên bản cùng giao dịch kết thúc lượt. Một mask có giới hạn, không thêm cờ rời. Giữ định dạng cha Spark/chest và ID receipt.
- Random trò tại boundary trước khi lưu operation; tái dùng journal/candidate và giao dịch mở rương hiện có. Không random trong render hoặc mỗi retry.

## Các gate (tiếp tục hết task)

- [x] 1. Luật/model, tương thích v1→v2 khi kết thúc lượt, rules từ template; unit và kiểm tra giả mạo.
- [x] 2. Thanh mốc responsive và popup rương có ownership/cleanup; không ghi theo frame/tick.
- [x] 3. UI 320/412/ngang/desktop, năm skin, offline/rapid click/restart/close, emulator, static/build/diff; cập nhật context và ghi bằng chứng cuối tại đây.

## Nghiệm thu

Hoàn tất nguồn ngày 08/11/2026.

- 41 unit mục tiêu đạt: v1/v2, toàn bộ thứ tự nhận, mọi mask v1 đang dở, 10.000 lượt, replay/overflow, random ba trò và lỗi dữ liệu không làm đổi input.
- `firebase emulators:exec --only firestore --project demo-memory-match "node scripts/check-festival-emulator.mjs"`: đạt chuyển lượt v1→v2, năm mốc mới, từ chối nhảy phiên bản/nhận nhiều mốc/thiếu huy hiệu và giữ giao dịch kho hiện hữu.
- 22 UI (`badge-track.spec.js`, `events-festival.spec.js`) đạt: 320/412/ngang/desktop, năm skin, đầy đủ/khóa/đã nhận, đếm bên trong thanh, bỏ footer, offline/retry/rapid click, 20 lần đóng cả popup con và đóng khi request đang chạy. Các phép đo DOM/timer/listener liên quan đạt; không có hoạt ảnh mới.
- 1 UI dịch vụ thật + Auth/Firestore giả lập (`badge-service-online.spec.js`) đạt: nhận đúng 150 Xu + ba rương/lượt, random trò trước ghi journal, mất phản hồi sau commit, retry không random/cấp lần hai.
- `npm run check`, `npm run build`, kiểm tra diff và sinh lại rules từ template: đạt. Ảnh QA cục bộ: `runtime/qa-badge-track`; không đưa QA vào bundle.
- Rà soát riêng sau triển khai: đối chiếu lựa chọn đã chốt với config/mask/version, chặn nâng phiên bản giữa lượt, journal chọn trò và cleanup popup. Không thay drop rate, luật quà trong rương, ID catalog hoặc schema Spark/chest. Chỉ festival có phiên bản 2, chuyển khi kết thúc lượt cũ.
- Rules nguồn đã cập nhật và kiểm bằng emulator; KHÔNG phát hành rules/web/APK. Client cũ chưa đọc được festival v2: cần phối hợp cập nhật client/rules khi phát hành; không coi nguồn mới là đã live. Chưa đo trên điện thoại thật.
