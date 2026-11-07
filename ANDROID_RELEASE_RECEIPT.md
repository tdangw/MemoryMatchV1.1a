# Bàn giao Android và Google Play — 07/11/2026

Đây là biên bản tại thời điểm bàn giao, không phải kế hoạch đang thực hiện. Trạng thái nguồn mới nhất và các việc còn chờ nằm trong `CONTEXT.md`. Các kế hoạch tài khoản, Android, quảng cáo và Play đã đóng được hợp nhất vào đây rồi xóa theo yêu cầu chủ dự án.

## APK đã giao

- Tệp: `runtime/releases/MemoryMatchAdventure-1.1a.2-ads-profile-test.apk`.
- Package `com.memorymatch.adventure`, versionName `1.1a.2`, versionCode `2`.
- Dung lượng 43.411.501 byte; SHA256 `0b328ad726e3b3f6c41c2a569192b8f97998538410a60add8900abd6d1a0e2c7`.
- Release ký upload key hiện có; APK Signature Scheme v2 hợp lệ. Chứng thư SHA256 `075e8a00b65712a6b1faa9309c75f1d21295ecb176f95cfd76e33120a6382a92`.
- R8/minify và shrinkResources bật; web build production; WebView debugging/mixed content tắt. Không chứa khóa ký riêng hay cấu hình bí mật trong APK. Toàn bộ 3.229 public assets khớp nguồn đóng gói.
- Nguồn chốt ở commit `957fe2c` cộng thay đổi tài khoản/quảng cáo/Android trong snapshot `runtime/ads-profile-frozen`. Snapshot không phải checkout hiện hành để triển khai tính năng mới.
- Những thay đổi sau mốc chốt: mục tiêu nhiệm vụ không Gợi ý 3 ván, tinh chỉnh nhiệm vụ/chữ/kim quay và bảng quà test bốn nhóm **chưa nằm trong APK này**. Web test cũng được phát hành từ nguồn chốt này, không đồng nghĩa đã có các thay đổi mới.
- APK trước `MemoryMatchAdventure-1.1a.2-2.apk` và bản ứng viên trong `runtime/candidates` đã bị thay thế, không dùng làm bản bàn giao mới nhất. Không xóa/ghi đè các tệp đó trong lượt dọn tài liệu.

## Hành vi đã bàn giao

- Hồ sơ: nhóm nút theo cột, có liên kết/đổi Google, Đăng xuất và Xóa tài khoản; khách không hiện Đăng xuất.
- Xóa/reset: chọn đáp án → xác nhận phạm vi → 10 giây có thể hủy. Thời gian chờ chỉ chạy foreground; cancel/destroy hủy timer/animation. Guard UID ngăn xóa nhầm khi đổi tài khoản.
- Reset xóa tiến trình cả ba trò, Xu/vật phẩm/thống kê/thứ hạng, giữ UID/tên/đăng nhập. Xóa tài khoản xóa dữ liệu trực tuyến và thiết bị rồi xóa Firebase Auth. Journal cho phép tiếp tục khi gián đoạn, khóa writer cũ để không tải ngược dữ liệu đã xóa. `accountOperations/{uid}` giữ marker an toàn tối thiểu, không tuyên bố xóa mọi dấu vết.
- Đăng xuất đợi lưu trực tuyến thành công, giữ tiến trình tài khoản Google và tạo khách sạch; chưa thêm email/password.
- Banner có ở menu/tab và bàn chơi Android; ẩn khi nền/bàn phím/popup nhạy cảm. Rewarded chỉ cấp sau earned, tối đa 10 lượt/ngày, có journal chống cấp trùng và phục hồi mất mạng. Interstitial chỉ ở Chơi tiếp khi đã sẵn sàng, cách ít nhất 3 màn và 120 giây, không chặn điều hướng nếu không có quảng cáo.
- Khóa trình bày chung ngăn video/toàn màn hình chồng nhau; banner/âm thanh/nền tạm dừng và phục hồi theo owner. RewardedBridgePlugin kết thúc cả khi đóng video sớm; callback earned trễ vẫn được ghi nhận đúng một lần.
- Launcher giữ trọn icon; Home có nút thoát, Android Back hỏi thoát ở Home; nền tạm dừng các owner liên quan; màn thắng Android có pháo hoa/confetti. Capacitor Android/core đã nâng 8.5.1. Không coi kiểm tra phụ thuộc là chứng nhận bảo mật tuyệt đối.

## Bằng chứng ở nguồn chốt

- `npm run check`: đạt, 259 module; sau bổ sung thư mục theme rỗng đã sinh lại manifest 2.472 ảnh/26 thư mục và kiểm tra theme đạt.
- 37 unit ads/liveops; 29 UI Hồ sơ/xóa/reset/Cài đặt/Nhiệm vụ; 12 UI account/logout/ads với Firebase cục bộ; 1 smoke từ tài nguyên Android: đạt. 16 ca banner/victory regression đã đạt ở lượt trước.
- Các ca gồm no-fill, đóng sớm/earned, thưởng một lần sau reload, mất mạng/phục hồi, rời owner, đổi UID, cancel/retry, pause nền, reduced-motion, 30 chu kỳ cleanup và viewport 320/412/844/1024.
- Build web, Android sync, assembleRelease đạt; Gradle cuối 4 phút 08 giây. Rà soát diff không có lỗi whitespace. Chưa kiểm AdMob/Google login/hao pin/FPS trên điện thoại thật.
- Tại lúc bàn giao: ruleset `022eaaad-e6a0-494e-bc35-48dbe72e7456`, canonical SHA256 `673057c570f3163fb180d2f61f4fcf090bc545d4d58efaab56d4f94357b3c7e2` đọc lại khớp snapshot. Đây là chứng cứ lịch sử; các lượt nhiệm vụ/quà test sau đó đã phát hành rules mới, không dùng hash này làm trạng thái live hiện tại.
- Hosting test `https://memorymatch-test.web.app` và ba trang `/legal/privacy.html`, `/legal/terms.html`, `/legal/delete-account.html` HTTP200 khớp nguồn chốt; nhãn V1.1a.2. Không phát hành production Hosting.
- Receipt/log giữ trong `runtime/fullscreen-ads-apk-validation.json`, `fullscreen-ads-freeze.json`, `fullscreen-ads-live-final.json`, `fullscreen-ads-hosting-verify.json`, `fullscreen-ads-web-version.json` và nhóm `fullscreen-ads-frozen-*.log`. Không đưa log/QA/snapshot/khóa riêng vào bundle hoặc commit.

## Google Play và AdMob tại lần kiểm tra gần nhất

- Play app ID `4972941294159300289`, developer `7753783515538090671`. Bản nội bộ đang được xác nhận ngày 07/11 là **1.1a (1)**, phát hành 06/11/2026 lúc 20:55 giờ Việt Nam; không phải APK 1.1a.2 ở trên.
- AAB đã upload: `runtime/releases/MemoryMatchAdventure-1.1a-1.aab`, SHA256 `a299c52250cd50da52ead73f73da6360e9369e70dbc5ebe988fa44a5b1d4e70f`.
- Link thử: https://play.google.com/apps/internaltest/4701301147015043710. Ba tester đã chỉ định: hungquocvo6868@gmail.com, tdangw@gmail.com, utmai5959@gmail.com. Không tự gửi thư mời.
- Đã lưu listing tiếng Việt, icon, ảnh bìa ba trò, hai ảnh Home/map, URL quyền riêng tư, Có quảng cáo và Không dùng Advertising ID; chưa đồng nghĩa đã xét duyệt. Tệp nguồn listing/ảnh ở `design/google-play/`.
- Sáu dấu vân tay SHA1/SHA256 của ba chứng thư Play đã đăng ký và đọc lại trong Firebase Android app; chi tiết `runtime/play-certificates/fingerprints.json`. APK upload key khác chứng thư Play App Signing; cài khác chữ ký có thể cần gỡ, chỉ gỡ sau khi chắc chắn dữ liệu cần giữ đã đồng bộ Google.
- AdMob do `flappycyberpunk@gmail.com` quản lý, publisher `pub-2780380420199964`. App `~5572977569`, banner `/4149796201`, rewarded `/3309776306`, interstitial `/4262880842`. Cấu hình bảo vệ trẻ em cho mọi người chơi, không cá nhân hóa, mức nội dung G; loại AD_ID/AdServices khỏi manifest.
- Tại lần kiểm tra Console: app bị hạn chế vì chưa liên kết cửa hàng/chưa phê duyệt; Policy Center không báo vấn đề, thông điệp EU còn nháp, chưa xác minh app-ads.txt cho riêng Memory Match. Không suy ra trạng thái Console hiện tại từ bản ghi này.
- Chỉ Firebase Spark, không Functions/SSV/Blaze/Scheduler. Chủ dự án chấp nhận quà thật dựa vào xác nhận client và giới hạn chống gian lận đó.

## Phần chủ dự án để lại

- Chờ thử điện thoại và xác nhận riêng trước AAB/upload Play mới. APK test không tăng phiên bản; AAB cho Store mới cập nhật phiên bản, versionCode lớn hơn mọi mã đã upload.
- Quyền truy cập reviewer/tài khoản Google, biểu mẫu đối tượng dưới 13 tuổi, Data Safety, phân loại nội dung và điều kiện phát hành công khai chưa hoàn tất. Quyết định bao gồm trẻ dưới 13 đã chốt, không hỏi lại.
- Quyền đối với nhân vật Pokémon chưa có tài liệu kiểm chứng; chủ dự án yêu cầu tiếp tục nội bộ và bổ sung bộ khác sau nếu cần. Không tuyên bố đã có license hoặc tự kết luận vi phạm.
- Cấu hình quà tặng 10 giây/bảng test cần chủ dự án chốt lại trước kết thúc test; không tự trả về 60 phút hoặc bảng cũ.
