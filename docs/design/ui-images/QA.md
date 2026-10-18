# Nghiệm thu bộ hình giao diện — 18–19/10/2026

## Kết quả sản phẩm

Đã thay vật liệu khung/nút/bệ và bộ biểu tượng dùng chung cho ba trò: popup thường, chọn màn/đầu màn, công cụ, thắng/thưởng/rương, Home, điều hướng, cửa hàng/bộ sưu tập, hồ sơ, xếp hạng, cài đặt, HUD và khay. Các nền/tranh chủ đề, cảnh hoa và banner vector phù hợp được giữ lại. Bảng nhiệm vụ/sự kiện chỉ đổi khung, không thêm tính năng.

Popup thắng có sao và tiêu đề cong theo nhãn đỏ, vừa màn999; đúng ba hàng Xu nhận, Thời gian, Điểm. Đây là số liệu đã quyết toán, giữ nguồn giờ và cách tính điểm/thưởng cũ; chỉ bỏ các hàng chi tiết. Nút không kéo đầy khung, tăng chiều cao vùng chạm. Tạm dừng có ba nút chính dọc ở giữa; Cài đặt là nút hình ở đầu khung. Banner không bị thu hồi khi mở popup thông thường.

Chữ/số vẫn là nội dung sống. Không đổi API công khai, schema/save, ID/giá catalog, luật, tài khoản hay cấu hình quảng cáo. Không tạo animation/timer/RAF mới cho bộ hình. Hình không tải được vẫn có màu nền tương phản, nút hoạt động và icon chuyển sang SVG cũ; callback error chỉ thuộc node ảnh, chạy một lần. Không tự thử tải lại hoặc thêm bộ nhớ đệm vô hạn.

## Nguồn và tải ảnh

Dùng skill `imagegen` với công cụ có sẵn; ba master1254×1254 RGBA và prompt nguyên văn ở [prompts.md](prompts.md). Bộ icon đầu quá sát đã được vẽ lại; không đưa bản bị loại vào bundle. Script chỉ cắt/thu nhỏ/nén, không vẽ lại bằng xử lý ảnh. Có56WebP, tổng526.264bytes: garden218.454, reward166.190, icons141.620; đều dưới các giới hạn350/250/250KB. Master không nằm trong bundle. Bản đồ vùng, hash và kích thước ở [runtime-metadata.json](runtime-metadata.json).

Chọn ảnh thành phần co giãn/chia9phần cùng nội dung DOM thay vì ảnh toàn popup với tọa độ cố định: giữ được focus, cuộn, nội dung dài, responsive và các tương tác sẵn có. Icon vẫn trả SVG/aria như trước, dùng ảnh bên trong khi tải được. Đường dẫn tôn trọng thư mục gốc của bản đóng gói, gồm bản chạy dưới thư mục con.

## Kiểm tra và các lỗi đã giải quyết

- Matrix geometry/layout/ads/catalog/purchase:110/110 đạt; có ba viewport và chuyển trò lặp lại. Bộ target29/29 trước bổ sung thiết kế mới đạt.
- Sau yêu cầu ba hàng/nút/nhãn cong: lượt38 có36đạt,2lỗi test. Một test vẫn đòi các hàng chi tiết người dùng vừa bỏ; đã đổi sang assert đúng thưởng/điểm và đúng3hàng. Một test đọc phiên level8 ngay khi HUD mount, trước intro/persistence; đã chờ intro kết thúc và canonical session level8, giữ assert snapshot/giới hạn thẻ. Không đổi controller để né test.
- Chạy lại toàn bộ Triple13 + art4 + resilience/perf2:19/19 đạt.
- Gate hình cuối art4/resilience2/HUD7:13/13 đạt, gồm thanh đóng băng dùng/chồng/pause/background/restart và cả reduced-motion/no-preference. Sau bổ sung fallback SVG: resilience2/2 đạt, chặn toàn bộ56ảnh mới từ lần mở đầu và vẫn thao tác được.
- Review độc lập ban đầu26/26 đạt; phát hiện BASE_URL và fallback mất mạng, đều đã sửa. Review source cuối không còn finding mở; kết quả chạy sau fallback SVG ghi dưới phần cổng cuối.
- Đã xử lý root cause cửa hàng Triple ngang: hàng nhóm appearance bị co xuống74px, nội dung chồng nhóm khay và chặn nút mua. Dùng grid-auto-rows:max-content; cả ba shop mua/hủy ở412/844/1024 đạt, không dùng pointer-events để che lỗi.
- Ảnh thực ở [qa/](qa/): Home,3trò preview/tools/win, shop/mua và5tab tại412×915,844×390,1024×900. Kiểm trực quan tiêu đề999, số điểm dài, sao sáng/tối, footer/banner, popup tạm dừng và mất ảnh. Không có câu chữ hướng dẫn phát triển trên giao diện.

## Hiệu suất và vòng đời

[performance.json](qa/performance.json) ghi Home412×915 với banner chuyển động sẵn có,119frame/mẫu, so sánh lớp ảnh tĩnh bật/tắt. Home yêu cầu16ảnh mới/117.024bytes trong mẫu, không tải toàn bộ56ảnh. Đây là phép so sánh lớp khung tĩnh, không phải baseline đầy đủ toàn trò. Không thêm chuyển động hoặc đường cập nhật mỗi frame. Lượt đo cuối: lớp ảnh bật mean7,00ms/p957,0ms/max13,9ms; tắt mean6,94ms/p957,1ms/max7,2ms. Không suy ra bật ảnh làm game nhanh hơn; đây là mẫu refresh trên máy tính.

Soak thắng/hủy/chuyển trò30vòng trước fallback SVG giữ node1302 và listener90 ở cả ba mẫu, heap tăng khoảng55–65KB; không có tài nguyên owner còn sống sau hủy. Sau fallback SVG, review độc lập9/9 đạt: node1302/1302/1302, listener113/113/113 (23listener ảnh sống thêm, không tăng theo chu kỳ), heap+56,8KB; mọi owner diagnostics về0. Các số đo là Chrome/Node trên Windows, không chứng nhận60FPS hoặc bộ nhớ trên điện thoại.

## Giới hạn

Chưa cài/kiểm tra Galaxy S22 Ultra, bàn phím Android hoặc quảng cáo thật trong lượt này. Không xuất bản website hay thông điệp AdMob, không vượt bước quyền riêng tư. Ảnh bị chặn được kiểm bằng request thất bại từ lần mở đầu; không coi đây là bằng chứng toàn bộ PWA offline/end-to-end trên thiết bị.

## Cổng cuối và bản đóng gói

Review độc lập cuối9/9 đạt, không còn finding mở; gồm fallback ảnh và lifecycle7. Đã xem ảnh thiếu ảnh: không còn dấu ảnh lỗi, SVG dự phòng và các nút/giá trị rõ. `npm run check` đạt, quảng cáo15/15, Triple solver p95=16,45ms trên Node Windows. Selector riêng cho nút đơn hoàn thành chặng đã được kiểm CSS ownership lại, không đổi luật/lifecycle.

Bộ nghiệm thu art cuối5/5 đạt: có assert3nút pause thẳng hàng, tỷ lệ nút dưới4,5 và nút đơn của hoàn thành chặng ở giữa. `npm run build:gh-pages` đạt; browser kiểm bản mount dưới `/MemoryMatchV1.1a/`1/1 đạt, icon và CSSảnh trả200đúng loại. Lượt preview đầu mount nhầm ở `/` nên không khởi động được; đã thêm config preview đúng base và chạy lại, không sửa source ứng dụng để né lỗi.

`npm run android:apk` đạt, đúng một lần trong toàn task. `npm run build` đạt; dist cuối là bản web gốc. Production smoke2 + art-base1:3/3 đạt, gồm icon tải đúng, mua giữ banner/footer, map/gameplay/pause giữ bố cục. Không ghi vào dịch vụ sản phẩm trong các phép thử.

APK `android/app/build/outputs/apk/debug/app-debug.apk`: 34778408bytes (tăng528.208bytes so với APK trước; tổng34,78MB thập phân). SHA256 `386020C6A1BE5CDEB2532A148798DBD971FFE506E660BE6C5622BFC0B2BAA897`. Chữ ký debugv2 hợp lệ, cùng certificate; package `com.memorymatch.adventure`, versionCode1/versionName1.0, min24/target36. Đã đối chiếu hash cả56WebP trong APK với nguồn, kiểm nhãn cong/3hàng kết quả/nút đơn giữa có trong bundle. [Biên nhận](qa/apk-receipt.json). Không có quyền Advertising ID/AdServices trong danh sách quyền của APK.

Commit phaseD `6fba053`, phaseE `f504960`, phaseF `65c6c57`; phaseG lưu fallback hoàn thiện, test/ảnh/QA/receipt. Không stage/ghi đè8PNG app-tabs hoặc `.vscode` của người dùng. Ảnh do test ghi vào QA lịch sử đã phục hồi đúng nội dung cũ; bằng chứng mới ở thư mục này. `git diff --check` đạt.
