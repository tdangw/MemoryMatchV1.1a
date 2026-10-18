# Bộ hình và tinh chỉnh banner — 18/10/2026

## Kết quả và ranh giới

Kế hoạch nguồn: [UI_IMAGE_UPGRADE_PLAN.md](../../../../UI_IMAGE_UPGRADE_PLAN.md). Đã chọn Vườn đêm cho các tab/cửa hàng và popup thao tác; gỗ/giấy cho thắng/thưởng. Kế hoạch phủ đầu màn, chọn màn, quà/rương, mua, công cụ, pause, hết giờ, thông tin, dữ liệu/quyền riêng tư và từng tab/HUD của ba trò. Có bảy bộ hình, trạng thái, thứ tự làm và ngân sách cần kiểm khi sản xuất. Skill imagegen được dùng ở bước chuẩn bị yêu cầu vẽ/xuất ảnh; lượt này chưa tạo ảnh, không tuyên bố đã nâng cấp toàn bộ skin.

Phần code của lượt này: thanh đóng băng Link2px vàng, sát mép và viền tối mảnh để đọc trên băng trắng; thời lượng/cadence/pause/stack và mở cặp băng800ms không đổi. Theo phản hồi bổ sung, dùng mới/dùng chồng/restore snap đầy ngay (duration0s khi ratio1); chỉ nội suy giảm khi ratio dưới1. Không thêm state, timer, RAF hoặc forced reflow. Test đo computed matrix và CSSTransition ngay tại style mutation, không chỉ kiểm target scale trong attribute. Banner web có5thẻ/3hoa trải ngang tối đa640px, cảnh chạy giữ nguyên. Cảnh luân phiên6s, SVG/CSS, không thêm timer/RAF hoặc ảnh vào gói tải.

Popup thông thường mặc định giữ banner hiện có, thay cho mặc định thu hồi cũ. Áp dụng cả thắng/hết giờ/tạm dừng/đầu màn/shop/công cụ/thông tin/rương. Intro riêng dùng cùng placement; cảnh hoàn thành chặng dùng cùng hàm chừa banner với popup. `connectBannerClearance` có hai consumer thật, observer thuộc lifecycle, không ghi vào slot đang quan sát. Dialog vẫn giữ vị trí theo bàn và cuộn nội dung dài; phần nút nằm trên banner.

Các ngoại lệ cố ý giữ: chính sách/quyền lựa chọn quảng cáo, chọn bản lưu, lỗi lưu; bàn phím nhập liệu, ứng dụng ở nền, provider không có quảng cáo. Android gameplay vẫn không được bật thêm; Android các tab giữ phạm vi trước. Không vẽ art đè quảng cáo thật.

Không thay public signature, schema/key bản lưu, catalog/effect ID, giá, giao dịch hoặc luật game. Thay đổi mặc định `keepBanner` là hành vi UI được giao, tùy chọn `false` vẫn có tác dụng và các luồng nhạy cảm chỉ định rõ. Không deploy Hosting/AdMob, không push.

## Bằng chứng

- Lượt mục tiêu đầu:38/38 pass (`ads-artwork`, `dialog-placement`, `hud-purchase-polish`, `ui-image-polish` trước phần chapter).
- Review độc lập đầu:30/30 pass (`ui-image-polish`, `dialog-placement`, `ads-banner` trước phần chapter); phát hiện coverage cảnh chapter, đã bổ sung source/test trước nghiệm thu cuối.
- Sau phần chapter:26/26 pass (`ui-image-polish`10, `ads-web-preview`5 gồm30restart qua ba trò, `hud-ui-polish`7, `shop-inventory`4).
- Sau sửa refill:24/25 pass (`hud-purchase-polish`13, `hud-ui-polish`7, chapter4/5). Chapter Link cũ ép totalPairs=1 trong bàn12thẻ, vi phạm invariant pair snapshot và rollback đúng thiết kế. Đổi harness sang chơi đủ cặp thật, chờ input mở và matchedPairs tăng; không sửa luật/lưu hoặc nới assertion. Root chạy lại toàn bộ `victory-level100`5/5 pass.
- Review nguồn sau chapter lần đầu:35/36 pass (UI10/dialog14/victoryownership7/chapter4/5), phát hiện cùng fixture Link. Refill review độc lập HUD7/7 pass; chapter cuối5/5 pass bằng bàn thật. Reviewer kết luận không còn finding mở. Soak thắng/chuyển trò/hủy30vòng giữ node1260/listener90 ổn định qua các mẫu.
- `npm run check` pass toàn bộ; quảng cáo unit15/15, Triple pure p95 10,94ms (Node desktop). `npm run android:apk` và `npm run build` pass; production smoke2/2 pass, gồm5thẻ trong bundle, mua giữ footer/banner và tạm dừng trong game giữ bàn/banner. Dist cuối là bản web.

Ảnh trong [qa/](qa/) bao gồm bar vàng,5thẻ/3hoa, summary cả ba trò và cảnh hoàn thành chặng ở412×915,844×390,1024×900. Ảnh dùng nội dung sản phẩm, không chèn ghi chú hướng dẫn phát triển.

## Đo hoạt ảnh

[Số đo](qa/art-performance.json): Chrome Windows, viewport412×915,120frame/mỗi scenario. Home tĩnh p95≈7,1ms; cards7,1ms/garden7,0ms/runner7,4ms; không long task. Node/animation từng scene: cards19/14, garden28/7, runner13/6. Với ba game, p95 tĩnh13,5–13,7ms, chuyển động7,1–7,2ms, không long task trong mẫu. Đây là mẫu khác pha/tải của trình duyệt máy tính, không kết luận thêm hoạt ảnh làm game nhanh hơn hoặc đạt60FPS trên điện thoại.

Giữ trần28node/14animation do thành phần tăng từ3thẻ/1hoa lên5thẻ/3hoa; kiểm riêng số lượng/độ trải ngang,30vòng thay scene, hủy khi suspend/dispose và reduced-motion không còn animation. Không nới ngưỡng long task hoặc delta p95 so với cảnh tĩnh.

## Giới hạn

Chưa nghiệm thu trên Galaxy S22 Ultra thật, quảng cáo thật hoặc bàn phím Android. Kế hoạch ảnh là lộ trình chuẩn bị; chất lượng ảnh, ngân sách tải và layout sau thay ảnh cần nghiệm thu ở đợt sản xuất tương ứng. Shop grid legacy Triple qua API trong game ngoài menu hiện hành vẫn là giới hạn đã ghi ở QA lượt trước, không sửa trong task này.

## Bản đóng gói và commit

APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 34250200bytes, SHA256 `8ABA924CFD968EF036A5BF3CC04B75EF7D22FF70BF4BE2BD0382CA235641DCF6`. Chữ ký debugv2 đã xác minh; package `com.memorymatch.adventure`, versionCode1/versionName1.0, min24/target36. Kiểm tra bên trong APK có màu/bar2px và nhánh duration0s cho refill; [biên nhận](qa/apk-receipt.json). Chưa cài/QA trên máy thật trong lượt này.

Phase kế hoạch `41f1070`; phase banner/bar/clearance `f3565d6`; phase refill tức thì + harness chặng đúng invariant `3ab02c7`; phase cuối lưu QA/ảnh/receipt. Tám ảnh app-tabs và thư mục .vscode có sẵn được giữ nguyên; ảnh do tests ghi vào thư mục QA lịch sử đã phục hồi từ bản trước, bằng chứng mới lưu riêng ở đây.
