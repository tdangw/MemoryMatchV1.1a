# Kết quả kiểm tra quảng cáo và APK — 16/10/2026

## Cập nhật17/10 — đang triển khai

Chủ dự án chốt web có khung ở mọi tab và gameplay3trò; Android thật mở mọi tab, gameplay native vẫn tắt. PhaseA: shared shell reserve58px, layoutfit trừ cùng58px, long board cuộn tới nội dung cuối trên fixed banner; scope chịu trách nhiệm tạo/hủy slot, không chèn nhánh game trong runtime. Các giới hạn placement ngày16/10 bên dưới là lịch sử, đã được thay bởi phạm vi mới này.

- Native boundary9/9, web4/4 đạt. Matrixgeometry/layout/lifecycle/cleanup chạy đủ121ca:120đạt,1ca khay Triple mobile đọc khay rỗng khi click chưasettle. Test vốn chờ1RAF, đã đổi sang run.whenIdle(), giữ nguyên các assertion; chạy lại ca này desktop/mobile/landscape3/3 đạt. Không sửa luật/renderer để né lỗi.
- Test30restart chia đều3trò đạt: luôn1slot, ownercũ hếtresource, về menu không còn gameplay slot.
- Hoạt ảnh mới chọn cả3hướng: thẻ ghép đôi → đom đóm/hoa → nhân vật chạy,6s/cảnh. Chưa dùng artwork để báo nghiệm thu trước khi nối/chạy gateB/C.

## Đã hoàn tất trong bản mã

Banner hiện hành trên trang chủ, bản đồ, Cửa hàng và Bộ sưu tập theo phản hồi mới. Không quảng cáo trong màn chơi, hồ sơ/cài đặt/xếp hạng, mục chưa có nội dung, hộp thoại, khi nhập chữ hoặc khi ứng dụng ở nền. Áp dụng bảo vệ trẻ em cho mọi người chơi, không cá nhân hóa và giới hạn nội dung gia đình. Không đổi tài khoản, định dạng lưu, Xu, vật phẩm, luật chơi hoặc phần thưởng.

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
- Dung lượng bản cập nhật bố cục:34.250.105bytes.
- SHA-256:`D04C1B22E5FC33187B6F5222433035DFCE4BDC4FCC0F04711A7EEFA43D0DCFD7`.
- Package:`com.memorymatch.adventure`, versionCode1, versionName1.0; Android tối thiểu24, target36.
- Bản trước cài cập nhật vào giả lập thành công, giữ dữ liệu. Bản cập nhật bố cục mới đã build/sync/assembleDebug và kiểm chữ ký/package, chưa cài lại trên thiết bị; chưa cài lên Galaxy S22 Ultra thật. Chữ ký debug giữ nguyên để cập nhật không đổi danh tính.

## Android và AdMob: phần còn đang xác minh

- SDK nhận đúng App ID nhưng trả lỗi: `Publisher misconfiguration: Failed to read publisher's account configuration; no form(s) configured for the input app ID`. Ứng dụng không bỏ qua lỗi để request quảng cáo. Chưa có bằng chứng banner/Test Ad thật.
- Đã đọc đúng app và banner trên tài khoản AdMob sau khi chủ tài khoản đăng nhập; banner dùng đúng ID được cung cấp. Không thêm/xóa/sử dụng các đơn vị quảng cáo khác đang có.
- Đã đặt mức G riêng cho Memory Match trên AdMob; không thay mức chung của tài khoản hoặc ứng dụng khác. Ảnh xác nhận: `qa/admob-family-rating.jpg`.
- Đã lưu và mở lại xác nhận bản nháp **Quyền riêng tư · Memory Match Adventure**, chỉ chọn Memory Match, trạng thái Bản nháp/Publish tắt. URL dự kiến đã lưu: `https://memorymatchv1-1a.web.app/legal/privacy.html`. Bật lựa chọn không đồng ý cho mọi khu vực của thông điệp; giữ đồng ý/quản lý lựa chọn. Ngôn ngữ tiếng Anh: danh sách được Google cung cấp không có tiếng Việt. Đây là mẫu dự phòng của Google; app vẫn luôn gửi cờ dưới tuổi đồng ý, không ép hiện form. Ảnh `qa/admob-memory-draft.jpg`.
- Trang quyền riêng tư và tệp xác nhận bên bán quảng cáo đã chuẩn bị, chưa đưa lên website. Kiểm tra đường dẫn công khai bằng trình duyệt vẫn hiện **Chọn trò chơi**, nên không xuất bản thông điệp với trang chưa đúng. Người dùng chọn **Chỉ chuẩn bị, tôi sẽ tự xuất bản** ngày16/10; không deploy hoặc bật Publish. Checklist thao tác cụ thể ở `HUONG_DAN_THU_APK.md`. Không thay thông điệp đang xuất bản của ứng dụng khác.
- Android giả lập Medium Phone dùng ảnh Android37 và bộ giả lập36.3.10 có cảnh báo tương thích. Sau tạm dừng/tiếp tục xuất hiện hộp thoại **System UI isn't responding**; đọc WebView được nhưng thao tác kiểm thử chưa hoàn tất. Đã chọn Wait rồi khởi động nguội bằng đồ họa máy tính; tiến trình sau đó thoát, danh sách ADB không còn thiết bị. Không xóa dữ liệu hay sửa game để né lỗi môi trường. Ảnh lỗi ở `qa/android-system-dialog.png`. Không có điện thoại thật kết nối; phase5 chưa đạt.
- Có log khởi tạo safe-area của Capacitor báo document chưa sẵn sàng; chưa dùng môi trường này để kết luận inset/hiệu suất trên điện thoại thật. Đăng nhập Google, liên kết tài khoản, quảng cáo thật và tốc độ trên S22 Ultra vẫn chưa xác minh.

## Nội dung và ảnh

### Điều chỉnh theo phản hồi về bố cục và câu chữ

Phiên bản hiện hành chỉ ghi **Quảng cáo**, bỏ viền nét đứt. Web dùng vùng50px + khoảng tách8px, tổng58px thay88px trước đó (giảm30px); Android giữ chiều cao thực tế do SDK trả về và dùng cùng gap8px. Web là diện tích đại diện để xem UI, không khẳng định pixel-perfect với mọi creative adaptive. Đã đối chiếu [khuyến nghị tách banner khỏi vùng tương tác](https://support.google.com/admob/answer/6275335?hl=en-GB); không coi8px là chứng nhận tuân thủ hoặc một ngưỡng do Google quy định.

Chủ dự án giao đề xuất vị trí; chọn Home/map/shop/collection. Không gameplay/modal/profile/settings/ranking hoặc các mục Sắp ra mắt. Nguyên nhân thiếu banner shop/collection là screen content dùng chung openAppModal đã suspend như overlay; sửa theo presentation, overlay thật vẫn chặn. Root và screen có slot riêng, cleanup so identity, không trộn owner. Không đổi save/schema/API/Auth/luật chơi.

Quy định câu chữ đã lưu trong `AGENTS.md` mục9: giao diện/ảnh/tài liệu người chơi dùng ngôn ngữ sản phẩm, tuyệt đối không chèn thuật ngữ triển khai; vùng thay thế vẫn trình bày như sản phẩm hoàn chỉnh. Báo cáo kỹ thuật này giữ chẩn đoán riêng cho chủ dự án. Skill làm rõ yêu cầu dùng để chốt chủ dự án giao quyền đề xuất placement, không tự đoán mở rộng vào gameplay.

- Native boundary regression9/9 đạt; web reviewer độc lập4/4 đạt: ba viewport, modal lồng trên shop,30menu cycles +30tab transitions, background/focus/resize/dispose. Finding suspend screen đã xử lý, không finding mở.
- Run đầu8/13 đạt, bắt đúng lỗi screen suspend. Sau sửa12/13 đạt, ca còn lại là test locator trùng dock hidden/visible. Đã scope locator vào dock đang hiển thị, giữ nguyên assertions; reviewer chạy lại4/4 đạt.
- Đã mở ảnh Home/shop/collection412 và dọc/ngang: nhãn đúng, khoảng gọn, thanh nút không chồng banner; ảnh hiện hành `qa/web-preview-*`, `qa/web-shop-412.png`, `qa/web-collection-412.png`.
- Shop/inventory và HUD/modal regression9/9 đạt (gồm mua vật phẩm, reload dữ liệu,20chu kỳ mỗi trò). `npm run check` đạt, unit15/15, Triple p95 14,27ms; `npm run android:apk` và `npm run build` đạt. APK cập nhật có receipt ở mục APK; không dùng build thành công thay bằng chứng quảng cáo thật.
- Production smoke mới1/1 đạt: nhãn Quảng cáo, Home/map/shop/collection và modal/profile trên bản đã đóng gói; không ghi dịch vụ thật. Không deploy website hoặc xuất bản thông điệp AdMob.

### Bản web đầu tiên — đã được điều chỉnh theo phản hồi bên dưới

Theo yêu cầu tiếp theo ngày16/10, bản web có vùng **Quảng cáo mô phỏng** tĩnh ở Home/map, dùng cùng quy tắc chuyển màn và chặn quảng cáo như Android. Chiều cao đại diện60px, cách dock28px; không mô phỏng nội dung/quảng cáo Google hoặc tự cấp thưởng. Không đổi API lưu/schema/tài khoản/luật chơi. Controller web sở hữu duy nhất một node, hủy ngay khi đổi target/dispose; không thêm listener/timer/animation riêng. Phương án dùng SDK giả đã loại vì có thể nhầm trạng thái quyền riêng tư và tải quảng cáo; phần hiển thị riêng dùng lại lifecycle chung giữ service web unsupported.

- Bộ quảng cáo native mô phỏng chạy lại:9/9 đạt. Test chọn trò qua nút chọn trước khi mở, tương thích carousel đang chỉnh song song.
- Reviewer đọc diff và chạy độc lập bộ web mới:4/4 đạt ở412×915,844×390,1024×900; tab/màn chơi ba game, mở/đóng level modal, resize, pagehide/pageshow, nhập chữ và30chu kỳ đều đạt; dispose lặp không giữ node. Không finding còn mở.
- Lần chạy review đầu2/4 đạt, hai ca mobile thất bại vì test bấm thẻ bên cạnh trước khi chọn trò. Đã sửa thao tác test theo hành vi chọn rồi mở, giữ nguyên code carousel, chạy lại4/4 đạt. Không nới assertion/ngưỡng để bỏ qua lỗi.
- Đã mở ảnh `qa/web-preview-412.png` và `qa/web-preview-844.png`: nhãn mô phỏng rõ, không chồng dock/controls; ảnh desktop ở `qa/web-preview-1024.png`. Các ảnh này không phải quảng cáo thật.
- Không deploy website, không xuất bản thông điệp AdMob hoặc thay bản APK đã bàn giao trong phần bổ sung web này.
- Cổng cuối: `npm run check` đạt (unit quảng cáo15/15, Triple p95 15,44ms); `npm run build:android` và `npm run build` đạt. Smoke bản web đã đóng gói1/1 đạt, gồm banner Home/map và ẩn khi mở preview/profile. Build Android chỉ kiểm tra đóng gói phần dùng chung, không tạo lại APK hoặc xác nhận quảng cáo thật.

Đã mở ảnh kiểm tra bố cục dọc/ngang và trang quyền riêng tư. Các ảnh `banner-mock-*` là mô phỏng vùng quảng cáo qua bài test trình duyệt, **không phải quảng cáo từ Google**. `privacy-412.png` là trang công khai được chuẩn bị; `privacy-settings-412.png` là nội dung trong Cài đặt. Không dùng thuật ngữ lập trình trong nội dung giải thích cho người chơi.

Skill làm rõ yêu cầu dùng để chốt banner/package và cách bảo vệ trẻ em. Computer Use dùng để kiểm tra tài khoản AdMob và giới hạn nội dung. Không dùng imagegen hoặc thay mỹ thuật của trò chơi trong task này.
