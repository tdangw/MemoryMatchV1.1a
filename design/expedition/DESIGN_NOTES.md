# Thung Lũng Đom Đóm — ghi nhận thiết kế07/11/2026

Trạng thái: ảnh minh họa chờ chủ dự án xem; chưa thay giao diện hoặc triển khai tính năng, chưa là kế hoạch active.

Ảnh: home-menu-concept.png. Built-in image generation, edit từ ảnh menu chủ dự án cung cấp. Prompt: giữ logo/mascot/thế giới và ba nút trò; thêm thẻ điểm đến vườn đêm màu teal, cổng/đèn/đom đóm/viền gỗ dưới Triple và trên dock; chữ Thung Lũng Đom Đóm, huy hiệu vé5; Hồ sơ thay Profile. Không chữ nội bộ, emoji hoặc giá mua. Số5 là số vé đang có để minh họa, không phải giá vào.

Đã chốt bởi chủ dự án:
- Vé thám hiểm có nguồn từ giftbox, vòng quay và cửa hàng mua bằng Xu; lượng/phân bố/giá chưa chốt.
- Mỗi lần bắt đầu lượt mới dùng vé. Thắng tiếp tục lượt đó, không phải chuyến cố định3màn.
- Thua hoặc chủ động Thoát lượt kết thúc lượt. Chuyển ứng dụng/đóng ứng dụng giữ lượt; trở lại không trừ thêm vé.
- Xem bản đồ/luật/thưởng trước khi bắt đầu; không thu vé chỉ vì mở trang.

Dự kiến kế hoạch sau khi chốt hình: (1) chốt luật lượt, chọn trò/độ khó, thưởng và các nguồn vé/giá; (2) model vé/lượt và lưu-phục hồi, giao dịch trừ vé/cấp thưởng chống lặp; (3) giao diện menu/bản đồ moonlit và tái dùng hoạt ảnh cũ đúng vị trí; (4) tích hợp giftbox/vòng quay/cửa hàng theo ranh giới ownership với agent phụ trách tab; (5) kiểm thử kinh tế, mất mạng/đóng app/đổi tài khoản, responsive/lifecycle/performance. Không tự chỉnh các tab ở giai đoạn minh họa.

Vé chỉ giới hạn số lượt bắt đầu; người chơi giỏi có thể thắng nhiều màn trong một lượt. Cần cân đối tổng thưởng theo độ khó/thời lượng và chi phí vé, không coi việc dùng vé tự nó ngăn lạm phát.

## Minh họa nâng cấp ngoại hình07/11
Ảnh cosmetic-tiers-concept.png: ba hàng Avatar/Khung/Huy hiệu, năm bậc cùng chủ đề nhà thám hiểm/đom đóm. Built-in image generation, tạo mới. Prompt: bảng3×5, giữ nhận diện một avatar gấu trúc đỏ qua5bậc; khung gỗ→đồng→bạc→vàng/ngọc; huy hiệu đom đóm tăng chi tiết/chất liệu, không dựa màu đơn thuần; hình tĩnh rõ, không chói; tiêu đề Nâng cấp bộ sưu tập; số mảnh thêm1/2/4/6/8, tổng1/3/7/13/21. Đây là hướng mỹ thuật tham khảo, chưa phải15asset trong catalog và chưa triển khai runtime.
Chủ dự án chốt mức1–2–4–6–8, tổng21mảnh cho một món tối đa. Hiểu theo ngữ cảnh: bản trùng sau khi món đạtmax chuyển Xu; trướcmax là mảnh nâng cấp. Đom đóm tách riêng và quầy đổi chỉ nằm trong bản đồ Thung Lũng.
Đề xuất ghép để thảo luận, CHƯA chốt:3mảnh cùng loại ngoại hình→1mảnh ngẫu nhiên cùng loại; chỉ dùng mảnh chưa tiêu vào mở khóa/nâng cấp, không hạ bậc hay mất món đang trang bị. Không ra món max; có thể loại cả món nguyên liệu khỏi kết quả nếu pool còn ứng viên. Chốt tỷ lệ, pool, bảo vệ mảnh và phí trước triển khai. Không thay code/save/luật thưởng ở lượt minh họa.

## Mẫu lớp trang trí thực tế08/11
Chủ dự án chọn giữ ảnh gốc và dùng lớp trang trí theo bậc; yêu cầu bảng xem thử riêng, chưa thay game. Bảng: tier-overlay/preview.html; ảnh chụp comparison-1380.png và comparison-740.png. Cả5bậc cùng tham chiếu avatar thực event-avatar-lantern-otter-256.webp, không sửa pixel/không filter ảnh nhân vật. Chỉ5 lớp SVG tĩnh ngoài ảnh: viền gỗ→đồng→bạc/vòng lá→vàng/ngọc→chi tiết ngọc hai bên. Có ảnh gốc và mẫu64px để đánh giá nhận diện nhỏ. Lớp này là đề xuất mỹ thuật, chưa quyết định cách ghép với khung trang bị độc lập; khi triển khai cần tránh chồng chi tiết với khung.
SVG được dựng trực tiếp, không dùng image generation để vẽ lại nhân vật. Chỉ thư mục design/expedition/tier-overlay được bổ sung; không thay nguồn game, catalog, save, trang hồ sơ, build/deploy. Kiểm tra render2/2 đạt ở1380và740px: cùng source ảnh256px, không filter, đủ5bậc, không tràn ngang. Sửa tràn hộp ảnh đã thực hiện trong trang xem thử. Test và log nằm local/ignored.

## Bảng phối avatar + khung + huy hiệu08/11
Mẫu cũ bị chủ dự án bác vì lớp trang trí avatar trùng vùng khung/huy hiệu. Bảng mới riêng tại equipped-tier-preview/preview.html và comparison.png; không áp dụng vào game.
Dùng đúng3ảnh gốc hiện có: Rái Cá Đèn Lồng, Vòng Gỗ Mộc, Lá Đầu Tiên. Mỗi loại giữ nguyên cùng1source qua5bậc, bổ sung lớp SVG tĩnh theo bậc. Avatar chỉ thêm điểm nhấn trong vùng tròn của ảnh, không trang trí dưới chân hoặc bên ngoài. Khung khảm trên phần thân, không tăng kích thước; tránh khu vực huy hiệu giữa phía dưới. Huy hiệu chỉ thêm trang trí trong footprint riêng. Bậc1 không thêm trang trí. Huy hiệu khi trang bị dùng vị trí/kích thước hiện hành: left36%,top68.4%,width/height28%; nằm trên avatar/khung. Có3hàng tách từng loại và hàng phối cùng lúc ở216px/116px.
Kiểm tra render1/1 đạt: cùngsource cho từngloại, decodeảnh đủ, vị trí badge đúng tỉ lệ; đã xem PNG phối thực tế. Hạn chế mỹ thuật: khác biệt avatar khi thu nhỏ còn nhẹ; lớp khung/huy hiệu cần mẫu theo nhóm hình dáng khi mở rộng, không coi mẫu vòng gỗ là lớp vừa mọi món. Không sửa nguồn game, save, catalog, tab hay asset gốc; không build/deploy.

## Mẫu3hình thái vẽ riêng08/11
Chủ dự án yêu cầu phương án2:5bậc nhưng3hình thái, thay đổi rõ và ghép chính xác, không rối. Bảng ở three-form-preview/preview.html và comparison.png. Bậc1–2 dùng3ảnh gốc không đổi;3–4 dùng avatar áo/mũ xanh rừng, khung bạc, huy hiệu lá bạc/nền teal;5 dùng avatar áo/mũ lam-vàng/đèn ngọc, khung vàng-ngọc, huy hiệu lá ngọc/nền lam. Hình mới không thêm trang trí nổi phụ.
Built-in image generation:6lần edit độc lập, mỗi lần lấy ảnh gốc đúng loại. Prompt avatar giữ rái cá/cầm đèn, thay mảng trang phục lớn, không viền/huy hiệu, mọi chi tiết trong hình tròn; frame thay vật liệu toàn thân, giữ lỗ giữa trong suốt và đáy trơn không mặt dây, không vương miện/hào quang; badge giữ chiếc lá và medal tròn, thay vật liệu gỗ→bạc/men teal→vàng/ngọc/men lam, không phụ kiện ngoài. Nền ngoài cả6ảnh trong suốt.
Exports mới512×512 WebP92 giữ alpha ở three-form-preview/{avatar,frame,badge}-{2,3}.webp; nguồnPNG retained trong Codex generated_images. Chỉ đổi định dạng/kích thước bằng Pillow, không sửa nội dung ảnh; căn tỉ lệ/tâm trong HTML dựa bounding box alpha, ghi alignment.json. Frame2và3 có alpha0 tại tâm. Huy hiệu đúngslot hiện tại left36%,top68.4%,width/height28%,z-index2; avatar trong lỗ khung, không khảm chung. Bảng có3hàng từng loại và hàng phối ở230px/116px. Đã xem ảnh tổng hợp: thay đổi rõ về chất liệu/trang phục; không che mặt, huy hiệu đọc được và không gắn thêm icon đè huy hiệu.
Render test1/1 PASS: sourcebậc1=2,3=4,3hìnhthái/loại, vịtrí/lớp badge đúng. Không sửa game, catalog, assetgốc, save, build/deploy; đây là mẫu riêng chờ đánh giá.


## Rà soát phạm vi08/11
Catalog có101món (39avatar/39khung/23huy hiệu),303file đủ3cỡ. Áp dụng3hìnhthái cho toàn bộ cần202thiết kế mới,606file xuất bổ sung. Toàn bộ file hiện có đúng kích thước/alpha,39khung có tâm trong suốt. Báo cáo COSMETIC_SCOPE_AUDIT.md và danh sách cosmetic-inventory.json. Đang chờ lựa chọn phạm vi toàn101hay một nhóm trước khi mở kế hoạch triển khai hình ảnh/dữ liệu; chưa tạo hàng loạt hoặc sửa game. Các ghi nhận ý tưởng vé chơi thắng tiếp lượt trong đoạn07/11 là lịch sử thảo luận; đề xuất mới hơn là1vé/1lần thử một màn, trò ngẫu nhiên, không dùng đoạn cũ làm luật thực thi.

## Kế hoạch logic và màn tự nâng08/11
Chủ dự án chọn toàn101món và tự nâng khi đủ mảnh. Kế hoạch hiện hành COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md ghi8gate từ khóa luật/model/receipt/migration/rules tớiUI/ảnh/render/nghiệmthu; chưa triển khai logic. Bản trùng saumax→Xu là đềxuất ưu tiên, không thêm tài nguyên đặcbiệt; ghép từ mảnh chưa tiêu đang chờ chốt. Không hiểu mảnh đã tiêu là kho cóthể rútra đểghép.
Mẫu auto-upgrade-preview/preview.html,comparison.png: ảnh thật từ ba hìnhthái;avatarbậc3 2/6mảnh vàbậc5 21/21; giữ nguyênframe/badge ở cảhai bên, không có nút Nâng cấp. Render1/1đạt, đãxemảnh; chỉtài liệu/trangthamkhảo, không sửa sourcegame/schema/rules/liveops. Chưa chạybuild/testgame vì không đổi game.

## Trang hồ sơ thực tế08/11
Chủ dự án yêu cầu thay ảnh giải thích bằng đúng trang profile, một mẫu đại diện, không chữ giải thích/mô tả hoặc bậc. Đã chụp profile-preview/profile-mobile.png trực tiếp từ renderer trang hồ sơ hiện có ở412×915, chỉ thay hình portrait trong phiên browser bằng avatar/khung/huy hiệu hình thái hoàn thiện. Vị trí/thông tin/nút/dock/quảng cáo giữ layout sản phẩm hiện hành. Dữ liệu An Nhiên/ngày/thời gian là dữ liệu mẫu trong phiên riêng, không truy cập hoặc ghi tài khoản thật. Không chèn labelbậc/thanhmảnh/khối giải thích vào profile.
Render1/1đạt; xemảnhthực tế,3ảnh khớp tâm và badgeđúngslot, không che mặt. Không sửa nguồn profile/CSSgame/save, khôngbuild/deploy. Mẫu auto-upgrade-preview trước đó chỉ là nội dung thảo luận, không được coi là bố cục profile đã duyệt.

## Mẫu Bộ sưu tập08/11
Theo yêu cầu vẽ giao diện thật sẽ thiết kế: collection-preview/collection-mobile.png, nguồn surface.html/preview.css/preview.js. Dùng khung trang/dock/ad hiện tại trong phiên browser riêng, ba tab Avatar/Khung/Huy hiệu, bản phối trên cùng và lưới3cột; nguồn ảnh và tên từ cosmetic-inventory.json. Chọn món sở hữu chỉ đổi đúngslot trong draft, giữ hai slotcòn lại; món khóa làm mờ/kýhiệu SVGkhóa, món đang chọn viền vàng/checkSVG. Có tênmón, Chi tiết và Trang bị; không chữ giải thích/bậc hoặc tiếntrình trên màn phối. Trạngthái sởhữu/đangchọn là mẫu trong phiên xem thử, không ghi game/account.
Kiểm tra render1/1đạt:3cột ở412×915, tabswitch, ảnhdecode, selection và nútTrangbị nằmtrên dock. Rà PNG cuối, đã sửa vùngfooter bịdockche ở bảnđầu. Đây chỉ bảnxemtrước bố cục, nútChi tiết chưa mở mànchi tiết trong mẫu, không coi logic tínhnăng đãtriểnkhai. Không sửa renderer/CSSgame/save/catalog, không build/deploy.


## Quyết định mới nhất: 21 level và mảnh sau Max — 08/11
Phương án hiện hành duy nhất nằm trong COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md: nhận đầu Level1, mỗi bản trùng +1 tới21 hiển thị Level Max. Ba hình thái dùng các dải1–6/7–20/21. Sau Max nhận mảnh Avatar/Khung/Huy hiệu theo loại món; mảnh có thể bán Xu hoặc chọn3mảnh bất kỳ, kể cả trộn loại, nhận ngẫu nhiên1rương Avatar/Khung/Huy hiệu. Rương vào kho rồi mở theo tỷ lệ, không bảo đảm ngoại hình. Giá bán/tỷ lệ/định lượng bản trùng→mảnh còn khóa ởGate0.
Quyết định này THAY THẾ các đoạn lịch sử5bậc tiêu1/2/4/6/8mảnh, đổi thẳng Xu sauMax, ghép3mảnh cùng loại→1mảnh và ghép mảnh chưa dùng nângbậc. Không có kho mảnh riêng theoID trướcMax nữa; không lấy các ví dụ UI cũ làm luật. Các PNG cũ chỉ minh họa mỹthuật/bố cục; khi triển khai cần cập nhật chữ/nhãn theo21level.
Bố cục dựa mẫu profile-preview/profile-mobile.png và collection-preview/collection-mobile.png; bổ sungLevel góc thẻ, Level Max ở21, kho mảnh/Bán/Ghép riêng trong Bộsưu tập, không đưa bảng giải thích vào profile. Quầy đom đóm vẫn chỉ ở ThungLũng, chưa triển khai trong task ngoại hình.
Ảnh theo6lô A0–A5:3/28/28/28/12/2món =101;6/56/56/56/24/4thiết kế mới =202. Manifest cosmetic-art-batches.json ghi từngID/ảnhgốc/form2,3. Lượt này chỉ cập nhật kế hoạch/manifest; không sourcegame/save/rules/tỷlệ, không tạoảnh hàngloạt, không check/build/deploy.
