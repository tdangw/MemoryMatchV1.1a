# Main menu hướng1 — 2026-10-15

Scope: một ô Memory lớn, Link/Triple bên dưới; art riêng rõ nét và không chữ, frame/label tương tác thật. Không đổi game/mode/navigation API, save/catalog/tiến độ hoặc nội dung5tab. Steering: gỡ ornament ảnh trong pause popup và phần padding của ornament; không áp dụng sheet popup mới vào gameplay.

Correction trước phase1: bỏ ornament pause, giữ vị trí/nút/pause; kiểm tra3game, commit riêng.

## Phase1 — Mỹ thuật runtime (hoàn tất)
- Dùng imagegen tạo ảnh riêng theo mẫu1 đã chọn; không kéo giãn các ô400px từ sheet.
- Master PNG ngoài bundle, WebP đúng kích thước; prompt/metadata, kiểm hình và ngân sách ≤350KB cho3ảnh mới; commit.

## Phase2 — Giao diện và ownership (hoàn tất)
- Một owner CSS cho selector, gỡ selector cũ đang trùng ở menu/adventure; không dọn phần khác.
- Native buttons/DOM title, scope sở hữu listener; background/art tĩnh, không loop. Ảnh lỗi vẫn chọn được bằng tên và nền fallback.
- So sánh ảnh nguyên màn và DOM+art: chọn DOM+art để keyboard/focus/crop và thêm trò; không screenshot có chữ làm UI.
-3trò: featured +2ô;4trò trở lên: lưới2cột, nội dung cuộn và dock/ad slot giữ nguyên. Compact landscape3cột ngang để đủ vùng bấm. Giữ cơ chế preload nền map cũ.
- Không thay tab khác hoặc add ornament popup; commit.

## Phase3 — Nghiệm thu
- Mobile412×915, hẹp, landscape và desktop; ảnh/snapshot runtime, keyboard, lỗi tải ảnh, chuyển game/Home, tab và30cycles ownership.
- Review độc lập, regression navigation/map/pause phù hợp; fullcheck, build web/Android. Đo browser chỉ là browser, S22 Ultra thật còn chờ. Không deploy.
- Cập nhật CONTEXT/ARCHITECTURE/QA, commit; không dừng ở checkpoint khi còn phần an toàn làm được.

Correction pause: commit7ea66e9,20/20 browserpass. Phase1:3master/3WebP đã kiểm bằng ảnh, không chữ/UI trong art; xuất349.418bytes≤350KB. Không PNG master trong bundle.

Phase2: Home7/7pass ở320/412/844/1024, keyboard/ảnhlỗi,4trò và30cycles. CSS Home cóowner riêng; gridcolumns/stretch sửa co chiều ngang do generic menu cũ. Error ảnh được ẩn theo scope để không lộ icon hỏng. Baseline18listener/0timer/0frame, owner cũ về0; progress durable giữ nguyên.
