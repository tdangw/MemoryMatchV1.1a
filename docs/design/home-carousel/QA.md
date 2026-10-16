# Home vuốt chọn trò — 2026-10-16

## Kết quả

Một trò nằm giữa, hé trò hai bên, vuốt trái/phải để đổi. Bấm card mở đúng bản đồ; mũi tên/chấm và bàn phím là phương án tương đương. Không thêm hướng dẫn hoặc thuật ngữ nội bộ vào sản phẩm. Reuse3WebP cũ349.418bytes, không sinh thêm ảnh; bỏ flourish Home, đơn giản viền và nhãn. Dock/ad slot, tab/popup, catalog và save không đổi.

## Phương án và ownership

Dùng native scroll-snap thay custom drag để trình duyệt sở hữu momentum, touch cancellation và snap. Không clone slide, không tự chạy, không timer. Scroll listener passive chỉ gộp một scoped frame khi có sự kiện; đọc vị trí trước ghi, chỉ cập nhật DOM khi đổi trò. Scope sở hữu listener/frame/ResizeObserver có disconnect. Transform/opacity160ms chỉ tạo trọng tâm, không đổi geometry snap; reduced-motion tắt transition. Explicit controls snap ngay, touch dùng momentum tự nhiên. Chỉ số phản ánh vị trí cuộn; không ghi persistence khi chuyển trò.

## Bằng chứng

- Home12/12 + registry5/5 đạt. Native CDP touch swipe trái→trái→phải chọn đúng trò mà không mở map; arrows/dots/Arrow/Home/End, Enter, resize và30lần đổi nhanh.
- 320×740,412×915,844×390,1024×900: game chính nằm đúng tâm, đầy đủ tên và controls, không tràn wrapper hoặc chồng dock.320×568/568×320: title và controls đều cuộn tới được.
- Fixture4trò vào cùng carousel; lỗi tải art vẫn có tên/nút và bàn phím mở đúng game.
- Reduced-motion và normal-motion, điều hướng giữa transition đều cleanup. [30cycles](qa/home-30-cycles.json):28listener/0timer/0frame/0animation khi nghỉ; owner cũ về0, progress không đổi, một Home/ba card.
- Lỗi phát hiện và sửa: carousel co theo intrinsic-width do wrapper align center cũ → explicit width/stretch; padding title cộng chiều rộng → border-box và assertion tâm/tràn; center dọc có nguy cơ clip trên viewport thấp → auto margins, overflow an toàn.
- Hồi quy52/52 đạt: app-tabs, menu.landscape, navigation-screens, adventure-map; tab nền/exit/dock, cả3game và6lựa chọn mode special giữ đúng hành vi.
- Lượt review đầu có một lần gesture test bắt vị trí giữa quán tính. Helper nay đăng ký/chờ native scrollend sau mỗi lần vuốt rồi mới kiểm tâm/trò cuối; vẫn giữ yêu cầu đúng trò kế bên, không sleep hoặc nới assertion. Lặp5/5 đạt, runtime không đổi.
- Review độc lập cuối12/12 đạt, approve không finding; đã kiểm lại hai sửa title/viewport thấp và ca vuốt chờ scrollend.
- Registry assertion cũ yêu cầu slogan/description đã bỏ trước đây; cập nhật theo tên native buttons và current indicator, giữ kiểm released games/menu adapter/shell/unknown ID.

Ảnh: [mobile](qa/home-412-memory-match.png), [Link ngang](qa/home-844-link-connect.png), [desktop](qa/home-1024-triple-connect.png), [màn thấp](qa/home-short-320.png), [fallback](qa/home-fallback.png).

Cổng cuối: `npm run check`, `npm run build`, `npm run build:android` đều exit0. `git diff --check` đạt; không đổi API/schema/save.

Không deploy hoặc build APK; S22 Ultra thật còn chờ, không tuyên bố FPS thiết bị từ kiểm tra desktop.
