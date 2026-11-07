# Memory Match Adventure — JavaScript thuần

Kiến trúc giao diện dùng chung: [`ARCHITECTURE.md`](ARCHITECTURE.md). Trạng thái mới nhất và kế hoạch active, nếu có, được ghi trong [`CONTEXT.md`](CONTEXT.md).

Phiên bản hiển thị trong ứng dụng: **V1.1a**.

Ứng dụng web/PWA dùng HTML, CSS và JavaScript ES modules. Vite phục vụ và build bản web; Capacitor đóng gói bản Android từ cùng mã nguồn khi cần.

## Yêu cầu

- Node.js và npm.

## Cài lại phụ thuộc

Tại thư mục dự án:

Để cài sạch đúng các phiên bản đã khóa trong dự án:

```powershell
npm ci
```

Khi chủ động thay đổi/thêm thư viện, dùng `npm install` để cập nhật cả `node_modules` và `package-lock.json`. Không cần tải hay chép thư viện JavaScript thủ công, và không xoá `public/assets` vì đây là toàn bộ hình ảnh và âm thanh của game.

## Chạy bản web

```powershell
npm run dev
```

Mở địa chỉ Vite hiển thị trong cửa sổ lệnh, mặc định của dự án là `http://localhost:4173`.

Các lệnh kiểm tra:

```powershell
npm run check
npm run build
npm run preview
```

- `check`: kiểm tra cú pháp tất cả module trong `js/`.
- `build`: tạo bản phát hành web trong `dist/`.
- `preview`: chạy thử nội dung đã build.

## Android

Project Capacitor Android được giữ trong `android/`. Sau khi cài Android SDK và đặt `android/local.properties`, dùng:

```powershell
npm run android:apk
```

Lệnh trên tạo APK Debug. Để build Release, cấu hình keystore theo `android/keystore.properties.example`, rồi dùng:

```powershell
npm run android:apk:release
npm run android:aab
```

APK ở `android/app/build/outputs/apk/release/app-release.apk`; AAB ở `android/app/build/outputs/bundle/release/app-release.aab`. Hai lệnh đều build web Android và đồng bộ tài nguyên trước khi đóng gói. APK thử giữ nguyên phiên bản; chỉ cập nhật phiên bản khi tạo AAB đưa Store, với `versionCode` lớn hơn mọi mã đã upload. Không tự upload khi build. Xem `CONTEXT.md` để phân biệt nguồn hiện tại với bản APK/Play đã bàn giao.

Bản Android đã bật banner ở menu/tab và ba màn chơi, video nhận thưởng và quảng cáo chuyển màn theo điều kiện. Áp dụng bảo vệ trẻ em cho mọi người chơi và không cá nhân hóa quảng cáo. Bản web không tải quảng cáo Android. Xem [hướng dẫn thử APK và AdMob](docs/ads/HUONG_DAN_THU_APK.md). Trang quyền riêng tư có trong Cài đặt và tại `public/legal/privacy.html`; build APK không tự deploy website. Biên bản bàn giao ở [Android/Play](ANDROID_RELEASE_RECEIPT.md).

## Cấu trúc

- `index.html`: khung giao diện và entry `/js/main.js`.
- `js/`: các module gameplay, UI, âm thanh, shop và hiệu ứng.
- `js/config.js`: cấu hình gameplay của Memory Match.
- `js/linkConnect/linkConfig.js`: cấu hình gameplay của Link Connect.
- `js/gameplayTuning.js`: giới hạn và thời lượng dùng chung giữa các trò.
- `style.css`: giao diện.
- `public/assets/`: hình ảnh và âm thanh được sao chép nguyên trạng vào bản build.
- `public/assets/images/`: các ảnh giao diện WebP, gồm nền chính, nền lưới, tile và logo.
- `public/assets/images/themes/default/`: kho 1.000 ảnh thẻ WebP 256×256 dùng chung cho mọi level. Khi bổ sung chủ đề, tạo thư mục mới cạnh `default`; không nhân bản ảnh giữa các level.
- Ảnh theme mới dùng tên English `kebab-case.webp` và đặt tại `public/assets/images/themes/<theme-id>/`. Chạy `npm run assets:sync` sau khi thêm/xóa ảnh; game tự lập chỉ mục tệp, không cần cập nhật danh sách filename trong code.
- Hiện không có thư mục `source-assets/`. Khi tạo hoặc xuất lại ảnh, lưu bản nguồn ngoài `public/assets/`; chỉ asset runtime đã chuẩn bị mới được đưa vào bản web.
- `vite.config.js`: cấu hình web JavaScript thuần.

Mỗi game có sáu mode và giữ session độc lập theo mode. `js/gameCatalog.js` là catalog chung cho selector và namespace tiến trình. Xem trạng thái sản phẩm trong `CONTEXT.md`, kiến trúc module trong `ARCHITECTURE.md`, và thiết kế chi tiết trong `Memory Match.md`/`Link Connect.md`/`Triple Connect.md`.

## Tài khoản, xếp hạng và thống kê

Cấu hình Firebase Web app trong .env: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID. Không commit .env. Auth bật Anonymous và Google; Rules/indexes trong repository. Không cần Cloud Functions hoặc nâng billing.

Cloud phân vùng production/beta/test/local theo hostname; có thể override VITE_FIREBASE_ENV. Emulator dùng VITE_FIREBASE_USE_EMULATORS=1 (Auth9199, Firestore8180). Kiểm thử Rules bằng firebase emulators:exec với project demo-memory-match, không ghi dữ liệu kiểm thử vào production.

Analytics chỉ bật production, không chạy trên emulator/beta/test/local. VITE_FIREBASE_ANALYTICS_DISABLED=1 tắt thu thập; VITE_FIREBASE_ANALYTICS_DEBUG=1 đánh dấu debug_mode để kiểm tra DebugView trên bản production thử nghiệm riêng. Không bật debug trên bản phát hành.

Trong Analytics/GA4 xem Active users theo khoảng ngày,7 ngày hoặc30 ngày để theo dõi số người chơi; đây là số tài khoản/trình duyệt được nhận diện, không bảo đảm một người thật một tài khoản. Đăng ký custom metric active_seconds (Seconds) cho event active_play_time, và dimensions game_id/game_mode/level_number để xem tổng thời gian chơi từng trò/chế độ. Thời gian này chỉ gửi khi dừng một đoạn chơi đang hoạt động; menu, tab ẩn và tải màn không tính. Không gửi email, credential, Xu hoặc session vào Analytics.

Trước phát hành: xác nhận measurement ID thuộc đúng web stream, event vào DebugView, cấu hình lọc developer/internal traffic, rồi tắt debug. Xác minh Google OAuth popup trên các miền production/beta/test và Google login trên Android thực. Các phép thử emulator không xác minh popup hosted hoặc dashboard Analytics.

Sao lưu theo sự kiện thắng màn hoặc thay đổi Xu/vật phẩm/trang bị/tên; checkpoint phiên chơi vẫn ở thiết bị. Bản commit lên máy chủ gần nhất được dùng chung, cập nhật profile từ xa khi về menu. Thiết bị offline gửi sau có thể thay bản lưu trước đó theo chính sách này; không cộng gộp tài nguyên.

Auth dùng [Anonymous Authentication](https://firebase.google.com/docs/auth/web/anonymous-auth) và [liên kết Google](https://firebase.google.com/docs/auth/web/account-linking); cloud publish dùng [Firestore transaction](https://firebase.google.com/docs/firestore/manage-data/transactions) để commit toàn bộ manifest cùng revision. SDK offline không thay thế IndexedDB và hàng đợi retry của ứng dụng.
