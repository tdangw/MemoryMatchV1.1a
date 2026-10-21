# Kế hoạch giao diện toàn dự án, hướng dẫn và trải nghiệm phần thưởng

Cập nhật 20/10/2026: chủ dự án xác nhận phạm vi là **toàn bộ giao diện Memory Match, Link Connect và Triple Connect**, gồm Home, hai ngữ cảnh năm tab, gameplay, HUD, menu, popup, toast, nút và Cài đặt. Popup thắng chỉ là mẫu thử phong cách, không phải phạm vi cuối. Lượt hiện tại hoàn thiện kế hoạch và inventory từ code; chưa tự triển khai toàn bộ runtime, sinh đủ sheet hoặc thêm setting vào sản phẩm.

Đầu ra khi triển khai xong phải là một bộ giao diện Nâng cao đồng bộ xuyên suốt ứng dụng, có thể chọn cùng bộ Mặc định. Một popup đẹp, một atlas hoặc vài ảnh chụp không đủ để nghiệm thu toàn dự án.

## 1. Hướng thiết kế đã được sửa

- Chủ dự án xác nhận bộ Ngọc Lam quá giống mặc định và cung cấp mẫu mới: gỗ nâu nổi khối, giấy kem sáng, ribbon đỏ, sao vàng, nút Menu cam và nút tiếp tục xanh lá. Đây là hướng đang áp dụng. Không tiếp tục rollout Ngọc Lam.
- Hai lựa chọn sản phẩm vẫn là Mặc định / Nâng cao. Mặc định là giao diện hiện hành. Bộ nâng cao theo mẫu mới; tên thương mại chưa bắt buộc chốt để kiểm popup.
- Dùng hình ảnh cho chất liệu, khung, ribbon, nút và icon. Chữ, số màn, sao đạt/chưa đạt, thời gian và kết quả là dữ liệu động, không chụp cứng cả popup.
- Cả ba trò dùng cùng modal/controller/ownership hiện hữu. Skin có thể có padding và kích thước mỹ thuật riêng, nhưng dùng phép đo layout thật; không xây lại một cây popup hoặc game shell riêng.
- Không đổi luật, timer, wave, seed, mức thưởng, giá, catalog ID, thứ tự rương, banner placement, API hoặc định dạng save. Không APK/deploy/push.
- Việc thêm lựa chọn giao diện cần một enum settings mới được normalize tại boundary; giữ key cũ và format tổng. Field thiếu/lạ về mặc định, không tạo nguồn localStorage song song.

### 1.1. Phạm vi màn hình bắt buộc

Inventory dưới đây dựa trên owner hiện có, không phải danh sách tính năng mới. Mỗi dòng phải có thiết kế bố cục, danh sách ảnh cần dùng, trạng thái tương tác và kiểm chứng trên màn thật. Các màn dùng chung vẫn phải kiểm ngữ cảnh Home, từng trò và lúc đang chơi khi có hỗ trợ.

| Khu vực | Nội dung phải thiết kế | Dùng hình để tạo chiều sâu | Giữ động và linh hoạt | Owner chính hiện có |
|---|---|---|---|---|
| Khởi động | Màn tải, thanh tiến trình, tải lâu, lỗi, Tải lại | Biểu trưng/khung thanh tải đồng bộ; ảnh nhẹ đủ hiện sớm | Tiến trình thực, thông báo, nút thử lại; không đợi tải toàn bộ skin mới hiện màn tải | `js/startupLoading.js`, `index.html`, `styles/startup-loading.css` |
| Home/chọn trò | Carousel ba trò, thẻ trò, tiêu đề, nút điều hướng, vào trò | Khung thẻ/biển tên/nút nổi; tận dụng tranh nền hợp tông, không mặc định vẽ lại mọi tranh | Tên trò, trạng thái focus/selected, vùng vuốt; giữ carousel ba node hiện hữu | `js/gameSelector.js`, `styles/home-menu.css` |
| Dock Home | Nhiệm vụ / Sự kiện / Profile / Xếp hạng / Cài đặt | Nền dock, đế tab, icon chủ đạo chung nét/chất liệu | Nhãn đọc rõ; đề xuất nhãn sản phẩm Hồ sơ thay Profile nhưng giữ ID `profile`; selected, focus, busy và trạng thái kết nối không chỉ phân biệt bằng màu | `js/appNavigation.js`, `styles/adventure.css` |
| Nhiệm vụ và Sự kiện | Hai trang hiện có, tiêu đề, minh họa và trạng thái Sắp ra mắt | Minh họa tĩnh cùng phong cách, khung nội dung gọn | Giữ đúng trạng thái chưa có nội dung; không tự thêm nhiệm vụ, lịch sự kiện hoặc quyền nhận thưởng | `js/main.js`, `js/appNavigation.js` |
| Hồ sơ/tài khoản | Thông tin người chơi, sửa tên tại chỗ, thống kê, liên kết và chọn bản lưu | Khung hồ sơ, huy hiệu/trang trí vừa phải | Form nhập tên, validation, lưu/bận/lỗi; trạng thái kết nối và lựa chọn bản lưu giữ nguyên ý nghĩa | `js/accountPanel.js`, `styles/profile.css` |
| Dock trong từng trò | Cửa hàng / Bộ sưu tập / Bản đồ / Xếp hạng / Cài đặt; nút về Home | Chung nền/đế/icon với dock Home, có biến thể selected rõ | Đúng tab theo ngữ cảnh; giữ vị trí cuộn và tab con; gameplay không tự xuất hiện dock này | `js/appNavigation.js`, `styles/adventure.css`, `styles/app-tabs.css` |
| Bản đồ hành trình | Chặng, nút màn, đường đi, sao, khóa, rương, Vô tận/Thử thách | Nút màn và rương nổi, huy hiệu độ khó; khung nút chế độ hòa với tranh nền | Số màn, sao, khóa, tiến trình và vị trí theo layout thật; không bake bản đồ thành một ảnh chứa mọi trạng thái | `js/adventureMap.js`, `js/adventureMapLayout.js`, `styles/adventure.css` |
| Xem trước màn/chế độ | Độ khó, mục tiêu, thời gian, số đợt, tài nguyên được cấp, Chơi; tiếp tục/chơi mới | Biển tiêu đề, biểu tượng chế độ, thẻ lựa chọn, nút chính | Dữ liệu từ preview adapter; khóa/chọn được, nội dung dài; Vô tận/Thử thách giữ luật xem trước hiện hành | `js/adventurePreview.js`, `js/adventureMap.js`, `js/mainmenu.js`, `js/linkConnect/linkController.js` |
| Cửa hàng | Mọi tab con theo trò, ví Xu, thẻ hàng, xem trước, giá, số lượng, mua và mở ô khay Triple | Khung hàng, icon vật phẩm, nhãn giá, nút mua đồng bộ; tái sử dụng ảnh catalog hợp lệ | Giá và quyền sở hữu thật; đủ/thiếu Xu, đã sở hữu, đang mua, lỗi; xác nhận không che giá hoặc tác dụng | `js/shop.js`, `js/shopCatalog.js`, `styles/shop.css` |
| Bộ sưu tập | Tranh; Chủ đề; Ngoại hình/Hiệu ứng lật của Memory; Đường nối/Xóa thẻ của Link và Triple | Khung xem trước, ô trưng bày, viền trang bị, mảnh tranh | Đã/chưa sở hữu, đang dùng, chọn trước, đang tải/lỗi; giữ catalog ID và lựa chọn hiện có | `js/mainmenu.js`, `js/progression/masteryCollection.js`, `styles/mastery-collection.css` |
| Xếp hạng | Chọn trò/chế độ, bảng hạng, huy chương, hàng của mình, phân trang | Huy chương và viền hàng nổi bật có tiết chế | Tên/điểm/hạng là chữ thật; loading/rỗng/lỗi/thử lại/phân trang; không thay thuật toán hoặc dịch vụ | `js/leaderboardPanel.js`, `js/leaderboardPresentation.js`, `styles/leaderboard.css` |
| Cài đặt | Âm thanh/nhạc và âm lượng; hiệu ứng nền, tọa độ, tên thẻ; Mặc định/Nâng cao; hướng dẫn/giới thiệu/quyền riêng tư/xóa dữ liệu | Thẻ nhóm, đế công tắc, nút kéo và ảnh xem trước skin cùng chất liệu | Input checkbox/range thật, phần trăm, disabled, keyboard, focus; nội dung dài cuộn được; không tự đổi thiết lập khác khi chọn skin | `js/settings.js`, `index.html`, `styles/settings.css` |
| Gameplay chung | Tiêu đề trò, fullscreen, HUD, menu, ví Xu, sao/điểm/thời gian/lượt/miss/combo, milestone, số đợt và công cụ | Viền HUD nhẹ, khay công cụ, đế nút/icon nổi; trang trí không lấn bàn | Số/thanh tiến trình cập nhật độc lập; thiếu vật phẩm/đang dùng/khóa; giữ layout và owner game shell | `js/gameShell/gameShellHud.js`, `js/gameShell/gameHudMenus.js`, `js/gameShell/gameShell.js`, `styles/game-shell/hud-unified.css` |
| Bàn chơi Memory | Khung bàn/thẻ, mặt sau, selected/mismatch/hint, công cụ và kho nhanh | Chất liệu mặt sau/viền phù hợp theme đang chọn; không phủ hình lên mặt thẻ cần ghi nhớ | Quy tắc lật/so khớp, hit area, tọa độ và hiệu ứng do renderer hiện hữu; skin UI không thay theme thẻ | `js/ui.js`, `js/grid.js`, adapter Memory hiện hữu |
| Bàn chơi Link | Khung bàn, ô chọn, đường nối/gợi ý, ô chặn và công cụ | Viền/đế công cụ; hình trang trí không che nét nối hoặc ô trống | Đường nối và trạng thái hợp lệ vẽ theo tọa độ thật; giữ lựa chọn hiệu ứng đã trang bị | `js/linkConnect/linkShell.js`, `js/linkConnect/linkController.js`, renderer hiện hữu |
| Bàn chơi Triple | Nhiều lớp, ô bị che/được chọn, khay, ô khóa/mở thêm, undo và công cụ | Khung khay nổi có phân lớp, đế ô và icon rõ; đủ hình dạng portrait/landscape | Capacity và số ô thật, bố trí khay theo layout hiện hành; phân biệt thẻ chơi được/bị che; giữ phí mở ô | `js/tripleConnect/tripleShell.js`, `js/tripleConnect/tripleController.js`, renderer hiện hữu |
| Hướng dẫn/thông tin | Hướng dẫn hiện có, bài tập/coachmark dự kiến, giới thiệu, quyền riêng tư | Bảng giấy dễ đọc, minh họa thao tác riêng cho mỗi trò, con trỏ minh họa nếu cần | Chữ/selectable text thật, vị trí target từ DOM; chính sách dài dùng mặt giấy ít họa tiết | `js/mainmenu.js`, `js/settings.js`, `js/privacyContent.js`, adapter hướng dẫn dự kiến |
| Phần thưởng/tiến trình | EXP, bốn rương, mốc thưởng, ô may mắn, mảnh tranh, nhận/xem tranh | Rương/mảnh/huy hiệu và hiệu ứng có trọng tâm; số lượng lấy từ dữ liệu thật | Phân biệt đã đủ EXP/đợi rương trước/có thể nhận/đang nhận/đã nhận; không grant bằng animation | `js/progression/treasureModal.js`, `js/progression/treasureView.js`, `js/progression/masteryCollection.js`, `js/ui.js`, `styles/progression.css` |
| Quảng cáo và khoảng chừa | Khu vực banner trong các màn hỗ trợ, trải nghiệm trở lại sau quảng cáo | Chỉ trang trí phần khung ứng dụng bên ngoài vùng nhà cung cấp nếu phù hợp | Giữ kích thước chừa chỗ và placement hiện hành; không đổi nhãn/bọc che quảng cáo thật, không thêm quảng cáo vào bài tập | `js/ads/menuAds.js`, footer do `js/appNavigation.js` sở hữu |

### 1.2. Toàn bộ họ popup và thông báo

Popup thắng là họ ăn mừng, không phải khung duy nhất. Chung tỷ lệ bo góc, chất liệu, hướng sáng, độ dày viền, font và hệ nút; khác mức trang trí theo mục đích. Popup thông tin dài không có ba sao/ribbon đỏ lớn; popup xóa dữ liệu không có sao ăn mừng.

| Họ | Trường hợp bắt buộc | Quy cách hình và hành vi phải giữ |
|---|---|---|
| Kết quả | Thắng 0–3 sao khi dữ liệu hỗ trợ, kết quả Thử thách/Vô tận, hết giờ, thua/khay đầy Triple, kết thúc chặng | Thắng dùng bộ mẫu mới; thua dùng bảng dịu, CTA thử lại rõ; không giả sao/EXP; giữ nút thật theo completion |
| Điều hướng/gameplay | Tạm dừng, chơi lại/lượt mới, thoát/về Menu, chọn chế độ, tiếp tục bản lưu/chơi mới, preview màn | Nền gỗ/giấy gọn, nút tiếp tục ưu tiên; giữ semantics pause/resume, focus return và thứ tự hành động |
| Giao dịch/kho | Xác nhận mua, thiếu Xu/vật phẩm, Kho thời gian/Kho xem trước, mua thời gian, mở ô khay | Hiện rõ giá/tác dụng/số lượng, trạng thái bận/chống bấm lặp; lỗi có đường hồi phục; không thay transaction |
| Tiến trình/phần thưởng | Chi tiết bốn rương, mở rương, milestone/may mắn, mảnh mới, đủ bộ, xem tranh lớn | Asset rương có state, mảnh và số động; khoảnh khắc nhận thưởng hữu hạn và có thể bỏ qua; ảnh xem lớn có đường đóng rõ |
| Thông tin | Hướng dẫn, giới thiệu/phiên bản, quyền riêng tư, thông báo đổi bộ sưu tập | Mặt giấy tương phản tốt, header ngắn, body có cuộn, footer tới được |
| Tài khoản/dữ liệu | Sửa tên, chọn bản lưu, kết nối lỗi, không thể lưu/phục hồi dữ liệu, xác nhận xóa | Ngôn ngữ bình tĩnh, hành động phá hủy phân biệt bằng cả nhãn và màu; không đổi lựa chọn hoặc tự đóng hộp bắt buộc quyết định |
| Toast | Thành công, thông tin, cảnh báo, lỗi; thông báo khóa màn, vật phẩm, lưu/đồng bộ | Dải nền ảnh nhẹ/nine-slice + icon phù hợp + chữ động; vị trí top/center hiện hữu; không chiếm focus hoặc che thao tác trọng yếu; kiểm thông báo liên tiếp/dài/chồng popup |
| Tooltip/thông báo trong ván | Tên thẻ/công cụ, badge số lượng, điểm/combo/Xu, wave và trạng thái bàn | Tooltip gọn có mũi tên và mặt nền dễ đọc; hiệu ứng dùng hình/SVG/CSS, chữ số vẫn thật; không kéo thêm atlas lớn cho mỗi tick |

Owner popup dùng `js/modal.js`; luồng đặc thù ở `js/ui.js`, `js/gameExitDialog.js`, `js/shop.js`, `js/accountPanel.js`, `js/themeChangeNotice.js` và controller từng trò. Tooltip ở `js/tooltips.js`; HUD/wave theo owner hiện hữu. Khi triển khai phải đối chiếu mọi call site, kể cả presentation `screen` dùng cùng nội dung với modal; không chỉ thay CSS của `level-summary-modal`.

### 1.3. Thành phần và trạng thái dùng xuyên suốt

- Nút chính xanh lá; nút phụ cam/gỗ; nút trung tính giấy/gỗ; nút nguy hiểm đỏ có nhãn rõ. Màu đỏ ribbon là điểm nhấn ăn mừng, không thay màu cảnh báo. Có nút dài/ngắn, vuông/tròn, icon-only, đóng/quay lại/fullscreen và nút nhóm.
- Mọi nút: normal, hover khi có chuột, pressed, focus-visible, disabled, busy; nút lựa chọn thêm selected. Ảnh normal/pressed cùng kích thước ngoài, cùng điểm neo và vùng chữ. Vùng bấm tối thiểu 44 CSS px; không suy vùng bấm từ alpha ảnh.
- Tab/dock/tab con, radio độ khó, checkbox/toggle, slider, dropdown, text input, pagination, card và badge đều có state tương ứng; dùng semantic control thật bên dưới lớp hình. Công tắc không chỉ đổi màu; slider giữ thao tác chạm/phím và phần trăm.
- Icon inventory phải đối chiếu `js/icons.js`, `js/uiArtManifest.js` và catalog thực: điều hướng, công cụ theo trò, tiền/thời gian/sao/rương, tài khoản/cài đặt, khóa/check, hạng, âm thanh, hướng dẫn, sửa/xóa, mũi tên. Không coi 6 icon của popup mẫu là đủ cho cả app. Giữ ID hiện có, fallback SVG và nhãn truy cập.
- Màn nội dung có dữ liệu: loading, ready, empty, error/retry; thêm offline hoặc ownership khi chức năng hỗ trợ. Không thêm trạng thái giả chỉ để có ảnh. Chuỗi dài, số lớn và chữ tiếng Việt có dấu phải được thử bằng nội dung thật.
- Khung ảnh co giãn theo nội dung; typography, spacing, safe-area và responsive là một phần thiết kế bắt buộc. Không thu nhỏ cả ảnh popup để chữa nội dung tràn.

### 1.4. Quy tắc phối hình toàn ứng dụng

Chất liệu chung là gỗ nâu ấm, giấy kem, viền vàng, hướng sáng từ trên trái; xanh lá cho hành động tiếp tục, cam cho hành động phụ. Màn dài dùng giấy phẳng ít họa tiết; HUD/dock dùng khung mỏng để dành diện tích cho bàn chơi; kết quả/rương được nổi bật nhất. Tranh nền xanh đêm hiện có có thể giữ nếu khung và lớp nền giúp hòa tông và chữ rõ. Không biến mọi bề mặt thành ribbon đỏ hoặc một khối gỗ nặng.

Ảnh là lớp mỹ thuật chủ đạo ở nơi cần chất liệu và khối: khung, nút, đế tab, khay, icon minh họa, rương, huy chương. Chữ/số, layout, hit area, progress fill, đường nối và focus ring tiếp tục dùng DOM/SVG/CSS theo chức năng. Quyết định dùng ảnh dựa trên giá trị hình ảnh và khả năng co giãn; không chụp nguyên màn, không ghép tuyệt đối theo một screenshot.

Trước sản xuất hàng loạt cần bản thiết kế đại diện của Home, Bản đồ, Cửa hàng, Bộ sưu tập, Xếp hạng, Hồ sơ, Cài đặt, HUD ba trò, popup tạm dừng/preview/thua/thắng/rương và toast. Mỗi bản đặt trong ngữ cảnh màn thật, có kích thước nhỏ và ngang; không chỉ đưa sheet rời để suy rằng lắp vào sẽ đẹp.

## 2. Sửa lại cách kiểm chứng

Lượt Ngọc Lam trước đã kiểm bản HTML dựng riêng. Kết quả24 trường hợp chỉ chứng minh bản HTML đó; không chứng minh popup thắng trong game. Bản đối chiếu trước không trung thành với bố cục thật: thêm nút đóng, đổi vị trí tiêu đề, xếp nút dọc và minh họa thêm EXP. Chủ dự án đã chỉ ra khác biệt này; không dùng ảnh đó làm baseline sản phẩm.

Baseline đúng ở js/ui.js / styles/modals.css:
- Sao nằm phía trên tiêu đề; sao giữa lớn và nâng cao hơn hai sao bên.
- Ba hàng Xu nhận / Thời gian / Điểm, mỗi hàng có ô giá trị riêng.
- Hai nút Menu / Chơi tiếp, bình thường không có nút đóng.
- EXP/mảnh tranh chỉ hiện khi completion thực sự chứa mastery tương ứng.

Bản kiểm mới khởi động app thật qua Vite, mở từng trò, gọi chính showLevelSummaryOverlay với bộ dữ liệu kiểm soát, chụp mặc định rồi chỉ tiêm CSS review lên cùng DOM. Dữ liệu đối chiếu: Màn1,2 sao đạt/1 sao chưa đạt,+26 xu,01:13,194 điểm. Không dựng lại popup bằng HTML và không thay innerHTML để tạo ảnh.

Đây là kiểm tra component hiển thị với fixture, không là bằng chứng đã chơi thắng tự nhiên hoặc đã kiểm toàn bộ luồng cấp thưởng. CSS chỉ được nạp trong test thiết kế, chưa được import vào sản phẩm.

## 3. Bộ tài nguyên theo mẫu mới

Nguồn và báo cáo hiện hành: docs/design/advanced-ui/woodland/README.md.
- 1 nền khung gỗ/giấy trống.
- 1 ribbon đỏ trống, tách khỏi sao và tiêu đề.
- 1 sheet12 thành phần: nút cam/xanh normal–pressed, ô số nâu, nền hàng giấy, Xu, đồng hồ đỏ, sao vàng/xám, nhà và mũi tên.
- Tổng14 tài nguyên, manifest đo sourceBounds/frame/pivot/nineSlice/hash.
- Bộ52 tài nguyên Ngọc Lam giữ làm lịch sử, không phải catalog dùng để tích hợp tiếp.

Source sinh từ imagegen có thể sai kích thước/lưới. Pipeline phải đo alpha và dải trống từng cột, không chia đều một cách mù quáng. Output atlas có tọa độ nguyên và vùng đệm cố định, không alpha-trim thêm ở runtime.

Khung và nút dùng nine-slice giữ bốn góc; ribbon dùng tỷ lệ riêng. Khoảng chữ/giá trị do DOM quyết định. Kiểm riêng normal/pressed cùng hộp; không bake chữ vào nút. Icon và sao không dùng emoji/glyph làm hình.

Nút và giá trị phải kiểm box-sizing/min-width để không tràn ở320px. Màn ngang có bố trí compact riêng và phải bảo đảm giấy nằm dưới toàn bộ nội dung, ribbon không che hàng chỉ số.

Nguồn192px chỉ đủ hình96CSSpx tạiDPR2. Hero lớn hoặcDPR3 cần nguồn đủ lớn; không upscale rồi tuyên bố sắc nét. Không mặc định decode mọi atlas hoặc preload ảnh của bộ nâng cao khi người chơi đang dùng mặc định.

### 3.1. Các nhóm sheet cần làm cho toàn dự án

14 tài nguyên hiện có chỉ là bộ thử popup thắng. Số asset toàn bộ chưa chốt: phải chốt sau khi gộp các thành phần dùng chung và định kích thước hiển thị; không lấy con số 14 hoặc bộ 52 Ngọc Lam làm mục tiêu hoàn thành.

| Nhóm tài nguyên dự kiến | Thành phần | Khi tải |
|---|---|---|
| `core-controls` | Nút chính/phụ/trung tính/nguy hiểm, đế icon, đóng/quay lại, chip, tab, toggle/slider, ô nhập, giá trị, badge và state cần ảnh riêng | Bộ lõi tối thiểu khi bật Nâng cao; tái sử dụng qua mọi trang |
| `navigation-home` | Khung carousel/thẻ trò, dock, đế selected, biển tên, icon điều hướng và minh họa Nhiệm vụ/Sự kiện | Khi vào Home hoặc ngữ cảnh điều hướng liên quan |
| `map-journey` | Màn khóa/mở/hoàn thành/đang chọn, huy hiệu độ khó, marker rương và nút chế độ | Khi vào bản đồ từng trò; tận dụng nguồn chung, không nhân ba bản giống nhau |
| `gameplay-hud` | Khung HUD, thanh/ví/mốc sao, khay công cụ, công cụ theo catalog, đế khay Triple và ô khóa/mở | Khi vào trò; phần riêng chỉ tải cho trò cần dùng |
| `dialogs-notices` | Bảng thường, bảng dài, header, dải toast/tooltip, khung preview/pause/confirm/thua | Dùng lại lõi, tải thêm họ hình đặc thù khi cần |
| `shop-collection` | Khung thẻ hàng/trưng bày, giá, trạng thái đã dùng/đã sở hữu/khóa, khung tranh và xem trước hiệu ứng | Khi mở trang; preview asset theo tab hiện tại |
| `profile-ranking-settings` | Khung hồ sơ, huy chương, hàng nổi bật, thẻ nhóm cài đặt và thumbnail hai skin | Khi mở trang; controls lấy từ lõi |
| `rewards-celebration` | Sao, ribbon, bốn rương cùng trạng thái đóng/sẵn sàng/mở/đã nhận, mảnh và reveal tranh, icon thưởng | Khi gần dùng; dùng chung nguồn cho map/modal nếu đủ độ phân giải |
| `tutorial-illustrations` | Minh họa thao tác Memory/Link/Triple, công cụ/con trỏ, hoàn thành bài tập | Khi mở hướng dẫn, không preload cả bộ lúc khởi động |

Đây là nhóm phân phối theo vòng đời, không bắt buộc mỗi nhóm là đúng một PNG lớn. Chọn ảnh lẻ hoặc atlas theo tập thường được dùng chung; tránh decode tấm rất lớn chỉ để lấy một icon. Tái sử dụng core-controls và icon registry thay vì xuất bản sao trong từng sheet.

Mỗi asset phải ghi: ID ổn định, owner và nơi dùng, source/frame/alpha bounds, pivot, kích thước CSS tối đa/DPR, padding chống bleed, nine-slice/content inset nếu có, state pairing, format/hash và bundle tải. Chốt token màu/font/viền/bóng/hướng sáng trước khi sinh batch; kiểm bản ghép trên màn thật sau từng nhóm. Quy trình sinh hình không tự bảo đảm tọa độ: atlas cuối phải được đo, đóng gói bằng generator và kiểm crop đúng từng ô. Chữ nhãn và số không nằm trong texture.

## 4. Hai cách kỹ thuật đã cân nhắc

| Phương án | Lợi ích | Vấn đề | Chọn |
|---|---|---|---|
| Một ảnh popup hoàn chỉnh và điểm bấm tuyệt đối | Dễ giống mẫu tại một kích thước | Số/chữ cứng, sai sao, mờ và lệch khi co giãn, khó responsive/focus | Loại |
| Component ảnh tách rời đặt trên modal thật | Giữ dữ liệu động, nút/focus/owner thật, có fallback | Cần quy cách slice/pivot và review từng viewport | Chọn |

Không tạo framework UI hoặc event bus mới. Không sao chép luật giữa ba trò. Các adapter hiện hữu vẫn sở hữu luật và vòng đời.

## 5. Chọn giao diện trong Cài đặt

- Hai thẻ Mặc định / Nâng cao có ảnh nhỏ và mô tả tự nhiên. Dùng chung cho cả ba trò và màn chức năng; không đổi theme hình thẻ.
- Không tự chuyển người đang dùng sang skin mới. Thiếu setting thì dùng mặc định.
- Chọn skin → tải/giải mã tài nguyên cần thiết → lưu thành công → đổi lớp hình trong một lượt cập nhật. Giữ bộ cũ khi đang tải; lỗi tải/lưu có thông báo và thử lại, không pha hai bộ.
- Một owner quản lý skin; có generation để bỏ kết quả tải cũ khi đổi nhanh hoặc đổi tài khoản.
- Không remount board, nhân listener hoặc reset đồng hồ/kho/round khi đổi skin. Trong Cài đặt vẫn giữ semantics pause.
- Fallback về mặc định nếu ảnh thiếu/hỏng, hoạt động offline/PWA/subpath. Không chỉnh output manifest cũ bằng tay.
- Không vẽ đè hoặc thay nhãn bắt buộc của quảng cáo thật.

## 6. Hướng dẫn cả ba trò

File Tasty Match đủ để học cách tổ chức: làm tối ngoài mục tiêu, bàn tay chỉ dẫn, thử đường bị chặn rồi quay lại sau khi dọn, cuối bài cho người chơi tự giải. Chưa xác minh bộ sưu tập10mảnh của mẫu.

So sánh hướng dẫn trên màn thật với bàn tập riêng: màn thật giữ mạch chơi nhưng phải xử lý RNG/timer/record; bàn tập riêng có seed cố định, dễ xem lại và cách ly thưởng. Đề xuất bàn Tập luyện riêng, tái sử dụng rules/renderer qua adapter.

- Memory: lật thẻ → tìm cặp → ghi nhớ sau lần không khớp → tự giải.
- Link: thẳng → góc rẽ → thử đường bị chặn có giải thích → dọn ô cản và nối lại → tự giải.
- Triple: ô đang mở → gom3 → lộ ô dưới → quản lý khay theo capacity thật. Công cụ giới thiệu sau, không tiêu kho trong bài tập.
- Mỗi bước có mục tiêu riêng, gồm chọn đúng, ghép thành công, thử đường bị chặn hoặc dọn bàn; không dùng timeout giả hoàn thành.
- Có Bỏ qua/Xem lại, tiến trình có version, chỉ đánh dấu sau hành động đúng mục tiêu.
- Không EXP/Xu/ranking/kho đồ hoặc snapshot ván thật trong bàn tập.
- Coachmark theo vị trí DOM thật, dừng khi đóng/chuyển trò/ẩn, cleanup idempotent, reduced-motion có phương án tĩnh.
- Giới thiệu wave, công cụ, EXP, rương và mảnh tranh đúng lần đầu gặp; không ép đọc tất cả đầu game. Không chen quảng cáo trong bài tập.

## 7. EXP, rương và bộ sưu tập

Giữ contract đã duyệt:
- Mỗi lần ghép thành công nhận 2 Xu cho một cặp Memory/Link hoặc một bộ ba Triple theo luật hiện hành; không tăng theo combo, không thay thưởng thắng và không cho skin tác động cấp thưởng.
- Thắng lần đầu/màn/độ khó nhận10EXP;10màn đạt100EXP cho đúng rương.
- Bốn rương C→B→A→S: Mầm Non30xu+1Gợi ý, Lá Bạc60+2, Hoa Vàng100+3, Ánh Sao160+4. EXP kiếm trước vẫn giữ, replay không cấp lại.
- Hoàn thành bốn độ khó của một màn nhận1mảnh;10mảnh hoàn thành tranh và nhận300xu một lần.
- Rương Sưu Tập chỉ là đề xuất trình bày khoản300xu hiện có, không tự thêm cấp thưởng hoặc cộng thêm300xu.

Nâng trải nghiệm: hiện delta EXP thật sau commit, mảnh ghép vào đúng vị trí, reveal tranh và cho xem lớn/xem lại khi đủ bộ, nhận thưởng một lần. Catalog hiện có3tranh luân phiên; mở rộng tranh theo chặng cần lộ trình nội dung, không tự hứa mỗi bộ có tranh mới.

Không tự thêm buff, drop ngẫu nhiên, vật phẩm trang bị hay lợi ích mới. Grant do transaction/receipt sở hữu, không do animation hoàn tất.

Timeline thưởng đề xuất: chuẩn bị120–180ms, impact300–450ms, resolve200–300ms; nếu commit chậm dùng busy có thể đóng UI. Tối đa1hero+1lớp nắp/ảnh+8hạt, ưu tiên transform/opacity và vùng repaint trong popup. Reduced-motion hiện ngay; cancel/hidden/close giải phóng owner mà không grant lại. Đây là ngân sách thiết kế cần đo.

## 8. Gate tiếp theo

| Gate | Nội dung | Bằng chứng cần có |
|---|---|---|
| G0 — Inventory và phong cách toàn ứng dụng | Chốt bảng phạm vi ở mục 1, token mỹ thuật, baseline thật; giữ popup thắng làm mẫu thử | Đối chiếu call site, không bỏ màn/biến thể; xác định rõ chỉ có mẫu popup đã áp thử |
| G1 — Thiết kế bộ màn đại diện | Bản ghép Home và hai dock, mọi loại trang/tab, HUD ba trò, popup thường/thắng/thua/rương, toast; ưu tiên màn nhỏ và ngang | Bố cục đủ nội dung trong ngữ cảnh thật; cùng tông/hướng sáng, mọi state có đặc tả; mẫu cụ thể để chủ dự án nhận xét |
| G2 — Core và hợp đồng tài nguyên | Hoàn thiện nút/icon/control/khung/typography; manifest/generator; xuất các nhóm sheet ở mục 3.1 theo nhu cầu | Crop/pivot/slice/state/DPR đúng; không chữ cứng; so khung cùng cỡ trên nhiều nội dung |
| G3 — Skin runtime và Cài đặt | Loader, enum setting tương thích, cancel/fallback, atomic apply; Cài đặt thực với đủ control | Reload/offline/lỗi tải/lưu/đổi nhanh nhất quán; không remount game, không mất setting/round |
| G4 — Home và điều hướng | Home carousel, dock Home đủ năm tab, Nhiệm vụ/Sự kiện hiện hữu, Hồ sơ, Xếp hạng, thoát/quay lại, startup | Từng trang có bố cục hoàn chỉnh và loading/rỗng/lỗi phù hợp; không coi thay dock là đã làm xong nội dung trang |
| G5 — Các trang trong từng trò | Dock trò, Bản đồ, preview/chế độ, Cửa hàng mọi tab con, Bộ sưu tập mọi tab con, Xếp hạng/Cài đặt theo ngữ cảnh | Kiểm cả ba trò; giữ tab/scroll/ownership/giá và catalog; không thiếu hình ở màn ít mở |
| G6 — Gameplay ba trò | HUD/menu/fullscreen/công cụ/wave/milestone, khung bàn Memory/Link, lớp và khay Triple | Portrait/landscape, board nhìn rõ, trạng thái chọn/khóa/hint đọc được; input/timer/pause không đổi |
| G7 — Popup và thông báo toàn bộ | Tất cả họ ở mục 1.2: thắng/thua/hết giờ/pause/confirm/mua/kho/help/tài khoản/dữ liệu; toast/tooltip/thông báo trong ván | Mở bằng entry point thật; focus, scroll, close/backdrop/Escape theo contract; không bỏ nhánh lỗi hoặc popup lồng |
| G8 — Trải nghiệm thưởng | EXP thật, bốn rương, mảnh cuối, xem tranh, trình bày 300 Xu; kết nối với summary và map | Claim một lần qua restart/reload/lỗi lưu/đổi owner; animation không sở hữu grant; giữ luật đã duyệt |
| G9 — Hướng dẫn | Hoàn thiện trình bày help; bàn tập/coachmark qua adapter như mục 6 | Bỏ qua/xem lại/đổi trò an toàn; không thay thưởng/kho/record hoặc gây pause treo |
| G10 — Nghiệm thu toàn dự án trên web | Toàn bộ ma trận bên dưới, check/build, regression, review diff, visual/lifecycle/hiệu suất | Mọi dòng phạm vi có bằng chứng cả hai skin; không còn P1/P2 xác nhận; giới hạn máy thật báo đúng |

Các gate là thứ tự kiểm soát thực hiện, không phải yêu cầu xin phép hoặc kết thúc lượt sau mỗi gate. Khi được giao triển khai toàn kế hoạch thì thực hiện liên tục các gate chưa đạt trong phạm vi được giao, trừ blocker thực sự. Yêu cầu hiện tại là làm rõ và hoàn thiện kế hoạch toàn dự án; không được đánh dấu các gate runtime hoàn tất dựa trên mẫu popup hoặc tự coi yêu cầu này đã giao sửa toàn bộ sản phẩm.

## 9. Nghiệm thu khi tích hợp sản phẩm

- 3trò×2skin;320×568,412×915,844×390,1024×900; normal/reduced-motion vàDPR2/3.
- Popup preview/kết quả/thua/tạm dừng/Cài đặt/mua/rương/collection/help; nội dung dài có cuộn và nút cuối tới được; banner/safe-area đúng.
- 20lần đổi skin nhanh,50chu kỳ mở/đóng, restart/chuyển trò giữa animation; missing/corrupt/offline asset, save reject, stale load và đổi tài khoản.
- Đổi skin không đổi round/board/counters; tài nguyên sau dispose về baseline. Kiểm icon/nhãn/ô số không chồng lấn, không chỉ kiểm khung ngoài.
- Unit enum/manifest/loader/invariant tutorial/reward; UI/focus/fallback/claim; npm run check và npm run build ở gate cuối. Review sau implementation đọc diff và chạy lại test trọng yếu.
- Ngân sách đề xuất: mặc định không tải ảnh nâng cao; enhanced core≤600KiB, reward thêm≤400KiB. Đo decoded texture/cache/heap riêng, không dùng kích thước WebP để suy bộ nhớ.
- Mục tiêu60FPS≈16,7ms/frame trên thiết bị mục tiêu; đo cùng scenario trước/sau. Desktop không chứng minh FPS điện thoại.

### 9.1. Bằng chứng để được gọi là hoàn tất giao diện toàn dự án

- Lập bảng nghiệm thu từ từng dòng mục 1.1 và từng họ mục 1.2: màn/entry point, game/ngữ cảnh, skin, trạng thái, viewport, asset bundle, ảnh/bài kiểm, kết quả và giới hạn. Thành phần dùng chung có thể chung test cấu trúc; đường vào và biến thể theo trò vẫn cần kiểm.
- Có ảnh thật của Home, từng tab Home, từng tab trò và tab con có layout riêng; gameplay ba trò; từng họ popup/toast/tooltip. Kiểm Mặc định không regression và Nâng cao đồng bộ, không chỉ kiểm screenshot popup thắng.
- Chơi/tiếp tục/chơi lại/thoát; chuyển tab; mua/trang bị; mở cài đặt rồi trở lại ván; sửa tên/đổi ngữ cảnh tài khoản; mở hướng dẫn và nhận thưởng bằng đường đi thật. Fixture hữu ích để phủ số lớn/state hiếm nhưng không thay kiểm luồng tự nhiên hoặc transaction.
- Trên màn nhỏ/ngang: không tràn ngang, không che bàn/đường nối/khay, không cắt tiêu đề/nội dung, footer và vùng chạm tới được; popup dài không đẩy nút ra khỏi viewport. Safe-area, bàn phím ảo của form và banner reserve được kiểm riêng.
- Theo dõi tải ban đầu, tải lần đầu từng trang, cache/decoded memory và chuyển trang lại. Ngân sách core/reward ở trên chỉ là dự kiến cho hai bundle, không phải ngân sách tổng app hay bằng chứng mọi sheet đã tối ưu. Chốt trần từng nhóm sau G1/G2 theo kích thước thực; không tải chín nhóm cùng lúc.
- Ảnh, thao tác và số đo phải gắn bản build/thiết lập kiểm. Chụp trong normal-motion lẫn reduced-motion khi ảnh có thể khác; không dùng 12 case summary để đại diện ma trận này.

## 10. Hồ sơ ban đầu — 20/10/2026 (lịch sử)

| Phần | Trạng thái thật tại lần cập nhật này |
|---|---|
| Phạm vi toàn dự án và owner | Đã bổ sung vào kế hoạch từ code hiện hành; chưa phải bằng chứng thiết kế/tích hợp hoàn tất |
| Popup thắng hướng gỗ/giấy | Có 14 asset và áp thử CSS trên component thật; fixture 3 trò × 4 viewport; chỉ là mẫu thử |
| Home, hai dock, nội dung năm tab, Cài đặt, HUD/menu/bàn ba trò | Đã đưa vào phạm vi bắt buộc; chưa có bộ thiết kế/asset và nghiệm thu toàn diện theo hướng mới |
| Các popup khác, toast, tooltip, control states | Đã có inventory/họ thiết kế; chưa tích hợp skin mới |
| Các nhóm sheet toàn dự án | Đã định nhóm theo vòng đời; chưa vẽ/đóng gói đủ; không tái dùng bộ Ngọc Lam làm sản phẩm |
| Chọn Mặc định/Nâng cao | Đã có đặc tả; chưa thêm setting/loader vào runtime |
| Hướng dẫn và nâng trải nghiệm thưởng | Giữ thành luồng riêng trong cùng kế hoạch; chưa coi phần mỹ thuật/hướng dẫn mới là hoàn tất |

- Bộ Ngọc Lam và24trường hợp HTML độc lập được giữ làm lịch sử thiết kế chưa được duyệt; không là nghiệm thu popup sản phẩm.
- Bộ gỗ/giấy mới có14asset, manifest, prompt và CSS review riêng. Test ở woodland/ khởi động app thật, dùng component summary hiện hành; không import CSS này vào index/styles sản phẩm.
- Kết quả cụ thể và giới hạn tại docs/design/advanced-ui/woodland/README.md và qa/.
- Chưa thêm lựa chọn skin vào save, chưa thay runtime/public assets, chưa APK/deploy. Các lỗi check chung của working tree ghi trong hồ sơ cũ không được tự nhận đã sửa trong task mỹ thuật.


## 11. Cập nhật thực hiện — 22/10/2026

G0–G10 đã đạt phạm vi nghiệm thu web. Hồ sơ hiện hành và bằng chứng/giới hạn từng gate ở [IMPLEMENTATION.md](docs/design/advanced-ui/IMPLEMENTATION.md), phần G10 cuối. Mục10 giữ lịch sử lúc lập kế hoạch, không phải trạng thái runtime hiện tại. Giữ nguyên phạm vi và acceptance criteria của kế hoạch; FPS điện thoại thật/Google OAuth trực tiếp không được tuyên bố đã kiểm.
