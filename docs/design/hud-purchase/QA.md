# Hoàn thiện thanh đóng băng và popup mua — 18/10/2026

## Thay đổi

- Thanh đóng băng cao4px, tím đậm có viền tối1px; giữ nguyên model và cadence HUD. So với thanh trắng/xanh nhạt2px trước đây, hình mới tách rõ khỏi nền băng sáng. Ảnh thực: qa/freeze-412.png.
- Cặp băng mở khóa800ms thay1000ms (nhanh hơn20%). Chỉ đổi token, các pha wipe và owner/cleanup giữ nguyên; reduced-motion vẫn mở ngay. Exact contract trong check-link-connect-core được cập nhật800ms theo hành vi đã duyệt, không nới assertion.
- Khung công cụ ba trò dùng gradient garden, viền vàng và shadow/inset giống menu tạm dừng; không thêm node/timer/loop. Layout, hàng vật phẩm, count và focus/keyboard giữ nguyên.
- Xác nhận mua dùng flex center trong vùng viewport an toàn trừ chiều cao banner. Lựa chọn CSScenter không cần thêm observer chiều cao panel hoặc đo layout lặp. Defaultstart của popup khác giữ nguyên.
- Banner tìm từ slot đang hiển thị (shop screen, map hoặc gameplay), gồm slot ban đầu0px để observer hiện có theo dõi khi quảng cáo tải xong. Chỉ confirmation dùng keepBanner, không bỏ blocker của cửa sổ khác; không che/vẽ đè quảng cáo thật.
- Skin mua hàng thuộc styles/shop.css, skin tools thuộc hud-unified.css, vị trí chung thuộc modal/dialogPlacement; không đổi giao dịch, giá/catalog, luật hoặc save. API cũ tương thích, thêm lựa chọn alignment mặc địnhstart.

## Bằng chứng đã có

- Purchase/shop/commerce ban đầu19/19 đạt; mua đủ vật phẩm Memory/Link trước và trong game, lưu/reload và rollback Triple.
- Bộ mới/nativebanner/HUDmenu26/27: ca thêm gameplay mởshop trước khi Memory preview kết thúc nên test chờ isLocked=false. Nhánh Triple chuyển sang mua mở rộng khay đúng luồng UI hiện hành; chạy lại ca đó1/1 đạt. Không thay product để bỏ qua test.
- Web/native3viewport412×915,844×390,1024×900; mỗi trường hợp5lầnHủy kiểm tra cùng node banner, không tăng nativecalls và footer không dịch chuyển. Thêm bước Mua ngay thành công vào vòng review cuối.
- Tools3trò×3viewport; wipe10cycles normal/reduced; ảnh thanh tím đã mở kiểm tra.
- Menu20vòng/trò giữ số node/listener ổn định, native banner9/9 đạt.
- npm run check: đạt, quảng cáo15/15, Triple board p9510.49ms trên Node desktop (không phải FPS điện thoại). Lần đầu check bắt expected duration1000ms cũ; cập nhật contract800ms và chạy lại toàn bộ đạt.

## Giới hạn và phạm vi

Chưa kiểm tra trên S22 Ultra thật, không tuyên bố60FPS. Website/AdMob không xuất bản trong task. Các ảnh QA tab và .vscode có sẵn được giữ nguyên.

Luồng gọi shop cũ từ API trong gameplay Triple (không nằm trong menu chơi hiện hành) có card bị chồng khi landscape; không sửa grid cũ ngoài phạm vi task. Nghiệm thu gameplay purchase dùng luồng mở rộng khay đang có trong UI, không khẳng định đã sửa shop grid cũ.

## Cổng cuối

Đã hoàn tất:

- Review độc lập **27/27 đạt**: purchase13 + dialog placement14. Có6trường hợp web/native ba viewport, mỗi trường hợp5Hủy +1Mua ngay; cùng banner node, không tăng show/remove calls và footer giữ tọa độ. Center trong gameplay dùng chiều cao an toàn, Triple trừ58px vùng banner; các popup khác giữ vị trí cũ.
- Reviewer đọc diff, xem ảnh purchase/freeze và không còn finding. Không thêm animation loop hoặc observer panel; ownership/cleanup cũ được giữ.
- `npm run check`, `npm run android:apk`, `npm run build`: đạt. Production smoke **2/2 đạt**, gồm popup mua trên bundle thật giữ banner và vị trí shop.
- APK `android/app/build/outputs/apk/debug/app-debug.apk`:34250200bytes, SHA256 `FB08BBA4B8D928B2C36CA86F059AD4AC9678D3441DE3E0581000731BF0AC68EC`. Packagecom.memorymatch.adventure,versionCode1/versionName1.0,minSDK24,target36. Chữ ký debugv2 hợp lệ; đã đọc CSS trong APK xác nhận màu tím mới có trong gói.
- Ảnh tại qa/: thanh tím412; popup mua412/844/1024; công cụ cả ba trò ở412/844/1024. Không xuất bản website/AdMob, chưa nghiệm thu quảng cáo thật hay hiệu suất trên điện thoại.
- Không có skill chuyên biệt cần áp dụng trong lượt chỉnh CSS/timing/modal này; dùng quy trình repo và review độc lập. Không tạo thêm ảnh sheet hoặc dependency.
