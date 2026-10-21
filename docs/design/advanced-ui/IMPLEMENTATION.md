# Giao diện toàn dự án — hồ sơ thực hiện

Nguồn phạm vi: `GAME_UX_SKIN_PLAN.md`. Bắt đầu 21/10/2026, working tree sạch.

## Trạng thái phase

| Phase | Trạng thái | Bằng chứng |
|---|---|---|
| G0 | Hoàn tất inventory và contract thiết kế | Kế hoạch mục 1.1–1.3; `inventory.json`; bảng dưới |
| G1 | Đạt bộ bản ghép đại diện trên DOM thật | `screens/qa/proof-*.json`, 240 ảnh/4 viewport; chưa phải runtime hoặc nghiệm thu G10 |
| G2–G10 | Chưa thực hiện | Chưa đánh dấu runtime/asset/tutorial/QA sản phẩm đạt |

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
