# Đồng bộ popup và nút thoát bản đồ

Ngày2026-10-15. [Kế hoạch](../../../POPUP_POLISH_PLAN.md).

## Kết quả

- Exit bản đồ gắn góc phải header56×60px như5tab; safe-area, map scroll và hành động về Home giữ nguyên.
- Popup gameplay bắt đầu tại mép trên region board của cả3trò. App modal và intro dùng cùng owner vị trí; popup bản đồ dùng mốc chrome Game Shell cùng cao độ gameplay, kể cả lần đầu; popup ngoài bản đồ/gameplay dùng lề trên16px. Không áp dụng vị trí dialog vào tab toàn màn hình, toast hoặc menu công cụ nhỏ.
- Resize/xoay/visualViewport/scroll cập nhật theo sự kiện, gộp tối đa một RAF đang chờ. ResizeObserver/listener/RAF bị hủy theo lifecycle. Nội dung dài cuộn trong chiều cao còn lại. Bỏ offset riêng intro/victory.
- Tạm dừng: Tiếp tục là hành động chính; Chơi lại/Lượt mới và Cài đặt cùng hàng; Thoát game ở dưới. Bỏ câu hướng dẫn thừa. Đổi surface xanh đậm, vàng dịu, close44px, nút nổi nhẹ, focus/reduced-motion và dùng flourish có sẵn. Intro bỏ glow xanh; không tạo bitmap mới, không animation loop.
- Không đổi public API, save/schema, Auth, điểm/sao/xếp hạng, inventory hoặc luật game. Không deploy Hosting/APK/Firebase.

## Phương án và review

Chọn region board semantic và một connection theo lifecycle thay top cố định theo từng game: chịu được HUD/rotate/scroll khác nhau, không thêm nhánh game vào shared module. Giữ DOM/handler exit thay dựng owner thứ hai. CSS/icon/flourish hiện có đủ thể hiện bề mặt và độ nổi, tránh tải thêm ảnh trang trí.

Review độc lập đọc diff ownership/cleanup, tiếp tục/async action guard, CSS cascade/reduced-motion và yêu cầu chứng minh footer fit. Đã bổ sung kiểm tra từng nút44px nằm trọn panel và icon theo màu nút. Không có finding blocker.

## Bằng chứng

| Phạm vi | Kết quả |
|---|---|
| Phase1 map exit |3/3 ở412×915,844×390,1024×900; mỗi ca cả3game/scroll/goHome |
| Phase2 vị trí |11/11:3game×3viewport/rotate, fallback/nested/replace/30cycles và summary thắng thật |
| Phase2 regression |9startup và9settings pass |
| Phase3 regression |68/68: placement11, exit6, startup9, HUD menu/lifecycle5, map3, settings9, Triple chrome8/tools10, victory7 |
| Delta hình thức cuối |11/11; từng nút pause nằm trọn panel,44px, focus Tiếp tục và không overflow |
| Steering popup bản đồ |3/3; mỗi ca cả3game, first visit map→play→pause ở412/844/1024, top lệch<2px, nút Chơi nằm trong viewport |
| Review độc lập trước steering |2/2browser: fallback/30cycles và victory; CSS ownership/diff pass |

Soak HUD20vòng mỗi game gồm restart/switch,120scope dispose đều trả tài nguyên về0. Placement30vòng disconnect observer/listener và hủy RAF; intro replace/destroy không giữ owner entry. Khi đo owner, đã chờ tác vụ tooltip focus hữu hạn bằng clock500ms; không coi snapshot giữa tác vụ là leak hoặc bỏ assertion. Bài fallback ban đầu chụp giữa animation nên sai vị trí tức thời; reduced-motion cho popup đã được xử lý, kiểm tra cuối đạt.

Ảnh runtime: [Tạm dừng dọc](qa/pause-link-connect-412.png), [Tạm dừng ngang](qa/pause-link-connect-844.png), [Memory](qa/pause-memory-match-412.png), [Triple](qa/pause-triple-connect-412.png), [Cài đặt ngang có cuộn](qa/settings-844.png), [Đầu màn](qa/intro-412.png), [Tổng kết](qa/victory.png), [Chọn độ khó cùng cao độ game](qa/map-preview-412.png). Dữ liệu gameplay trong ảnh là ván kiểm tra local; không tạo dữ liệu mẫu production.

Galaxy S22 Ultra thật còn chờ theo xác nhận người dùng; browser Windows không chứng minh60FPS hoặc bàn phím hệ thống trên điện thoại thật.

## Mở rộng header Cửa hàng/Bộ sưu tập

Nguyên nhân exit sót: CSS chỉ liệt kê5screen cụ thể. Đã chuyển sang mọi adventure-screen có data-screen; cùng geometry60px/56px và handler cũ, không dựng exit thứ hai. Xu ở giữa header, số dài bị giới hạn vùng hiển thị nhưng text thật vẫn đủ trong DOM; Bộ sưu tập bỏ tên game, gameId vẫn quyết định catalog/namespace.

- Catalog/inventory/navigation21/21pass; gồm mua vật phẩm trước và trong game, giữ tab qua reload và pause/startup.
- Sau delta fixture và source cuối:21/21 app-tabs9 +catalog-header4 +Triplechrome8. Header4viewport320/412/844/1024 ×3game ×4screen; tâm Xu, số123456789, không chạm title/exit, titlecollection đúng, scroll cố định và goHome.
- Fixture số dài ban đầu gọi updateCoinDisplay thiếu tham số, ảnh kiểm tra hiện undefined; đã sửa fixture theo API thật và thêm assertion giá trị123456789. Không sửa runtime để chiều fixture.
- Ảnh mới: [Cửa hàng](qa/shop-header-412.png), [Bộ sưu tập](qa/collection-header-412.png), [Cửa hàng hẹp](qa/shop-header-320.png).

## Tham khảo Home

[Hai concept](../home-concepts/README.md) và [prompt](../home-concepts/prompts.json) dùng skill imagegen/built-in image_gen. Không ảnh mới được đưa vào runtime. Hướng một lớn/hai nhỏ được khuyến nghị vì đường chọn rõ và co giãn dễ; hướng lối vườn cổng lệch tạo cá tính hơn. Đây là ảnh tham khảo trước khi chốt hướng, không phải Home đã triển khai.

Review bổ sung cuối độc lập7/7pass:4catalog header và3map preview, mỗi ca cả3game. Đối chiếu source CSS/ownership/purchase/equip/catalog/save không có finding. Reviewer/server độc lập đã dừng trước full check để không nhiễu phép đo.

Full check cuối: `npm run check` pass136module và toàn bộ contracts. Triple Easy p95 10,51ms;28high-level witnesses max109,09ms trên Node desktop, không phải FPS điện thoại. Placement cuối14/14pass sau steering bản đồ.

Build cuối: `npm run build` và `npm run build:android` đều pass (178/176module). Chỉ build dist, không cap sync/APK/Hosting/Firebase rollout. Diff check pass. Commit: phase1 a7c7b21, phase2 17adc0d, phase3 d79d94f, phase4 2529e81; phase5 gồm2concept/prompt và tài liệu nghiệm thu cuối.

Steering mới: gỡ ornament ảnh trong popup tạm dừng và padding36px đi kèm, header thường72px/landscape60px. Giữ vị trí/nút/pause.20/20 dialog-placement+game-exit pass;3game×3viewport không pseudo ornament, header≤80px và mọi nút vẫn fit. Ảnh pause đã cập nhật.
