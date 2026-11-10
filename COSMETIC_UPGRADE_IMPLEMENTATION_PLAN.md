# KẾ HOẠCH LEVEL NGOẠI HÌNH VÀ LÔ ẢNH — 08/11/2026

Trạng thái08/11: đã được giao toàn task, bổ sung offline/local-first và phân công hai chat theo mục13–14 bên dưới. Kinh tế đã chốt: bán100Xu/mảnh, ghép3mảnh phí20Xu, ghép3chữ phí10Xu; nguồn ngoại hình chọn cả món mới và đã có trong101món; đổi hình ởLevel7và21. Kho rương đổi nhãn Kho lưu trữ, ô lưới icon và popup, có bán/mở nhiều rương theo mục8. Source logic đã bắt đầu tích hợp nhưng **chưa nghiệm thu**:50unit đạt trước phần bán rương; emulator đã chạy và đang lỗi ngân sách1000biểu thức ở nhận ngoại hình. Không dùng source hiện tại làm bản đã hoàn tất, không phát hành. Handoff chi tiết trong design/expedition/IMPLEMENTATION_NOTES.md. Ảnh đang tạo riêng, chưa gắn catalog sản phẩm. Tài liệu này thay thế phương án5bậc tiêu1/2/4/6/8mảnh và Max đổi thẳngXu cũ.

## 1. Phạm vi đã chốt

- Toàn bộ 101 món: 39 avatar, 39 khung, 23 huy hiệu. Giữ ID, quyền sở hữu và lựa chọn trang bị hiện có. Không mở rộng sang nền, thẻ hoặc effect-cover.
- Nhận món lần đầu: Level 1. Mỗi bản trùng hợp lệ trước Max tăng 1 level; không nút nâng cấp, không tiêu mảnh để tăng level, không có mảnh riêng theo từng ID.
- Level tối đa là 21, hiển thị đúng chữ **Level Max** thay cho Level 21.
- Ba hình thái, giữ các mốc tích lũy của phương án trước: Level 1–6 hình gốc; Level 7–20 hình nâng cấp; Level 21 hình hoàn thiện. Những mốc này được ghi rõ để không hiểu nhầm Level 3 đã đổi hình như mẫu 5 bậc cũ.
- Sau Max, mỗi bản trùng chuyển thành1mảnh theo loại món: mảnh Avatar, mảnh Khung hoặc mảnh Huy hiệu; không tự nhân theo nguồn/độ hiếm.
- Người chơi được bán các mảnh lấy Xu hoặc ghép **3 mảnh bất kỳ**, có thể trộn cả ba loại, để nhận ngẫu nhiên 1 rương Avatar, Khung hoặc Huy hiệu. Có thể dùng 3 mảnh cùng loại; không bắt buộc đầu vào cùng loại.
- Ghép cấp rương vào kho, chưa mở và chưa cấp quà bên trong. Khi người chơi mở rương, dùng luật xác suất của rương được duyệt; không bảo đảm nhận ngoại hình.
- Bán mỗi mảnh nhận100Xu. Mỗi lần ghép3mảnh tiêu thêm20Xu; ba loại rương có cơ hội bằng nhau, mỗi loại1/3. Mỗi lần ghép3chữ tiêu thêm10Xu; giữ luật chọn chữ đang dùng. Chỉ trừ phí khi giao dịch thành công, không trừ lại khi phục hồi/replay.
- Kết quả ngoại hình mới từ rương/vòng quay được chọn ngẫu nhiên cả món đã có và chưa có, trong101món đúng loại; gồm ba món starter. Giữ trọng số nhánh Xu/hỗ trợ/ngoại hình, không đổi kết quả đã chốt theo policy cũ.
- Không hạ level, không bán vật phẩm đang sở hữu, không rút lại các bản đã dùng để tăng level. Mỗi món có level riêng; nâng avatar không tự nâng khung/huy hiệu.
- Vẽ thêm hai hình thái cho từng món: 202 thiết kế mới, xuất 606 file ở 128/256/512; cùng 303 file gốc thành 909 file sản phẩm, không phải 909 thiết kế.

Ngoài phạm vi: triển khai Thung Lũng, vé thám hiểm, map ngẫu nhiên, thu đom đóm hoặc quầy đổi quà. Các nguồn đó có thể gọi luồng cấp ngoại hình chung sau này. Quầy đom đóm chỉ thuộc bản đồ Thung Lũng, không đưa sang hồ sơ/Bộ sưu tập. Không tự deploy, phát hành rules, APK hoặc sửa task của agent khác.

## 2. Luồng nghiệp vụ và các trường hợp biên

| Trạng thái trước nhận | Kết quả nhận 1 bản hợp lệ |
|---|---|
| Chưa sở hữu | Mở khóa món và đặt Level 1 |
| Level 1–19 | Tăng đúng 1 level; tới 7 đổi sang hình nâng cấp |
| Level 20 | Thành Level Max và đổi hình hoàn thiện; chưa cấp mảnh |
| Level Max | Giữ nguyên món/level và cấp mảnh đúng loại |
| Operation đã xử lý | Trả lại kết quả cũ, không tăng level hoặc mảnh lần hai |

Ví dụ một gói cấp 3 bản cho món ở Level 20: 1 bản hoàn tất Max, 2 bản còn lại thành 2 mảnh. Không cấp cả 3 mảnh, không vượt Level 21. Khi chưa sở hữu, bản đầu trong gói mở khóa Level 1 rồi mới tính các bản còn lại.

- Nhãn Level tính từ trạng thái đã commit, không từ số lần render hoặc từ hoạt ảnh kết thúc. Reload, bỏ/đổi trang bị không tác động level.
- Bán mảnh: chọn loại và số lượng; trừ kho + cộng Xu + receipt trong một giao dịch. Hủy, hết mảnh hoặc lỗi trước commit thì không mất mảnh. Giao dịch đã commit nhưng mất phản hồi phải phục hồi đúng một lần.
- Ghép rương: người chơi chọn vector đầu vào avatar/frame/badge với tổng đúng 3, mỗi số không âm và không vượt số dư. Kết quả luôn 1 trong ba loại rương, không phụ thuộc việc chỉ dùng một loại hay trộn loại.
- Random loại rương được lưu bền trước commit; xem tỷ lệ hoặc đóng/mở popup không cấp rương, không trừ mảnh, không lăn lại kết quả đã chốt. Nếu conflict phải rebase hợp lệ, giữ entropy/policy đã lưu; sau commit chỉ replay receipt.
- Mở rương là giao dịch khác: trừ 1 rương, cấp đúng một kết quả theo policy. Nếu ra ngoại hình, đi qua cùng luồng tăng level/Max → mảnh; nếu ra Xu/hỗ trợ thì giữ loại thưởng đó. Không cấp thêm mảnh chỉ vì kết quả rương không phải ngoại hình.
- Khi cả kho ngoại hình đã Max, không vô hiệu hóa luồng nhận bản trùng; bản trùng vẫn phải tạo mảnh như luật đã chốt.

## 3. Quyết định đã khóa và phần còn cần xác nhận

Đã khóa qua các câu trả lời của chủ dự án:100Xu/mảnh cho cả ba loại;1bản sau Max thành1mảnh;3mảnh bất kỳ +20Xu thành1rương ngẫu nhiên đều ba loại;3chữ +10Xu thành1chữ theo luật chọn hiện hành. Chọn ngẫu nhiên cả món mới lẫn đã có trong101món, bổ sung ba starter vào nhóm đúng loại; không thay trọng số loại quà.

Đã chốt mốc đổi hình7và21:Level1–6 hình gốc,7–20 hình nâng cấp,21 hình hoàn thiện/Level Max. Brief từng món phải giữ chủ đề/nhận diện gốc và hướng ba hình thái đã chọn; sáu ảnh mẫu cần QA trước khi nhập sản phẩm.

## 4. Kinh tế và vòng lặp mảnh → rương

Không coi tăng số tầng quy đổi là bằng chứng kinh tế tự cân bằng. Mô phỏng trước khi duyệt giá và tỷ lệ:
- Nguồn cấp ngoại hình → thời gian đạt Level 7/Max theo pool thực; khác biệt giữa món mới, người chơi có một phần bộ và người đã Max nhiều món.
- Mảnh có thể bán lấy Xu hoặc dùng 3 mảnh lấy rương; so sánh lựa chọn này mà không tự gán mọi ngoại hình một giá Xu giả định.
- Với giá đã chốt, bán3mảnh nhận300Xu; ghép tiêu3mảnh và20Xu. Ghép thiên về cơ hội sưu tập/hỗ trợ, không phải cách kiếm Xu lời hơn bán. Trung bình nhánh Xu trực tiếp là46,67Xu/rương, sau phí còn26,67Xu trước khi tính cơ hội40%hỗtrợ/20%ngoại hình. Không coi26,67Xu là tổng giá trị quà hoặc lợi nhuận vì đã tiêu3mảnh.
- Rương có thể tạo lại mảnh nếu ra món đã Max. Đo số mảnh kỳ vọng trả lại cho mỗi rương, tỷ lệ tạo lại rương và tổng Xu/hỗ trợ từ chuỗi ghép/mở. Không được tạo chuỗi tự duy trì hoặc cấp mảnh cả khi ra quà không phải ngoại hình.
- Thử trạng thái 0%, một phần và 100% món Max; vector đầu vào 3/0/0, 2/1/0 và 1/1/1; giá/tỷ lệ ở biên, nhiều lần ghép liên tục.
- Không tăng ghi mạng theo tick/frame. Chỉ ghi theo nhận quà/bán/ghép/mở rương có ý nghĩa.

## 5. Nguyên nhân gốc và ranh giới owner hiện tại

- achievementModel.js/acquisitionModel.js chủ yếu chứng nhận quyền “đã sở hữu”. Receipt theo itemID như uid:chest:item:itemID không đủ đếm nhiều lần nhận cùng món. Giữ receipt quyền cũ; bổ sung đường nhận từng bản theo operation/sequence, không đếm số grant cũ.
- chests.js hiện ưu tiên unowned, hết pool món mới đổi Xu; resolve vật phẩm đã có cũng đổi Xu. Phải chuyển đúng boundary của **kết quả ngoại hình mới** sang Level/Max → mảnh, không chỉ thêm nhãn UI. Không sửa hồi tố receipt đã chốt.
- wheelRewards.js, sparkModel.js, letters.js, service.js có candidate/policy riêng. Đổi chữ khi bật rương chỉ cấp rương: không cộng level/mảnh ở cả bước đổi chữ và mở rương.
- persistence.js/ledger.js áp thưởng và giữ watermark. Nhận bản, tạo mảnh, bán mảnh, tạo/mở rương phải cùng bảo vệ chống replay.
- Field Spark.cosmetics đã phục vụ sự kiện cũ; không đổi ý nghĩa field đó cho level. Chốt namespace/schema mới ở Gate 1.
- Catalog và rules có generator/template. Chỉnh source rồi sinh lại output; không sửa generated output bằng tay.

## 6. Phương án kỹ thuật

Chọn một model thuần dùng chung, adapter theo nguồn thưởng và projection chỉ đọc cho UI. Loại phương án mỗi tab tự tăng level/cộng mảnh: dễ lệch receipt, nguồn dữ liệu và double grant. Không dùng callback hoạt ảnh để quyết định thưởng.

- Một nguồn sự thật theo UID; level nằm trong [1,21] cho món đã có, kho mảnh chỉ ba bộ đếm không âm và kho rương hiện có. Không có “mảnh đang tích lũy theo món” của phương án cũ.
- Schema có version và các giới hạn safe integer. Bounded map tối đa các ID hợp lệ trong catalog, không tự tạo quyền sở hữu từ một số level không có chứng cứ.
- Với grant nhiều bản, tính tăng level tới Max và phần dư tạo mảnh bằng phép tính hữu hạn; không loop theo quantity không giới hạn.
- Phân biệt receipt quyền sở hữu lâu dài và receipt mỗi lần nhận/sell/fuse/open theo operation/sequence. Journal có giới hạn và thu hồi theo watermark, không giữ lịch sử tăng vô hạn.
- Trừ mảnh + nhận Xu hoặc rương phải atomic. Hai thiết bị cùng bán/ghép không tiêu cùng số dư hai lần. Không merge kho tiêu hao bằng cộng mù hoặc max từng field; dùng canonical revision/CAS/rebase.
- Random tạo ngoài transaction retry, lưu operation/policy/entropy trước chi tiêu. Không cho hủy/mở lại để lăn lại một operation đã tiêu tài nguyên.
- Phí ghép chữ10Xu dùng policy mới có version; pending/receipt ghép miễn phí cũ tiếp tục theo luật cũ. Không sửa hồi tố lịch sử. Kiểm tra số dư Xu trước tiêu; ví, chữ/mảnh, kết quả và journal cùng commit. Quy tắc remote phải chặn giao dịch trừ nguyên liệu nhưng không trừ phí, thiếu Xu, âm ví hoặc thu phí hai lần.
- UI gửi command tới owner; renderer không sửa trực tiếp level/kho. Nâng cấp, bán, ghép và mở rương có success/failure/cancel/stale rõ ràng.

## 7. Dữ liệu cũ, phiên bản và phục hồi

- Món cũ đã có → Level 1. Không giả lập số lần nhận lịch sử, không đổi các Xu từng được cấp thành level hoặc mảnh, không thu hồi Xu cũ.
- Starter/backfill/đăng nhập lại chỉ công nhận sở hữu ban đầu một lần; không biến mỗi lần normalize thành một bản mới.
- ID món đang trang bị giữ nguyên, hình thái suy từ level; không tạo ba quyền sở hữu độc lập cho ba hình thái.
- Receipt/candidate đã commit hoặc pending từ policy cũ giữ luật cũ; không chuyển một quà Xu đã chốt thành mảnh mới. Policy mới chỉ áp dụng tại boundary/version được duyệt.
- Mở rộng schema phải có migration idempotent, giữ nguồn cũ, validate missing/unknown/corrupt và chặn ghi không an toàn. Không normalize lỗi thành kho sạch rồi ghi đè.
- Cloud backup/restore, guest → Google, đổi UID, logout/reset/xóa tài khoản phải mang đúng level/kho mảnh/rương/journal và không cấp lại tài nguyên đã xử lý.
- Kiểm tra client cũ ghi snapshot thiếu field mới, cross-device conflict, crash sau trừ trước cộng, mất phản hồi sau commit, tiếp tục operation khi khởi động lại. Rules/client rollout cần kế hoạch phối hợp riêng; không tự deploy trong task nguồn.

## 8. Bố cục giao diện

Nguồn bố cục được người dùng chỉ định: design/expedition/profile-preview/profile-mobile.png và collection-preview/collection-mobile.png. Những bản so sánh/giải thích trước đó không phải màn sản phẩm.

- Profile giữ bố cục gọn và chỉ bộ đang trang bị như mẫu. Không thêm bảng giải thích, thanh mảnh cũ hoặc cả kho lên trang chính.
- Bấm ảnh hồ sơ → Bộ sưu tập: bản phối trên, ba tab Avatar/Khung/Huy hiệu, lưới 3 cột mobile và tăng cột trên PC; mỗi món chỉ một ô. Chọn một món chỉ đổi slot đó trong draft; giữ hai slot còn lại, xem trước rồi Trang bị.
- Món đã có ghi **Level 1 … Level 20** ở góc trên thẻ; tới 21 ghi **Level Max**. Chừa vùng riêng cho nhãn, không đè mặt, thân khung hoặc huy hiệu. Trạng thái đang chọn/đang dùng/khóa không trùng vị trí nhãn level. Món chưa có dùng khóa, không hiện Level 0.
- Món khóa làm mờ; ba hình thái không thành ba ô hoặc ba món mới. Trang chi tiết có level và ba hình thái xem trước; không còn UI “2/6 mảnh lên bậc 4” hay nút nâng thủ công.
- Đổi tên tab Kho rương hiện tại thành **Kho lưu trữ**, giữ tab ID cũ để tương thích lựa chọn đã lưu. Trong tab có nhóm Rương chưa mở và Mảnh ngoại hình; tương lai thêm nhóm vật phẩm theo loại, không thêm counter hoặc timer rời rạc. Mảnh đúng ba loại và số dư; bấm một loại mở popup **Bán / Ghép** giống bộ chữ. Bán chọn số lượng và tổngXu; Ghép cho chọn3mảnh bất kỳ từ các loại đang có, hiện phí20Xu trước xác nhận. Không thêm tab Mảnh riêng. Không nhầm với đom đóm, huy hiệu thu thập của sự kiện hoặc quầy đổi đom đóm.
- Ghép cho chọn đầu vào tổng 3, xem tỷ lệ; nhận rương vào kho. Hiện rương vừa tạo và đường tới Kho lưu trữ, không tự mở hoặc giấu xác suất.
- Nút xác nhận ghép mảnh hiện20Xu, ghép chữ hiện10Xu; thiếu Xu không cho xác nhận và không trừ nguyên liệu. Bán hiển thị tổngXu theo số lượng×100 trước xác nhận.
- Kho lưu trữ dùng một lưới phân trang chung, một ô cho mỗi loại vật phẩm đang có; chỉ icon trên ô, không tên/nút/số lượng trên lưới. Tên và số lượng nằm trong popup và nhãn truy cập. Dự kiến4cột×6hàng trên điện thoại,6cột×6hàng khi đủ rộng; đo vùng nội dung thực320/384/412/ngang/desktop để chốt kích thước, không ép icon nhỏ. Tab ID chests giữ nguyên dù nhãn đổi. Có slot trống và phân trang để mở rộng loại vật phẩm, không tạo counter riêng cho từng trang.
- Rương bấm mở popup Xem tỷ lệ / Mở / Bán. Mảnh bấm mở Bán / Ghép; không có Mở cho mảnh. Mở và Bán dùng thanh trượt số lượng như bán chữ. Bán rương Avatar/Khung/Huy hiệu200Xu mỗi loại; giá mua dự kiến10.000Xu mỗi loại được ghi nhận, chưa tự mở rộng triển khai cửa hàng nếu chưa được giao. Rương C bán bằng một nửa giá trị quà trung bình quy ra giá mua hỗ trợ:40%×50Xu +60%×mean(158,6667;158,5;158,5)=115,1333Xu; một nửa57,5667 làm tròn58Xu. Rương khác tương lai phải có policy giá trị/tỷ lệ được tính riêng, không áp200Xu mù.
- Mở nhiều: chọn số lượng, mỗi rương là một operation lưu bền và xác nhận riêng; hiệu ứng lần lượt, cuối cùng một popup tổng quà. Đóng popup hoặc mất mạng dừng yêu cầu mở tiếp, operation đang gửi vẫn phục hồi đúng một lần; rương chưa bắt đầu vẫn trong kho. Không trừ toàn bộ số lượng trước rồi mới mở dần, không lặp request hàng loạt sau khi owner đóng.
- Thông báo nhận bản/tăng level/tiến hóa/mảnh sau Max chỉ hiện từ kết quả commit, không phát lại sau reload nếu receipt đã áp dụng. Profile đọc cùng projection với Bộ sưu tập/header/bảng xếp hạng.
- Chữ dành cho người chơi tự nhiên, không “mock/debug/API” hay giải thích triển khai. Minh họa dùng ảnh/SVG/CSS, không emoji làm đồ họa.

## 9. Kế hoạch lô ảnh và pipeline

Danh sách 101 ID theo lô: **design/expedition/cosmetic-art-batches.json**. Mỗi món có đúng hai thiết kế mới, hai form gắn vào cùng ID, không đổi mẫu trang bị theo tên file.

| Lô | Nội dung | Số món | Thiết kế mới |
|---|---|---:|---:|
| A0 | Rái Cá Đèn Lồng + Vòng Gỗ Mộc + Lá Đầu Tiên, chuẩn hóa mẫu |3|6|
| A1 | Memory Match |28|56|
| A2 | Link Connect |28|56|
| A3 | Triple Connect |28|56|
| A4 | Sưu tập chữ |12|24|
| A5 | Chim Sẻ Nhỏ + Ánh Đom Đóm còn lại |2|4|
| Tổng |39 avatar /39 khung /23 huy hiệu|101|202|

Quy trình từng lô:
1. Brief từ ảnh gốc: giữ nhân vật/biểu tượng/chủ đề, thay rõ trang phục/chất liệu/hình khối; không ép tất cả món thành cùng bộ bạc–vàng. Chốt silhouette và vùng an toàn cho mặt/lỗ khung/vị trí badge.
2. Vẽ riêng form nâng cấp và hoàn thiện; dùng công cụ tạo ảnh theo từng tài sản, giữ master/source và prompt. Sáu ảnh mẫu A0 có thể tái dùng sau QA, không mặc định đạt sản phẩm chỉ vì đã có screenshot.
3. Căn canvas, alpha và anchor tại nguồn xuất, không tính bounding box hoặc sửa ảnh theo frame ở runtime. Giữ ảnh gốc và file base ổn định; không ghi đè form gốc bằng form mới.
4. Xuất 128/256/512 từ nguồn đủ độ phân giải, không phóng ảnh nhỏ để giả nguồn lớn. Ghi hash, kích thước, trạng thái QA vào manifest; sửa generator/source, không sửa generated catalog.
5. QA ảnh lẻ, lỗ trong suốt của khung, mặt nhân vật, dấu hiệu huy hiệu; ghép chéo với các món khác và thử 116px/header nhỏ. Kiểm tra tự động các cặp và rà ngoại lệ, không chỉ xem bộ đồng nhất.
6. Chỉ nhập lô đủ file/QA vào catalog. Trong phát triển có thể bổ sung dần; bàn giao toàn bộ vẫn phải đủ 202 thiết kế và 606 export. Fallback ảnh lỗi về form gốc của đúng món không được dùng để coi ảnh còn thiếu là hoàn tất.
7. Ghi dung lượng thực theo lô, khả năng nén và tải đúng cỡ/form. Mỗi portrait chỉ vẽ ba ảnh avatar/frame/badge; không preload/decode toàn bộ 909 file hoặc chồng cả ba hình thái.

Bổ sung món tương lai bằng nguồn manifest/catalog và policy level dùng chung; không thêm switch/if theo từng món vào renderer. Không thêm các lớp trang trí chung đã bị bác hoặc loop hoạt ảnh chỉ để phân biệt level.

## 10. Gate triển khai

- [x] Gate 0 — Chốt mục 3, nguồn bản sao cho đủ 101 món, giá mảnh, tỷ lệ ghép/rương và kinh tế vòng lặp; duyệt bố cục có nhãn Level/Level Max và kho mảnh. Phân ranh file với agent khác trước chạm module chung.
- [x] Gate 1 — Spec schema/owner/version/migration và model thuần: nhận lần đầu, mỗi bản +1, mốc 6→7/20→21, grant nhiều bản, Max→mảnh đúng loại, bán và ghép mọi tổ hợp, giới hạn số/nguyên liệu/candidate.
- [x] Gate 2 — Tích hợp rương/vòng quay/đổi chữ/nguồn được duyệt qua cùng boundary; receipt từng lần, journal, replay và canonical projection. Giữ xác suất loại thưởng đã chốt; không cộng level/mảnh ở hai chặng của cùng rương.
- [x] Gate 2 bổ sung — Phí20Xu ghép mảnh,10Xu ghép chữ; trừ nguyên liệu/phí/cấp kết quả atomic; UI hiện giá, xử lý thiếuXu; pending/receipt cũ không bị thu phí hồi tố.
- [x] Gate 3 — Persistence/cloud/Auth/rules: migration idempotent, receipt/candidate cũ, crash/retry/two-device/UID/backup/reset/xóa; emulator cả allow/deny. Template/generator sinh lại rules; deploy rules theo quyền bổ sung09/11 bên dưới và xác minh hash sau phát hành.
- [x] Gate 4 — UI theo mẫu, Level/Level Max, phối/thay trang bị, kho mảnh/Bán/Ghép, cấp rương vào kho và mở rương riêng. Test 320/412/ngang/desktop, thao tác nhanh, đóng popup khi pending, offline/retry, focus và không lộ chữ nội bộ.
- [ ] Gate 5 — Pipeline và toàn bộ lô A0–A5, đủ 101 món/202 thiết kế/606 export, manifest/hash/alpha/alignment/cross-match/nhận diện nhỏ. Không dừng task toàn bộ sau một lô nếu đã được giao triển khai toàn task.
- [ ] Gate 6 — Đồng bộ hình thái theo level tại profile/Bộ sưu tập/header/xếp hạng; vẫn ba ảnh/portrait. Đo trước/sau về frame, long task, heap/cache, node/listener/timer qua nhiều chu kỳ; reduced-motion và cleanup cho feedback mới. Không coi browser là chứng nhận điện thoại 60 FPS.
- [ ] Gate 7 — Nghiệm thu tất cả luật/nguồn/ảnh; check/build, unit/contract/migration/emulator, UI mục tiêu/regression, review diff tách khỏi implementation và chạy lại kiểm tra trọng yếu. Một báo cáo chung; không APK/deploy/push nếu chưa được giao riêng.

Gate7 cuối chỉ được đóng sau khi các gate offline O0–O6 ở mục13 cũng đạt. Phần logic/UI/offline và phần ảnh có thể làm riêng theo ownership mục14; không tạo một kế hoạch active thứ hai.

Gate là checkpoint nội bộ. Khi được giao triển khai toàn task thì tiếp tục hết gate, không hỏi tiếp tục sau từng bước. Yêu cầu mới nhất đã giao triển khai toàn kế hoạch sau phác thảo hai trò; tiếp tục hết các gate khi các quyết định bắt buộc đã được chốt. Không coi ghi chú phạm vi của lượt lập kế hoạch cũ là lệnh dừng.

## 11. Acceptance và kiểm thử bắt buộc

- Đủ 101 món có đường nhận bản sao, Level 1–21 chính xác; nhãn Level Max ở 21. Form 1/2/3 đúng các dải 1–6/7–20/21, không tự đổi slot khác.
- Level 20 nhận 1 bản chỉ lên Max, bản tiếp theo mới thành mảnh. Batch3 tại Level20 tạo2 mảnh; replay không tăng thêm. Trộn nhiều item/type không lẫn mảnh.
- Bán không âm kho, Xu đúng giá policy; ghép tổng3 bất kỳ tạo đúng1rương, không mở luôn; quantity sai/không đủ/candidate giả bị từ chối; retry/crash không mất hoặc nhân tài nguyên.
- Ghép mảnh: ví19Xu bị từ chối nguyên vẹn;20Xu thành0, trừ đúng3mảnh và cấp1rương. Ghép chữ:9Xu bị từ chối nguyên vẹn;10Xu thành0, trừ3chữ và cấp1chữ. Replay không thu phí/cấp quà lại; hai thiết bị không tiêu chung số dư; mất phản hồi sau commit phục hồi kết quả cũ.
- Mở rương vẫn có xác suất, đúng receipt/quota/chest count. Nếu ra món Max, chỉ cấp mảnh đúng loại; không tạo rương miễn phí từ việc chỉ xem tỷ lệ hoặc đóng popup.
- Giữ save/UID/ownership/equipped/receipts lịch sử; schema extension và hạn chế client cũ được nêu thật, không tuyên bố không đổi save khi có extension.
- Đủ ảnh và QA phối; không mất mặt/che badge/lệch khung, không vẽ lại bản gốc hoặc tăng các lớp mỗi portrait. Chi tiết dung lượng/hiệu suất ghi từ phép đo thật.
- Mọi giới hạn hoặc khác biệt baseline được ghi rõ; không làm yếu test hoặc đổi logic ngoài scope để báo pass.

## 12. Trạng thái kiểm chứng lượt lập kế hoạch

Đã đối chiếu 101 ID/303 file từ catalog, luồng quyền sở hữu/receipt, rương hiện hành và các mẫu UI. Lượt này chỉ sửa tài liệu/manifest lô ảnh, không sửa code game, ảnh sản phẩm, save, rules hoặc tỷ lệ. Chỉ kiểm đếm lô/đường dẫn và rà diff; không chạy check/build/UI vì không đổi game.


## 13. Bổ sung offline / lưu trên máy trước / đồng bộ nền — 08/11

### Rà kiến trúc trước khi sửa offline

1. `persistence.js` đang có hàng đợi ghi dùng chung, IndexedDB/chapter formatVersion2, revision/CAS, snapshot ở thời điểm gọi, delta bảo vệ thưởng xen giữa save. `savePersistentGameData` lưu progress +drop markers +reward facts trong bản ghi địa phương trước notify. Đây là owner phải mở rộng, không lập kho save hoặc ví offline song song.
2. Trong save, lỗi write thật đặt `blocked=true`; phải phân biệt lỗi lưu thiết bị với lỗi cloud. Không đưa Firebase403/network failure vào cờ khóa ghi máy. `commitSparkOperation` hiện giữ hàng đợi persistence trong khi callback làm I/O cloud; mất mạng giữa request có thể giữ hàng đợi ghi local quá lâu. Cần tách chuẩn bị durable intent / gửi ngoài hàng đợi / commit phản hồi ngắn, vẫn qua cùng owner và revision guards.
3. `accountService.runRewardOperation` đang dùng `replaceProfileSafely` bao trùm giao dịch mạng. `canLaunchGame` bị chặn khi có replacement, dù bản chất đang nhận thưởng chứ chưa thay profile. Giữ khóa cho import/reset/xóa thật; không giữ khóa gameplay trong khi chờ mạng hoặc rules từ chối.
4. `accountService` đã có schedule/backoff, online hook, cloud-save events và CAS snapshot; nhưng `handleFailure` chưa tách lỗi mạng khỏi403/version không hỗ trợ để dừng retry vô ích. Đọc identity phụ thuộc trạng thái auth mạng; phải có owner của profile đã lưu cho ghi offline, tách khỏi quyền thực hiện thao tác tài khoản online, không tự gán UID mới.
5. `appearance.rewards.pending/applied`, Spark settled/drop markers và sync metadata đang là các journal/receipt hiện có. `liveops/service.js` lưu một pending operation theo environment/UID/profile, giữ entropy/candidate qua retry; nhưng hiện kiểm tra online trước khi lưu request. Mở rộng journal hiện hữu thành hàng đợi intent có giới hạn, không tạo service/persistence/journal cạnh tranh.
6. `settlementAdapters.js` chỉ tạo fact khi có `trustedRewardPeriod()`. Khi khởi động offline chưa có giờ máy chủ, một ván thắng có thể không được ghi fact nhiệm vụ. Phải lưu raw fact theo round/attempt +owner bất kể có clock, rồi đối chiếu kỳ khi đồng bộ; không lấy Date.now để cấp quà ngày. `normalizeFact` hiện bắt buộc day: cần version/migration raw facts phù hợp, không sửa lén ý nghĩa dữ liệu cũ.
7. `cloudStore.js` đã stage dữ liệu theo hash rồi CAS root +rewardRevision/economyRevision. Giữ atomic publication và phục hồi mất phản hồi. Xung đột hiện dẫn tới chọn toàn bản local/cloud; lựa chọn đó chưa đáp ứng yêu cầu hợp nhất tiến độ hai thiết bị. Phải rebase theo domain, operation ID/watermark; không dùng bản mới nhất thắng hoặc max/sum kho tiêu hao.
8. Kho rương có fallback đọc snapshot khi offline; trang Sự kiện/Hồ sơ phải rà tương tự, vẫn render nội dung lưu được và giới hạn riêng thao tác cần mạng. Đang cần cập nhật Kho lưu trữ và ngoại hình mới, không được dựng lại toàn trang thành lỗi.
9. `public/sw.js` chỉ precache shell tối thiểu, cache asset khi đã fetch; bỏ qua Range audio, asset chưa cache trả lỗi mạng. `pwa.js` xóa/unregister cache trong DEV. Vì vậy thử localhost DEV không chứng nhận web offline. Phải kiểm tra production build/worker thật; Android dùng bundle, web chỉ hứa theme có đủ tài nguyên, có fallback âm thanh/ảnh hợp lệ.

### Ma trận xử lý và quyết định sản phẩm

| Nhóm | Được lưu/hiển thị ngay trên máy | Chỉ hoàn tất sau xác nhận canonical |
|---|---|---|
| Chơi/qua màn/tiếp tục | Round/checkpoint, completion, thống kê và raw facts lưu bền rồi báo thành công; không chờ Firebase | Gửi/hợp nhất nền khi có mạng; lỗi cloud không thu hồi thắng hoặc khóa chơi |
| Nhiệm vụ/chữ/huy hiệu rơi từ chơi | Lưu sự kiện đủ dữ liệu +ID/marker/entropy, hiển thị tiến độ hoặc số đang chờ; không mất raw fact khi chưa có clock | Xác nhận tài sản/quà vào phần có thể tiêu qua cùng receipt/watermark; không nhận lại khi resend |
| Xem kho/ngoại hình/trang bị đã sở hữu | Đọc snapshot; đổi lựa chọn trang bị và cài đặt không tiêu tài sản có thể lưu local và sync | Quyền sở hữu/level/mảnh không tự tăng do render hoặc chọn trang bị |
| Nhận quà, đổi chữ, ghép/bán mảnh, mở/bán rương, tiêuXu | Lưu intent theo UID/profile, báo **Chờ đồng bộ**, giữ nguyên phần tài sản đã xác nhận; lượng khả dụng có thể suy từ các intent đang giữ, không tạo ví khác | Server/CAS xác nhận mới trừ/cộng thật; RNG/candidate/policy ổn định, receipt đã commit phục hồi một lần |
| Level ngoại hình | Xem hình/level đã lưu | Tăng level hoặc Max→mảnh chỉ từ bản nhận đã xác nhận; không có lệnh nâng thủ công |
| Quà theo ngày/giờ, quảng cáo | Có thể xem tiến độ đã xác nhận; khi chưa có bằng chứng/clock thì chỉ giới hạn thao tác đó | Giờ máy chủ và bằng chứng hoàn tất quảng cáo hợp lệ; không queue quà ngày mơ hồ để tự chọn ngày thưởng |

Đã chốt bổ sung: **được dùng offline hỗ trợ đã được máy chủ giữ riêng cho thiết bị**. Việc giữ phải chuyển quyền sử dụng từ lượng dùng chung sang phần của thiết bị, bảo toàn tổng tồn và cùng owner/journal hiện hữu; không sao chép kho sang một ví khác. Mỗi lần dùng lưu bền ID và lượng đã tiêu trước khi áp dụng tác dụng trong ván. Restart/retry không tiêu lại; thiết bị khác không được dùng phần đã giữ. Phần chưa dùng không tự trả về kho chung chỉ vì mất mạng, hết thời gian hoặc đăng xuất; trả/chuyển phải có xác nhận để không nhân tài sản. Nếu thiết bị chưa từng được cấp phần dùng offline hoặc đã hết phần đó, chỉ thao tác hỗ trợ cần kết nối, không khóa gameplay. Mua bằng Xu và tài sản thưởng mới cần xác nhận vẫn giữ chính sách chờ máy chủ.

Đã chốt theo câu trả lời “Như đề xuất”: các ván offline không xác định được ngày được tính vào nhiệm vụ của ngày máy chủ xác nhận. Chỉ áp dụng hạn mức/quà của kỳ đó; không cấp bù quà ngày cũ, không tự tăng điểm danh hoặc bỏ qua thời gian chờ theo đồng hồ máy. Lưu bền việc gán kỳ cùng ID ván/receipt để retry hoặc mở lại không gán sang ngày khác và không tính hai lần. Kết quả ván, màn đã vượt và sự kiện kiếm được vẫn phải được lưu trên máy trước khi báo thành công; chưa xác nhận quà không có nghĩa mất tiến độ. Hai lựa chọn sản phẩm offline đã được chốt; GateO1 còn phải hoàn thiện contract kỹ thuật và migration, chưa phải runtime đã đạt.

### Gate O0–O6 (cùng kế hoạch hiện hành)

- [x] **O0 — Audit và ownership:** đã đọc owner persistence/account/cloud/reward ledger/settlement/worker và ghi các điểm trên. Chưa coi audit read-only là bằng chứng hành vi offline đạt.
- [x] **O1 — Contract local-first và migration:** chốt ma trận còn mở; đặc tả confirmed/pending, durable owner khi cold boot offline, raw facts có/không kỳ, queue/version/error taxonomy. So sánh mở rộng journal hiện hữu với cache Firestore; chọn journal/receipt/CAS đang có, cache chỉ phục vụ dữ liệu đọc. Test dữ liệu cũ/thiếu/hỏng/version lạ, idempotent và không mất queue.
- [x] **O2 — Gameplay và lưu bền không phụ thuộc mạng:** bỏ khóa mạng khỏi launch/next/resume; bảo vệ import/reset/xóa thật. Tách network I/O khỏi hàng đợi ghi máy mà không tạo writer thứ hai. Save success chỉ sau commit thiết bị, giữ checkpoint/facts/drop chung transaction. Không nuốt lỗi disk/quota hoặc báo đã lưu giả.
- [x] **O3 — Một hàng đợi sync có owner:** intent ID duy nhất +UID/profile/environment +policy +entropy, bounded queue/watermark, prepared→pending→confirmed/failed/reconciliation. Online/startup/foreground tự drain có backoff+jitter+giới hạn concurrency; mạng chập chờn không nhân scheduler.403/auth/version giữ request và dừng retry vô ích tới điều kiện phục hồi có ý nghĩa; không chặn gameplay. Không gửi nhầm sau logout/đổiUID/restore/reset/xóa.
- [x] **O4 — Hợp nhất hai thiết bị và tài sản:** rebase raw round facts/completion theo identity, không LWW snapshot; immutable receipts/watermark tránh double grant, confirmed wallet/inventory theo canonical operation, không max/sum kho tiêu hao. Xung đột không giải quyết an toàn giữ hai nguồn +pending để đối chiếu, vẫn chơi. Test mất phản hồi sau commit, lost local acknowledgement, hai thiết bị cùng bán/ghép/mở/tiêuXu, stale candidates và hết nguyên liệu.
- [x] **O5 — UI kho và tài nguyên offline:** giữ UI hiện tại và source mỹ thuật. Snapshot-first tại Hồ sơ/Bộ sưu tập/Kho lưu trữ/Nhiệm vụ/Sự kiện; Chờ đồng bộ/đã lưu máy hiển thị đúng trạng thái, không toast nhận quà sớm. Lưới và popup giữ lựa chọn khi mất mạng. Android asset đóng gói; web production worker có manifest/availability/fallback cho theme chưa tải, bounded cache; không preload909ảnh hay hứa mọi theme khi chưa có. Không phát thưởng/âm thanh nhận lại lúc reload.
- [ ] **O6 — Kiểm chứng và phát hành phối hợp:** dùng local DB thật +emulator/network fault thật, không chỉ UI fixtures; matrix trước/trong/sau commit, crash/cold boot, transient/403/version, hai thiết bị/UID/cũ/reduced-motion/lifecycle và resource-cache cold/warm. Assert số dư, receipt, checkpoint và queue trước/sau. Chạy check/build và regression theo rủi ro sau khi ổn, independent diff review. Ghi trình tự rules tương thích cũ+mới→client mới→xác minh→mới xét bỏ legacy; **không tự deploy Hosting/rules hoặc tạoAPK**.

Nếu môi trường không đo được một ca, giữ unchecked và ghi rõ giới hạn; không ghi offline hoàn tất vì đã bật cache. Các gate O1–O6 phải đạt cùng các gate ngoại hình trước Gate7 nghiệm thu chung.

## 14. Phân công hai chat và điểm bàn giao

Theo yêu cầu bàn giao mới nhất: chia thành **hai agent ở hai chat mới**. Agent A tạo/QA ảnh; Agent B xử lý logic, giao diện kho/hồ sơ và offline, dùng cùng file kế hoạch này. Chat hiện tại kết thúc ở phần bàn giao, không tự tạo chat hoặc kế hoạch active khác. Prompt tiếp nhận đầy đủ: `design/expedition/HANDOFF_ART_AGENT.md` và `design/expedition/HANDOFF_LOGIC_AGENT.md`. Prompt ảnh thực tế và khung prompt tiếp tục: `art-production/prompts.json` và `art-production/PROMPT_GUIDE.md` trong cùng thư mục. Task hai trò mới vẫn chỉ là draft, chờ phân tích thêm.

- Chat ảnh: chỉ sửa master/prompts/QA/manifest lô ảnh trong `design/expedition/` và export ở namespace asset form mới; không sửa logic/rules/shared runtime/CSS sản phẩm. Không đổi ID/catalog gốc. Handoff manifest ảnh đủ tên ổn định, anchor/cỡ/hash/QA; chat logic chỉ đọc, gắn mapping bằng generator sau khi lô được bàn giao.
- Chat logic: owner `js/progression`, `js/liveops`, persistence/account/cloud/session/sync, templates/generators/rules, UI Kho lưu trữ/Hồ sơ và CSS/test liên quan. Không ghi đè thư mục master/prompts/manifest lô ảnh đang tạo, không tự sinh ảnh thay thế. Nếu cần thay contract đường dẫn ảnh thì thống nhất trước khi cả hai bên đổi.
- Mọi thay đổi dirty có sẵn vẫn của người dùng/agent khác. Không reset/revert/format/commit gộp chúng. Logic mới trong working tree đang dở; đọc `design/expedition/IMPLEMENTATION_NOTES.md` trước khi triển khai. Không bắt đầu lại từ baseline hoặc khẳng định50unit đã chứng minh mọi thay đổi mới.
- Chưa gate nào về offline runtime được nghiệm thu. Lỗi emulator1000biểu thức ở nhận ngoại hình là việc cần xử lý trong chat logic; không giảm kiểm tra rules để báo pass. Rules mới đang ở máy, chưa deploy.

## Chính sách offline thay thế — chủ dự án chốt 08/11/2026

Mục này có ưu tiên cao hơn các mô tả giữ riêng hỗ trợ/chờ xác nhận tài sản ở trên: ưu tiên trải nghiệm giải trí và Firebase Spark tiêu chuẩn cơ bản. Hỗ trợ đã có dùng offline bình thường; không chia kho theo thiết bị, không thêm giao diện phân bổ. Cho phép mở quà/quay thưởng offline, kết quả và tiêu hao lưu bền trên máy trước khi báo thành công; giữ operation ID/policy/entropy/receipt qua retry và restart. Không áp dụng quy tắc mọi quà offline phải chờ máy chủ mới được dùng. Xem quảng cáo thêm vé cần mạng. Chấp nhận tình huống hiếm hai thiết bị dùng cùng số hỗ trợ cached offline; đồng bộ vẫn phải bảo vệ phiên chơi, giữ nguồn khi có conflict và tránh cấp/trừ lại do retry. Không dùng last-write-wins để ghi đè phiên đang chơi. Quyết định tính raw fact không biết ngày vào ngày máy chủ xác nhận vẫn giữ nguyên. Không triển khai giữ riêng/thu hồi hỗ trợ theo thiết bị hoặc hỏi lại lựa chọn phân bổ. Các gate O1–O6 phải được đánh giá theo chính sách mới này; không tạo kế hoạch active khác. Không deploy/APK.

## Quyền phát hành bổ sung — 09/11/2026

Chủ dự án cho phép deploy rules nếu cần cập nhật. Quyền này thay phần cấm deploy rules trước đó, chỉ áp dụng Firestore rules của dự án `memorymatchv1-1a` đã xác minh từ .firebaserc. Phải kiểm tra diff với rules đang phát hành, giữ bản trước, chạy hồi quy client cũ+mới và xác minh ruleset/hash sau deploy. Không gồm Hosting, indexes, APK hoặc phát hành client. Các gate ảnh và nghiệm thu toàn task vẫn chưa hoàn tất chỉ vì rules được triển khai.


## Khắc phục local-first và phát hành — 09/11/2026

Chủ dự án giao sửa và deploy: online chỉ là phần bổ sung, không làm việc nhận/dùng quà trên máy phụ thuộc Firebase. Giữ writer IndexedDB hiện hữu, owner/backup/conflict và policy kỳ nhiệm vụ; không mở kế hoạch thứ hai.

Chọn sao lưu snapshot của phần thưởng đã commit trên máy thay cho replay bắt buộc từng giao dịch. Giữ đọc save/journal cũ, operation ID/kết quả và lịch sử hữu hạn; quá 512 thao tác không chặn người chơi. Quy tắc cloud cũ tiếp tục bảo vệ bản lưu cũ; client mới sao lưu cùng CAS và giữ reward revision online hiện hữu, không ghi vào liveops để cấp lại quà. Quảng cáo cần mạng và callback earned; BXH cần mạng. Không dùng lỗi cloud làm lỗi commit trên máy.

- [x] L1: status/nhận/dùng thưởng local-first; migration và lịch sử hữu hạn, không cấp lại quà khi retry/reload.
- [x] L2: backup snapshot không chờ hàng đợi thưởng; giữ CAS/owner/không ghi đè phiên chơi và nguồn conflict.
- [x] L3: unit và browser với offline/403/503/cold start/queue đầy, quảng cáo earned, backup/restore và ba trò; review/check/build.
- [x] L4: deploy Hosting production; chỉ deploy Rules nếu thay đổi thật sự cần; đọc lại build/release, cập nhật một báo cáo nghiệm thu hiện hữu.

Nghiệm thu nhánh local-first ngày10/11/2026: L1–L4 đạt; Hosting production đã phát hành và index/worker/hai JS bundles khớp SHA256 artifact. Không deploy Rules/indexes/APK; không đóng thay các gate ảnh/Android hoặc task BXH riêng. Chi tiết trong IMPLEMENTATION_NOTES.md, mục Khắc phục bắt buộc-online.
