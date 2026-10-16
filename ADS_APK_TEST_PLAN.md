# Kế hoạch quảng cáo Android và APK test

Ngày khảo sát: 2026-10-15. Người dùng giao triển khai ngày 2026-10-16, commit từng phase. **Kế hoạch triển khai đang thực hiện.** Giao diện carousel và tab Sự kiện đã bàn giao; kiểm tra ban đầu chỉ có tài liệu kế hoạch quảng cáo chưa commit, không có thay đổi code của task khác.

## Theo dõi thực hiện

- Bổ sung theo yêu cầu ngày16/10 sau bàn giao APK: web hiển thị banner mô phỏng tĩnh Home/map, cùng quy tắc chặn của Android và vùng60px + khoảng cách28px. Không gọi Google/consent hoặc cấp thưởng trên web, không deploy. Chọn controller hiển thị riêng dùng chung navigation/lifecycle thay vì tạo SDK giả; giữ service web unsupported và đường native hiện có. Acceptance: một banner tối đa, đúng vùng/màn, ẩn modal/tab/gameplay/nền/nhập chữ, cleanup qua30chu kỳ; layout dọc/ngang/desktop, regression native, check/build và review độc lập.
- Bổ sung web đã hoàn tất: web review độc lập4/4, native regression9/9, production smoke1/1, check/unit15/15, build web/Android đạt. Đã mở ảnh dọc/ngang kiểm tra dock/controls; không finding mở, không thay APK hoặc deploy. Task kiểm tra quảng cáo thật phase5 vẫn giữ trạng thái chờ người dùng xuất bản và kết nối máy.

- Phase 0: đã nhận App ID `ca-app-pub-2780380420199964~5572977569`, banner unit `ca-app-pub-2780380420199964/4149796201`; giữ package, chỉ banner Home/map. Tham khảo thông tin quyền riêng tư của sản phẩm cùng chủ sở hữu nhưng viết lại theo dữ liệu thực tế của trò chơi này, không sao chép tính năng không có. Câu chữ cho người chơi dùng tiếng Việt dễ hiểu.
- Phase 1 hoàn tất: đã cài/pin AdMob8.2.1/App8.1.2; cấu hình hai ID thật, bảo vệ trẻ em cho mọi người chơi, không cá nhân hóa, mức nội dung gia đình. Bảy kiểm thử service, Android build/sync và `:app:compileDebugJavaWithJavac` đã đạt. Hai thao tác tạo/hủy banner được chuyển qua cầu nối nhỏ trên luồng giao diện Android: plugin gốc trả promise remove trước lúc view thực sự bị hủy; chỉ xếp hàng JS không đủ chặn race này. Không chỉnh node_modules. Gỡ quyền Advertising ID/AdServices khỏi bản hợp nhất và chặn đo quảng cáo trước initialize; cần kiểm chứng manifest đóng gói cuối.
- Phase 2 hoàn tất: một banner owner, thao tác native tuần tự, gỡ khi đổi tab/gameplay/modal/nhập chữ/nền; chiều cao theo sự kiện và cách dock28px. Home ngang co thẻ trong phạm vi banner để các nút chuyển trò không bị dock che. Trang quyền riêng tư dùng một nguồn cho bản trong trò chơi và trang website; nội dung dễ hiểu, không sao chép tính năng khác. Tệp app-ads.txt sẵn có cho lần đưa website sau, chưa deploy. Unit14/14, UI9/9 qua adapter mô phỏng đạt, gồm30chu kỳ và restart ba game; đây chưa phải bằng chứng quảng cáo native thật.
- Phase 3 hoàn tất: xác nhận luồng ứng dụng chỉ gọi banner; không có API thưởng/video/toàn màn hình hoặc mock thưởng trong service. Kiểm thử web xác nhận không tải native adapter. Gate3 dành cho quảng cáo bổ sung đã loại khỏi phạm vi như lựa chọn người dùng; không thêm đếm màn, phần thưởng hay thay save.
- Phase 4 hoàn tất: check đầy đủ đạt (Triple p95 14,32ms, không đổi ngưỡng20ms); unit15/15; bộ trình duyệt71/71; chạy lại quảng cáo sau sửa race9/9; bản web đã build và smoke1/1; bản Android build/sync/assembleDebug đạt. APK34.250.102bytes, package/version đúng, chữ ký debug hợp lệ, không có quyền Advertising ID/AdServices trong APK. Reviewer độc lập tái hiện/sửa/xác minh race Home→ẩn→Home, chạy lại15test và probe riêng: một banner, dispose về0banner/0listener; không còn finding mở.
- Phase 5: đã cài/mở APK giả lập và xác nhận đúng App ID; Google chặn request vì app chưa có form. Đã đặt G riêng trong AdMob, lưu bản nháp **Quyền riêng tư · Memory Match Adventure** chỉ chọn Memory Match và URL dự kiến. Website hiện vẫn trả trang chọn trò chơi ở URL quyền riêng tư. Người dùng chọn tự xuất bản website/thông điệp ngày16/10; agent không deploy/bật Publish. Đã hoàn tất chuẩn bị và checklist bàn giao; nghiệm thu quảng cáo thật/S22 Ultra/Auth/hiệu suất còn chờ xuất bản và thiết bị. Giả lập không ổn định sau System UI ANR và thử khởi động nguội; không dùng kết quả đó để chứng nhận native QA. Bằng chứng `docs/ads/QA.md`.

Người dùng xác nhận có trẻ em dưới13tuổi và chọn bảo vệ trẻ em cho tất cả người chơi, không hỏi tuổi. Cấu hình quảng cáo áp dụng lựa chọn này cho mọi request; đây không phải xác nhận phát hành Play hay hoàn tất mọi yêu cầu đối với ứng dụng trẻ em. Không đổi tài khoản hay phát hành website chỉ để tạo bản APK thử.

## 1. Mục tiêu, phạm vi và quyết định

- Chuẩn bị APK Android dùng **AdMob App ID và ad unit thật của chính ứng dụng**, thử trên điện thoại đã đăng ký test device trong AdMob theo xác nhận người dùng. Không mặc định dùng ID demo hay ép toàn bộ người dùng thành test device.
- Người dùng đã chốt giữ Android package `com.memorymatch.adventure`; tên: Memory Match Adventure. Người dùng xác nhận chưa tạo app AdMob cho Memory Match. Không đổi package hoặc lấy ID của ứng dụng khác.
- Phạm vi APK đầu tiên đã chốt: adaptive banner ở Home/bản đồ theo contract hiện có. Không hiển thị trong gameplay hoặc năm tab chức năng. Vị trí thực tế hiện tại là dưới dock trong footer; không tự chuyển sang phía trên hoặc chèn vào thẻ trò chơi.
- Video thưởng và interstitial làm sau, ngoài phạm vi APK đầu tiên. Không tự áp cadence/phần thưởng của sản phẩm khác vào economy hiện tại.
- Không đổi save/API/catalog/luật game/ranking, không tự deploy Hosting, không tạo tài khoản/quảng cáo trong console hoặc phát hành Play trong lượt lập kế hoạch.
- Hoàn thành lượt lập kế hoạch: có inventory, lựa chọn kỹ thuật, ranh giới owner, gate kiểm thử, checklist người dùng và các quyết định còn thiếu. Các gate bên dưới là công việc triển khai tương lai, chưa có bằng chứng pass.

**Đã chốt:** chỉ banner Home/map, giữ package, hai ID thật đã được cung cấp. Có trẻ em dưới13tuổi; áp dụng bảo vệ trẻ em cho mọi người chơi, không hỏi tuổi, không cá nhân hóa và chỉ nội dung gia đình. Việc xác nhận thông điệp trong tài khoản AdMob và thử trên điện thoại vẫn cần bằng chứng riêng. Các quyết định video thưởng/interstitial chỉ cần ở task sau, không chặn banner hoặc trở thành gate của APK đầu tiên.

## 2. Bằng chứng ban đầu, trước triển khai (2026-10-15)

| Hạng mục | Đã kiểm tra | Ý nghĩa |
|---|---|---|
| Capacitor | Lockfile core/android/cli đều 8.5.0 | Có nền Android sẵn; chưa có `@capacitor-community/admob` hoặc `@capacitor/app` |
| Android identity | Config/Gradle: `com.memorymatch.adventure`, versionCode 1, versionName 1.0 | Giữ đồng bộ nếu được duyệt; không đổi chỉ để khớp tên Firebase |
| Native config | Manifest có INTERNET, chưa có AdMob APPLICATION_ID | Cần metadata trỏ tới resource App ID đúng ứng dụng |
| Banner shell | `js/appNavigation.js`: `createFooter`, `.adventure-ad-slot`, `data-ad-placement="menu"` | Placeholder chung cho Home/map, chưa phải quảng cáo thực |
| Layout | `styles/adventure.css`: slot 60px + safe area, compact 40px + safe area | Kích thước này không chứng minh đủ cho adaptive banner thực tế |
| Page ownership | `js/appPageLifecycle.js`, `js/gameShell/gameShellLifecycle.js` | Có scope/cleanup; tab chức năng chỉ ẩn root cũ, không dispose page ngay |
| Build | Có `build:android`, `android:sync`, `android:apk`, `android:apk:release` | Giữ pipeline hiện có; Android build dùng mode android và bước prepare dist riêng |
| Máy build | Java 21.0.11; local.properties trỏ SDK; API 36/build-tools 36.0.0 tồn tại | Chưa cần yêu cầu cài lại Java/Android Studio. Chưa build native trong lượt này |
| Thiết bị | ADB gọi được qua đường dẫn SDK, không có trong PATH; lần thử báo không khởi động được daemon | Chưa xác minh kết nối điện thoại. Đây không phải bằng chứng điện thoại chưa bật USB debugging |
| Signing | Có đọc cấu hình release và file example; chưa có `android/keystore.properties` | Debug APK không cần release key; release cài được cần chữ ký thật |
| Ignore signing | Comment yêu cầu không commit key nhưng ignore chưa bao phủ keystore.properties/JKS | Bổ sung ignore trước khi tạo/copy thông tin ký; không ghi mật khẩu vào tài liệu |
| Auth | `js/accountService.js` dùng Firebase Web popup/linkWithPopup | Phải thử Google login/link guest/cancel trong APK; không suy từ browser pass |
| Privacy/seller | Chưa có `public/legal` hoặc `public/app-ads.txt` | Cần chuẩn bị nội dung/URL phù hợp; không tự dùng URL của ứng dụng khác |

Không đọc/ghi console AdMob trong khảo sát; trạng thái test device là thông tin người dùng cung cấp, chưa kiểm chứng bằng ad request của ứng dụng này. Không đọc nội dung file .env hay keystore bí mật.

## 3. Phương án kỹ thuật

| Phương án | Ưu điểm | Chi phí/rủi ro | Kết luận |
|---|---|---|---|
| Community AdMob plugin + service JS nhỏ do ứng dụng sở hữu | Có banner/UMP/events; phù hợp nền Capacitor; mock được boundary | Vẫn phải xử lý async navigation, native lifecycle và pin dependency | **Đề xuất** |
| Tự viết Capacitor bridge Java/Kotlin với Google Mobile Ads/UMP | Chủ động toàn bộ native API | Tự bảo trì consent/listener/activity/layout; tăng bề mặt lỗi và QA | Chưa có nhu cầu buộc phải chọn |

Tài liệu upstream hiện hướng tới plugin 8.2.0 với Capacitor >=8.5 trong nhánh 8. Dự án đáp ứng version Capacitor trên lockfile, nhưng phải xác minh package thực tế/peer dependency/release notes khi cài; pin bản được duyệt và commit lockfile. Không hạ Capacitor hoặc chép dependency cũ theo thói quen. Kiểm tra dependency native được resolve, tránh version động làm build không tái lập.

Với banner, chọn một owner cấp ứng dụng lưu **desired placement/visibility** và một hàng thao tác native tuần tự. Không giao riêng từng page gọi show/remove tùy ý: callback show cũ có thể hoàn thành sau khi page đã đóng, hoặc cleanup cũ xóa banner của page mới. State hữu hạn như unsupported/waiting-consent/ready/loading/visible/suspended/error có transition rõ; desired target + generation token chặn kết quả cũ. Không thêm các cờ rời rạc hoặc polling liên tục.

## 4. Ownership và contract đề xuất

Tên module mới là đề xuất, điều chỉnh theo code sau khi giao diện hoàn tất:

- `js/ads/adConfig.js`: đọc/validate cấu hình Android; App ID và unit ID có định dạng khác nhau (`~` và `/`). Thiếu/sai ID thì không request, có chẩn đoán rõ; không fallback sang ID ứng dụng khác.
- `js/ads/adService.js`: boundary native Android, UMP, init dùng chung một promise đang chạy, kết quả/error có kiểu rõ, retry hữu hạn theo sự kiện. Không khóa vĩnh viễn bởi một promise thất bại/offline; không tự retry theo frame/timer vô hạn.
- `js/ads/bannerController.js`: một native banner tối đa; ownership của native listeners, desired target, generation và layout bridge. Cleanup idempotent, xử lý listener đăng ký xong sau dispose, không removeAllListeners ảnh hưởng owner khác.
- `js/appNavigation.js`: chỉ báo eligibility từ navigation thật. Home/map visible => eligible; tab chức năng dù root cũ còn trong DOM => ineligible; gameplay/modal che vùng quảng cáo/app background/keyboard => policy hide phù hợp. Không suy eligibility chỉ từ việc slot còn tồn tại.
- `js/settings.js`: nút quyền riêng tư quảng cáo khi UMP yêu cầu, có đường cập nhật consent và reconcile banner sau thay đổi. Tích hợp sau khi owner giao diện bàn giao.
- `styles/adventure.css`: giữ một owner cho slot; dùng chiều cao native thực tế và safe area, khoảng cách ngăn bấm nhầm với dock. Kiểm chứng đơn vị height ở plugin được chọn, không mặc định pixel native bằng CSS pixel. Không hard clamp làm cắt quảng cáo.
- Native foreground/background cần một subscription cấp app (ví dụ `@capacitor/app`), dispose rõ. Không chỉ dựa visibilitychange của trình duyệt để tuyên bố Android background đã xử lý.
- Web/PWA: không request native ads và không tự trả reward thành công. Mock thành công chỉ ở test harness rõ ràng nếu sau này có rewarded. Giữ hành vi web hiện có.

Luồng privacy theo tài liệu hiện tại: cập nhật consent mỗi lần khởi động; hiển thị form khi cần; chỉ khi `canRequestAds` mới initialize SDK một lần và load quảng cáo. Consent lỗi/không được request hoặc no-fill không chặn mở Home/chơi game. Privacy options luôn phản ánh trạng thái mới. Không reset consent người dùng ở production.

Banner là overlay native, placeholder DOM chỉ giữ khoảng trống. Cần đo viewport/WebView, inset hệ thống, dock và banner trên thiết bị để tránh chồng nội dung, kể cả landscape, bàn phím và đổi màn nhanh. Khi không được hiển thị, không còn vùng native chặn input hoặc khoảng trống sai kích thước. Không thêm animation/RAF/ghi persistence cho banner.

Nếu được giao video thưởng: khóa một fullscreen request tại một thời điểm; SDK reward event là bằng chứng nhận thưởng, dismissal không phải reward. Grant qua transaction economy hiện có, đúng một lần; có stale-round/account guard, đường đóng sớm/fail/cancel/khôi phục ghi lỗi rõ. Chốt riêng yêu cầu chống nhận trùng qua crash/reload và nhu cầu server-side verification trước thiết kế; không tự thêm ledger hoặc đổi schema.

Nếu được giao interstitial: chỉ natural break được duyệt, không chen giữa thao tác gameplay; no-fill cho tiếp tục ngay; pause/resume âm thanh và thời gian theo owner; không tự thêm đếm bền vững/cadence schema khi chưa duyệt. Quảng cáo không được trì hoãn commit kết quả màn thắng.

## 5. Gate triển khai tương lai

### Gate 0 — Chốt cấu hình và bàn giao ownership

- Nhận các quyết định ở mục 1 và checklist mục 6; xác nhận ID thuộc app/package đúng.
- Đọc trạng thái/diff/CONTEXT mới nhất. Không sửa `js/appNavigation.js`, `js/mainmenu.js`, `js/settings.js`, CSS hoặc CONTEXT cùng lúc owner giao diện đang sửa. Khảo sát/tài liệu độc lập có thể song song.
- Giữ plan này là draft cho tới khi được giao thực hiện; lúc đó xác lập một plan triển khai active rõ ràng. Không khôi phục plan runtime cũ hoặc trộn dọn UI.
- Pass: phạm vi, placement, privacy audience, IDs, file ownership và baseline được ghi rõ. Không cần dữ liệu ký release để làm debug APK.

### Gate 1 — Cấu hình native và service

- Cài/pin plugin phù hợp, thêm App ID metadata/resource, ad unit qua cấu hình build (đề xuất `VITE_ADMOB_ANDROID_BANNER_ID`; các unit khác chỉ khi scope đã duyệt), ví dụ cấu hình không chứa ID thiết bị cá nhân.
- Build Android có kiểm tra ID theo scope; không yêu cầu ad unit ngoài phạm vi. Kiểm tra merged manifest/SDK permissions và plugin registration; sửa source, để `cap sync` tạo output.
- Tách native supported/web unsupported, consent/init/retry, privacy options và diagnostics. Thêm native app lifecycle dependency nếu chọn dùng.
- Pass: unit/contract cho concurrent initialization, consent required/not required/denied/error, config sai/thiếu, offline recovery và web không gọi SDK. Không có fake reward production.

### Gate 2 — Banner theo navigation

- Gắn controller vào page/navigation owner đã bàn giao, cập nhật slot chiều cao và khoảng cách với dock; static fallback, không chặn gameplay khi SDK fail/no-fill.
- Test chuyển nhanh Home → map → tab chức năng → gameplay → Home; show/remove pending đảo thứ tự; background/foreground; rotate/keyboard; modal chồng màn; consent đổi khi banner đang visible.
- Pass: tối đa một banner, không banner trên màn không eligible, callback cũ không tác động owner mới, listener trở baseline qua ít nhất 30 chu kỳ. Không ghi save/network ngoài request hợp lệ, không polling.

### Gate 3 — Xác nhận phạm vi banner-only

- Video thưởng/interstitial **không thuộc phạm vi** theo lựa chọn người dùng; không tạo module reward/interstitial dư thừa, không thêm policy đếm màn, không yêu cầu tạo unit tương ứng.
- Pass: chỉ banner Home/map được enable, không có reward mock hoặc fullscreen request trong production. Task video thưởng/interstitial sau này phải có acceptance riêng, không gộp vào lượt triển khai banner.

### Gate 4 — Regression và đóng gói

- Chạy test service/controller mục tiêu trước; Playwright navigation/map/tab/game shell lifecycle liên quan với native adapter mock. Bổ sung kiểm tra Android build config, privacy/options.
- Baseline chính S22 Ultra CSS 412×915; thêm landscape và desktop/web. Responsive hẹp kiểm tra theo phạm vi UI thực sự thay đổi; không tạo gate thiết bị 320/360 riêng khi không có lỗi mục tiêu.
- `npm run check`, `npm run build`, `npm run build:android`, sau đó `npm run android:apk` (lệnh cuối tự build Android/sync/assembleDebug). Không chạy lại cùng matrix nếu không đổi code và không có concern mới.
- Xác nhận APK tại `android/app/build/outputs/apk/debug/app-debug.apk`, package/version/certificate/manifest/dependency thực tế. Ghi SHA-256 file, kích thước và phiên bản để nhận diện đúng bản test.
- Đánh giá sau implementation là bước riêng: đọc diff đối chiếu plan, chạy lại test trọng yếu; có thể dùng reviewer chỉ đọc/test theo quy tắc repo. Không lấy báo cáo tác giả làm bằng chứng duy nhất.
- Pass: toàn bộ scope tự động đạt; ghi rõ thiết bị thật còn chờ nếu chưa có kết quả. Không gọi browser/mock pass là native ad pass.

### Gate 5 — QA APK trên máy đã đăng ký

- Giải quyết kết nối ADB, ghi thiết bị/Android/WebView và bản APK. Nếu sandbox chặn công cụ, thử cách kiểm tra an toàn/quyền phù hợp; không yêu cầu cài lại SDK chỉ vì lỗi daemon một lần.
- Cài cập nhật giữ dữ liệu nếu chữ ký/package tương thích. Không tự uninstall/clear data; đổi debug → release khác chữ ký cần phương án sao lưu/khôi phục hoặc package test được duyệt.
- Kiểm tra Google ads có nhãn Test Ad/Test Mode; xem Ad Inspector/log để xác nhận request/response và app/unit đúng. Giữ thiết bị test hiện có; chỉ sửa đăng ký nếu thực tế chưa được nhận diện. Không thu thập test-device ID vào Git.
- Thử banner Home/map, chuyển tất cả tab/ba game, thao tác nhanh, 30 chu kỳ, pause/restart, nền/foreground, rotate, offline/no-fill/consent, safe-area và vùng bấm dock. Đo frame/long-task/resources trên scenario xác định; không tuyên bố 60 FPS chỉ từ máy tính.
- Smoke IndexedDB/resume/Xu/kho/chủ đề, guest/Google link/cancel/return, cloud save/ranking trong WebView. Nếu OAuth popup không hoạt động, báo thành task Auth riêng cần quyết định adapter; không âm thầm sửa Auth trong task ads.
- Pass: QA native có bằng chứng, lỗi no-fill phân biệt với lỗi cấu hình, không crash/chặn input/timer/reward hoặc mất dữ liệu. Các format không chọn không nằm trong matrix.

## 6. Việc người dùng chuẩn bị

Đây là checklist từ lần lập kế hoạch. Package và hai ID ở bước1–5 đã được người dùng cung cấp ngày2026-10-16, không tạo lại. Hướng dẫn hiện hành cho những việc còn lại ở `docs/ads/HUONG_DAN_THU_APK.md`.

### Cần trước khi tích hợp quảng cáo thật

1. Package đã chốt: dùng `com.memorymatch.adventure` trong các đăng ký Android về sau. Không cần đổi Firebase Web App ID hay Firebase project.
2. Vào AdMob đúng tài khoản đang quản lý thiết bị test → Apps/Ứng dụng → Add app/Thêm ứng dụng → Android → chọn chưa có trên cửa hàng nếu chưa phát hành → đặt tên Memory Match Adventure → tạo app. Nếu đã có app đúng thì dùng app đó, không tạo trùng. App chưa phát hành có thể được tạo để tích hợp/test; việc liên kết store và review để phục vụ đầy đủ là giai đoạn sau.
3. Trong App settings, sao chép **AdMob App ID** dạng `ca-app-pub-…~…`.
4. Trong Ad units, tạo **Banner**, ví dụ tên `android_home_map_banner`, lấy **ad unit ID** dạng `ca-app-pub-…/…`. Một banner unit có thể dùng ở hai vị trí hiện tại; chưa cần tách reporting/đơn vị khác nếu chưa có yêu cầu. Chưa tạo Rewarded/Interstitial cho APK này.
5. Gửi hai giá trị: App ID và banner ad unit ID. Đây là cấu hình công khai; không gửi mật khẩu AdMob/Google, service-account key hoặc mật khẩu ký APK.
6. Giữ thiết bị đã đăng ký trong Settings → Test devices trên cùng tài khoản AdMob; chưa cần thêm lại. Khi có APK, kiểm tra nhãn test thực tế. Nếu thiếu, kiểm tra Advertising ID đã reset/đổi hoặc khác tài khoản; agent hỗ trợ chẩn đoán. Không thay test device ID vào App ID/ad unit ID.
7. Chốt nhóm tuổi dự kiến và thị trường phát hành. Chuẩn bị/tán thành nội dung privacy policy đúng các dịch vụ đang dùng, có email liên hệ. AdMob → Privacy & messaging → chọn app → cấu hình/publish thông điệp áp dụng với URL privacy HTTPS; agent có thể chuẩn bị trang/tài nguyên, bạn quyết định nội dung và cấu hình console. Chưa tự khai báo hướng trẻ em hay consent thay bạn.

### Khi nhận APK test

8. Chuẩn bị Galaxy S22 Ultra, cáp dữ liệu, bật Developer options → USB debugging, mở khóa và chấp nhận hộp thoại RSA khi kết nối. Cho phép cài APK từ nguồn dùng để mở file nếu cài thủ công. Java/SDK đã có trên máy, không cần cài lại mặc định.
9. Thử bản APK được xác định bằng version/hash, kiểm nhãn test và checklist Gate 5; báo ảnh/video/lỗi cùng thời điểm và màn hình. Không xóa bản cũ/dữ liệu để xử lý lỗi cài khác chữ ký nếu chưa sao lưu và quyết định phương án.

### Chuẩn bị sau, trước phát hành hoặc nếu muốn release APK

10. Debug APK đầu tiên không yêu cầu Play Console/AAB/release keystore. Khi muốn release APK ký riêng: tạo/khôi phục key của Memory Match, giữ ở nơi riêng và sao lưu an toàn; agent bổ sung ignore trước. Không cần gửi mật khẩu/key vào chat. Không tự tái dùng key sản phẩm khác.
11. Trước phát hành: chốt developer website HTTPS; lấy dòng app-ads.txt từ AdMob đúng publisher, đặt ở root website và liên kết developer website trên listing, kiểm trạng thái xác minh AdMob. Có thể dùng site production của dự án sau khi chốt; không cần mua domain chỉ để có URL HTTPS. Không deploy file/web ngoài phạm vi đã giao.
12. Hoàn thiện privacy/account-deletion URL, Play listing/target audience/Data Safety theo SDK thực tế; liên kết store và app readiness review; phân biệt test track với test device. Đây không phải điều kiện để viết mã hay build debug APK cài tay.

## 7. Nguồn chính thức và giới hạn bằng chứng

- [Tạo app AdMob, gồm unpublished app](https://support.google.com/admob/answer/9989980?hl=en).
- [ID thật với thiết bị test, nhãn test và mediation](https://developers.google.com/admob/android/test-ads). Phạm vi đầu tiên đề xuất AdMob Network, không tự thêm mediation adapter.
- [Plugin, compatibility và API](https://github.com/capacitor-community/admob).
- [Thứ tự consent/init](https://github.com/capacitor-community/admob/blob/main/docs/consent.md) và [cấu hình](https://github.com/capacitor-community/admob/blob/main/docs/configuration.md).
- [UMP Android](https://developers.google.com/admob/android/privacy).
- [app-ads.txt](https://support.google.com/admob/answer/9363762?hl=en).

Skill `clarify-ambiguous-requirements` dùng để hỏi/chốt banner-only và giữ package, tách task reward tương lai khỏi phạm vi đã xác nhận. Khảo sát chỉ đọc source/config và đối chiếu nguồn chính thức; chưa cài dependency, sửa runtime, request quảng cáo, build APK, deploy hoặc chứng nhận thiết bị test. Không chạy check/build cho thay đổi chỉ tài liệu; kết quả lượt này chỉ xác minh nội dung/diff, không phải nghiệm thu các gate triển khai.
