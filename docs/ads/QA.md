# Kết quả kiểm tra quảng cáo và APK — 16/10/2026

## Đã hoàn tất trong bản mã

Chỉ banner trên trang chủ và bản đồ. Không quảng cáo trong màn chơi, tab chức năng, hộp thoại, khi nhập chữ hoặc khi ứng dụng ở nền. Áp dụng bảo vệ trẻ em cho mọi người chơi, không cá nhân hóa và giới hạn nội dung gia đình. Không đổi tài khoản, định dạng lưu, Xu, vật phẩm, luật chơi hoặc phần thưởng.

Đã chọn plugin AdMob sẵn có thay vì tự viết toàn bộ kết nối quảng cáo. Một bộ quản lý chung tạo/hủy banner theo thứ tự; hai thao tác tạo/hủy trên Android đợi xử lý giao diện xong để tránh banner cũ xóa banner mới. Không dùng chờ theo thời gian để che lỗi chuyển màn.

## Bằng chứng tự động

| Kiểm tra | Kết quả |
|---|---|
| `npm run test:ads` | 15/15 đạt; có khởi tạo đồng thời, từ chối/lỗi quyền riêng tư, mất mạng, không có quảng cáo, callback cũ, đăng ký trễ và 30 chu kỳ |
| Bộ Playwright quảng cáo, điều hướng, bản đồ, Home, HUD và vòng đời | 71/71 đạt |
| Chạy lại bộ quảng cáo sau bản sửa từ review | 9/9 đạt; có mobile412×915, ngang844×390 và desktop1024×900 |
| Bản web đóng gói `production-smoke.spec.js` | 1/1 đạt |
| `npm run check` cuối | Đạt; phép đo Triple Connect p95 14,32ms so với ngưỡng20ms |
| `npm run build` cuối | Đạt |
| `npm run build:android` và `cap sync android` | Đạt trong chuỗi đóng gói APK |
| `gradlew.bat assembleDebug` | Đạt |
| Kiểm tra chữ ký và thông tin APK | Chữ ký debug hợp lệ; package/version đúng; không có quyền Advertising ID/AdServices |

Lần đầu chạy check cùng bộ trình duyệt/khởi động giả lập có Triple p95 41,66ms; lần tiếp theo khi build native vẫn đang chạy là22,04ms. Đã giữ nguyên test/ngưỡng, chạy riêng sau khi tải nặng kết thúc đạt14,95ms rồi chạy toàn bộ check đạt14,32ms. Đây là số đo Node trên máy tính, không phải60FPS hay số đo điện thoại. Lỗi tải thư viện Maven `bad_record_mac` ở lần đóng gói đầu hết khi chạy lại; không tắt kiểm tra chứng chỉ hoặc đổi thư viện để né lỗi.

## Đánh giá độc lập

Reviewer chỉ đọc và chạy test, không sửa file. Đã tìm ra tình huống Home → ẩn → Home trong lúc đăng ký quảng cáo khiến banner chưa được tạo nhưng vẫn giữ hai đăng ký sự kiện. Đã sửa bằng hủy lượt đăng ký cũ, bổ sung test tái hiện. Reviewer chạy lại15/15 và probe riêng: chỉ một banner; khi hủy còn0banner/0đăng ký. Không còn lỗi được tìm thấy trong phạm vi diff đã đọc. Không dùng kết quả reviewer thay cho kiểm tra Android thật.

## APK tạo được

- File: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Dung lượng:34.250.102bytes.
- SHA-256:`84C780C312739EA53335C1414BC34621EA52F495A29E2AD37621AE3BD80D9171`.
- Package:`com.memorymatch.adventure`, versionCode1, versionName1.0; Android tối thiểu24, target36.
- Cài cập nhật vào giả lập thành công, giữ dữ liệu. Chưa cài lên Galaxy S22 Ultra thật.

## Android và AdMob: phần còn đang xác minh

- SDK nhận đúng App ID nhưng trả lỗi: `Publisher misconfiguration: Failed to read publisher's account configuration; no form(s) configured for the input app ID`. Ứng dụng không bỏ qua lỗi để request quảng cáo. Chưa có bằng chứng banner/Test Ad thật.
- Đã đọc đúng app và banner trên tài khoản AdMob sau khi chủ tài khoản đăng nhập; banner dùng đúng ID được cung cấp. Không thêm/xóa/sử dụng các đơn vị quảng cáo khác đang có.
- Đã đặt mức G riêng cho Memory Match trên AdMob; không thay mức chung của tài khoản hoặc ứng dụng khác. Ảnh xác nhận: `qa/admob-family-rating.jpg`.
- Trang quyền riêng tư và tệp xác nhận bên bán quảng cáo đã chuẩn bị, chưa đưa lên website. Thông điệp mới cần được hoàn thiện/xuất bản sau khi có đường dẫn công khai đúng trò chơi. Không coi thông điệp của ứng dụng khác là đã áp dụng cho ứng dụng này.
- Android giả lập Medium Phone dùng ảnh Android37 và bộ giả lập36.3.10 có cảnh báo tương thích. Sau tạm dừng/tiếp tục xuất hiện hộp thoại **System UI isn't responding**; đọc WebView được nhưng thao tác kiểm thử chưa hoàn tất. Đã chọn Wait và đang thử khởi động nguội bằng đồ họa máy tính; không xóa dữ liệu hay sửa game để né lỗi môi trường. Ảnh lỗi ở `qa/android-system-dialog.png`.
- Có log khởi tạo safe-area của Capacitor báo document chưa sẵn sàng; chưa dùng môi trường này để kết luận inset/hiệu suất trên điện thoại thật. Đăng nhập Google, liên kết tài khoản, quảng cáo thật và tốc độ trên S22 Ultra vẫn chưa xác minh.

## Nội dung và ảnh

Đã mở ảnh kiểm tra bố cục dọc/ngang và trang quyền riêng tư. Các ảnh `banner-mock-*` là mô phỏng vùng quảng cáo qua bài test trình duyệt, **không phải quảng cáo từ Google**. `privacy-412.png` là trang công khai được chuẩn bị; `privacy-settings-412.png` là nội dung trong Cài đặt. Không dùng thuật ngữ lập trình trong nội dung giải thích cho người chơi.

Skill làm rõ yêu cầu dùng để chốt banner/package và cách bảo vệ trẻ em. Computer Use dùng để kiểm tra tài khoản AdMob và giới hạn nội dung. Không dùng imagegen hoặc thay mỹ thuật của trò chơi trong task này.
