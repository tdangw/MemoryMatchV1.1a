# Home vuốt chọn trò — 2026-10-16

## Kết quả

Một trò nằm giữa, hé trò hai bên, vuốt trái/phải để đổi. Bấm card mở đúng bản đồ; mũi tên/chấm và bàn phím là phương án tương đương. Không thêm hướng dẫn hoặc thuật ngữ nội bộ vào sản phẩm. Home hiện nối vòng hai chiều bằng cùng3node; Memory đã vẽ lại portraitv2, tổng3WebP323.366bytes; bỏ flourish Home, đơn giản viền và nhãn. Dock/ad slot, tab/popup, catalog và save không đổi.

## Phương án và ownership

Dùng native scroll-snap thay custom drag để trình duyệt sở hữu momentum, touch cancellation và snap. Không clone slide, không tự chạy, không timer. Scroll listener passive chỉ gộp một scoped frame khi có sự kiện; đọc vị trí trước ghi, chỉ cập nhật DOM khi đổi trò. Scope sở hữu listener/frame/ResizeObserver có disconnect. Transform/opacity160ms chỉ tạo trọng tâm, không đổi geometry snap; reduced-motion tắt transition. Explicit controls snap ngay, touch dùng momentum tự nhiên. Chỉ số phản ánh vị trí cuộn; không ghi persistence khi chuyển trò.

## Bằng chứng

- Home12/12 + registry5/5 đạt. Native CDP touch swipe trái→trái→phải chọn đúng trò mà không mở map; arrows/dots/Arrow/Home/End, Enter, resize và30lần đổi nhanh.
- 320×740,412×915,844×390,1024×900: game chính nằm đúng tâm, đầy đủ tên và controls, không tràn wrapper hoặc chồng dock.320×568/568×320: title và controls đều cuộn tới được.
- Fixture4trò vào cùng carousel; lỗi tải art vẫn có tên/nút và bàn phím mở đúng game.
- Reduced-motion và normal-motion, điều hướng giữa transition đều cleanup. [30cycles](qa/home-30-cycles.json):26listener/0timer/0frame/0animation khi nghỉ; owner cũ về0, progress không đổi, một Home/ba card.
- Lỗi phát hiện và sửa: carousel co theo intrinsic-width do wrapper align center cũ → explicit width/stretch; padding title cộng chiều rộng → border-box và assertion tâm/tràn; center dọc có nguy cơ clip trên viewport thấp → auto margins, overflow an toàn.
- Hồi quy52/52 đạt: app-tabs, menu.landscape, navigation-screens, adventure-map; tab nền/exit/dock, cả3game và6lựa chọn mode special giữ đúng hành vi.
- Lượt review đầu có một lần gesture test bắt vị trí giữa quán tính. Helper nay đăng ký/chờ native scrollend sau mỗi lần vuốt rồi mới kiểm tâm/trò cuối; vẫn giữ yêu cầu đúng trò kế bên, không sleep hoặc nới assertion. Lặp5/5 đạt, runtime không đổi.
- Review độc lập cuối12/12 đạt, approve không finding; đã kiểm lại hai sửa title/viewport thấp và ca vuốt chờ scrollend.
- Registry assertion cũ yêu cầu slogan/description đã bỏ trước đây; cập nhật theo tên native buttons và current indicator, giữ kiểm released games/menu adapter/shell/unknown ID.

Ảnh: [mobile](qa/home-412-memory-match.png), [Link ngang](qa/home-844-link-connect.png), [desktop](qa/home-1024-triple-connect.png), [màn thấp](qa/home-short-320.png), [fallback](qa/home-fallback.png).

Cổng cuối: `npm run check`, `npm run build`, `npm run build:android` đều exit0. `git diff --check` đạt; không đổi API/schema/save.

Không deploy hoặc build APK; S22 Ultra thật còn chờ, không tuyên bố FPS thiết bị từ kiểm tra desktop.

## Nối vòng và ảnh portrait v2 — 2026-10-16

Logical index giữ thứ tự catalog, DOM xoay khi native scrollend để đưa trò đang xem về giữa mà không clone. Arrows/ArrowLeft/Right modulo qua hai đầu; Home/End vẫn logical first/last. Chỉ reorder khi cần, resize giữ lựa chọn, hidden track không cập nhật từ geometry0. Bỏ focus→select listener để không reparent target trước pointerup; warm và explicit keyboard focus giữ nguyên. Sau rebase, focus trong track theo trò đang chọn. Không timer/loop RAF; scrollend cùng vị trí không phát sinh vòng lặp mới.

Home14+registry5 đạt19/19;14native swipes (7mỗi chiều) qua cảhai ranh giới, tap hai sidepeek với normal-motion mở đúng game.100forward+100backward giữ nguyên3node, resource về baseline. Review độc lập14/14 approve. Ảnh mới đúng576×768/108670bytes; src versioned v2 +natural size đạt4/4viewport và review thêm1/1. Ảnh cũ ngang bị cắt đã được thay, xem [Memory412](qa/home-412-memory-match.png) và [landscape](qa/home-844-memory-match.png).

Regression31ca có kết quả đạt:30lần đầu,1ca kết thúc context bị ENOENT do file trace trong test-results bị lượt chạy song song dọn. Không có assertion UI fail; chạy lại ca đó bằng thư mục TEMP riêng1/1 đạt. Các module/quy tắc quảng cáo do task khác quản lý, chỉ kiểm tương thích, không sửa trong task này. Test phía review cũng lưu outputTEMP riêng.

Gate cuối sau cập nhật URLv2 và nhãn Quảng cáo của task song song: Home14/14 đạt; ảnh bàn giao đã xem, không còn từ chỉ trạng thái thử nghiệm. npm run check (gồm15ads unit), npm run build và npm run build:android đều exit0. Một lượt đo Triple p95=23.37ms vượt20ms trong lúc chạy song song; không sửa script/ngưỡng, đo riêng19.99ms đạt và fullcheck cuối19.48ms đạt. Đây là Node desktop, không phải FPS mobile. git diff --check đạt; không đổi API/schema/save/catalog.
