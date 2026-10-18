# Kế hoạch bộ hình giao diện — 18/10/2026

## Triển khai bộ hình — đã được giao18/10

Người dùng đã giao thực hiện toàn bộ lộ trình ảnh bên dưới. Phần A–C là hồ sơ lượt chuẩn bị trước; phần hiện hành là D–G, thực hiện tới hết. Giữ luật/save/API/catalog, nền và tranh trò đã có; không deploy. Chỉ tạo APK **một lần cuối khi hoàn thành toàn bộ**, báo tiến độ ngắn và giữ bằng chứng trong một QA.

- [x] D — Tạo ảnh nguồn đủ nét, xuất khung/nút/biểu tượng theo bảy nhóm; kiểm alpha, biên co giãn và ngân sách. Gom theo chất liệu/vòng đời thành các master sheet Vườn đêm, gỗ/giấy và biểu tượng; các nhóm dùng lại ảnh thay vì nhân bản sheet gần giống.
- [ ] E — Gắn khung/nút/biểu tượng cho mọi popup thao tác, đầu màn/chọn màn/công cụ và thắng/thưởng của ba trò; chữ/số/vùng chạm vẫn thật, không đổi luồng.
- [ ] F — Đồng bộ cửa hàng/bộ sưu tập/tab/điều hướng/HUD và cảnh kết thúc chặng; giữ nền/trang trí phù hợp hiện có. Kiểm kê mọi thành phần và ghi rõ sử dụng ảnh mới/giữ nguồn đã có.
- [ ] G — Kiểm ảnh thật412/844/1024, tương tác/focus/lifecycle/reduced-motion/save, đo tải/frame, review độc lập, check/build web và APK cuối; commit từng phase.

Lựa chọn thực hiện: ảnh thành phần co giãn + nội dung sống. Không chọn ảnh toàn màn với tọa độ chữ cố định vì không đáp ứng nội dung dài, popup nhiều dòng hoặc màn ngang. Không thêm animation/RAF mới; ảnh trang trí tĩnh giữ ownership DOM hiện có. Các nguồn icon SVG ít dùng giữ fallback tương thích, bộ hình chính dùng chung ở mọi nơi.

## Phạm vi đã chốt

Giữ Vườn đêm cho Home, các tab và cửa hàng. Popup thắng dùng gỗ, giấy, sao vàng và nút nổi theo ảnh mẫu. Các popup khác đều được đưa vào bộ hình: thao tác thường ngày dùng khung Vườn đêm được vẽ nổi; nhận thưởng dùng chung chất liệu gỗ và giấy với popup thắng. Cùng hướng ánh sáng trên trái, độ bo tròn, độ dày viền và cách vẽ biểu tượng trong cả ba trò.

Lượt này **lập kế hoạch bộ hình**, chưa tạo ảnh và chưa thay toàn bộ giao diện. Đồng thời thực hiện ba chỉnh sửa đã giao: thanh đóng băng, thêm thẻ/hoa vào banner, giữ banner khi mở popup thông thường. Không đổi luật, giá, thưởng, bản lưu, phạm vi quảng cáo Android hoặc tự xuất bản website/AdMob.

## Các phần cần dùng hình

| Nơi hiển thị | Hình cần chuẩn bị | Nội dung tiếp tục hiển thị bằng chữ/số | Nguồn quản lý hiện tại |
|---|---|---|---|
| Thắng màn, cả ba trò | Khung gỗ/giấy co giãn; dải tiêu đề trống; sao sáng/tối; ô giá trị; nút cam/xanh; xu, đồng hồ, sao | Màn, số sao, điểm, Xu, thời gian, lượt, lỗi, thưởng thêm; Menu/Màn tiếp theo | `js/ui.js`, `styles/modals.css` |
| Đầu màn chơi | Khung Vườn đêm vừa, bảng tên trống, huy hiệu độ khó, biểu tượng mục tiêu/giờ/công cụ | Màn, độ khó, chủ đề, mục tiêu, thời gian, vật phẩm theo cấu hình thật | `showLevelRewardOverlay` trong `js/ui.js` |
| Chọn màn/độ khó, chọn tiếp tục hay lượt mới | Khung Vườn đêm lớn, bộ huy hiệu C/B/A/S, bệ huy hiệu đang chọn, nút Chơi/Tiếp tục | Màn, mô tả, thời gian, số thẻ/cặp/bộ ba, chủ đề | `js/adventureMap.js`, `js/mainmenu.js`, controller Link/Triple |
| Rương, đã nhận thưởng, quà may mắn | Khung gỗ/giấy nhỏ và vừa, rương đóng/mở, xu và vật phẩm, dải tiêu đề trống | Số lượng quà và kết quả nhận thật; không đưa số cố định vào ảnh | `js/adventureMap.js`, toast thưởng trong `js/ui.js` |
| Kết thúc chặng | Huy hiệu và bảng chúc mừng dùng cùng bộ thắng; giữ cảnh hoa hiện có | Màn/chặng, hành động tiếp tục | `js/victoryCelebration.js`, `js/victoryFlowerScene.js` |
| Xác nhận mua, thiếu Xu, mở rộng khay | Khung Vườn đêm nhỏ, bệ vật phẩm, đồng Xu, nút chính/phụ | Tên, giá, số lượng, trạng thái sở hữu/mua, Hủy/Mua ngay | `js/shop.js`, giao dịch Triple, `styles/shop.css` |
| Sử dụng công cụ | Bảng nổi Vườn đêm cho menu, ô công cụ và bệ số lượng; ảnh gợi ý/xáo trộn/đóng băng/thêm giờ/xem trước/hoàn tác/mở khay | Tồn kho, thời lượng, tên và trạng thái dùng được; giữ khác biệt luật của từng trò | `styles/game-shell/hud-unified.css`, `js/shop.js`, item catalog từng trò |
| Tạm dừng, xác nhận chơi lại/thoát | Khung Vườn đêm vừa, nút nổi, biểu tượng tiếp tục/chơi lại/cài đặt/thoát | Tiêu đề và hành động; không tăng số bước sử dụng | `js/gameExitDialog.js`, `js/modal.js` |
| Hết giờ/thất bại | Khung Vườn đêm, huy hiệu đồng hồ và trạng thái hết giờ; nút thử lại/dùng vật phẩm | Lý do, giá/đồ đang có, lựa chọn tiếp theo | `openTimeUpModal` trong `js/ui.js`, controller ba trò |
| Thông tin, hướng dẫn, phiên bản, đổi chủ đề | Khung Vườn đêm giản dị; biểu tượng thông tin và nút đóng | Nội dung dài, danh sách, liên kết; vùng đọc cuộn được | `js/mainmenu.js`, `js/settings.js`, `js/themeChangeNotice.js`, controller Link |
| Quyền riêng tư, chọn bản lưu, xóa dữ liệu, lỗi lưu | Cùng khung giản dị và nút chung; ít trang trí, không dùng vẻ ăn mừng | Toàn bộ nội dung và trạng thái quan trọng, dễ đọc | `js/settings.js`, `js/accountPanel.js`, `js/main.js`, `js/ui.js` |
| Home và điều hướng các tab | Giữ ba tranh trò/nền đã có; thay bệ tên/nút cần thiết, bộ biểu tượng điều hướng thống nhất | Tên trò/tab và trạng thái chọn; không vẽ cả thanh điều hướng vào một ảnh | `js/gameSelector.js`, `js/appNavigation.js`, `styles/home-menu.css`, `styles/adventure.css` |
| Bản đồ | Giữ nền/trang trí/rương đã có; đối chiếu nút màn, khóa, bệ độ khó với bộ mới | Số màn và tiến trình | `js/adventureMap.js`, `styles/adventure.css` |
| Cửa hàng và Bộ sưu tập | Khung ô hàng, bệ ảnh, bệ giá, huy hiệu sở hữu/đang dùng/khóa; công cụ dùng chung bộ ảnh trong game | Giá, tồn kho, tên, hành động; giữ ảnh chủ đề/mặt lưng đã có | `js/shop.js`, `js/mainmenu.js`, `styles/shop.css` |
| Hồ sơ | Giữ nền; khung avatar và khung nhóm thống kê cân đối | Tên, trạng thái tài khoản, thời gian và dữ liệu cá nhân | `js/accountPanel.js`, `styles/app-tabs.css` |
| Xếp hạng | Giữ nền; bộ huy chương 1–3 và khung hàng nổi bật | Hạng, tên, điểm/màn, bộ lọc và trạng thái tải | `js/leaderboardPanel.js`, `styles/app-tabs.css` |
| Cài đặt | Giữ nền; khung nhóm, bệ công tắc/thanh âm lượng cùng chất liệu | Nhãn, giá trị âm lượng, bật/tắt, focus bàn phím | `js/settings.js`, `styles/settings.css`, `styles/app-tabs.css` |
| Nhiệm vụ/Sự kiện | Giữ nền và biểu tượng tab chung; chỉ chuẩn bị khung/bệ dùng lại | “Sắp ra mắt”; chưa sáng tác tính năng mới | `js/main.js`, `styles/app-tabs.css` |
| HUD, bàn và khay ba trò | Bệ HUD, bệ nút công cụ/menu; kiểm tra chất liệu mặt lưng/khay đã có trước khi tạo thêm | Giờ, combo, điểm, số lượng; thanh tiến trình, đường nối, vùng chạm và luật bàn vẫn do trò chơi điều khiển | game shell, renderer riêng từng trò |
| Banner web | Giữ ba cảnh vector không chữ; bổ sung hai thẻ và hai hoa | Không thêm nhãn kỹ thuật; không chèn hình lên quảng cáo Android thật | `js/ads/bannerArtwork.js`, `styles/ad-banner.css` |

## Danh sách sheet cần vẽ

Sheet là bản xem tổng thể để chốt nét vẽ. Ảnh sử dụng trong trò chơi được xuất riêng theo thành phần, không dùng một ảnh chụp toàn popup rồi chèn mọi thứ bằng tọa độ cố định.

| Bộ | Thành phần bắt buộc | Trạng thái và cách dùng |
|---|---|---|
| 01 — Khung Vườn đêm | Khung popup nhỏ/vừa/lớn dùng chung góc và cạnh; phần giấy/nền đọc tối; bảng tên trống; ô thông tin; bảng nổi công cụ | Cạnh giữa kéo dài, góc giữ nguyên tỷ lệ; nền đọc ít chi tiết. Các kích thước là cách ghép cùng một khung, tránh ba ảnh gần giống |
| 02 — Thắng và thưởng | Khung gỗ, giấy giữa, dải đỏ trống, sao sáng/tối, ô giá trị nâu, bệ quà; rương mở/đóng chỉ vẽ lại nếu lệch nét | Ghép 0–3 sao; hỗ trợ thêm/bớt dòng thưởng và nội dung cuộn; không gắn cứng ba dòng như ảnh mẫu |
| 03 — Nút và điều hướng | Nút chính/phụ/cảnh báo Vườn đêm; nút cam/xanh trên gỗ; nút đóng tròn; bệ tab và trạng thái chọn | Bình thường, nhấn, vô hiệu hóa; hover/focus có lớp sáng/viền rõ dùng lại hình nền. Chữ không nằm trong ảnh |
| 04 — Biểu tượng chung | Xu, đồng hồ, sao, mục tiêu, quà, rương, khóa; Home, cửa hàng, bộ sưu tập, bản đồ, xếp hạng, cài đặt, hồ sơ, nhiệm vụ, sự kiện; tiếp tục, chơi lại, thoát, thông tin | Một biểu tượng một nguồn, dùng lại trong popup/tab/shop; kích thước nhỏ phải đọc được, không dùng emoji |
| 05 — Công cụ ba trò | Gợi ý, xáo trộn, đóng băng, thêm giờ, xem trước, hoàn tác, mở rộng khay; bệ vật phẩm và bệ số lượng | Cùng ảnh ở menu công cụ, kho, shop và phần thưởng. Cấp công cụ phân biệt bằng bệ/màu/nhãn, không tạo bản gần trùng |
| 06 — Cửa hàng, bộ sưu tập, độ khó | Ô hàng, bệ giá, huy hiệu trạng thái; C/B/A/S và vòng chọn; khung xem chủ đề/hiệu ứng | Giữ tên, giá, số lượng và trạng thái là nội dung sống; tận dụng preview chủ đề hiện có |
| 07 — Tab và HUD | Khung avatar, nhóm thống kê, huy chương; khung nhóm cài đặt, bệ công tắc; bệ HUD/khay nếu đối chiếu cần đổi | Không thêm mảnh trang trí nhỏ trên Hồ sơ đã được yêu cầu gỡ; giữ tỷ lệ cân đối. Không nhân bản nền tab hiện có |

Ưu tiên 01–05 trước: chúng phủ hầu hết popup và tạo nền chung cho các phần còn lại. Mỗi bộ cần ảnh tổng quan sáng/tối và bản xem ở kích thước thật trước khi đưa vào game.

## Cách tạo và ghép hình

- Chọn ghép ảnh thành phần với chữ/nút thật. Phương án ảnh toàn popup nhanh để xem mẫu nhưng không đáp ứng số liệu dài, nhiều dòng thưởng, tiếng Việt, màn ngang và khả năng bấm/đọc; không chọn làm cách sử dụng cuối.
- Dùng `imagegen` built-in cho tranh/chất liệu vẽ nổi. Không cần khóa API riêng. Mỗi bộ có yêu cầu vẽ, ảnh tham chiếu, bảng màu và phiên bản lưu trong hồ sơ dự án. Lượt này chưa gọi tạo ảnh, chưa phát sinh bộ ảnh mới.
- Ảnh mới nền trong suốt thật, không chữ/số/nhãn/nút bấm được vẽ liền với khung. Giữ vùng giữa thoáng; gỗ/giấy dùng ánh vàng ấm, Vườn đêm xanh đậm viền vàng dịu. Không lấy ảnh của trò khác làm tài nguyên.
- Khung lớn cần nguồn riêng đủ nét, không phóng ô nhỏ từ sheet cũ `docs/design/home-assets/garden-ui-sheet-v1.png` (1254px tổng). Sheet cũ chỉ tham khảo.
- Kích thước xuất dựa trên kích thước dùng thật: icon thường24–48px cần nguồn tối thiểu3×; popup tối đa520px cần master khoảng1560px ngang hoặc góc/cạnh có mật độ tương ứng. Đo kích thước file và alpha thật, không tin kích thước ghi trong yêu cầu vẽ.
- Khung dùng chia chín phần hoặc cạnh/giữa riêng; nút cùng nguyên tắc để nhãn dài không méo góc. Ảnh hiển thị bằng lớp trang trí không nhận chạm; phần bấm/nhãn vẫn có tên truy cập, trạng thái disabled và viền focus.
- Chỉ gộp ảnh nhỏ cùng vòng đời vào một bảng ảnh nếu đo có lợi. Không tải cả bộ popup/thành tựu vào Home. Ảnh có tên phiên bản, được dùng lại và tải khi cần; cache có giới hạn. Master nằm ngoài thư mục đóng gói.
- Ngân sách đề xuất để kiểm khi sản xuất: bộ nền/khung/nút dùng chung tải ban đầu thêm không quá350KB; bộ thắng tải khi cần không quá250KB; icon/công cụ không quá250KB; bộ trang trí tab bổ sung không quá300KB. Đây là giới hạn thiết kế cần đo, chưa phải kết quả đã đạt. Nếu vượt, giảm kích thước/số biến thể trước khi xin tăng ngân sách.
- Ảnh tĩnh không tạo animation mới. Chỉ dùng sheet nhiều khung khi chuyển động thực sự cần vẽ tay; hiệu ứng điểm, bar, đường nối vẫn giữ cách vẽ nhẹ hiện có. Mọi chuyển động mới cần timeline hữu hạn, hủy được và có chế độ giảm chuyển động.

## Thứ tự thực hiện bộ hình sau kế hoạch

1. Vẽ bản tổng quan01–05 và một popup thắng, chọn màn, mua hàng ở kích thước thật để chốt độ nổi/nét vẽ. Chốt tỷ lệ chữ/nút và khoảng đọc, sau đó mới mở rộng; không sinh tất cả ảnh rồi mới phát hiện lệch phong cách.
2. Xuất nguồn riêng, ghi kích thước/crop/biên co giãn/trạng thái, nén, kiểm nền trong suốt và mép trên nền sáng/tối. Lưu prompt và ảnh nguồn trong hồ sơ; xuất bản đóng gói từ một script có thể chạy lại.
3. Gắn bộ khung/nút chung và popup thao tác; áp dụng đầu màn, chọn màn, tạm dừng, thông tin, mua, công cụ, hết giờ và xác nhận. Giữ luồng thao tác, focus, pause và giao dịch.
4. Gắn bộ thắng/thưởng cho ba trò và các rương/quà; kiểm cả0–3sao, không thưởng, nhiều khoản thưởng, màn/chữ/số dài và kết thúc chặng.
5. Gắn cửa hàng/bộ sưu tập/tab/HUD từ cùng bộ hình. Đối chiếu cả ba trò, không nhân bản khung riêng từng trò; không tạo nền mới nếu nền hiện có phù hợp.
6. Kiểm tra412×915,844×390,1024×900; popup dài, bàn phím, vùng an toàn, banner, chữ Việt, focus, giảm chuyển động, mở/đóng/chuyển trò lặp lại; đo tải/giải mã/bộ nhớ và khung hình trước/sau. Chạy check/build và review độc lập, commit từng phần. Không coi ảnh đẹp riêng lẻ là đã hoàn thành giao diện.

Các bước trên là lộ trình sản xuất sau lượt lập kế hoạch, chưa tự triển khai trong lượt này.

## Chỉnh sửa đi kèm được giao trong lượt này

### A — Khảo sát và kế hoạch

- [x] Chốt hướng kết hợp và inventory mọi nhóm popup/tab/shop/HUD của cả ba trò.
- [x] Định nghĩa sheet, trạng thái, nội dung sống, cách xuất và tiêu chí nghiệm thu.

### B — Thanh đóng băng, hình banner và hiển thị popup

- [x] Link: bar2px như combo, vàng rõ trên băng trắng, sát hai mép; giữ thời lượng và nhịp HUD hiện có.
- [x] Banner:5thẻ và3hoa, giãn ngang theo vùng hiển thị; giữ cảnh chạy, mỗi cảnh6s và một scene tại một thời điểm. Chọn bổ sung SVG/CSS hiện có thay raster/loop mới: chi phí nhỏ, dispose hiện tại vẫn sở hữu toàn cảnh. Tối đa5thẻ/3hoa/3đốm sáng; chỉ transform/opacity; reduced-motion đứng yên. Đo lại node/animation/frame so với cảnh tĩnh, kiểm hủy và30vòng luân phiên.
- [x] Popup thông thường giữ node/banner và vùng dành sẵn, gồm thắng/hết giờ/đầu màn/mua/công cụ/menu/thông tin/rương và cảnh hoàn thành chặng. Cảnh chặng và popup dùng chung hàm chừa banner, observer do lifecycle sở hữu. Chọn chính sách chung ở modal thay thêm nhánh ở mỗi controller; quyền riêng tư, chọn bản lưu và lỗi lưu tắt rõ ràng. Nhập liệu/ứng dụng nền/no-fill giữ xử lý hiện hành; Android gameplay vẫn tắt.

### C — Nghiệm thu và bàn giao

Phản hồi bổ sung: thanh đóng băng phải đầy ngay khi dùng và khi dùng chồng, sau đó chỉ giảm. Nguyên nhân là transition250ms cũng áp dụng khi ratio tăng0→1. Đã cân nhắc bỏ transition hoàn toàn (bar giảm theo nấc250ms) và chỉ bỏ chuyển động lúc đầy (vẫn giảm mượt); chọn cách thứ hai, suy ra từ ratio hiện có, không thêm cờ/timer/RAF/reflow. Lần đầu/chồng/restore đầy dùng0s; ratio dưới1 dùng cadence cũ; reduced-motion giữ tĩnh. Kiểm tra computed transform ngay trong lần thay đổi style, thay vì chỉ nhìn giá trị đích trong attribute.

- [x] Test mục tiêu + responsive + lifecycle + review độc lập.
- [x] Check/build, kiểm ảnh thật và diff cuối; commit từng phase. Không xuất bản.
- [x] Ghi bằng chứng và giới hạn kiểm chứng; kết thúc kế hoạch hiện hành. Lộ trình bộ hình ở trên vẫn là phần chuẩn bị.

Nghiệm thu A–C hoàn tất: xem `docs/design/ui-image-upgrade/QA.md`. Kế hoạch này không còn gate triển khai active; phần bộ hình là lộ trình chuẩn bị, chưa tạo hoặc tích hợp ảnh mới.
