# KẾ HOẠCH LEVEL NGOẠI HÌNH VÀ LÔ ẢNH — 08/11/2026

## Trạng thái hiện hành — cập nhật 16/11/2026

Các ghi nhận cũ bên dưới là lịch sử tại thời điểm ghi. Phần backup emulator timeout và hồi quy audio đã được chạy lại: ma trận emulator snapshot/offline/online/mất ACK reload/server fault/hai thiết bị đạt; audio 29 PASS/2 SKIP. Check/build PASS; art 202/202 sẵn sàng và profile UI decode đạt. Gate 6, O6 và Gate 7 vẫn chưa đóng do yêu cầu reviewer độc lập và xác nhận hiệu năng trên Android vật lý chưa có. Kho tạm là chỉ xem và tự chuyển khi có ô trống; trạng thái 5 trang chính/120 ô theo bổ sung 16/11 trong IMPLEMENTATION_NOTES.md thay các mô tả 3 trang cũ ở mục16. Không deploy Rules/Hosting hoặc tạo APK trong lượt này.

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

**Chỉ dẫn mới11/11 ở mục16 thay hợp đồng kho cũ bên dưới:** mỗi rương riêng một ô,5trang×24ô,8ô đầu miễn phí,112ô còn lại mua riêng1000Xu/ô; quà vượt chỗ vẫn nhận và được giữ trong Kho tạm. Kho tạm chỉ xem, không mở/bán/ghép; khi có ô chính trống hoặc mua thêm ô, tài sản dư tự hiện ở ô chính theo projection từ counter hiện hữu. Mỗi lần Mở/Bán đúng1rương, bỏ slider và mở lô cho rương, giữ slider bán mảnh. Không dùng mô tả gom loại/mở nhiều cũ làm yêu cầu hiện hành.

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
- [x] Gate 5 — Pipeline và toàn bộ lô A0–A5, đủ 101 món/202 thiết kế/606 export, manifest/hash/alpha/alignment/cross-match/nhận diện nhỏ. Không dừng task toàn bộ sau một lô nếu đã được giao triển khai toàn task.
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

## 15. Cửa hàng/Bộ sưu tập 4 cột và ảnh nội dung dùng chung — 10/11/2026

### Trạng thái, phạm vi và thứ tự ưu tiên

**Đã nghiệm thu phạm vi mục15 ngày11/11/2026.** Đây là phần bổ sung trong kế hoạch hiện hành, không là kế hoạch active thứ hai. Không mở lại các gate logic/offline đã nghiệm thu và không dùng phần này để đóng thay Gate5–7 của bộ202hình thái. Bằng chứng cuối tại IMPLEMENTATION_NOTES.md, mục Cửa hàng/Bộ sưu tập4cột.

**Điều chỉnh mỹ thuật do chủ dự án yêu cầu khi xem bản tích hợp:** preview chụp trực tiếp đúng renderer nhưng chưa đẹp/dễ nhận biết như ảnh mẫu. Chuyển preview Đường nối/Xóa thẻ/Hiệu ứng lật/Chủ đề sang ảnh minh họa riêng theo phong cách mẫu4cột (vàng/teal, khối rõ, đọc được ở40px). Ảnh chụp thật vẫn là tài liệu đối chiếu màu, dạng và công dụng, không là hạn chế bắt buộc dùng nguyên screenshot làm ảnh cuối. Được tạo bitmap minh họa từ các tham chiếu này; không đổi renderer/gameplay, tên/ID/giá hoặc hứa hiệu ứng khác với runtime. Các mặt lưng đã có ảnh đẹp tiếp tục tái dùng; mặt lưng CSS đơn giản được trình bày rõ trên hình thẻ tương ứng. Chỉ dẫn mới này thay yêu cầu dùng nguyên capture/composite ở mục15.3/S2 dưới đây.

**Đã chốt riêng với chủ dự án:**10chủ đề thiếu bộ thẻ gốc giữ icon hiện có và trạng thái chưa có sẵn; không tạo bộ thẻ mới, không tạo ảnh minh họa khiến chúng trông đã sẵn sàng. Phạm vi ảnh202hình thái của chat khác vẫn độc lập.

Mục tiêu: Cửa hàng và các tab danh mục của Bộ sưu tập hiển thị4món/hàng, gọn và đồng đều; hình nhận diện nội dung nhất quán giữa các skin; ảnh xem trước diễn tả đúng món người chơi mua/trang bị. Giữ tiến trình, công dụng, số lượng trong gói, giá, trạng thái sở hữu/trang bị và giao dịch hiện hữu.

Các chỉ dẫn UI mới nhất của chủ dự án có ưu tiên hơn mẫu cũ tại mục8/handoff:

- **Vật phẩm hỗ trợ chỉ có trong Cửa hàng.** Không tạo tab Vật phẩm trong Bộ sưu tập. Số đang có vẫn cần xuất hiện ở Cửa hàng, nhưng chuyển thành nhãn nhỏ ở góc trên phải của ô.
- Hiệu ứng, mặt lưng thẻ, chủ đề là quyền sở hữu lâu dài: không hiện số lượng. Hiện giá hoặc trạng thái Đã có/Đang dùng theo đúng hành vi thực tế của từng màn.
- Không khôi phục tab Thành tích trong Bộ sưu tập, nút Xem hình thái, câu hướng dẫn hay ghi chú trò/Màn dưới vật phẩm trong phần Trang trí hồ sơ vừa được bỏ theo yêu cầu10/11.
- Lưới4cột lần này không áp dụng cho popup Trang trí hồ sơ hoặc Kho lưu trữ. Kho giữ4×6/24ô, tabIDchests và hợp đồng ôchỉicon/tên-sốlượng trongpopup đang dùng. Không đưa badge số lượng vào Kho khi chưa được giao thay đổi riêng.
- Không thêm mặt hàng, đổi danh mục/giá, rút gọn hoặc gộp ID. Giá rương ngoại hình10000Xu vẫn chỉ là dự kiến, không mở thêm bán rương.
- Không đổi nền/khung/header/tab/navigation của skin ngoài điều chỉnh cần thiết cho lưới; không viết lại hoạt ảnh gameplay, persistence, ví, quảng cáo, journal, Rules hoặc đồng bộ.
- Không tạo asset cho hai trò mới đang phác thảo; chỉ Memory Match, Link Connect và Triple Connect hiện hữu.

### 15.1. Kết quả rà nguồn và ranh giới ownership

| Phần | Owner/call site hiện có | Việc cần làm khi triển khai |
|---|---|---|
| Cửa hàng | js/shop.js, js/shopCatalog.js, js/linkConnect/linkItems.js, js/tripleConnect/tripleItems.js | Audit từng mặt hàng thực tế, dùng chung hình nhận diện; giữ boundary mua/xác nhận và refresh tồn kho |
| Bộ sưu tập | js/mainmenu.js, js/catalogPreferences.js | Cùng cách trình bày danh mục4cột; giữ tabID, lựa chọn đã lưu và trang bị |
| Icon và skin | js/icons.js, js/uiArtManifest.js, styles/ui-skin-icons.css, styles/ui-skin-storybook.css, styles/ui-style-packs.css | Hiện SVG ở skin mặc định; Storybook dùng WebP qua manifest, Woodland có thay ảnh bằng CSS. Tách đúng icon nội dung khỏi icon điều hướng/thao tác |
| Preview và bố cục | styles/shop.css, styles/raised-actions.css, các skin và compositor Storybook | Rà cascade thực tế, tránh quy tắc skin nâng kích thước hoặc thay ảnh trở lại |
| Hiệu ứng | js/linkConnect/linkEffects.js, js/flipEffectCatalog.js, js/effects và owner renderer tương ứng | Chụp hiệu ứng thật, không coi một class/icon chung là bằng chứng preview đúng |
| Mặt lưng/chủ đề | js/appearance.js, js/themeCatalog.js, js/generated/themeAssetManifest.js, js/themeSelection.js | Render mặt lưng hiện có; ghép thẻ đúng theme. Không sửa generated output trực tiếp |
| Ảnh ngoại hình202form | design/expedition/art-production và manifest/generator hình thái hiện hữu | Chỉ đọc tài nguyên được bàn giao; giữ ownership của chat ảnh |

Các con số sơ bộ có thể dùng để audit:11gói hỗ trợ Memory Match,21hiệu ứng nối và21hiệu ứng xóa cơ bản dùng chung Link/Triple, ngoài phần thưởng achievementOnly. Không coi đây là tổng cuối cùng của toàn bộ asset: phải đối chiếu tất cả tab, lọc bán/đã có và các món thưởng trong S0. Mỗi hình thức hiển thị trùng cùng ID/ngữ nghĩa dùng lại asset; không xuất một bộ khác cho từng game/skin.

Không chỉnh tay js/uiArtManifest.js hoặc các file generated. Phải truy nguồn generator trước khi thêm mapping vào manifest được sinh. Nếu cần manifest riêng cho ảnh nội dung thì chỉ một mapping có owner rõ, phục vụ ít nhất Cửa hàng và HUD/phần thưởng có cùng ngữ nghĩa, không dựng thêm hệ icon cạnh tranh.

### 15.2. Hợp đồng bố cục và nội dung người chơi

- Danh mục dùng4cột trên màn hình dọc mục tiêu320/384/390/412px; ngang và desktop vẫn4cột trong vùng nội dung có giới hạn rộng, không kéo ô quá lớn. Đo bề rộng khả dụng thật gồm padding, safe-area và khung skin; không chỉ dựa trên viewport.
- Khoảng cách dự kiến6px; hình36–44px; nút giá có vùng chạm tối thiểu44px. Đây là thông số thiết kế cần đo ở S1, không phải kết quả đã đạt. Không thu font hoặc vùng chạm dưới mức dễ đọc chỉ để ép đủ4cột.
- Mọi ô trong cùng nhóm có cùng cấu trúc và chiều cao. Dành sẵn vùng icon, tên tối đa2dòng và vùng hành động. Tên1dòng, có/không số lượng, đã có/chưa có đều không làm lệch hàng hoặc giá. Tên đầy đủ nằm trong nhãn truy cập và popup/tooltip hiện hữu; không cắt cụt gây nhầm món.
- **Hỗ trợ:** icon + tên ngắn + nhãn góc “Có 5” + nút giáXu. Giữ chỗ/đệm cho nhãn để không che hình. Có0vẫn có cùng hình học. Dữ liệu cập nhật qua nguồn tồn kho hiện hữu sau mua/dùng/đổi hồ sơ; không tạo bản đếm riêng. Kiểm tra0/1/99/9999/số lớn nhất hợp lệ; quy tắc viết gọn số lớn phải không gây tràn và có số đầy đủ trong nội dung truy cập/chi tiết.
- **Thời gian:** chữ số30/45/60 do code hiển thị trong mặt đồng hồ; chỉ số giây được thêm. Nhãn tồn kho ở góc là thông tin riêng, không dùng cùng vị trí hoặc chỉ ký hiệu × khiến người chơi nhầm. Không cần ba ảnh đồng hồ theo ba số.
- **Gói gợi ý/xem thẻ:** phân biệt rõ số lượt/thẻ nhận trong một gói với số gói/lượt đang sở hữu. Giữ ngữ nghĩa tồn kho hiện tại, không quy đổi ngầm đơn vị. S0 phải đối chiếu từng loại, S1 minh họa trường hợp gói nhiều lượt; tên/chi tiết nêu rõ nội dung mua.
- **Hiệu ứng/mặt lưng/chủ đề:** ảnh xem trước + tên + giáXu hoặc trạng thái đúng màn. Không thêm số lượng. Trạng thái Đang dùng chỉ khi thực sự đang trang bị; Đã có không được ngụ ý mua lần nữa hoặc tự trang bị.
- Bỏ tiêu đề nhóm trùng tab như “Vật phẩm Triple Connect”; giữ heading cần thiết nếu một tab có nhiều nhóm khác nghĩa. Không tự dịch/đổi tên effect trong catalog hoặc gộp ba nhóm động vật thành một món như ảnh minh họa; chỉ dùng tên ngắn được đối chiếu với tên đầy đủ.
- Nhấn giá tiếp tục mở popup xác nhận mua hiện hữu. Không đổi sang mua ngay từ việc chạm icon. Mở xem trước nếu cần dùng popup/owner hiện hữu và không chiếm hành vi mua hoặc chọn trang bị.
- Giữ tab dạng dải liền, focus/keyboard, tooltip căn giữa, cặp nút xác nhận/Hủy vừa được chỉnh. Nội dung UI chỉ dùng ngôn ngữ sản phẩm; không nhãn debug, nội bộ, tên file, mã hiệu ứng hay hướng dẫn tích hợp. Không emoji/font làm hình trang trí.

### 15.3. Phương án ảnh và tái sử dụng

So sánh hai hướng trước triển khai:

| Phương án | Lợi ích | Hạn chế | Quyết định |
|---|---|---|---|
| Giữ toàn bộ SVG/icon và đổi theo từng skin như hiện tại | Tải nhẹ, dễ đổi màu; ít công tạo ảnh | Hình nhận diện thay theo skin; ngôi sao/quà chung không thể hiện đúng hiệu ứng; khó đạt chất lượng minh họa đã xem | Giữ SVG cho control/fallback, không chọn làm hướng chính cho ảnh nội dung |
| Một bộ hình nội dung dùng chung; tái dùng WebP, preview tạo từ nguồn thật | Đồng nhất nhận diện và gần chất lượng mẫu; dùng lại giữa các màn; preview có thể kiểm chứng | Cần audit, pipeline chụp/ghép, quản lý tải và cache | **Chọn**, chữ/số/trạng thái vẫn vẽ bằng code |

Phân loại sản phẩm:

1. **Hỗ trợ:** contact sheet WebP đang có, đối chiếu Gợi ý/Thời gian/Hoàn tác/Xáo trộn/Đóng băng/Xem thẻ/Mở rộng và mọi loại thật trong catalog. Chọn một bộ cùng nét vẽ, vật liệu, góc nhìn và vùng an toàn. Tái sử dụng ảnh đạt; chỉ vẽ mới món thiếu/lệch chất lượng. Đồng hồ phải có vùng trống đọc số rõ, không dùng đồng hồ cát để biểu thị số trong mặt đồng hồ. Một mẫu cho một chức năng; các gói chỉ đổi chữ số/badge bằng code. Không cần vẽ lại toàn bộ tài nguyên trước khi audit.
2. **Đường nối:** render từ chính renderer đang phục vụ gameplay trên cùng hình học mẫu, chọn khoảnh khắc tiêu biểu của từng effectID. Giữ đúng màu, nét, đặc trưng; default là nét mặc định. Không vẽ bằng AI một hiệu ứng khác rồi gắn vào tên đang có. Link/Triple tái dùng nếu renderer/hành vi giống nhau; nếu khác phải ghi variant có lý do trong inventory.
3. **Xóa thẻ:** một thẻ mẫu thống nhất, render hiệu ứng thật và chọn khung hình thể hiện rõ tan bụi, chia mảnh, cháy, đóng băng… Preview không hứa hẹn điều runtime không làm được. Chọn thời điểm riêng theo effect thay vì cùng một timestamp làm nhiều ảnh trống/giống nhau.
4. **Chủ đề:** ghép2–3thẻ thực tế của đúng theme thành hình đại diện. Với chữ/số/hình học và theme sinh bằng code, render từ generator có sẵn; chữ/số mang ý nghĩa nội dung game được giữ. Không vẽ một bức minh họa mới không tồn tại trong bộ thẻ. Theme chưa đủ ảnh/không khả dụng giữ đúng trạng thái hiện tại.
5. **Mặt lưng và hiệu ứng lật Memory Match:** cùng bố cục4cột. Mặt lưng lấy từ render CSS/asset hiện có; hiệu ứng lật chụp renderer thật với thẻ mẫu thống nhất. Audit cả hiệu ứng từ thành tích xuất hiện trong Bộ sưu tập; không bỏ sót vì chúng không bán trong Cửa hàng.
6. **Điều hướng/thao tác, tiền, rương, portrait:** không thay theo lô hỗ trợ này. Giữ nguồn icon điều hướng hiện tại, ảnhXu và factory rương dùng chung đã có. Ảnh avatar/khung/huy hiệu tiếp tục contract riêng202form.

Icon nội dung đã chọn phải có cùng nhận diện trong Cửa hàng, HUD hỗ trợ và nơi hiển thị phần thưởng cùng loại. Skin chỉ đổi bề mặt/viền/nút, không gán ảnh khác cho cùng chức năng. Ở cỡHUD nhỏ phải QA riêng độ tương phản; fallback SVG vẫn cùng ngữ nghĩa. Không đổi toàn cục icon search/timer/undo cho cả điều hướng và thống kê chỉ vì trùng tên. Audit call sites, định nghĩa ranh giới domain trước khi sửa registry chung; ít nhất hai consumer thật mới gom adapter.

### 15.4. Hợp đồng tài nguyên và tích hợp

- Namespace dự kiến riêng: design/shop-catalog/ cho brief/inventory/nguồn/QA; public/assets/shop-catalog/v1/ cho export dùng trong sản phẩm. Chốt cây thư mục và generator ở S0 trước ghi asset. Không dùng hoặc sửa design/expedition/art-production/{masters,prompts,journal,manifest} của chat ảnh hình thái.
- Inventory/mapping gồm loại, IDcatalog, nguồn hoặc renderer, assetKey, đường dẫn, kích thước, hash, quyền tái sử dụng, trạng thái QA; với capture thêm frame/seed/trạng thái render cần để tái tạo. Có mapping đầy đủ cho mọi mục thực tế, không viết nhánh theo tên từng món trong rendererUI.
- Tên ổn định theo ngữ nghĩa; dùng lại một file khi cùng hình. Asset sản phẩm WebP vuông, alpha sạch nếu là icon rời, không có giá, chữ sốthời gian, tồn kho, tên hay trạng thái gắn trong ảnh. Theme/capture nội dung chữ/số thật là ngoại lệ theo ngữ nghĩa, không phải nhãn UI.
- Mục tiêu xuất128px cho ô/HUD nhỏ và256px khi cần xem lớn/DPR; lựa chọn src theo kích thước hiển thị, không tải cả hai bản cho mỗi ô. Không bắt buộc512px vào bundle; master giữ ngoài public. Mục tiêu nén ban đầu ≤12KiB/128 và≤32KiB/256 mỗi file; đo chất lượng và tổngbyte ở S0/S2, ghi riêng ngoại lệ có lý do thay vì làm mờ hình để đạt số.
- Dùng công cụ sinh ảnh khi cần tạo bitmap hỗ trợ mới; ảnh hiệu ứng/chủ đề lấy từ renderer/asset thật. Khi triển khai phải áp dụng skill tương ứng cho tác vụ thực tế. Lưu nguồn/prompt thực tế nếu sinh ảnh; không dùng ảnh contact sheet cắt làm icon sản phẩm.
- Tải theo tab/trang đang xem, chia sẻ URL/decoder/cache trình duyệt; không preload toàn catalog hoặc tất cả frame effect. Mỗi ô có kích thước dự trữ cố định tránh layout shift, lỗi ảnh fallback một lần có giới hạn. Callback ảnh cũ không được sửa ô mới sau đổi tab/skin/UID/đóng popup.
- Android đưa export đã duyệt vào gói; web tích hợp qua asset/worker hiện hữu. Mất mạng vẫn xem được asset đã có cache/đóng gói và chơi bình thường. Ảnh thiếu chưa cache có fallback đúng chức năng, không retry vô hạn hoặc khóa mua/trang bị/gameplay. Không tuyên bố tất cả ảnh khả dụng khi chưa tải.
- Chỉ bàn giao source thật đãQA: contact sheet/preview thiết kế không phải manifest sản phẩm. Gắn mapping/export vào source generator, không sửa output bằng tay. Không tạo hoặc chỉnh Rules do thay ảnh/bố cục.

### 15.5. Gate S0–S5

- [x] **S0 — Inventory, owner, baseline:** kiểm đủ catalog/call sites/skin overrides; xác định tồn kho và đơn vị từng hỗ trợ, khả năng chia sẻ Link/Triple; đánh dấu reuse/redraw/capture/composite cho từngID. Chốt namespace/generator và hợp đồng ảnh riêng, ghi baseline sốnode, network/byte, thời gian mởtab, layout và bộ ảnh đang có. Không ghi đè thay đổi dirty khác.
- [x] **S1 — Mẫu bố cục/mỹ thuật trước runtime:** sửa minh họa4cột đã xem để tồn kho ở góc thay vì dòng Có5, không gộp danh mục hoặc đổi tên/giá. Mẫu có đồng hồ chứa30/45/60, gói nhiều lượt, số0/lớn, tên1–2dòng, đã có/đang dùng; minh họa hỗ trợ + nối + xóa + theme + nhóm Memory. Đo vùng nội dung thật trên320/384/390/412/ngang/desktop và5skin; duyệt mẫu trước triển khai rộng, không xin lại quyết định đã được chốt nếu người dùng đã duyệt chính mẫu đó.
- [x] **S2 — Tạo/QA bộ ảnh:** tái sử dụng/tạo bổ sung icon; dựng harness riêng để capture hiệu ứng thật và ghép theme, không tiêu tài sản hay thay save người chơi. QA thu nhỏ36–44px, alpha, vùng an toàn, khác biệt giữa các effect, file/hash/budget, coverage theo inventory và khả năng tái tạo. Không để món không có preview chỉ vì không bán hoặc asset chưa được sinh.
- [x] **S3 — Tích hợp ảnh dùng chung:** mapping và loader/fallback có owner rõ, gắn vào Cửa hàng/Bộ sưu tập/HUD/quà đúng ngữ nghĩa; giữ UI/public API/ID/schema. Kiểm đổi5skin, ảnh lỗi/offline, owner cũ, không request/giải mã lại theo tick hoặc theo mỗi click. Không thay ảnh điều hướng/stat ngoài phạm vi.
- [x] **S4 — Triển khai lưới4cột:** dùng cơ chế tab/panel hiện hữu, tách dữ liệu item với trình bày; ràng buộc chiều cao icon/tên/action và badge góc. Giữ tồn kho live, gói nhận/giá/tiền, ownership/equip, focus/keyboard, popup xác nhận và tooltip. Không tạo ví, listener/scheduler hoặc bản đếm mới.
- [x] **S5 — Nghiệm thu/review:** ma trận và tiêu chí dưới đây; reviewer đọc diff và chạy lại kiểm tra trọng yếu độc lập với bước viết code. Chỉ đánh dấu xong phạm vi shop khi mọi item/skin/gate đạt; báo riêng phần ảnh202form đang dở. Cập nhật bằng chứng thật vào IMPLEMENTATION_NOTES.md hiện có; không tạo báo cáo rời cho mỗi chỉnh UI. Check/build ở gate nghiệm thu phù hợp; không tự deploy Hosting/Rules, APK hoặc push.

S1 là cổng kiểm tra mẫu cụ thể, không phải yêu cầu người dùng trả lời lại các quyết định đã chốt trong mục15. Nếu khi đo thực tế4cột không giữ được vùng chạm và nội dung đọc được ở320px/skin có khung dày, trình bày ảnh đo cùng hai phương án có thể thực hiện để chốt điều chỉnh; không âm thầm giảm cột hoặc thu nhỏ font/vùng chạm.

### 15.6. Acceptance và bằng chứng cần lưu

1. Tất cả tab thuộc phạm vi của ba trò có4cột thật; không tràn ngang trang, không che safe-area/quảng cáo, panel cuộn đúng owner. Ô/giá cùng hàng ổn định giữa tên dài/ngắn, số lượng0/lớn và mọi trạng thái. Kho4×6 và Trang trí hồ sơ không bị đổi theo selector chung.
2. Nhìn ảnh nhỏ phân biệt được từng loại hỗ trợ; icon cùng chức năng giữ nhận diện khi đổi5skin và giữa shop/HUD/quà. Không nhân bộ ảnh theo game/skin; số giây, sốgói/lượt và tồn kho không nhầm đơn vị. Kiểm toàn item, không chỉ4món trong ảnh minh họa.
3. Preview nối/xóa/lật đối chiếu renderer thật, theme đối chiếu thẻ thật, không dùng sao/quà chung thay cả họ effect. Chỉ báo đủcoverage sau inventory+mapping+file+QA đạt; export tồn tại không tự coi là đạt mỹ thuật.
4. Unit/contract cho mapping, coverage, định dạng badge/số lớn và fallback cần thiết; UI mua từng loại/gói, hủy/xác nhận, thiếuXu, đã có/đang dùng, dùng hỗ trợ sau mua, trang bị/đổi tab/reopen/reload. Kiểm tiền và tồn kho không đổi ngoài hành động đã xác nhận; schema cũ/catalog preference giữ nguyên.
5. Playwright mục tiêu trên320/384/390/412px, ngang844×390 và desktop1024px,5skin, cả3trò và mọi tab. Chụp/đọc ảnh thật để kiểm chữ tiếng Việt, độ tương phản và badge không che hình; máyS22U thật nếu có, không coi browser thay chứng nhận máy thật.
6. Lặp30chu kỳ đổi tab/skin/mởđóng, thao tác nhanh, ảnh tải chậm/lỗi, đổi profile trong khi tải; sốnode/listener/timer/cache hữu hạn. Reduced-motion không ảnh hưởng trạng thái mua/trang bị; không thêm loop liên tục vào catalog. Đo lại sốnode, longtask, frame/thời gian mởtab và byte so với baseline; không tuyên bố60FPS nếu chưa đo.
7. Test bảnweb build với worker thật: tab đã cache dùng offline, tab chưa cache fallback, restart/online lại không tạo request storm hoặc ảnh cũ sửa owner mới. Không xóa cache/save người dùng để đạt test; Android asset packaging kiểm tại lượt đóng gói được giao riêng.
8. Diff cuối chỉ chứa thay đổi thuộc scope; giữ master/prompt/journal/manifest của chat ảnh, icon rương dùng chung và các chỉnh UI hiện có. Static/CSS ownership, test mục tiêu, check/build cần thiết ghi PASS/FAIL/SKIPPED cùng đường dẫn chứng cứ thật. Không chạy test/build trong lượt chỉ lập kế hoạch.

### 15.7. Bằng chứng của lượt lập kế hoạch

- Đã rà owner shop/mainmenu/icons/manifest/skin, catalog hỗ trợ/hiệu ứng/theme và phạm vi kế hoạch hiện hành. Bộ icon hiện là hỗn hợp SVG và WebP theo skin; chưa có coverage/QA thống nhất cho toàn bộ preview.
- Ảnh minh họa đã gửi trong cuộc trò chuyện là tham chiếu thẩm mỹ và mật độ4cột. Còn phải sửa nhãn tồn kho góc, kiểm tên/danh mục và khả năng hiển thị thật ở S1; không dùng nguyên ảnh làm asset, không coi là kết quả nghiệm thu sản phẩm.
- Trong lượt này chỉ bổ sung mục15 và nguồn phạm vi ở CONTEXT.md; chưa tạo namespace/ảnh/manifest mới, chưa sửa runtime, chưa chạy test/build hoặc deploy/APK. Toàn bộ gateS0–S5 chưa đánh dấu hoàn tất.

## 16. Kho từng rương, mua từng ô và thao tác1rương — 11/11/2026

Yêu cầu trực tiếp mới của chủ dự án; cùng kế hoạch hiện hành, không tạo kế hoạch active khác. Thay các mô tả cũ về gom rương theo loại/mở lô ở mục8, handoff và gate cũ trong đúng phạm vi Kho lưu trữ. Không đổi phạm vi bộ202hình thái.

- Mỗi rương, kể cả trùng loại, chiếm một ô riêng. Mảnh vẫn gom theo loại. Giữ counter rương hiện hữu làm nguồn dữ liệu, không tạo kho/ví song song hoặc cấp lại rương khi migrate.
-5trang chính,24ô/trang,4cột×6hàng. Miễn phí8ô đầu (hai hàng đầu trang1);112ô còn lại khóa, được mua bất kỳ ô riêng với1000Xu/ô. Mỗi lần xác nhận mua một ô vĩnh viễn; giữ nguyên ô đã mua khi restart/chuyển mạng.
- Theo quyết định chủ dự án, vẫn nhận đủ rương khi vượt sức chứa. Phần dư nằm trong Kho tạm có phân trang24món; chỉ xem được. Khi mở/bán rương chính hoặc mua ô tạo chỗ trống, phần dư tự chuyển sang ô chính qua projection counter, không tạo ID/kho phụ hoặc receipt tài sản mới. Không buộc mua ô để nhận quà; chỉ cần mở/bán được sau khi có chỗ chính.
- Mỗi lần bấm Mở hoặc Bán chỉ xử lý1rương; không slider, không batch hoặc popup tổng mở lô. Giữ backend/receipt cũ tương thích; slider bán mảnh và ghép mảnh hiện hữu không đổi.
- Mở: lưu giao dịch trước, rồi dùng ảnh đóng/mở cùng factory rương, timeline hữu hạn560ms, tiếp theo hiệu ứng rơi/thu quà dùng reward feedback chung. Max12vật phẩm/32Xu particles theo owner cũ, không tạo loop. Đóng popup/đổi trang/đổi hồ sơ hủy phần hình, không hủy quà đã commit. Reduced-motion hiện quà ngay. Lỗi trình bày sau commit không được nói rương còn nguyên hoặc cấp lại quà.
- Mở bên phải màu vàng, Bán bên trái xanh ngọc, Ghép tím; dùng nút nổi của cửa hàng. Các tab Cửa hàng/Bộ sưu tập cách tiêu đề4px, không đệm trên14px cũ.
- Dữ liệu bổ sung duy nhất: spark.state.storageUnlocks={slots,sequence,last}, tùy chọn với save cũ;112index mua hợp lệ8–119. Mua qua unlockStorageSlot trong local reward writer/journal/receipt/CAS hiện hữu, policy1 giữ giá1000Xu khi replay. Ví và quyền mở ô commit cùng một transaction. Không đổi formatVersion, catalogID hoặc số dư rương cũ; không sửa Rules.

Trạng thái: logic/UI mục16 và phần kho tạm đã kiểm chứng bổ sung ngày16/11; **không đóng toàn kế hoạch ngoại hình**. Gate tổng hợp O6/Gate7 và tích hợp nghệ thuật còn theo báo cáo nghiệm thu chung. Bằng chứng chi tiết mới nhất tại IMPLEMENTATION_NOTES.md; không deploy/Rules/APK/push/commit trong lượt này.

- Popup mua ô: mô tả đúng “Mở rộng thêm ô lưu trữ”, giá1.000Xu riêng; Hủy–Mua cùng96×44px, cách10px, căn giữa và dùng phong cách nút xác nhận của cửa hàng. Chỉ hiện toast−1.000Xu nếu receipt xác nhận có khoản trừ thật; toast rộng vừa chữ, bay lên1400ms rồi được owner hiện hữu dọn. Reduced-motion giữ thông báo tĩnh gọn.
- Trang trí hồ sơ: bỏ tick, giữ aria-pressed và viền vàng làm dấu chọn/đang dùng. Khóa20px và nhãnLevel cùng góc phải4px; chừa vùng đầu ô để không đè tên hoặc ảnh. Giữ nhãn bạcLevel7–20/vàngLevelMax, không đổi dữ liệu trang bị.
- [x] Projection từng rương,5trang chính và Kho tạm chỉ xem/phân trang hữu hạn; rương dư tự lấp ô chính khi phát sinh chỗ, giữ đủ tài sản cũ.
- [x] Mua từng ô qua writer/journal/receipt hiện hữu; xác minh không trừ hai lần, rollback khi lỗi và bền qua offline/restart.
- [x] Mở/bán1rương, hiệu ứng hữu hạn có cleanup, modal/nút/toast/tab/profile đúng yêu cầu mới.
- [x] Bổ sung16/11:32 unit storage/local-reward/Spark;27/27 UI Kho lưu trữ;2/2 UI production-worker offline; npm run check; npm run build; syntax/diff checks. Scenario mới xác nhận Kho tạm chỉ xem, không có thao tác Mở/Bán, tự hiện ở ô chính sau khi mua slot và mở rương. Chi tiết log tại báo cáo nghiệm thu hiện hành; không coi bộ test Kho báu bản đồ ngoài phạm vi là bằng chứng cho mục16.


## Bàn giao bản thử 11/11/2026

Chủ dự án giao hoàn tất phần còn lại, gom toàn bộ thay đổi hiện có để commit/push, cập nhật link test và tạo APK; kiểm chứng Android thật do chủ dự án tự làm. Sau bàn giao tạm dừng và ghi phần cần tiếp tục.

Gate5 đã đạt202 thiết kế/606WebP, manifest/hash/alpha/căn và phối đã kiểm. Phần tích hợp web của Gate6 đã nhận đủ202 form, đúng ba lớp/portrait; đã kiểm202 lượt decode, không giữ DOM dư. Không dùng kết quả web để xác nhận Android60FPS. Gate6/O6/Gate7 vẫn chưa đóng nghiệm thu toàn phần:7ca âm thanh mở rộng chưa đạt và1ca UI sao lưu tài khoản giả lập timeout còn cần chẩn đoán. Các kiểm tra logic/ảnh/web chính và ba suite emulator backend đã đạt. Xem một báo cáo chung tại design/expedition/COSMETIC_ACCEPTANCE_2026-11-11.md; không hiểu báo cáo này là kế hoạch thứ hai hoặc cho phép phát hành production.
