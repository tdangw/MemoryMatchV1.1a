# Giao diện toàn dự án — hồ sơ thực hiện

Nguồn phạm vi: `GAME_UX_SKIN_PLAN.md`. Bắt đầu 21/10/2026, working tree sạch.

## Trạng thái phase

| Phase | Trạng thái | Bằng chứng |
|---|---|---|
| G0 | Hoàn tất inventory và contract thiết kế | Kế hoạch mục 1.1–1.3; `inventory.json`; bảng dưới |
| G1 | Đạt bộ bản ghép đại diện trên DOM thật | `screens/qa/proof-*.json`, 240 ảnh/4 viewport; chưa phải runtime hoặc nghiệm thu G10 |
| G2 | Đạt | Nhóm core/rewards, generator và ngân sách bên dưới |
| G3 | Đạt | Unit6/6; runtime skin10/10 |
| G4 | Đạt | Home8/8; startup5/5 |
| G5 | Đạt | Catalog8/8, ba trò và mọi tab con |
| G6 | Đạt | Gameplay8/8 giảm chuyển động/DPR2 và8/8 thường/DPR3, cả ba trò |
| G7 | Đạt kiểm trình bày | Dialog8/8; purchase8/8; nhánh hiếm ghi rõ fixture |
| G8 | Đạt | Natural6/6; treasure8/8; lifecycle7/7 và tranh1/1 |
| G9 | Đạt | Unit5/5; browser12/12, ba bàn tập và lifecycle |
| G10 | Đạt nghiệm thu web, giới hạn máy thật ghi bên dưới | Production32/32; hồ sơ8/8; offline1/1; mua thật2/2; đo4/4; thua thật8/8; check/build và review |

## Quyết định và ranh giới

- Mặc định giữ nguyên. Nâng cao dùng gỗ nâu, giấy kem sáng, nút xanh lá/cam và ribbon đỏ dành cho ăn mừng. Không rollout Ngọc Lam.
- Chọn component hình tách trên DOM thật. Loại ảnh nguyên màn và shell thứ hai vì gây sai dữ liệu, vùng chạm, responsive và ownership.
- Không đổi luật, mức thưởng, giá, API, catalog, save format; enum skin là phần mở rộng settings được kế hoạch cho phép ở G3. Không APK/deploy/push.
- `woodland/README.md` yêu cầu G1 được duyệt trước tích hợp. Bản ghép G1 là đầu ra để duyệt; không dùng ảnh ghép để tuyên bố sản phẩm hoàn tất.

## Inventory và ownership G0

| Nhóm | Owner kiểm tra | Quyết định hình/layout |
|---|---|---|
| Startup/Home/carousel | startupLoading, gameSelector | Giữ tiến trình thật, ba node và tranh hiện hữu; biển tên gỗ, khung mỏng |
| Hai dock và screens | appNavigation, appPageLifecycle | Chung gỗ nâu; selected giấy sáng + indicator; không sửa banner reserve |
| Hồ sơ/tài khoản/bản lưu | accountPanel | Giấy phẳng; input thật, lỗi/busy và quyết định bắt buộc giữ nguyên |
| Bản đồ/preview/chế độ | adventureMap, adventurePreview, mainmenu; controller Link | Giữ tọa độ, số/khóa/sao; không bake map hoặc độ khó |
| Shop/collection/tab con | shop, mainmenu, masteryCollection | Khung trưng bày giấy; giá/ownership/catalog và tab state do owner cũ |
| Ranking/settings | leaderboardPanel, settings | Giấy ít họa tiết; form/select/range thật; mọi trạng thái giữ nghĩa |
| HUD/menu/tools/board | gameShell và renderer từng trò | Viền gỗ mỏng, không tăng geometry; không thay mặt thẻ/đường nối/lớp chặn |
| Dialog/thông báo | modal, ui, gameExitDialog, themeChangeNotice, tooltips | Khung thường/giấy dài/ăn mừng riêng; giữ focus/scroll/close theo contract |
| EXP/rương/tranh | treasureModal, treasureView, masteryCollection, ui | Dữ liệu động; grant thuộc transaction, không thuộc timeline |
| Help/tutorial | mainmenu, settings; adapter dự kiến G9 | Giấy sáng, minh họa thao tác; bài tập cách ly phiên và phần thưởng thật |
| Ads | menuAds và footer appNavigation | Không đặt lớp mỹ thuật lên nội dung nhà cung cấp |

`inventory.json` ghi các call site modal/screen/toast/tooltip và icon registry từ source hiện tại; dynamic ID và wrapper được giữ kèm số dòng để review, không coi regex là bằng chứng chạy hết nhánh.

## Token thiết kế G1

| Token | Giá trị / quy tắc |
|---|---|
| Gỗ | #713d22 / cạnh #a56938 / ánh sáng #dcab65 |
| Giấy | #fff2ce / inset #efd9a6 |
| Chữ chính / phụ | #4b2b18 / #775432 trên giấy |
| Tiếp tục | Xanh lá #4e7d28, chữ kem; ảnh normal/pressed chung frame |
| Hành động phụ | Cam #c87826, chữ kem; ảnh normal/pressed chung frame |
| Nguy hiểm | Đỏ #a13e32 + nhãn rõ; không dùng sao/ribbon ăn mừng |
| Selected | Nền giấy + viền + indicator, không chỉ đổi màu |
| Focus | Outline 3px, không baked vào ảnh |
| Font | Segoe UI/Trebuchet MS; heading Georgia; số tabular |
| Vùng chạm | Ít nhất 44px; HUD hiện hữu chưa tăng kích thước trong bản ghép |
| Chất liệu | Khung/modal/nút dùng nguồn woodland; nội dung dài giấy phẳng, không kéo giãn nguyên panel |
| Chuyển động | G1 giữ animation hiện hữu; reduced-motion theo owner cũ |

## Đặc tả state cho G2–G9

- Control: normal/hover/pressed/focus-visible/disabled/busy; busy giữ kích thước và nhãn hành động. Selected có hình dạng/indicator. Nút pressed không đổi hộp ngoài.
- Tab/card: selected/equipped/owned/locked riêng; không thay disabled bằng opacity khi cần đọc giá hoặc lý do khóa. Grade C/B/A/S giữ ngữ nghĩa màu hiện hữu.
- Dữ liệu: loading/empty/error/retry/offline chỉ khi owner hỗ trợ; giấy sáng giữ chữ dễ đọc và không giả thành dữ liệu đã tải.
- Modal: pause/preview/confirm dùng gỗ gọn; thông tin/privacy dùng giấy ít họa tiết; thua dịu; thắng mới dùng ribbon/sao; xóa dữ liệu dùng đỏ + nhãn rõ. Body cuộn, footer tới được.
- Rewards: EXP thực sau commit; rương closed/ready/open/claimed/blocked giữ state thật. Mảnh cuối và 300 Xu dùng receipt hiện có, không grant lần hai khi replay/skip/reload.
- Tutorial: Memory lật/không khớp/ghi nhớ/cặp; Link thẳng/rẽ/chặn/dọn; Triple bộ ba/lộ lớp/quản lý khay. Bỏ qua/xem lại, version tiến trình riêng trong boundary settings đã được chốt trước G9; không viết session/record/kho/ranking.

## Giới hạn bằng chứng

G0 là đọc source và contract. G1 là thiết kế trên DOM ứng dụng thật với CSS tiêm từ test; không là skin runtime, không chứng minh transaction, offline, account switch, bộ nhớ hay FPS điện thoại. Mọi gate G2–G10 vẫn cần triển khai và kiểm riêng.

## Phiên kiểm tra quyền và môi trường — 21/10/2026

- Chủ dự án đã giao toàn bộ gate chưa hoàn tất và cho phép tiếp tục sau khi dựng mẫu. Ghi chú chờ duyệt G1 ở hồ sơ trước không còn là yêu cầu xin phép mới. Vẫn phải kiểm bản ghép trên ứng dụng thật trước sản xuất hàng loạt/tích hợp.
- Git: `git update-index --force-write-index` thất bại với `fatal: Unable to create '.git/index.lock': Permission denied`. Lệnh `git update-index --refresh` chỉ báo `CONTEXT.md: needs update`, không phải bằng chứng ghi index thành công. Phiên cấm `sandbox_approval`; không yêu cầu nâng quyền, không sửa ACL/sandbox, không stage hoặc commit.
- Working tree lúc bắt đầu và kết thúc: chỉ `CONTEXT.md` đã có thay đổi; giữ nguyên nội dung đó. Không sửa runtime/gameplay/API/save, không APK/deploy/push.
- G1: chạy `node node_modules/@playwright/test/cli.js test --config=docs/design/advanced-ui/screens/playwright.config.cjs`; cổng 4193 đang dùng. Thử cổng riêng 4287, nhưng Playwright không truy cập được webServer. Khởi động Vite riêng ở 4288/4289 thành công (Vite báo ready); Node `fetch` tới cả hai cổng trả `connect EACCES 127.0.0.1`.
- Kiểm độc lập bằng Chrome headless qua Playwright (không qua webServer health check): `page.goto('http://127.0.0.1:4289/', { timeout: 15000 })` trả `net::ERR_NETWORK_ACCESS_DENIED`. Trình duyệt in-app cũng trả `net::ERR_CONNECTION_TIMED_OUT` tại cùng URL. Đây là hạn chế truy cập mạng của môi trường, chưa có bằng chứng lỗi ứng dụng.
- Đã ngừng ba tiến trình do phiên này khởi động và trả cấu hình cổng G1 về nguyên trạng. Không dừng server 4193 của phiên khác. Không dùng file HTML độc lập để thay bằng chứng sản phẩm.
- Đã tạo một ảnh ý tưởng sáu bề mặt (dock, panel giấy, biển tên, huy hiệu, toast, con trỏ); chưa chấp nhận làm asset: ảnh kết quả còn nền tối thay vì alpha trong suốt. Chưa crop/đóng gói/preload hoặc đưa vào sản phẩm.
- G1 chưa đạt; G2–G10 chưa thực hiện. Không có kết quả pass mới, không chạy check/build sản phẩm vì không có thay đổi runtime. Cần phiên cho phép truy cập loopback để nghiệm thu G1 và tiếp tục tích hợp; quyền ghi `.git` riêng cần thiết để commit từng phase. Không thay đổi quyền Windows hoặc vô hiệu hóa sandbox.

### Kiểm lại trên server của chủ dự án tại localhost:4173 — 21/10/2026

- Đã đọc lại AGENTS.md, CONTEXT.md, GAME_UX_SKIN_PLAN.md và hồ sơ này. Đối chiếu js/settings.js, js/gameState.js, index.html: chưa có skin runtime/enum/chọn Mặc định–Nâng cao; không có gate mới đạt để bỏ qua.
- Không khởi động server mới, không dừng server chủ dự án. Node `fetch('http://localhost:4173/', {signal: AbortSignal.timeout(5000)})` trả `TypeError fetch failed EACCES`; chưa đọc được HTML nên chưa xác minh danh tính dự án ở server.
- Kiểm riêng trình duyệt: Chrome headless khởi động thành công qua Playwright, nhưng `page.goto('http://localhost:4173/', {timeout: 10000})` trả `net::ERR_NETWORK_ACCESS_DENIED`. Browser đã đóng trong finally. Không lặp thử cùng lệnh hoặc sửa cấu hình bảo mật.
- `git update-index --force-write-index` vẫn trả `Unable to create '.git/index.lock': Permission denied`. Chính sách phiên tự động từ chối sandbox_approval; không gọi require_escalated, không sửa ACL, không stage/commit. Quyền commit không được suy từ quyền sửa code.
- Không sửa code sản phẩm hoặc cấu hình test; giữ nguyên sáu dòng thay đổi CONTEXT.md có sẵn. Chỉ bổ sung kết quả vào hồ sơ chung này (docs/ đang được ignore theo .gitignore hiện hành).
- G1 kiểm bản ghép và các gate phụ thuộc vẫn bị chặn bởi quyền truy cập loopback của tiến trình agent. G2 không sản xuất hàng loạt khi chưa kiểm bản ghép theo mục 1.4/3.1 kế hoạch. Check/build gate cuối chưa chạy vì task chưa tới nghiệm thu và không có thay đổi runtime.
- Để thực hiện phần còn lại: cần phiên cho phép tiến trình agent/Chrome kiểm thử truy cập localhost. Quyền ghi .git cần riêng cho commit, không phải điều kiện để thiết kế/code. Không có cơ chế nâng quyền được phép trong phiên này.

## Phiên triển khai tiếp — 21/10/2026 (cơ chế auto-review)

- Kiểm riêng trong sandbox: Node fetch localhost:4173 trả EACCES ở ::1 và 127.0.0.1; Chrome headless khởi động nhưng goto trả ERR_NETWORK_ACCESS_DENIED; Git force-write-index bị Permission denied. Dùng require_escalated theo cơ chế hiện hành, cả ba thao tác được phê duyệt và thành công. HTML/title/module xác nhận Memory Match Adventure, Vite và js/bootstrap.js. Không đổi ACL/sandbox, không tạo hoặc dừng server.
- G1 dùng UI_SKIN_BASE_URL=http://localhost:4173 để tái sử dụng server. Sửa URL CSS tiêm để ảnh tương đối tải đúng; sửa ribbon bị content-box kéo tràn, tương phản trên giấy của shop/profile/rương/ranking và header. Không sửa DOM luật hoặc cấp thưởng.
- Bổ sung mở rương bằng nút bản đồ thật ở cả ba trò; toast hết vòng đời trước sang màn kế. Bộ kiểm ghi 60 ảnh/viewport × 4 viewport = 240 ảnh; proof-320/412/844/1024.json chứa geometry và lỗi trang. Kết quả 4/4, không pageerror; đã xem trực tiếp ảnh Home, Cài đặt, Hồ sơ, shop, ranking, summary, rương và gameplay ngang. Đây là bằng chứng bản ghép G1; summary/thua/toast là fixture hiển thị, không chứng minh transaction thưởng hoặc ma trận G10.
- Nhóm core tiếp theo: dùng imagegen tích hợp, giữ nguồn core-materials-v1.png; alpha thực được kiểm bằng sharp (alpha min0/max254), sáu đảo độc lập có crop đo. Generator scripts/generate-ui-skin.cjs tái sử dụng 14 nguồn woodland và thêm sáu phần vật liệu; core205262byte, rewards263610byte, chưa có runtime sử dụng. Không dùng ảnh toàn màn hoặc chữ baked.

## G2 — Hợp đồng lõi và hai nhóm hình đã kiểm

- Đạt kiểm G2 trên DOM ứng dụng thật: 4/4 viewport, 240 ảnh cập nhật; có Home, hai dock, tab con, gameplay, rương, kết quả và thông báo. Đã xem ảnh thật sau ghép nhóm vật liệu/nút/rương/icon. Màn hẹp không còn bị dock che nút chuyển trò. Các state hiếm/giao dịch vẫn thuộc G7/G8/G10, không suy từ fixture.
- Tài nguyên hiện hành: public/assets/ui/woodland/manifest.json và js/uiSkinManifest.js do scripts/generate-ui-skin.cjs sinh. 37 mục core456852byte <600KiB;12 mục rewards402272byte <400KiB. Core tái sử dụng21icon đã có qua đường dẫn nguồn, không chép thêm bản giống nhau. Bốn nút mới1200×184 hỗ trợ400CSSpx ởDPR3, cùng frame normal/pressed. Rương đo8đảo alpha bằng flood-fill, không cắt theo lưới ước lượng; frame480×400, pivot(.5,.925), hero tối đa160CSSpx/DPR3. Biểu trưng/độ khó/catalog hiện hữu tiếp tục dùng nguồn hợp lệ; minh họa hướng dẫn đi cùng G9.
- Generator kiểm ngân sách, hash, crop/frame/pivot/nine-slice và có --check; chạy lại tái tạo trùng byte. Đã hạ ribbon xuống1200px và panelWebP80 để đạt ngân sách sau khi thêm8rương; không gọi kích thước nén là số đo decoded memory. Chưa nghiệm thu FPS điện thoại.
- Control spec: nút dùng normal/pressed đúng cặp; hover/focus/disabled/busy là trạng thái semantic và CSS, không bake chữ. Icon base/selected tab/thumb dùng một source, pressed giảm sáng trong cùng box. Chữ/số/progress vẫn DOM thật. Bộ mặc định chưa thay; nhóm này mới ghép qua CSS review.
- Nguồn imagegen tích hợp mới: screens/sources/core-materials-v1.png, buttons-v2.png, chests-v2.png. Bản rương đầu có clipping đã loại; bản v2 alpha kiểm trên nền giấy tại qa/chest-alpha-review.png, không có viền đỏ nhìn thấy khi composite đúng alpha. Prompt/contract lưu tại screens/sources/PROMPTS.md. Tái sử dụng pieces/ và manifest woodland cho14nguồn mẫu.

## G3 — Runtime và Cài đặt (đạt)

- Một owner uiSkin.js quản lý37ảnh lõi, tải/giải mã tối đa4ảnh đồng thời; chỉ lưu thành công mới đổi settings RAM và data-ui-skin trong cùng lượt. Generation/AbortController và identity của settings loại kết quả cũ khi đổi nhanh hoặc hydrate hồ sơ. Queue commit riêng; lỗi tải/lưu không đổi lớp hình. Đổi Mặc định bỏ toàn bộ reference ảnh; cache hữu hạn49mục, không listener/timer/RAF mới. Rewards tải riêng khi cần, có generation và fallback vector; trình bày phần thưởng hoàn thiện ở G8.
- So sánh giữ DOM và thay lớp hình với dựng shell khác: chọn giữ DOM vì bảo toàn board/round/pause/focus và owner. CSS có scope nằm cùng bundle ứng dụng (không tải ảnh Nâng cao ở Mặc định); tránh lỗi import stylesheet bị cache khiến không thử lại được. Bỏ chuyển màu legacy trên button khi đổi skin để không pha palette/giảm tương phản trong200ms.
- Field settings.uiSkin (default/woodland) được normalize ở gameState; thiếu/lạ về default. Whitelist persistence thêm field đã được kế hoạch cho phép, không nguồn localStorage song song, không đổi key/formatVersion/catalog/luật/kinh tế. Giữ lựa chọn đã lưu nếu ảnh không khả dụng lúc reload, dùng default hoàn chỉnh và có giải thích/thử lại trong Cài đặt.
- Bằng chứng: node --test tests/unit/ui-skin.test.js6/6; persistence/game-core/CSS ownership checks pass; runtime/skin.spec.cjs10/10 trên server4173. Bao gồm4viewport chọn/lưu/reload, không tải ảnh Nâng cao ở Mặc định, corrupt asset/retry,20lần đổi nhanh, mất ảnh sau reload, quota failure thật ở boundary IDB, hydrate hủy tải cũ và lượt chơi mở qua preview thật giữ nguyên nodeboard/round/moves/coins/time khi paused rồi resume sau popup đóng.
- Đã xem ảnh Cài đặt thật320px và sửa tương phản do legacy transition. Test lấy chính URL module Vite đã cấp cho sản phẩm qua Resource Timing; import đường dẫn trần sau HMR có thể tạo singleton thứ hai và không được dùng làm bằng chứng RAM sản phẩm.
- RGBA ước tính từ kích thước ảnh: core8634928byte; rewards13181856byte. Đây không phải GPU/heap đo được hoặc FPS thiết bị. Offline toàn ứng dụng/PWA/subpath,50chu kỳ và review toàn dự án còn thuộc G10; bài mất ảnh chỉ chứng minh fallback/retry ảnh khi app vẫn tải được.

## G4 — Home và điều hướng (đạt)

- Runtime thật cho Home/carousel và năm tab; nhãn Hồ sơ thay Profile, giữ ID profile. Nhiệm vụ/Sự kiện vẫn đúng Sắp ra mắt; chỉ trình bày bằng bảng giấy, không thêm tính năng. Khung giấy/đế tab/icon tái sử dụng đã ghép; sửa vùng giấy selected tab để chữ không nằm trên chân xanh và menu ranking dùng giấy thay nút CTA.
- home.spec.cjs8/8 (2skin×4viewport), kiểm3node carousel sau6lần chuyển, không chồng dock/nút chuyển, form tên20ký tự khi service sẵn sàng và trạng thái khóa thật khi đang kết nối; menu family ranking/focus/Escape, mọi tab, quay Home không mở lại loading. Ảnh/geometry theo từng case ở runtime/qa/home-*.json/png. Lượt đầu cũng đã có ảnh form qua đường vào thật; một lượt giữa gặp kết nối kéo dài45s được ghi nhận là state chưa sẵn sàng, không ép bật nút hoặc sửa auth ngoài phạm vi.
- startup.spec.cjs5/5:4viewport, chặn module bằng gate xác định để chụp loading thật; clock tiến15s kiểm tải lâu; lỗi import hiện thông báo và Tải lại phục hồi. Giữ tranh cổng vườn đã duyệt, tiến trình và cleanup owner startup hiện hữu; không thêm loading khi đổi trang.
- Giới hạn: không biến ảnh loading ranking hoặc form hủy thành bằng chứng đổi tài khoản/lưu tên từ xa. Các ma trận lặp về catalog/gameplay dùng backend-null boundary trong browser kiểm thử để tránh tạo hồ sơ online lặp; logic game, IndexedDB và grant cục bộ vẫn thật. Dịch vụ thật không thay đổi.
- Working tree vừa có thay đổi từ công việc khác ở tests/ui/progression-wave-presentation.spec.js và public/assets/sounds/{3eae70ed-4717-4f21-9160-a1a8d127d2e4.7ffa6.mp3,summary.mp3}; giữ nguyên, không stage cùng phase UI. CONTEXT.md6dòng đầu có sẵn vẫn ngoài commit.

## G5 — Trang trong từng trò (đạt)

- Bản đồ dùng biển tên gỗ, nút chế độ và rương ảnh tải theo nhu cầu; giữ nguyên tọa độ/nút màn/khóa/sao và vị trí scroll owner. Preview, mục tiêu/danh sách chi tiết dùng mực nâu trên giấy; legend/độ khó và mode đặc biệt giữ semantics hiện hữu.
- Cửa hàng/Bộ sưu tập: mọi tab con của3trò đã đi qua entry point thật; khung giấy, CTA mua/trang bị normal/pressed và state đã dùng có nhãn thật/viền xanh, giá và catalog không sửa. Kiểm nút cuối của từng tab và dòng cuối preview cuộn tới được; rời/quay lại giữ stable tab ID.
- catalog.spec.cjs8/8,2skin×4viewport×3trò,45ảnh/profile=360ảnh; JSON từng profile có geometry/errors. Có map, preview thường/Thử thách/Vô tận, tất cả shop/collection subtabs, ranking không kết nối và settings theo ngữ cảnh. Static checks adventure-preview/theme-selection/adventure-map-layout pass. Đã xem ảnh map, preview và shop ngang; sửa cascade khiến icon Thử thách bị nền cũ che và nút đóng mất texture.
- Một profile giữa lượt đầu bị Vite tự tải lại2lần trong khi working tree khác đang thay đổi, không phải fail app được chứng minh. Helper freezeDevelopmentReloads chỉ cô lập socket Vite có token trong browser test, không đổi server/sandbox/game request. Lượt cuối toàn matrix8/8 đạt. Dịch vụ từ xa dùng backend-null boundary; không nhận đây là nghiệm thu Firebase/account online hoặc giao dịch thưởng.
- Generator giờ chỉ ghi file khi byte thay đổi, tránh full reload không cần thiết; --check pass, ngân sách asset giữ nguyên. Icon modifier tăng specificity đúng registry để không bị các background shorthand cũ che. Mặc định không đổi art/cascade.

## G6 — HUD, bàn và khay (đạt)

- HUD Nâng cao dùng gỗ/giấy và chữ nâu; công cụ tối thiểu44px ngay ở320px. Khung bàn vẽ trong padding hiện hữu, không thay geometry tile/theme/luật. Khay Triple giữ10node, slot mở giấy và slot khóa nguyên ngữ nghĩa.
- gameplay.spec.cjs:8/8 giảm chuyển động/DPR2 và8/8 thường/DPR3, mỗi profile đi cả3trò qua Home→bản đồ→preview→chơi thật. Kiểm wave/preview, công cụ/Escape, fullscreen bật/tắt, pause, đổi skin rồi trở lại giữ nguyên nodeboard, resume và thoát round. Scope đã dispose có các bộ đếm resource về0. Screenshot/JSON kèm hash diff lúc đầu/cuối tại runtime/qa/gameplay-*.
- Đã xem ảnh320px của cả3bàn và menu công cụ. Đây là kiểm UI/lifecycle; chưa thay bằng bằng chứng thắng và cấp thưởng G8. Không thay controller, HUD JS hoặc công việc âm thanh/summary của phiên khác.

## G7 — Popup và thông báo (đạt kiểm trình bày)

- Giấy/gỗ cho nội dung thường, pause, chọn chế độ, xác nhận/reset, kho thời gian/xem trước; tooltip thật .app-tooltip và toast theo tone. Chỉ summary thắng dùng ribbon/sao ảnh khi rewards bundle ready; fallback giữ SVG. Sửa màu legacy theo ID để nội dung và số kho disabled đọc được, không đổi hành vi owner.
- dialogs.spec.cjs8/8:2skin×4viewport, đường vào thật Giới thiệu/Quyền riêng tư/Hướng dẫn, cuộn đoạn cuối, focus trap/return và Escape; production-owner fixtures reset/return/hết giờ/0–3sao/số dài/xung đột bản lưu/toast. Fixture hiếm chỉ là bằng chứng trình bày, không là cấp thưởng, auth hay natural defeat. purchase dialogs8/8 kiểm đường mua/giá/xác nhận/thiếuXu/Hủy của cả3trò qua nút thật. Popup pause/settings/gameplay đã kiểm G6; preview/chế độ G5; quota failure G3. Các luồng thắng thật/rương/mảnh thuộc G8, toàn bộ regression G10.
- Đã xem ảnh320px kết quả2sao/số dài, kho thời gian và tooltip. Lượt kiểm mua đầu sửa locator giá (nút số+icon) và chờ toast trò trước kết thúc; không thay app để test pass. CSS ownership pass; generator --check pass với NODE_PATH tới sharp runtime sẵn có. Không thay ui.js/controllers/logic thưởng đang được công việc khác xử lý.

## G8 — EXP, bốn rương và tranh (đạt)

- treasureSkin chỉ ghép hai SVG image cùng frame/pivot khi rewards bundle đã giải mã; default xóa href/node, lỗi ảnh giữ native SVG. Loại lớp SVG cũ bằng modifier rõ để không chồng hình nắp. Dùng lại timeline/owner mở rương:3animation hữu hạn cho bitmap,4cho fallback, không particle/loop/grant trong animation. Đổi skin/ẩn/reduced/đóng vẫn giữ transaction trước presentation.
- Bộ sưu tập giữ10vị trí mảnh/catalog3tranh, thêm Xem tranh khi đủ bộ; ảnh lớn có tải/lỗi/Thử lại/đóng và cleanup owner. Giấy Nâng cao sửa tương phản EXP/mảnh; không thêm khoản thưởng. Khoảng chạm rương Nâng cao tối thiểu44px kể cả ngang.
- rewards.spec:6/6 natural rewards (3trò×2skin), bàn sinh thật, click DOM, đủ2wave, thắng/replay/reload; +10EXP lần đầu, replay không thêm, durable10/100 sau reload. Không gọi hàm hoàn tất/grant để thay chơi. Snapshot/ảnh natural-* ghi rõ phạm vi. Bài kiểm đọc state để tìm nước đi, không đổi luật/RNG/board.
- treasure presentation8/8 (2skin×4viewport×3trò): fixture chứng nhận40màn chỉ chuẩn bị điều kiện mốc; click marker/rương thật, trạng thái SđợiC, C→B→A→S grant30/60/100/160Xu và1/2/3/4Gợi ý, đủ350Xu/10Gợi ý; claim300Xu thật tới650Xu, xem ba tranh theo game, mở lại không có Mở rương. Không nhận fixture này là40màn chơi tự nhiên.
- reward-lifecycle7/7:close/reload/default/reduced/profile replacement khi đang mở, receipt giữ một lần; write-failure boundary rollback rồi retry đúng30Xu; thiếu ảnh rương fallback vẫn nhận đúng. Bổ sung painting error/retry/close1/1, không đổiXu. Unit skin6/6, JS/CSS checks và adventure-rewards/level-progression checks pass. Lượt ma trận đầu phát hiện kiểm ảnh trước load; sửa owner tải/lỗi và await ảnh thật, chạy lại8/8. Đã xem ảnh rương S mobile sau sửa không còn chồng SVG.
- Chưa gọi đây là kiểm auth/Firebase thật, physical mobile FPS hay toàn bộ G10. Luật/giá/catalog/save key/version không đổi; chỉ UI xem tranh được thêm theo kế hoạch.

## G9 — Tập luyện và gợi ý theo ngữ cảnh (đạt)

- Ba adapter tập luyện cách ly state, gọi lại decideMemorySelection/Pair, findConnectionPath và reduceTripleCommand; không dùng singleton bàn thật hoặc transaction thưởng. Memory thử không khớp/ghi nhớ/úp lại/tự ghép; Link thẳng/góc/thử chặn/dọn cặp giữa/nối lại/tự giải; Triple ô mở/bộba/lộ lớp/khay capacity7 đúng luật. Chỉ tiến theo hành động đúng, không timeout hoàn thành.
- Hướng dẫn tại Home và từng trò có đường Tập luyện/Xem lại/Bỏ qua; gọi lazy khi người chơi mở. Tranh thẻ tái sử dụng catalog fruits, con trỏ SVG tĩnh, làm tối ô ngoài mục tiêu; không thêm bitmap hoặc loop. Nested modal giữ pause/focus và không chen quảng cáo. Lỗi hình có Tải lại hình; lỗi lưu có Thử lưu lại, generation chặn kết quả cũ sau replay.
- settings.tutorialProgress={version:1,completed,seen} là mở rộng settings đã chốt trong kế hoạch, normalize tại boundary và whitelist persistence; không đổi key/formatVersion/session/catalog/API hiện có. Queue lưu flags chỉ commit RAM khi bền vững và owner settings còn đúng; skip không hoàn thành. Gợi ý đợt/công cụ/EXP/rương/mảnh xuất hiện tại DOM thật lúc gặp, tối đa1guide; inline trong dialog để giữ focus, floating theo anchor/viewport với ResizeObserver và tối đa1frame đang chờ. Không tự lấy focus/tạm dừng thêm; đóng/chuyển owner/ẩn tab dọn node/listener/frame/observer. Acknowledge mới lưu đã xem.
- Unit tutorial5/5; browser tutorial12/12:2skin×4viewport×3bài, solve/replay/reload flags, giữ nguyên toàn bộ coins/progress,20lần mở/skip trong ván paused giữ nodeboard/round/moves/time/kho; hidden không nhận input; lỗi hình/retry; lỗi lưu và late-save không redraw bài xem lại; guide viewport/hidden/ack durable. JS/CSS/persistence checks pass. Đã xem ảnh thật320px Memory và Triple, sửa opacity để thẻ lớp dưới không xuyên qua thẻ lớp trên.
- Có thay đổi đồng thời về âm thanh, Link renderer/shuffle/resolve và exit engine từ phiên khác. Giữ nguyên; Link controller và waveHud chỉ stage các hunk nối tutorial, không stage thay đổi hiệu ứng/âm thanh. CONTEXT.md6dòng có sẵn tiếp tục giữ ngoài commit. Review độc lập đã được chủ dự án cho phép trong G10.

### G10 — Review độc lập và sửa race lưu lựa chọn

- Reviewer được chủ dự án cho phép, đọc diff riêng, không sửa source/server/Git. Unit11/11 và browser skin+currenttutorial22/22 pass. Xác nhận1P2: shortcut save dựa RAM bỏ ghi Mặc định khi write Nâng cao đang chạy nhưng đã bị supersede, làm reload đổi skin.
- Sửa: queue luôn ghi durable cho request đã vào; no-op chỉ bỏ trước request khi controller rảnh và cả RAM/current skin cùng trùng. Không tăng write cho lần bấm lại lựa chọn đã ổn định. Regression browser giữ write đầu, đổi về default, thả write thật, kiểm disk và reloaddefault1/1; reviewer đọc fix và chạy lại unit6/6 + regression1/1, xác nhậnP2đóng, chưa thấyP1/P2khác trong phạm vi đọc.
- npm run build pass (278modules), cảnh báo chunk lớn/static+dynamic imports hiện hữu được giữ. npm run check hai lượt dừng tại benchmark Easy generator p9524.88/20.51ms >20ms; chạy riêng checker đạt19.95ms. Không nới threshold hoặc sửa generator. Các check phía sau đang chạy riêng, full check sẽ được xác nhận lại ở cổng cuối; chưa đánh dấu G10 đạt.

## G10 — Nghiệm thu web cuối, 22/10/2026

| Phạm vi | Bằng chứng và kết quả |
|---|---|
| Home5tab, carousel;3trò×5tab và mọi tab con, map/preview/chế độ, HUD/bàn/khay/công cụ/fullscreen/pause/restart/thoát | production-matrix.spec.cjs32/32,2skin×4viewport×2motion×DPR2/3;60state/profile=1920state;128ảnh; lỗi JS/HTTP0. Bản build B1 cố định, không bị HMR từ công việc đồng thời. |
| Form tên dài, lưu lỗi/thử lại, đổi UID khi đang sửa, focus/keyboard/safe-area | closure.spec.cjs8/8,2skin×4viewport. Boundary tài khoản thay thế có kiểm soát; form/owner sản phẩm thật. CDP mô phỏng safe-area24/20px và bàn phím; không là điện thoại hay Google OAuth thật. |
| Offline và subpath | offline.spec.cjs1/1 trên B1: service worker thật, reload offline sau warm; Home, đổi skin và mở tập luyện Triple/3ảnh đã cache đạt. Không nhận là cài mới offline hoặc đồng bộ Firebase offline. |
| Thắng/cấp thưởng/mua/trang bị/lưu | G8natural6/6 cho3trò×2skin; commerce.spec.cjs2/2: thắng Memory2wave nhận52Xu, mua3theme qua cửa hàng thật, còn49Xu, trang bị/reload giữ đúng. Không fixture ví tiền. |
| Thua thật | defeat.spec.cjs8/8: timer thật3trò×2skin, clock tiến200s, Escape giữ popup; Triple chơi thắng Dễ mở Thường rồi chọn7ô lộ không ghép ba để thua khay đầy. Mỗi ca4viewport. Sáu ca timer dùng B2; hai ca khay đầy dùng source được ghi trong diff. |
| Lifecycle/đổi skin và đo | metrics.spec.cjs4/4, B1;50chu kỳ mở/đóng và20lựa chọn nhanh, cả2skin; đo mở rương thật sau chuẩn bị eligibility mốc. G3/G6/G8/G9 kiểm scope dispose, restart/interrupt/owner và lỗi lưu riêng. |
| Popup/thông báo/loading/error/fallback/hướng dẫn | Các suite G3–G9 ở trên, thêm G10thua thật và tài khoản; fixture chỉ phủ nhánh hiếm, không thay natural game/grant. |

- Lỗi phát hiện cuối: rule legacy theo ID làm chữ popup thua quá nhạt trên giấy kem. Bốn selector chỉ scope woodland/time-up sửa body nâu, tiêu đề/nút kem; câu mô tả đổi thành “Bạn có thể chơi lại hoặc trở về bản đồ.” Hai assertion UI và core contract cập nhật cùng copy, không bỏ assertion. Bổ sung kiểm computed color trong8ca thua, xem lại ảnh320px và844px. G7 trước đó đạt geometry nhưng chưa đủ bằng chứng màu của họ này; G10 đã bổ sung và sửa.
- B1: runtime/qa/production-build.json (base runtime/production/); B2: runtime/qa/production-v2-build.json (base runtime/production-v2/). Đây là sản phẩm Vite build phục vụ qua server4173 đang có, không server mới/deploy. VITE_FIREBASE_DISABLED=1 là cấu hình đã hỗ trợ để cô lập dịch vụ trong ma trận; không sửa backend sản phẩm. B1 giữ nguyên để bằng chứng32profile tái lập được; B2 chỉ kiểm lại họ thua vừa sửa, không lấy kết quả B1 thay bằng chứng sửa màu. Build/hash, thiết lập và giới hạn ở JSON đi kèm.
- Số đo Chrome headless đơn worker:50chu kỳ có listenerΔ0/nodeΔ0 ở cả2skin, heapΔ347720byte Mặc định/189348byte Nâng cao. rAFp95~7.1ms, max27/14.4ms, longtask0; màn desktop khoảng144Hz, không kết luận60FPS điện thoại. Rương: commit23.5/28.1ms, presentation890.5/896.9ms, rAFp95~7.1ms, max97.2/27.7ms, longtask0. Lần đầu rương listenerΔ+4/heap tăng~0.8MB (khởi tạo resource); không nhận đây là zero-resource sau mọi rương. Các scope dispose và50chu kỳ ổn định là bằng chứng riêng.
- Kiểm cuối: npm run check và npm run build đạt exit0 (log/result trong runtime/qa/final-*). Hai lượt check lịch sử từng dừng benchmark Easy24.88/20.51ms; lượt yên tĩnh trước sửa copy đạt14.15ms; lượt cuối sau cập nhật contract đạt11.26ms. Lượt sửa copy đầu dừng đúng assertion cũ, đã cập nhật contract và chạy lại toàn bộ; không nới threshold/xóa test. Build còn cảnh báo chunk>500kB và static/dynamic import hiện hữu.
- Review độc lập: reviewer đọc diff/check acceptance, chạy lại11unit+22browser; P2 lưu skin đã đóng bằng regression bền vững và rerun6unit+1browser. Với sửa màu cuối, reviewer đọc lại2diff, JS177module/CSSownership pass; không thấy P1/P2 mới trong phạm vi review.
- Tập luyện có bàn tay SVG tại Cài đặt→Hướng dẫn→Tập luyện của từng trò (Home chọn trò trước); không ảnh chụp cả màn, không tự bật trong ván thưởng. Bỏ qua/xem lại giữ nguyên thưởng và round thật.
- Giữ nguyên API/catalog/giá/luật/save key/formatVersion; chỉ uiSkin và tutorialProgress mở rộng settings như kế hoạch. Không APK/push/deploy; giữ server chủ dự án. Các diff âm thanh/Link/shuffle/exit từ công việc khác không stage trong gate này. FPS máy thật, Google OAuth và giao dịch Firebase thật chưa xác minh; không đưa chúng vào tuyên bố nghiệm thu web.
- Bộ kiểm tái chạy: node node_modules/@playwright/test/cli.js test -c docs/design/advanced-ui/runtime/production.config.cjs cho32profile; các file closure/offline/commerce/metrics/defeat dùng runtime/playwright.config.cjs, output tách từng suite. Offline tự bật service worker. Cần quyền localhost của tiến trình agent; các lần sandbox từ chối đã ghi đúng ở hồ sơ, không sửa ACL hoặc lách sandbox.

## Kế hoạch nhập môn và phần thưởng R0–R8 — 22/10/2026

### R0 — Baseline và lựa chọn (đạt)

- Nguồn scope UI_UX_ONBOARDING_REWARDS_PLAN.md và ONBOARDING_REWARDS_AGENT_PROMPT.md. Không dùng kết quả G0–G10 đóng R mới. Git baseline27ef096 cùng diff có sẵn: CONTEXT/GAME_UX_SKIN_PLAN/exitEngine/Link controller+renderer/logic/check-effect-v2 và hai test effect/progression; kế hoạch mới chưa tracked. Không stage/commit hoặc sửa các hunk đó.
- Browser R0Link1/1 tái hiện T01/T03/T04; runtime/qa/onboarding-baseline.json/png ghi pointer0 ở2bước đầu, tiles0/path1 sau match, không đường chặn. Node localhost sandbox EACCES; browser chạy bằng cơ chế approval của tool trên server4173 sẵn có, không đổi ACL/sandbox/server.
- Entry: so sánh chặn ở3controller với adapter chung adventureMap.launch. Chọn trước adapter.launch trong owner map; giữ launch intent và kiểm identity settings/profile+scope sau await, loading hiện hữu chống lặp. Không khởi tạo ván/timer trước bài. Close hủy; skip/hoàn thành chỉ tiếp tục một lần sau thao tác rõ.
- Flags: giữ version1/completed/seen; thêm skipped từng game tùy chọn normalize boundary, không reset flags cũ. Session suppression WeakMap theo settings cho save-failure; bằng chứng người cũ từ certified best/started/session/ranked records, không từ Xu.
- Surface: so sánh nhồi tiến trình vào summary với map card+Kho báu hiện hữu. Chọn map card đọc projection, đúng range/cụm, không ghi khi cuộn. Summary chỉ kết quả+2CTA. Thời gian completion.remainingTime là còn lại; nhãn phải là Thời gian còn lại.
- R1dùng adapter cũ/pathfinder/reducer thật; phase lựa chọn→feedback→xác nhận thay scene, giữ hình ởfeedback. Đường sai chỉ tới blocker, không giả routehợp lệ. Pointer1SVG neoDOM ô/CTA; không JS loop, không animation liên tục; phản hồi tĩnh cho reduced, thay scene sau xác nhận. Node phụ pointer/path/blocker≤12; frameđangchờ0 với CSSanchor.
- R5dùng projection+transaction cũ; R6metadata tranh ổn định theo mapping cũ, thêm missing-piece route qua preview hợp lệ. Mỹ thuật tranh chưa chốt; không tạo bitmap/rương/thưởng mới. Ngân sách mới: không longtask>50ms do code mới, so warm heap/listener/node50chu kỳ và p50/p95/p99 cùng profile bật/tắt presentation; desktop không chứng minhFPSđiện thoại.
- Copy inventory: Home/navigation(appNavigation/gameSelector), shop/collection(themeCatalog/masteryCollection), settings/help(mainMenu/modal), HUD/tools(gameShell/gamecatalog), summary(ui), map/preview(adventureMap), treasure(treasureView), startup/errors(appStartup/persistence UI), ARIA ảnh(themeCatalog). R3 sẽ ghi từng nhóm và kiểm UI theo ngữ cảnh; log/comment không phải copy người chơi.

```text
Preview → Chơi → kiểm flags/chứng cứ đã chơi → bài nhập môn nếu cần
  → Bắt đầu chơi/Bỏ qua → kiểm owner/settings/profile → adapter.launch đúng intent
  → X/Escape/owner hủy → không launch
Thắng → transaction hiện hữu → summary kết quả → Bản đồ/Chơi tiếp
Bản đồ → Kho báu/bộ tranh → transaction nhận thưởng hiện hữu → receipt/đã nhận
```

### R1–R6 — Kết quả triển khai và kiểm mới (đạt phạm vi web)

- R1:7unit thuần (gồm tương thích flags/R2), onboarding-lessons8/8 ở2skin×4viewport; chụp từng hành động, pointer0–1vàoverlap DOM, Link0/1/2góc và đường thử dừng tại blocker; giữ hình trongfeedback chờxácnhận. Memory/Triple cùng kiểm; khay lấy capacity từ model. Bàn tập giữ nguyên coins/progress.
- R2: onboarding-launch12/12 completed/skip của3trò×2skin; close/legacy riêng1/1; boundaries9/9 gồm savefail vẫn chơi đúng Thử thách cả3trò, held-save close/owner/profile không launch,3đường mảnh thiếu→preview hợp lệ. Không chuyển skip thànhcompleted. Đổi lựa chọn trong ván không tạo round mới; tutorial lifecycle11/12+context rerun1/1 (bài context cũ chưa đi qua first-play, đã cập nhật và pass).
- Entry chỉnh sau review: nạp code practice cùng entry chung thay lazy import trong hành động Chơi. Lý do: modal preview đang submit thì không đóng được nếu chunk bị treo; mở bài đồng bộ bảo đảm X/Bỏ qua hoạt động trong lúc ảnh tải/lỗi. Hình vẫn chỉ tải khi mở bài. Chọn eager module nhỏ với adapter/pathfinder đã được app sử dụng, thay vì thêm loading overlay/race coordinator; không thêm timer/poll. CSSpointerneo node,0frameJS,1SVG tay (path+blocker thêm tối đa3node).
- R3: ARIAảnh dùng nhãn trung tính theo chủ đề+số hình ổn định từ catalog, không filename/ID. Bài dùng tên hình thân thiện đã xem ảnh; HUD Lượt/Sai/Màn/Chuỗi; lời dẫn công cụ ngắn; toastkhóa dùng tên độ khó. Form tên giữ validationhữuích nhưng lỗi dịch vụ không đưa failure.message kỹ thuật trực tiếp lênUI. Profile8/8 kiểm raw lỗiFirebase/SDK không lộ, save/retry+UID+keyboard/safe-area. Inventory theo ngữ cảnh tại runtime/qa/onboarding-copy-inventory.json; ma trận production mới kiểm chữ nhìn thấy và ARIA từng màn, không coi grep từ khóa là toàn bộ review.
- R4: onboarding-summary6/6 thắng/replay thật3trò×2skin, bốnviewport cho từngpopup; không EXP/progress/guide/mảnh/rương,2CTA Bản đồ/Chơi tiếp, nhãn timer theo hướngđếm (còn lại/đãchơi). Map1/10 sau thắng/replay/reload giữ10EXP. Gỡ sourceblock và hookexp từmodal, không thay transaction/âmthanh. Cả nhánh chặng dùng2CTA hiện hữu onMenu/onNext; không bắt đi qua popup phụ.
- R5/R6: onboarding-treasure8/8, mỗi profile3trò×0/1/3/9/10mảnh, range/cụm đúng;10/10frontier chuyển card sangMàn11–20 vàmarker1 mởMàn1–10; C→B→A→S transaction thật350Xu/10Gợiý, collection300tới650, reloadkhôngclaimlại. Fixture chỉ chuẩn bị chứng nhận màn, không thay natural6/6. Missing-piece hiển thị4độkhó vàCTA tới prerequisite hợp lệ; không vượt khóa. Bộ tranh0/1/9/10 có tên/range/cáchkiếm/preview10mảnh/300Xu/Xemtranh; mappings/IDkhôngđổi. Metadataasset/crop cóowner trong catalog hiện hữu. Baảnh1500×600 đangcó chưađượcduyệtmỹthuậtcuối, khôngthaytranh/hứatranhmớivôhạn.
- Lỗi tải/claimcollection2/2 (mỗi ca3trò) giữ dữ liệu khi savefalse, retry chỉ300mộtlần; loader córetry vàowner guard. Rương/tranh lifecycle8/8 đã chạy lại trong task mới, gồm close/reload/đổi skin/reduced-motion/profile, lỗi transaction/ảnh rương/ảnh tranh; không dùng kết quả G8 cũ.

### R7 — Tích hợp, lifecycle và hiệu suất (đạt phạm vi web)

- Bộ kiểm của task mới dùng server4173 đúng dự án. Không chạy server thứ hai. Browser cần cơ chế approval của tool vì Node sandbox nhận EACCES; không sửa ACL, sandbox hoặc quyền Git. Index vẫn rỗng; không stage/commit. Các source QA mới có thể bị ignore theo cấu hình repository nhưng vẫn được lưu cùng hồ sơ trên đĩa.
- First-play/skip/close/legacy13/13; boundaries10/10 (save-failure vẫn đi đúng mode, held-save không launch khi owner/profile đổi, missing-piece route hợp lệ và không ghi tutorial flag trong lúc thay hồ sơ). Final-features38/38 gộp các bài trên với lesson/smoke/summary-edge, không cộng thành số người chơi hoặc số ván thắng.
- Lesson cuối16/16 = ba bài trong mỗi tổ hợp hai skin × bốn viewport × normal-DPR3/reduced-DPR2. Ảnh từng bước có tên `onboarding-{motion}-dpr{dpr}-{skin}-{width}-{game}-{step}.png`; JSON `onboarding-lessons-{motion}-dpr{dpr}-{skin}-{width}.json`. Assertion kiểm tối đa một tay, tay nằm đầy đủ trong vùng cuộn và chạm đúng control, không chỉ đếm SVG. Link giữ thẻ sau ghép đúng, có đường chặn/điểm chặn; Memory/Triple đi hết bài và tự giải. Tối đa12node phụ, không loop JS cho pointer.
- Layout cuối10/10: sáu lượt thắng tự nhiên ba trò × hai skin, replay/reload/map có đúng tiến trình, summary qua cả bốn viewport; bốn ca keyboard/đổi hướng/đổi skin giữa bài. Sửa clipping tay bằng inset2px và ribbon summary gọn để hàng Điểm đầy đủ ở320×568. Trạng thái hoàn thành xóa bàn/khay và không để khoảng trống lớn trước Bắt đầu chơi.
- Kho báu8/8 (mỗi cấu hình bao gồm cả ba trò), waiting2/2; thẻ rương sau giữ10/10 ngay cả khi rương trước3/10 và đọc “Chờ rương trước”. Collection0/1/9/10, thưởng350Xu+10Gợi ý từ bốn transaction rương và300Xu bộ tranh được kiểm qua UI rồi reload. Không dùng fixture thay sáu lượt thắng thật. Errors/profile/lifecycle18/18; sau sửa owner ởR8 chạy lại errors+lifecycle11/11. Regression cuối24/24 gồm reward/audio/summary/treasure18, startup5 và card đổi hướng1.
- Đo cùng compiled build tại `runtime/onboarding-final/` (hash/giờ ở `qa/onboarding-final-build.json`), bốn profile hai skin × hai motion, mỗi profile bật/tắt lớp presentation ở hai context mới. Mỗi lần6warmup+50chu kỳ thao tác bài thật, thêm cuộn map/mở rương/xem tranh; không so hai checkout có công việc đồng thời khác nhau. `qa/onboarding-metrics-{motion}-{skin}.json`: listenerΔ0/nodeΔ0 ở cả8lần, heapΔ362324–409644byte gồm trace buffer/JIT; lesson rAF p50≈6.9ms/p95≈7.1ms/p99≈7.3–7.4ms; longtask0 ở cả lesson và map/reward. Rương normal commit10.2–14.9ms/presentation872.5–875.3ms; reduced commit8.6–9.4ms/presentation7.4–9.2ms. Đây là Chrome headless trên desktop khoảng144Hz, không chứng minh60FPS máy điện thoại.
- Phép bổ sung không giữ trace: `onboarding-cleanup.spec.cjs` 1/1,30warmup+200chu kỳ tạo bài/chọn ô/hủy khi chưa xong; listener/nodeΔ0, heap tăng33760byte ở100lần đầu và6388byte ở100lần sau; scope owned timeout/RAF/observer/animation/listener về0. Không diễn giải heap đo có trace là leak hoặc nhận rằng heap tuyệt đối không tăng.
- Hai build đo/baseline giữ nguyên: `onboarding-production/` (B1 của task mới,32/32), `onboarding-final/` (B3 đo hiệu suất4/4). Build nghiệm thu mới `onboarding-acceptance/` không thay chúng; metadata chứa SHA256 bundle và source working tree. Tất cả được phục vụ từ server4173 đang có với cấu hình VITE_FIREBASE_DISABLED đã hỗ trợ, không deploy và không biến lỗi dịch vụ thật thành bằng chứng live.
- Kiểm tổng cuối sau sửa owner: `npm run check` exit0 (179module, CSS ownership, logic/persistence/technical/ads; Triple Easy p95 10.38ms), `npm run build` exit0. Log và kết quả UTC tại `qa/onboarding-{check,build}.log` / `qa/onboarding-{check,build}-result.json`. Build còn cảnh báo chunk>500kB và import static/dynamic hiện hữu; không nới threshold để qua kiểm.
- Bổ sung bằng chứng câu chữ/thị giác thua mới: `onboarding-defeat.spec.cjs`8/8, sáu ván hết giờ thật trên build nghiệm thu (ba trò × hai skin) và hai ván Triple đầy khay thật trên source hiện tại. Mỗi ca kiểm bốn viewport, contrast, thao tác trở về và Escape không đóng sai popup. Ảnh `qa/onboarding-defeat-*` / `qa/onboarding-tray-full-*`, kết quả `qa/onboarding-defeat-final-results`; không mượn8pass G10.

### R8 — Lượt tự review riêng sau triển khai (đạt phạm vi web)

- Đã đọc lại diff source/acceptance, ranh giới dữ liệu, entry và cleanup rồi chạy lại kiểm trọng yếu. Đây là **tự review riêng, không phải review độc lập**; không dùng reviewer của task G10 để nhận nghiệm thu kế hoạch mới.
- Review phát hiện lỗi profile collection: nút từ DOM của hồ sơ cũ có thể gọi transaction cho hồ sơ mới trước khi guard sau await chạy. Ca tái hiện thật qua UI cho kết quả500→800Xu, nằm ở `qa/onboarding-old-profile-before-results`. Đã thêm guard profile/owner/generation và profile-replacement trước transaction; guard cả Xem tranh/mảnh khi view đã cũ. `onboarding-errors.spec.cjs` giữ regression và xác nhận500Xu không đổi, yêu cầu mở lại bộ sưu tập; errors+lifecycle11/11 đạt sau sửa. Transaction cấp thưởng không đổi.
- Các mục review khác đã đóng bằng kiểm: chứng cứ người cũ từ tổng score/star/frontier khi chapter được lưu ngoài RAM; không ghi flag trong replacement; pointer không bị clip; focus giữ hành động kế; resize cập nhật đúng block; summary không clip hàng Điểm và cả nhánh chặng/vô tận có đúng hai CTA. Ca lỗi điều hướng tới muộn cũng được chạy đến khi callback thật reject để kiểm không báo nhầm sang trang mới.
- Bản build nghiệm thu đi hết bài và vào ván thật6/6 (ba trò × hai skin) ở320×568 normal/DPR3; kiểm tay từng bước, completion không còn bàn/khay, chỉ một shell, notice Đợt1/2, không pageerror/HTTP lỗi. Kết quả `qa/onboarding-bundle-final-results`, ảnh `onboarding-bundle-{skin}-{game}-complete.png` và JSON kèm hash build.
- Ma trận B4 có31/32pass lượt đầu; normal/DPR3/Mặc định412 dừng ở bấm thẻ ngoài tâm carousel, snapshot chỉ đổi lựa chọn Link mà chưa vào map. Giữ nguyên lỗi/ảnh và source bộ kiểm đầu tại `qa/onboarding-acceptance-matrix-results` / `qa/onboarding-matrix-initial-source.cjs`. Chuyển thao tác bộ kiểm sang nút chọn carousel→aria-current→bấm thẻ giữa, không sửa code carousel hoặc nới timeout/assertion. Profile này chạy lại3/3 có trace tại `qa/onboarding-acceptance-carousel-rerun-results`. Đủ32profile phân biệt/2016state/320ảnh của B4; không gọi lượt đầu là32/32. Kết quả này không chứng minh mọi click thẻ ngoài tâm đều nhận được click.
- Review đối chiếu badge phát hiện mở sai bộ: khi frontier ở11 nhưng cuộn về cụm1, dock ghi10/10 mảnh mà album mởMàn11–20. Ca tái hiện `onboarding-collection-range-before-results` đã fail đúng title/range. So sánh truyền business metadata qua dock chung với getter đọc từ owner map; chọn getter có scope/profile guard, cleanup cùng view và không lưu nguồn trạng thái mới. Album chụp block lúc mở; replay trong ván vẫn dùng bộ mặc định hiện hữu. Chỉ sửa `adventureMap.js`/`mainmenu.js`, không đổi transaction/dữ liệu;19/19 kiểm lại ba trò/hai skin, lỗi lưu/profile/điều hướng/focus/resize đạt. B5 `runtime/onboarding-closure/` giữ riêng khỏi B4;12/12 compiled đạt: sáu first-play tới ván thật và sáu range case, mỗi range case qua320×568/412×915/844×390/1024×900. Fixture đi qua persistence source hiện hành rồi bản compiled tự hydrate từ cùng IndexedDB; không import module source để thay RAM bản compiled.

| Gate | Kết luận và bằng chứng mới |
|---|---|
| R0 | Đạt: baseline Link thật, inventory/owner, hai phương án entry/progress, luồng và ranh giới diff27ef096 |
| R1 | Đạt:7unit;16profile lesson gồm cả ba trò; tay thấy đầy đủ/đúng control, Link giữ hình và minh họa blocker, tự giải/khay theo model |
| R2 | Đạt:13launch+10boundary; skip/completed riêng, legacy/archived flags, save failure/late owner/profile và replay lifecycle |
| R3 | Đạt phạm vi app:9nhóm copy/ARIA,32profile toàn màn; profile8 và thua thật8; không dùng grep hoặc kết quả G10 thay review |
| R4 | Đạt:6thắng thật ba trò/hai skin +edge/navigation; hai CTA, timer đúng nghĩa, không EXP/rương/mảnh/guide; replay không cấp lặp |
| R5 | Đạt:8treasure+2waiting+8lifecycle; card đúng block/range, bốn trạng thái, thứ tự/transaction/reload giữ nguyên |
| R6 | Đạt UX với art hiện hữu:0/1/9/10, legal prerequisite, once-only300Xu, lỗi/retry/xem lại;19source+12compiled closure cho owner/range mới |
| R7 | Đạt phạm vi web:32profile có bằng chứng cuối (31pass đầu+profile thiếu chạy lại3/3),2016state,320ảnh;50chu kỳ mỗi profile đo/200cleanup;check/build exit0 |
| R8 | Đạt tự review riêng:hai lỗi profile/range đã có ca fail trước và regression pass sau; giữ đúng giới hạn bên dưới; không nhận review độc lập |

- Danh tính cuối: HEAD27ef09684685aef93382234ce39ad19311a11c3c +working tree, không commit task này. `qa/onboarding-closure-build.json` lưu hash31source cùng bundle; script receipt xác nhận source chưa thay sau B5. So với B4 chỉ hai file map/menu thay để truyền block hiện tại, được kiểm closure ở trên. Không gọi32profile B4 là32profile chạy lại trênB5; không dùng B1/G10 đóng sửa mới.
- Kết quả cuối có thể tái tổng hợp: `node docs/design/advanced-ui/runtime/onboarding-evidence.cjs` exit0, xuất `qa/ONBOARDING_REWARDS_SUMMARY.json`. Mọi run được chờ tới kết quả cuối; các nhóm test có chồng lặp sau sửa, không cộng tổng thành số scenario độc lập. Bằng chứng ảnh/JSON nằm cùng thư mục runtime/qa, không tạo báo cáo riêng cho từng lỗi.

#### Giới hạn và tính tương thích của lượt R0–R8

- **Mỹ thuật tranh chưa chốt.** Runtime vẫn dùng đúng ba tranh/mapping cũ, không tích hợp thêm ảnh từ nhánh review `docs/design/collection-art`, không shuffle/append catalog hoặc đổi sở hữu. Metadata title/asset/crop sẵn để thay hình có kiểm soát ở task đã được duyệt sau.
- Không xác nhận FPS trên điện thoại thật, keyboard Android thật, Google OAuth/Firebase live hoặc chất lượng nội dung từ nhà cung cấp ngoài. Các ca profile/lỗi dịch vụ dùng boundary kiểm soát và đã ghi rõ; không gọi đó là giao dịch từ xa thật. Số đo desktop và dữ liệu fixture được phân biệt với UI/luồng thắng/transaction thật.
- Không thay luật, RNG/timer/wave, giá, EXP10, thưởng rương30/60/100/160Xu và1/2/3/4Gợi ý, mảnh hoặc300Xu. Không sửa module transaction/persistence/gameState. Settings tutorial version1 chỉ mở rộng flags skipped tùy chọn, normalize/giữ completed/seen cũ; không thêm save key/formatVersion hoặc nguồn lưu song song. Export preview nội bộ chỉ bổ sung đường điều hướng, không phá contract API hiện hữu.
- Giữ diff Link/exit/shuffle/logic/check-effect-v2/test effect có sẵn. Ở Link controller chỉ đổi một tiêu đề Level→Màn; test progression-wave-presentation chỉ cập nhật expected notice thành Đợt1/2, giữ hunk vị trí notice của công việc khác. Không sửa hoạt ảnh cảnh nền bản đồ. Không tạo APK, commit, push, deploy, server trùng hoặc sửa quyền môi trường.
- Không tạo bitmap trong task mới; dùng SVG/CSS có owner và ảnh hiện hữu. Không nhận đã sử dụng imagegen/skill tạo ảnh cho những tài nguyên được tái sử dụng. Bản build/check tạo generated output từ generator hiện hữu; không sửa tay generated source.

#### Chạy lại bằng chứng

- `node --test tests/unit/tutorial.test.js` (7/7).
- Browser chung: `node node_modules/@playwright/test/cli.js test -c docs/design/advanced-ui/runtime/playwright.config.cjs <tên-suite>`; các bộ `onboarding-*`, `reward-lifecycle.spec.cjs`, `startup.spec.cjs` dùng server có sẵn, không khởi tạo webServer. Module source trong fixture lấy URL sản phẩm đã tải, tránh singleton Vite/HMR khác RAM; không sửa luật để làm test đạt.
- Từng bước lesson: config `onboarding-lessons-final.config.cjs`; ma trận compiled: `onboarding-production.config.cjs` với `ONBOARDING_ACCEPTANCE=1`, `ONBOARDING_BASE_URL=http://localhost:4173/docs/design/advanced-ui/runtime/onboarding-acceptance/`. Output build ghi trong `qa/onboarding-acceptance-build.log`; bản static này dùng cấu hình backend-disabled được app hỗ trợ, không phải deploy.
- Metadata/hash, kết quả từng suite, số profile/state/ảnh và giới hạn được tổng hợp từ các file kết quả bởi `runtime/onboarding-evidence.cjs` vào `runtime/qa/ONBOARDING_REWARDS_SUMMARY.json`. Script từ chối run còn thiếu/fail không được giải thích, check/build khác0 hoặc source thay sau build; kết quả thất bại ban đầu không bị xóa.

## Bổ sung — tải trước ba nền trong loading đầu game

- Theo yêu cầu chủ dự án: loading đầu game chuẩn bị sẵn nền Memory/Link/Triple để chọn ngay một trò không phải bắt đầu tải ảnh từ lúc bấm. Nguyên nhân trước sửa: chỉ warm nền qua focus/pointer của từng thẻ hoặc lúc navigation. Bootstrap không chờ nền.
- So sánh preload link HTML (chỉ khởi phát download, không đảm bảo decode/khó chọn orientation đúng) với reuse preloader hiện hữu: chọn `preloadGameBackgrounds` trong owner `gameBackgroundTransition.js`, gọi song song với module/save/interface boot và await trước đóng loading. Chọn đúng ba source theo orientation hiện tại, không tải cả sáu hoặc các ảnh nền tab. Không đổi phase/UI/luật/save/API cũ; chỉ thêm API warm-up tương thích.
- Payload ba ảnh: portrait594.614byte (≈581KiB), landscape329.898byte (≈322KiB). RGBA theo kích thước nguồn lần lượt31.104.000/18.870.192byte, là ước tính decode, không phải đo heap/GPU. Cache Promise sẵn có giới hạn theo sáu URL đã khai báo; không thêm cache bitmap giữ reference dài hạn, không tải lại qua navigation khi lần warm thành công. Browser vẫn có thể tự thu hồi decode cache; xoay màn hình sang orientation chưa warm tải ba bản tương ứng theo nhu cầu.
- Chỉ chờ ảnh tối đa8giây, tính từ lúc khởi phát boot song song; lỗi/load/decode/abort trả false, không làm startup thất bại và không chờ vô hạn. Deadline có owner, clear timer/listener/onload/onerror khi settle; abort ở finally của bootstrap. Kết quả decode đến muộn bị settled guard bỏ qua. Cache xóa entry lỗi để navigation/focus có thể thử lại. Đây là deadline tài nguyên, không phải sleep che race. Không đổi animation/timing gameplay, không preload skin chưa chọn hoặc face art.
- Browser suite `runtime/startup-backgrounds.spec.cjs`:7/7 ở `runtime/qa/startup-backgrounds-complete-results`. Các viewport320/412/844 chặn ba response, xác nhận loading vẫn có sau hai ảnh, chỉ thoát khi đủ ba; đi ngay cả ba trò bằng carousel/menu thật. Kiểm riêng download xong nhưng decode còn pending, ảnh lỗi/retry, tải treo hết hạn và abort/owner mới retry. Lần đầu harness dùng page.goto mặc định chờ window.load nên chỉ quan sát sau deadline; đã sửa sang DOMContentLoaded để chủ động giữ ảnh. Một assertion đếm đúng3request khi ảnh hỏng bỏ sót warm từ focus Home sau loading; đã sửa kiểm đủ3URL và tối đa một lần warm thêm, không sửa game để pass. Giữ output lỗi đầu/final và output complete riêng.
- Build cuối sản phẩm exit0: `runtime/qa/startup-backgrounds-build.log`, cảnh báo chunk>500kB như hiện có. Check đầu fail benchmark Triple p95=21,30ms/giới hạn20ms trong lúc browser và build chạy đồng thời; không sửa luật/benchmark/ngưỡng. Log giữ ở `startup-backgrounds-check-first.log`; check cuối chạy riêng exit0, Triple p95=10,54ms; log `startup-backgrounds-check.log`. Không thay ngưỡng hoặc sửa suite để đạt.
- Review riêng của cùng agent: diff chỉ hai owner bootstrap/background; không chỉnh controller của agent khác, index không stage. Promise dùng chung giữa startup và navigation; startup chặn thao tác Home tới khi settle. Không thêm listener/timer lặp hoặc cache không giới hạn. Đây là tự review, không nhận review độc lập. Không APK/commit/push/deploy hoặc sửa quyền. Chưa đo tải lạnh trên điện thoại/mạng di động thật; trade-off là chuyển phần đợi ba nền vào loading đầu tiên, không loại bỏ chi phí mạng.
