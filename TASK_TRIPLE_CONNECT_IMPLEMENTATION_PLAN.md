# TASK

## Goal

Triển khai **Triple Connect** như game thứ ba độc lập, theo `Triple Connect.md`, sử dụng Game Shell và hệ thống dùng chung hiện có nhưng không làm thay đổi luật, state hoặc dữ liệu của Memory Match và Link Connect.

Phiên bản đầu phải đạt:

- khay cố định đúng 7 ô, không có ô khóa hoặc Mở rộng khay;
- board nhiều lớp sinh theo solution-first và được solver xác nhận;
- luật chọn thẻ lộ, tự nhóm khay, resolve bộ ba, Miss, combo, điểm, thắng/thua và Undo có một reducer thuần làm nguồn sự thật;
- giao diện dọc theo concept đã duyệt: HUD trên, board nhiều lớp ở giữa, khay 7 ô dưới board;
- line đi qua ba thẻ trong khay rồi mới chạy effect xóa đang trang bị;
- state/controller/board/renderer/persistence Triple tách khỏi hai game hiện tại;
- hiệu suất, lifecycle, cleanup và tương thích save được kiểm chứng trên bản web PC/mobile; game luôn xuất hiện trong menu để người dùng chơi thử, sửa lỗi và cải tiến trực tiếp.

Ảnh concept được tạo trước quyết định mới vẫn có 10 slot, nên chỉ được dùng để tham chiếu bố cục, màu sắc, board nhiều lớp và chất lượng thị giác; không được dùng làm yêu cầu số ô khay. `Triple Connect.md`, reducer luật và các contract test mới là nguồn hành vi chính xác, với đúng 7 ô.

## Problem

### Baseline dùng chung đã được khóa

Gate 0 đã hoàn tất tại commit `3f89ff7`. Các lỗi selector geometry, assertion compact layout, breakpoint 500/600, test-server isolation và Link reflow playable đã được xử lý và review lại. Đây là baseline phải giữ, không phải danh sách để Gate 1 sửa lại.

Mỗi gate sau chỉ chạy regression tương xứng với shared owner đã chạm. Chỉ mở lại Gate 0 nếu test hoặc diff mới chứng minh một invariant baseline bị phá.

### Triple Connect chưa có owner kỹ thuật

- Các nhánh chọn game, appearance, shop và hydrate hiện có chỗ giả định chỉ tồn tại hai game.
- Chưa có reducer Triple dùng chung cho runtime, generator và solver; nếu ba bản luật khác nhau, board có thể được đánh giá “có lời giải” nhưng runtime vẫn kẹt.
- Board tối đa 60 thẻ/5 lớp có nguy cơ nổ tổ hợp solver và làm nghẽn main thread.
- Chuỗi animation chọn → bay → nhóm → nối → xóa có nguy cơ race khi tap nhanh, restart hoặc đổi game.
- Persistence Triple chưa có namespace/schema và có thể làm sai dữ liệu cũ nếu thêm bằng nhánh mặc định.

### Quyết định sản phẩm đã khóa

- Khay có đúng 7 ô trong mọi mode của phiên bản đầu.
- Không triển khai hoặc hiển thị Mở rộng khay; không tạo ID, inventory, field save hay code dự phòng cho 10 ô.
- Luật Miss dùng `streakType` và `streakCount`, độc lập với thứ tự nhóm thẻ trong khay.
- Undo phục hồi snapshot chính xác; không tự đưa tile lên layer cao hơn. Shuffle xóa Undo history.
- Timeline effect có các pha hữu hạn, có interrupt/cleanup và reduced-motion; gameplay không phụ thuộc callback animation để trở nên đúng.
- ID game dùng ở catalog/registry là `triple-connect`; key dữ liệu JavaScript là `tripleConnect`.
- Mode ID dùng chung với hệ hiện tại: `easy`, `normal`, `hard`, `superHard`, `endless`, `challenge`; “Trung bình” chỉ là nhãn hiển thị của `normal`, không tạo ID `medium` mới.
- Gate 2/3 chỉ cấu hình Easy và luật chung. Các mode còn lại chỉ được thêm lần lượt tại Gate 7A.

### Contract thực hiện từng gate

- Thứ tự thực thi bắt buộc: `Gate 1 -> Gate 2 -> Gate 3 -> Gate 4 -> Gate 5 -> Gate 6 -> 7A-normal -> 7A-hard -> 7A-superHard -> 7A-endless -> Gate 8 -> 7B-hint -> 7B-time -> 7B-undo -> 7B-shuffle -> 7C-challenge/lucky -> 7C-integration -> 7C-release`. Gate 8 là checkpoint quyết định sản phẩm, không phải gate code.
- Chỉ thực hiện **một gate hoặc sub-gate trong một lượt**. Không tự kéo việc của gate sau vào để “hoàn chỉnh luôn”.
- Trước khi code, Terra phải nêu ngắn: precondition đã đạt, file owner dự kiến sửa, ngoài phạm vi và test sẽ chạy. Sau đó tiếp tục triển khai; không dừng ở phân tích nếu quyết định đã có trong tài liệu này.
- Chỉ dừng hỏi khi gặp một quyết định chưa chốt được liệt kê rõ ở Gate 8, thay đổi schema/API ngoài phạm vi, hoặc bằng chứng code mâu thuẫn tài liệu. Khi dừng phải nêu file, invariant xung đột và đúng một quyết định cần người dùng chốt.
- Mỗi gate phải có diff riêng, review riêng và báo cáo pass/fail thật. Gate sau chỉ bắt đầu khi gate trước đã pass hoặc có văn bản chấp nhận rủi ro.
- Không coi file/module được liệt kê trong “Files to inspect” là quyền sửa. Chỉ sửa owner thuộc gate hiện tại và call site bắt buộc được chứng minh bằng import/test.
- Không tạo callback rỗng, capability giả, schema field, ID item hoặc abstraction dự phòng cho gate tương lai.
- Báo cáo cuối mỗi gate phải ghi: file thực sự đổi, invariant đã thêm/giữ, test và số đo đã chạy, diff ngoài phạm vi (nếu có), phần chưa xác minh và commit/hash dùng làm đầu vào cho review độc lập. Không được chỉ báo “đã chạy được”.

### Thứ tự ưu tiên tài liệu

1. `AGENTS.md` và yêu cầu trực tiếp mới nhất của người dùng.
2. File task này cho thứ tự gate, phạm vi, ownership, test và acceptance criteria.
3. `Triple Connect.md` cho luật gameplay và thiết kế đã chốt.
4. `ARCHITECTURE.md`, `ADD_GAME.md` và contract hiện có trong code cho pattern tích hợp.
5. `TRIPLE_CONNECT_READINESS_PLAN.md` chỉ là hồ sơ đánh giá lịch sử; không dùng số gate cũ của file đó để triển khai.

Nếu nguồn thấp hơn khác nguồn cao hơn, Terra phải theo nguồn cao hơn và ghi xung đột trong báo cáo; chỉ hỏi lại nếu khác biệt vẫn làm thay đổi hành vi hoặc dữ liệu sau khi áp dụng thứ tự trên.

### Addendum hoàn thiện sau implementation ngày 2026-09-13

Addendum này phản ánh code hiện có đến commit `428c6fd` và **thay thế thứ tự gate cũ cho phần việc còn lại**. Các commit đã tồn tại chỉ là đầu vào review, không tự động chứng minh gate pass.

Worktree hiện có nhiều thay đổi chưa commit từ quá trình Terra hoàn thiện Triple. Đây là công việc đang thực hiện của người dùng/agent; trước mỗi gate phải đọc `git status` và diff đúng owner, tiếp tục có chủ ý, không dựa vào danh sách file cũ trong tài liệu và không hoàn nguyên hoặc ghi đè.

Trong repository này cần phân biệt rõ hai khái niệm:

- `released: true` trong `gameCatalog.js` chỉ có nghĩa game xuất hiện trong selector/menu để người dùng chạy và kiểm thử như hai game hiện có. Trạng thái này là **có chủ ý và phải được giữ**.
- Mục tiêu hiện tại là **Web Experience Complete**: đầy đủ chức năng, chơi mượt và có thể nghiệm thu thực tế trên web PC/mobile. PWA/APK, Android lifecycle và QA cửa hàng ứng dụng là phase sau, chỉ được lập/thực hiện khi người dùng xác nhận bản web đã ổn định; chúng không phải gate của kế hoạch hiện tại.

#### Quyết định sản phẩm đã được người dùng duyệt

Các giá trị hiện có sau đây là chính thức, không còn là blocker Gate 8:

- khởi đầu có 3 Gợi ý;
- giá Gợi ý 8 Xu, Thêm thời gian 2 Xu/giây, Hoàn tác 15 Xu và Xáo thẻ 15 Xu;
- mốc sao mode đếm ngược `12 / 18 / 25` điểm trên mỗi bộ ba;
- mốc sao Endless `10 / 15 / 20` điểm trên mỗi bộ ba;
- Lucky chỉ có trong Challenge, mỗi board có 1–3 Lucky Card và loại thưởng gồm Xu, thời gian hoặc Gợi ý;
- `thunder`, `freeze` và `tray-expand` không thuộc item Triple phiên bản đầu.

Không đổi các giá trị này chỉ để giống game khác. Nếu test cân bằng cho thấy cần đổi, báo số đo và xin duyệt trong một task tuning riêng.

#### Khoảng trống phải khép lại để bản web đủ chức năng và nghiệm thu thực tế

- `gameCatalog.js` đã đặt Triple `released: true` tại `84aa7d0`; đây là quyền truy cập chơi thử qua menu theo yêu cầu người dùng, không phải tuyên bố game đã hoàn thiện hoặc sẵn sàng đóng gói.
- `tripleRenderer.js` hiện hard-code theme Fruits và CSS dùng một kích thước tile chung; layout 24/36/60 có `tileWidth`/`tileHeight` khác nhau nên visual và hit geometry chưa được xác nhận đúng.
- Controller còn cố định `level: 1`, chưa có terminal flow hoàn chỉnh, Next level, Continue menu production hoặc Endless advance.
- Time hiện mới là thao tác `+1 giây`; Shuffle, giao dịch mua, Shop Triple và Collection đúng capability Triple chưa hoàn chỉnh.
- Collection Triple hiện có thể rơi vào nhánh appearance của Memory; không được coi việc modal mở được là tích hợp Collection đúng.

#### Thứ tự hoàn thiện bắt buộc

`Completion 0 -> Completion 1A -> Completion 1B -> Completion 2 -> Completion 3A -> Completion 3B -> Completion 4A -> quyết định Lucky còn lại -> Completion 4B -> Completion 5 -> Completion 6 Web Acceptance`.

Mỗi Completion gate/sub-gate là một lượt và một diff riêng. Không gộp visual, progression, commerce, Lucky và Web Acceptance.

Nếu Terra đã triển khai một phần gate phía sau, Completion 1A và 1B vẫn là corrective gates bắt buộc và phải pass trước khi tiếp tục Completion 4B–6. Không chạy PWA/APK/Android hoặc vòng lặp “QA đóng gói” trong phase này; các bước đó không thay thế việc hoàn thiện UI, gameplay và tính năng mà người dùng cần nghiệm thu trên web.

##### Completion 0 — Khóa contract truy cập chơi thử qua menu

1. Giữ Triple `released: true` và hiển thị cùng Memory/Link trong selector để người dùng có thể chơi thật, xem visual và phát hiện lỗi.
2. Luồng mở từ menu phải dùng controller production của Triple, không phụ thuộc development launcher hoặc query/localStorage bypass.
3. Development/test hook vẫn có guard và chỉ phục vụ fixture/seed đặc biệt; không phải đường duy nhất để vào game.
4. Contract test bắt buộc: selector có đúng ba game; Triple mở đúng menu/game của nó; ID lạ không đổi active game; mở/đóng/đổi giữa ba game không nhân đôi shell/bootstrap.
5. Mode/tính năng chưa hoàn chỉnh có thể ẩn riêng hoặc ghi rõ chưa sẵn sàng; không ẩn toàn bộ Triple chỉ vì một mode chưa xong.

**Pass khi:** người dùng vào và chơi Triple trực tiếp từ menu, còn test hook vẫn cô lập; quyền truy cập này không được gọi là bằng chứng game đã đủ chức năng hoặc đã qua Web Acceptance.

##### Completion 1A — Đồng bộ selector, chủ đề và HUD

Gate này chỉ sửa contract điều hướng/hiển thị chrome; chưa đổi slot, cover graph, solver hoặc topology board.

1. Picker Bắt đầu và Tiếp tục của Triple dùng cùng cấu trúc `difficulty-content` như Memory/Link: hàng tóm tắt chủ đề đang trang bị, icon/tên chủ đề và nút **Đổi**, sau đó mới đến lưới mode/session. Nút Đổi mở Collection đúng `gameId: "triple-connect"`; đóng/quay lại không tự bắt đầu game, không mất mode/session dự định và không rơi về appearance Memory/Link.
2. Mode lấy label/icon từ `gameCatalog.js`; không hiển thị raw ID hoặc trộn `Easy`, `normal`, `superHard`. Continue phải hiển thị label tiếng Việt + level và dùng cùng quy tắc đóng modal/chọn new-or-continue đã ổn định ở hai game cũ.
3. Triple Shell phải đưa progress, HUD, action menu và tools menu qua contract `createGameShellHud`/Game Shell dùng chung. Chỉ nội dung gameplay là riêng Triple; không copy thêm một bộ component hoặc phụ thuộc CSS selector riêng của Link như owner lâu dài.
4. Progress row giữ đúng các nội dung đã duyệt: Moves, Miss, Combo, tiến trình 3 sao, Điểm, số bộ ba đã xóa/tổng và Gợi ý khi capability đã hoạt động. Thanh HUD giữ Menu, Level, Timer, tổng sao và Công cụ; icon, nhãn, tooltip, trạng thái mở/đóng và thứ tự phải đồng bộ Memory/Link.
5. Action menu chỉ hiện action có handler thật. Hai menu trái/phải loại trừ lẫn nhau, đóng khi Escape/click ngoài/unmount/chuyển game, không nhân listener qua restart. Compact landscape tiếp tục dùng contract shell chung; desktop landscape giữ chrome desktop có chủ ý.
6. CSS chỉ thêm modifier Triple cho khác biệt nội dung thật. Nếu cần thay shared HUD, chứng minh cả ba consumer và chạy regression cả ba game; không vá bằng specificity/load-order.

**Pass khi:** người dùng nhận ra cùng một luồng chọn mode/chủ đề và cùng HUD như hai game cũ; label đúng, theme Triple được giữ qua start/continue/reload, menu không lệch/đè board và không có listener/shell trùng.

##### Completion 1B — Topology nhiều lớp, trạng thái che và phép fit hình ảnh

Gate này bắt đầu sau 1A và sở hữu config/layout/cover graph/renderer/CSS/test geometry. Không trộn progression, Shop, Lucky hoặc effect timeline.

1. Thay các helper xếp `normalSlots`/`hardSlots`/`superHardSlots` theo cột bằng catalog template hình học thật. Mỗi template dùng một lưới tọa độ logic có bước bằng **nửa chiều rộng/nửa chiều cao thẻ**; các tầng được căn giữa trong cùng board và có mask khác nhau, không phải cùng một lưới kéo dài theo cột.
2. Layer 1 được phép chiếm gần toàn board nhưng vẫn phải có silhouette có chủ ý thay vì lấp lưới máy móc. Layer 2 đặt phần lớn tâm thẻ vào khe/đường nối giữa các thẻ Layer 1; Layer 3 xen kẽ tương tự với Layer 2; Layer 4 xen kẽ với Layer 3 và được phép có nhiều slot hoặc footprint lớn hơn Layer 3; Layer 5 xen kẽ với Layer 4 và nên có footprint nhỏ để còn đọc được các lớp phía sau. “Lớn hơn” ở đây là **cụm/mask hoặc số lượng thẻ**, không phải tăng kích thước từng card theo layer.
3. Bộ template ban đầu phải có hình dạng đọc được bằng cách sắp thẻ, không biến hình bằng CSS: khung vuông/chữ nhật, vòng/kim cương, dấu cộng, tam giác hoặc biến thể bất đối xứng cân bằng. Phân bố tham chiếu vẫn là Easy `8 + 4`, Normal `12 + 8 + 4`, Hard `18 + 9 + 6 + 3`, Super Hard/Endless `24 + 15 + 9 + 9 + 3`; đây là ngân sách slot ban đầu, không phải quy tắc bắt buộc số lượng phải giảm ở mọi layer trung gian. Mọi thay đổi phân bố phải giữ đúng tổng 12/24/36/60, số layer của mode và pass solver/visual review.
4. Slot cùng một layer không được giao nhau. Các card trong một layout giữ cùng kích thước; sự xen kẽ được tạo bằng tọa độ nửa ô, không bằng phóng to/thu nhỏ card. Phần lớn slot layer cao phải phủ qua khe của hai hoặc bốn tile layer ngay dưới để tạo chiều sâu; slot biên được phép có ít support hơn nhưng vẫn phải có quan hệ che phủ có chủ ý. Không có thẻ nằm ngoài bounds, bị che kín 100% hoặc tạo cột dọc ép ảnh. Validator phải kiểm tra ID duy nhất, bounds, layer/count, same-layer collision, blocker hữu ích và phần thẻ dưới còn nhìn thấy.
5. Một tile board chỉ exposed khi **không còn tile layer cao nào giao vùng của nó** trong cover graph precomputed. Tile đang bị che phải `disabled`, `aria-disabled="true"`, bỏ khỏi thứ tự focus và command chọn phải bị reducer từ chối mà không tăng Moves/Miss. Không khóa cứng toàn bộ layer: tile dưới đã hết blocker thực tế được sáng/chọn ngay cả khi cùng layer vẫn còn tile khác bị che.
6. Trạng thái bị che dùng opacity/màu phủ tĩnh đủ nhận diện ảnh và viền; trạng thái exposed sáng, tương phản và nổi hơn. Không dùng blur/filter động hoặc animation loop. Khi blocker cuối bị lấy đi, renderer chỉ patch các dependency liên quan, không quét/rebuild toàn board.
7. Layout engine lấy shape/bounds thật của template đang chạy, tính **một scale đồng nhất** từ chiều rộng và chiều cao khả dụng rồi căn giữa; không khai báo cố định `5×2`, không co riêng trục X/Y và không tái sinh board khi resize/orientation.
8. Ảnh trong thẻ phải hiện trọn nội dung bằng `object-fit: contain`, có padding/background ổn định và không bị cắt bởi tỷ lệ thẻ hoặc layer kế bên. `overflow: hidden` chỉ cắt đúng biên bo góc của chính thẻ. Asset lỗi/tải chậm dùng fallback nhưng không đổi kích thước, slot hay cover graph.
9. Khay luôn 7 ô, nằm ngoài vùng layer và còn thấy được ở mọi viewport. Board/tray phải fit ở `360×640`, `640×360`, `411×914`, `914×411` và profile desktop landscape hiện có; desktop không bị ép vào compact mobile và không mất nửa ảnh.
10. Layout ID mới phải tăng version. Session cũ giữ resolver layout v1 để Continue an toàn trong giai đoạn chuyển tiếp hoặc được từ chối có thông báo theo policy session hỏng; tuyệt đối không dùng tọa độ v2 để diễn giải một snapshot v1.
11. Chụp visual candidate cho Easy, Hard và Super Hard ở portrait mobile, compact landscape và desktop landscape; review riêng silhouette của từng layer, nhịp xen kẽ, độ mờ, ảnh đầy đủ, vùng trống và khả năng đọc trước khi cập nhật baseline.

**Pass khi:** board không còn là các cột chồng; hình từng layer đọc được, cover graph khớp hình học, thẻ bị che không chọn được, thẻ vừa lộ được mở đúng lúc, toàn ảnh hiện đủ và cùng round giữ nguyên topology qua resize/orientation.

#### Addendum review sau Completion 1A/1B — 2026-09-14

Review độc lập trên code/worktree hiện tại cho thấy phần lõi đã tiến bộ nhưng **chưa đạt visual/experience acceptance**. `npm run check` và production build pass; 98/99 test UI mục tiêu pass trên desktop/mobile/landscape. Test còn fail tại `411×914`: đáy một tile của board 60 thẻ ở `437.02px` vượt đáy board `436.11px` theo assertion, và ảnh lỗi cho thấy bố cục vẫn đọc thành các cụm cột hẹp. Kiểm tra UI thật còn xác nhận khay tăng từ `52px` lên khoảng `70.3px` sau thẻ đầu tiên vì row lấy kích thước nội tại của tile.

Các corrective gate dưới đây **bắt buộc thực hiện theo thứ tự `UX-0 -> UX-1 -> UX-2 -> UX-3 -> UX-4 -> UX-5` trước Completion 6 Web Acceptance**. Không được dùng việc test logic phần lớn đang xanh để bỏ qua lỗi nhìn thấy hoặc cập nhật baseline nhằm che lỗi. Popup đầu màn, popup cuối màn và mốc thưởng đặc biệt là ba contract riêng; không gộp thành một modal tổng quát hoặc đánh dấu hoàn thành chỉ vì đã có một hộp thoại kỹ thuật.

##### Corrective UX-0 — Khóa lại geometry và visual topology

1. Sửa phép fit từ bounds thật của layout + tray reserve; mọi tile phải nằm trong board ở đúng hai chuẩn mobile đã chốt và desktop landscape. Không tăng `min-height` theo từng viewport để né assertion.
2. Review lại mask v2 bằng hình ảnh, không chỉ `layerCounts`: silhouette phải là khung/kim cương/dấu cộng/tam giác hoặc biến thể có chủ ý, các lớp xen kẽ ở nửa ô và không tạo ba/sáu cột dọc giống bản cũ.
3. Test phải duyệt toàn bộ tile của mọi mode, không chỉ tile đầu; thêm screenshot Easy/Hard/Super Hard và assertion board/tray không giao nhau.

**Pass khi:** geometry test xanh ở `360×640`, `640×360`, `411×914`, `914×411` và desktop; visual reviewer phân biệt được hình từng layer, không còn tile vượt board hoặc cụm cột nén.

##### Corrective UX-1 — Hoàn thiện main menu, picker, theme và HUD

1. Main menu Triple bổ sung **Cài đặt** và **Thông tin** theo cùng thứ tự, icon, nội dung phiên bản/tác giả và hành vi quay lại như Memory/Link. Hướng dẫn phải mô tả layer bị che, khay 7, bộ ba, điều kiện thắng/thua và vật phẩm Triple; không dùng đoạn một câu tạm.
2. Popup chọn mode giữ theme row nhưng màu nền/viền/chữ/nút Đổi phải dùng token modal/theme chung; không giữ hàng theme xám lệch palette. Mỗi mode có mô tả ngắn về số thẻ/lớp/thời gian; popup này chỉ chọn mode/theme và không thay nhiệm vụ của popup đầu màn.
3. In-game action menu phải có đủ action shared đã hỗ trợ thật: Chơi lại, Menu, Cài đặt, Cửa hàng, Bộ sưu tập, Hướng dẫn, Thông tin và Xóa dữ liệu. Main menu và in-game menu gọi cùng owner nội dung, không sao chép HTML/handler.
4. HUD Triple dùng cùng DOM contract/tokens với Memory/Link cho progress row, Menu, Level, Timer, tổng sao và Công cụ. `createGameShellHud` hiện chỉ đồng bộ cập nhật dữ liệu; Terra phải loại CSS/markup gần giống nhưng sở hữu riêng nếu shared component có thể nhận config Triple.
5. Timer số vẫn cập nhật theo giây, nhưng timer bar phải nội suy mượt từ timestamp bằng RAF owner chung như Memory/Link; pause/background/resume/time purchase phải rebase thời điểm, không chạy nhiều loop và reduced-motion vẫn đúng thời gian.
6. Thêm **popup đầu màn** cho mỗi board mới: hiển thị mode, level, mục tiêu, số thẻ/số lớp, giới hạn thời gian hoặc nhãn Endless, chủ đề đang dùng, luật/mẹo ngắn phù hợp board và tóm tắt mốc thưởng đặc biệt. Nút Bắt đầu mới mở input và khởi động timer; trong lúc popup mở không được trừ thời gian, nhận click board hoặc chạy effect gameplay.
7. Continue/resume không phát lại popup đầu màn của board đang dang dở. Next level, board Endless kế tiếp và Replay là board mới nên hiển thị popup với dữ liệu mới; callback popup cũ phải có round/generation guard. Back/Menu hủy round chưa bắt đầu sạch sẽ, không để session giả, timer, listener hoặc overlay sót lại. Nội dung dùng cùng modal/component owner với hai game trước nhưng nhận model Triple qua adapter, không sao chép markup/handler.

**Pass khi:** parity test xác nhận menu/picker/HUD đủ mục, màu token đồng nhất, timer bar không nhảy từng nấc một giây; popup đầu màn xuất hiện đúng một lần cho board mới, không xuất hiện khi Continue, timer/input chỉ bắt đầu sau xác nhận và ba game không bị thay đổi hành vi.

##### Corrective UX-2 — Khay 7 ô cố định và animation chọn thẻ

1. Khay tạo sẵn đúng 7 slot wrapper có kích thước cố định từ lúc mount; thêm/bớt tile chỉ thay nội dung slot, không thay height/width/số cột hoặc đẩy board/surface.
2. Row height, tray height và slot size dùng token; tray tile thu nhỏ để nằm trọn slot, giữ tỷ lệ ảnh và không lấy `min-width/min-height: 44px` của board tile làm row lớn lên. Tile trong khay không cần hit target 44px vì không tương tác, nhưng slot/khay vẫn phải rõ và dễ đọc.
3. Khi chọn, commit reducer trước rồi chạy FLIP/ghost từ rect board sang slot đích trong 180–240 ms bằng `transform`/`opacity`. Capture geometry trước/after theo batch; gameplay state không chờ animation để đúng.
4. Khi tray regroup, các tile đang có di chuyển tới slot canonical bằng FLIP. Tap trong presentation bị từ chối không penalty; restart/unmount/timeout hủy toàn bộ ghost/animation và reconcile về state mới nhất.
5. Reduced motion bỏ flight dài, dùng fade/highlight ≤100 ms; geometry khay trước/sau 0–7 tile phải tuyệt đối ổn định.

**Pass khi:** test đo rect khay trước/sau từng lượt bằng nhau, tile tray không làm co giãn, đường bay đúng slot, regroup không nhảy và cleanup về 0 sau 20 chu kỳ.

##### Corrective UX-3 — Match, điểm, phần thưởng và popup kết quả

1. Sửa nguồn tính sao trước khi làm visual: code hiện tính theo `matchedTriples / totalTriples`, khiến mọi round thắng luôn đạt 3 sao và bỏ qua config đã duyệt. Một owner phải tính sao theo mốc `12/18/25` cho mode đếm ngược và `10/15/20` cho Endless, dùng cùng kết quả cho progress HUD, terminal record, thưởng Xu và popup. Xóa/sửa test đang mặc định mọi lần clear board đều 3 sao; thêm case thắng 1/2/3 sao tại biên ngưỡng.
2. Mở rộng `triplePresentation` thành timeline hữu hạn: select feedback → bay vào khay → regroup → line qua ba tâm → effect xóa đang trang bị trên ba ghost → `+điểm/combo` → reward visual nếu transition/transaction thực sự có thưởng → resolve/popup terminal.
3. Effect xóa phải chạy adapter đang trang bị thật, không chỉ gắn class vào clone rồi fade line. Test cần chờ computed animation/event hoàn tất và xác nhận ba ghost được cleanup, thay vì chỉ kiểm tra tên class.
4. Cộng điểm hiển thị một label ngắn tại cụm match và cập nhật HUD từ state đã commit; không cộng điểm trong callback visual và không dùng DOM làm nguồn số điểm.
5. Rơi Xu chỉ chạy khi giao dịch Xu đã commit: Lucky Xu hoặc thưởng cuối màn. Rơi vật phẩm chỉ chạy khi Lucky Gợi ý/thời gian hoặc một reward event đã được duyệt và commit. Tái dùng `lootEffects`/`coinRewards` qua adapter Triple, thêm source selector Triple thay vì copy module. Không tự thêm tỉ lệ rơi ngẫu nhiên hoặc kinh tế theo mỗi match.
6. Popup thắng/thua kỹ thuật hiện đã có `#triple-round-summary-modal`, nhưng phải nâng thành **popup cuối màn** theo trải nghiệm summary chung: phân biệt thắng, hết giờ và đầy khay; hiển thị mode/level, sao đạt, điểm, combo tốt nhất, Xu cuối màn, từng thưởng Lucky/mốc đặc biệt đã nhận và mốc còn thiếu. Chỉ hiển thị số thưởng sau khi transaction đã commit; không gộp thưởng dự kiến với thưởng đã nhận.
7. Action popup cuối màn phụ thuộc trạng thái: Menu và Chơi lại luôn hợp lệ; Màn tiếp theo chỉ có sau khi thắng mode có level; Endless dùng Tiếp tục để tạo board kế trong cùng run; Challenge dùng contract progression riêng. Popup chỉ mở sau presentation cuối đã settle, khóa input phía sau, focus đúng nút chính và xuất hiện đúng một lần; callback round cũ không được mở hoặc sửa popup round mới.
8. Thưởng và popup chịu transaction rollback: save fail không chạy coin/item flight giả, không tăng counter và không báo nhận thưởng. Reduced motion giữ nguyên thứ tự nghiệp vụ với visual rút gọn.

**Pass khi:** người chơi nhìn thấy đầy đủ đường bay, line/xóa, điểm và reward đúng sự kiện; popup cuối màn xuất hiện đúng một lần, phân biệt đúng nguyên nhân kết thúc, số liệu/thưởng khớp persistence, action điều hướng đúng mode và không còn ghost/coin/item/modal node sau cleanup.

##### Corrective UX-4 — Mốc thưởng đặc biệt của Triple

1. Bật region `data-shell-region="milestones"` đang bị ẩn của Triple và đưa nó về cùng semantic/component HUD với Memory/Link: số Xu, thanh tiến trình và marker có tooltip/mô tả. Portrait và desktop hiển thị đầy đủ; compact landscape được phép ẩn phần visual theo contract Game Shell hiện hành nhưng tiến trình/reward vẫn phải hoạt động và popup cuối màn vẫn tổng kết được.
2. Triple có owner/config riêng cho luật mốc; chỉ tái dùng shell, presentation và transaction chung. Không sao chép bảng thưởng Memory/Link vì các hành vi như phá cặp, mở băng hoặc item không thuộc Triple. Trước khi bật production, bảng cấu hình phải chốt: nguồn tích lũy, xác suất/đảm bảo nhận năng lượng nếu có, số mốc/chu kỳ, reward từng mốc, fallback khi inventory đầy, reset/carry giữa level và hành vi Endless/Challenge.
3. Phương án mặc định đề xuất để Terra thiết kế contract và test: tiến trình chỉ tăng từ một bộ ba đã resolve thành công; state bền vững lưu `progress`, reward/claim ID và pending presentation, không lấy DOM/animation làm nguồn sự thật. Mỗi milestone được grant tối đa một lần trong chu kỳ; Undo không thu hồi hoặc cấp lại reward đã commit, Shuffle giữ nguyên tiến trình/claim ledger, reload/Continue khôi phục chính xác và board mới tuân theo reset/carry đã được duyệt.
4. Timeline hữu hạn: ba thẻ resolve → một energy/marker flight về thanh → marker bật sáng/pulse → commit và hiển thị reward tương ứng → tiếp tục gameplay. Chỉ tạo visual sau event hợp lệ; tối đa một hàng đợi milestone có giới hạn, xử lý tuần tự, có round/generation guard và cleanup khi restart/menu/unmount. Reduced motion dùng highlight/fade ngắn, không dùng animation loop liên tục.
5. Reward thay đổi board chỉ được chọn từ trạng thái hợp lệ sau resolve và phải giữ solvable invariant; reward Xu/time/item đi qua transaction/catalog Triple và giới hạn inventory. Save fail rollback toàn bộ reward/progress liên quan và không phát visual giả. Nhiều milestone phát sinh gần nhau phải có thứ tự xác định, không khóa game vĩnh viễn hoặc mở popup cuối màn trước khi queue đã settle.
6. Test bắt buộc: đạt từng mốc và rollover; không thưởng khi chọn sai/chưa đủ bộ ba; nhiều milestone liên tiếp; inventory đầy; save fail; Undo/Shuffle/reload/Continue; level mới/Endless/Challenge theo policy; win xảy ra cùng milestone cuối; restart/switch game giữa effect; 20 chu kỳ không tăng node/listener/timer/RAF và số dư/persistence không double grant.

**Pass khi:** thanh mốc đồng bộ hình thức với hai game trước nhưng luật là của Triple; mọi reward có config được duyệt, commit đúng một lần và được phản ánh trong HUD/popup cuối màn; không mất/nhân thưởng, không phá solvability và không còn effect/queue sau cleanup.

> **Quyết định sản phẩm còn bắt buộc cho UX-4:** việc yêu cầu “có mốc thưởng đặc biệt” đã chốt phạm vi tính năng nhưng chưa chốt kinh tế. Terra được phép hoàn thiện shell, state contract và test fixture, nhưng không được tự đưa bảng thưởng/tỷ lệ/reset policy vào production hoặc sao chép từ game khác. Ô này chỉ chặn phần grant reward của UX-4, không chặn UX-0 đến UX-3.

**Bảng 10 mốc Triple đề xuất — chờ người dùng duyệt:**

| Mốc | Điều kiện tích lũy | Mode đếm ngược/Challenge | Endless |
|---:|---:|---|---|
| 1 | 3 bộ ba | `+2 Xu` | `+2 Xu` |
| 2 | 6 bộ ba | `+2 giây` | `+2 Xu` |
| 3 | 9 bộ ba | `+1 Gợi ý` | `+1 Gợi ý` |
| 4 | 12 bộ ba | `+3 Xu` | `+3 Xu` |
| 5 | 15 bộ ba | `+1 Hoàn tác` | `+1 Hoàn tác` |
| 6 | 18 bộ ba | `+3 giây` | `+3 Xu` |
| 7 | 21 bộ ba | `+5 Xu` | `+5 Xu` |
| 8 | 24 bộ ba | `+1 Gợi ý` | `+1 Gợi ý` |
| 9 | 27 bộ ba | `+1 Xáo trộn` | `+1 Xáo trộn` |
| 10 | 30 bộ ba | `+10 Xu` và `+1 Gợi ý` | `+10 Xu` và `+1 Gợi ý` |

Contract đề xuất đi cùng bảng:

1. Mỗi bộ ba do người chơi resolve hợp lệ tăng đúng `1` tiến trình; không dùng xác suất rơi năng lượng, không tăng từ Lucky, reward tự động hoặc thao tác item. Track hiển thị `0/30` với 10 marker tại `3, 6, ..., 30`.
2. Tiến trình dùng chung cho Triple và carry qua level/mode/thua/restart; mốc 10 grant xong mới tăng `cycleId` và reset về `0`. Không reset chỉ vì đóng menu, reload hoặc đổi viewport.
3. Endless đổi phần thưởng thời gian ở mốc 2/6 thành Xu như bảng; không tạo item thời gian vô dụng. Các phần thưởng còn lại giống nhau để người chơi không phải học hai bảng.
4. Khi item đạt giới hạn inventory, đổi sang Xu bằng khoảng 50% giá Shop, làm tròn lên: Gợi ý `4 Xu`, Hoàn tác `8 Xu`, Xáo trộn `8 Xu`. Fallback và reward gốc chỉ commit một lần trong cùng transaction.
5. Không có mốc tự động lấy/xóa thẻ ở phiên bản đầu. Điều này tránh thay đổi cover graph, tray, solver, combo và thứ tự popup cuối màn; nếu muốn thêm sau phải là task cân bằng riêng có solver/regression mới.
6. Undo không đảo ngược milestone/reward đã commit. Để không farm bằng match → Undo → match lại, mỗi board lưu tập tile instance đã từng cấp tiến trình; một tile chỉ góp năng lượng một lần dù được phục hồi. Shuffle giữ nguyên ID và ledger này; reload/Continue phải khôi phục ledger.
7. Lucky và mốc đặc biệt là hai nguồn thưởng độc lập nhưng dùng chung transaction queue; nếu cùng phát sinh trong một bộ ba, thứ tự cố định là match/score → Lucky → milestone → kiểm tra thắng → popup cuối màn. Popup chỉ tổng kết reward đã commit.
8. Giá trị bảng này là baseline để chơi thử web, chưa phải cân bằng vĩnh viễn. Sau ít nhất 20 round trải đều Easy/Normal/Hard/Super Hard/Endless, ghi số mốc trung bình mỗi board, Xu/item nhận trên mỗi 10 phút và tỷ lệ dùng item; tuning chỉ đổi config, không đổi state contract/schema.

##### Corrective UX-5 — Inventory tính năng, hiệu suất và review cuối

1. Lập parity matrix Memory/Link/Triple cho: main menu, start/continue picker, popup đầu màn, settings/info/help/reset, Shop, Collection/theme/effect, HUD/timer, mốc thưởng đặc biệt, pause/background, sound, popup cuối màn/win/loss/next/restart, Xu và item. Mỗi ô ghi `shared`, `Triple adapter`, `not applicable` hoặc `missing`; không sao chép tính năng theo cặp không phù hợp Triple.
2. Đóng toàn bộ ô `missing` thuộc phạm vi đã duyệt bằng gate riêng theo owner. Freeze/Thunder/Mở rộng khay và reward drop ngẫu nhiên vẫn ngoài phạm vi nếu chưa có quyết định sản phẩm mới.
3. Chạy `npm run check`, production build, test Triple mục tiêu và regression shared owners trên hai chuẩn mobile/landscape + desktop. Không chạy profile mobile cực nhỏ ngoài yêu cầu này.
4. Đo p95 tap→feedback, DOM patch, frame/long task trong select/regroup/match/reward; kiểm tra 20 chu kỳ mount/restart/switch/orientation và heap/node/listener/timer/RAF/animation trở về baseline.
5. Review trực quan độc lập phải chơi thật ít nhất một round Easy và một board 60 tile, đổi theme, dùng item, thắng/thua, xoay màn hình và mở mọi menu. Test pass không thay thế visual acceptance của người dùng.

**Pass khi:** parity matrix không còn ô `missing` trong phạm vi, toàn bộ test/build xanh, khay/animation/reward đạt ngân sách và người dùng có thể nghiệm thu trọn luồng chơi trên web PC/mobile.

##### Completion 2 — Progression, Continue, thắng/thua và chuyển level

1. Bỏ mọi `level: 1` hard-code khỏi luồng production. Session có mode, level, seed/layout, timer và snapshot đã validate.
2. Menu Triple hiển thị Continue khi có session hợp lệ và picker theo mode/level; session hỏng không hiện Continue.
3. Win/loss/tray-full/time-up chỉ settle đúng một lần, dừng timer/input, lưu state bền vững rồi mở popup phù hợp. Callback round cũ không được mở popup cho round mới.
4. Mode cố định: Next tăng level, tạo seed mới xác định từ run/level, sinh board được solver xác nhận và không mang tray/Undo/history từ level cũ.
5. Endless: clear board tăng level và sinh board kế tiếp; đồng hồ đếm xuôi là thời gian tích lũy của cả run, không reset về 0 khi sang level. Continue phục hồi đúng level và elapsed time.
6. Terminal session không được đưa trở lại Continue như một round đang chơi. Xử lý save failure theo pattern hiện có, không báo thắng giả rồi mất progression.
7. Thêm test new/continue/reload/next, thắng bằng match cuối, thua do tray 7, time-up, Endless qua nhiều level và restart/exit giữa settlement.

**Pass khi:** progression và popup đúng một lần, Continue chính xác theo mode/level, Endless chuyển board không mất elapsed time và không có timer/callback cũ.

##### Completion 3A — Time và Shuffle hoàn chỉnh

1. Time dùng catalog/transaction Triple đã duyệt, không để button `+1 giây` tự trừ item mà thiếu purchase/use contract. Không xuất hiện trong Endless.
2. Purchase/use thất bại phải rollback đồng thời Xu, inventory, timer và session; không có trạng thái lưu một nửa.
3. Shuffle chỉ phân bố lại tile còn trên board qua slot/layer hợp lệ, giữ nguyên tray, counter và multiset; dùng seeded RNG, solver witness, hard budget và rollback nguyên trạng khi fail.
4. Shuffle thành công xóa Undo history, cancel presentation cũ và render lại bằng cùng renderer keyed; không rebuild shell hoặc tạo listener mới.

**Pass khi:** Time và Shuffle qua purchase/use/reload/failure tests; Shuffle không tạo board vô nghiệm, không mất/trùng tile và không leak worker/cache/node.

##### Completion 3B — Shop, inventory và Collection Triple

1. Tạo capability/adapter Triple cho item catalog, purchase, inventory count và equip; không thêm nhánh mặc định `else => Memory`.
2. Shop chỉ hiển thị bốn item Triple đã duyệt; không có Freeze/Thunder/Mở rộng khay.
3. Collection Triple chỉ hiển thị capability thực sự dùng được: Chủ đề, hiệu ứng đường nối và hiệu ứng xóa. Không hiển thị Mặt lưng/Lật thẻ của Memory nếu Triple không dùng chúng.
4. Catalog effect/theme được tái sử dụng, nhưng lựa chọn trang bị theo game có key Triple rõ ràng; normalize save cũ idempotent và không làm đổi lựa chọn Memory/Link.
5. Giao dịch mua phải atomically cập nhật Xu + inventory/ownership + persistence, có cap và rollback khi quota/revision fail.

**Pass khi:** mua/dùng/trang bị/reload đúng, ba game không lẫn kho hoặc lựa chọn appearance, và modal Triple không rơi vào renderer Memory/Link ngoài adapter dùng chung.

##### Completion 4A — Challenge core chưa có Lucky

1. Có thể triển khai mode Challenge, progression `12 -> 18 -> 24 -> 30 -> 36 -> 42 -> 48`, timer và solver phía sau development flag trước khi chốt Lucky.
2. Không tạo Lucky metadata/reward tạm. Challenge chưa hoàn chỉnh có thể tạm ẩn riêng trong danh sách mode; Easy/Normal/Hard/Super Hard/Endless và toàn game Triple vẫn ở menu để chơi thử.
3. Mỗi kích thước board phải có layout/corpus/budget riêng và pass trước kích thước kế tiếp.

**Pass khi:** Challenge core deterministic, solvable, progression/timer đúng và hoàn toàn không phụ thuộc placeholder Lucky.

##### Quyết định Lucky còn lại — chỉ chặn Completion 4B

Đã khóa 1–3 Lucky Card mỗi board Challenge. Trước Completion 4B cần ghi thêm vào bảng duyệt:

- cách chọn số lượng trong khoảng 1–3;
- layer/slot nào hợp lệ và cách phân bố để không dồn nhiều Lucky vào cùng một bộ ba;
- giá trị chính xác của thưởng Xu, thời gian và Gợi ý;
- hành vi khi inventory Gợi ý đầy;
- quan hệ với Undo/Shuffle để không nhận thưởng lặp.

Phương án kỹ thuật đề xuất để duyệt: RNG có seed chọn đều 1–3; chọn các tile instance thuộc những bộ ba khác nhau sau khi board đã có witness; mọi layer đều hợp lệ vì Lucky chỉ là metadata, không đổi type/slot/blocker; thưởng cố định `10 Xu`, `+5 giây` hoặc `+1 Gợi ý`; khi Gợi ý đầy đổi sang `10 Xu`; resolve Lucky xóa Undo history và ghi reward ID đã claim; Shuffle giữ nguyên Lucky instance/reward và claimed ledger. Không đưa các giá trị đề xuất này vào production trước xác nhận của người dùng.

##### Completion 4B — Lucky Card

1. Chỉ bắt đầu sau khi toàn bộ bảng quyết định Lucky được duyệt.
2. Lucky là metadata của đúng một tile instance, không phải tile type mới và không thay đổi cover graph hoặc khả năng solver.
3. Reward chỉ phát một lần khi bộ ba chứa Lucky resolve; claim ledger nằm trong snapshot/session và transaction reward phải atomic.
4. Visual badge/effect không tạo hitbox khác, không chạy loop và có reduced-motion/fallback tĩnh.
5. Test deterministic seed, 1/2/3 Lucky, mọi layer hợp lệ, Undo/Shuffle/reload, inventory đầy, save failure và không double reward.

**Pass khi:** board vẫn solvable, reward không lặp/mất, persistence nhất quán và visual không ảnh hưởng input/performance.

##### Completion 5 — Theme, effect, sound và Xu

1. Renderer dùng theme đang trang bị của Triple qua provider chung; đổi theme không tái sinh board.
2. Line/xóa dùng lựa chọn Triple qua effect adapter hiện có, giữ cap một line/ba ghost và cleanup Gate 5.
3. Map sound sự kiện select/match/miss/win/loss/bonus qua sound owner chung; không tạo Audio object mỗi lượt.
4. Thưởng Xu cuối level/Endless/Lucky đi qua một transaction owner, HUD cập nhật sau commit và rollback đúng khi save fail.
5. Không copy catalog/effect CSS hoặc tạo asset gần trùng chỉ để có namespace Triple.

##### Completion 6 — Web Acceptance trên PC và mobile

1. Chỉ bắt đầu sau khi UI, progression, item, Shop/Collection, Challenge/Lucky, popup đầu/cuối màn, mốc thưởng và effect/sound/Xu trong các gate trước đã đủ chức năng. Completion 6 không được dùng để trì hoãn hoặc thay thế implementation còn thiếu.
2. Chạy check/build và regression shared owner cho cả ba game.
3. Chạy trình duyệt desktop landscape và đúng hai chuẩn mobile đã chốt ở portrait/landscape; kiểm tra resize/orientation, safe area, browser bar, reduced motion, tab background/foreground và refresh/Continue. Không chạy Android/PWA/APK trong gate này.
4. Chạy 20 chu kỳ mount/unmount/restart/switch/orientation; listener/timer/RAF/worker/ghost/node/heap trở về baseline.
5. Đo production-web p50/p95, long task, DOM, bundle và heap theo ngân sách trong task này; chơi thật Easy và board 60 tile với các menu, item, theme, popup và reward đã hoàn thiện.
6. Review độc lập toàn diff, sửa mọi lỗi P0/P1 và lỗi nhìn thấy trong scope, rồi chạy lại test liên quan. Giữ `released: true` để người dùng nghiệm thu trực tiếp trên web.
7. Web Acceptance chỉ hoàn tất khi test tự động xanh **và** người dùng xác nhận trải nghiệm thực tế PC/mobile đạt yêu cầu. Test pass không thay thế nghiệm thu hình ảnh/cảm giác chơi.

**Pass khi:** không còn P0/P1 trong phạm vi web, đầy đủ chức năng đã duyệt, số đo đạt ngân sách, không leak/regression và người dùng xác nhận chơi mượt trên web PC/mobile.

##### Phase hoãn lại — PWA/APK và phân phối

Phase này **không thuộc task hiện tại và không được Terra tự bắt đầu**. Chỉ tạo kế hoạch riêng sau khi Completion 6 Web Acceptance đã pass và người dùng yêu cầu. Khi đó mới đánh giá PWA/offline, Android lifecycle/back/background/resume, packaging/signing, thiết bị Android, store compliance và rollback phát hành; không dùng kết quả phase này để định nghĩa lại hoặc trì hoãn Web Acceptance.

## Files to inspect

### Tài liệu và contract

- `AGENTS.md`
- `Triple Connect.md`
- `TRIPLE_CONNECT_READINESS_PLAN.md`
- `ARCHITECTURE.md`
- `ADD_GAME.md`
- `GAME_SHELL_PLAN.md`
- `TASK_COMPACT_LANDSCAPE_GAME_SHELL_PLAN.md`

### Shared owners cần kiểm tra có mục tiêu

- `js/gameCatalog.js`
- `js/gameState.js`
- `js/main.js`
- `js/mainmenu.js`
- `js/gameSelector.js`
- `js/appearance.js`
- `js/sessionProgress.js`
- `js/sessionTiming.js`
- `js/persistence.js`
- `js/shop.js`
- `js/modal.js`
- `js/coinRewards.js`
- `js/lootEffects.js`
- `js/gameShell/gameShell.js`
- `js/gameShell/gameShellLayout.js`
- `js/gameShell/gameShellLifecycle.js`
- `js/gameShell/gameShellEffects.js`
- `js/gameShell/gameShellHud.js`
- `js/gameShell/gameShellConfig.js`
- `js/memoryMatch/memoryShell.js`
- `js/linkConnect/linkShell.js`
- `js/linkConnect/linkController.js`
- `styles/game-shell/presentation.css`
- `styles/game-shell/tokens.css` — generated, không sửa tay
- `styles/hud.css`
- `styles/gameplay-ui.css`

### Effect/theme dùng chung

- `js/themeCatalog.js`
- `js/uiCatalog.js`
- `js/motion.js`
- `styles/gameplay-effects.css`

### Triple owners cho Completion 1A/1B

- `js/tripleConnect/tripleConfig.js`
- `js/tripleConnect/tripleBoard.js`
- `js/tripleConnect/tripleState.js`
- `js/tripleConnect/tripleRules.js`
- `js/tripleConnect/tripleRenderer.js`
- `js/tripleConnect/tripleShell.js`
- `js/tripleConnect/tripleController.js`
- `js/tripleConnect/triplePresentation.js`
- `styles/triple-connect.css`
- `tests/ui/triple-connect.geometry.spec.js`
- `tests/ui/triple-connect.progression.spec.js`
- `tests/ui/triple-connect.tools.spec.js`

### Test baseline liên quan

- `tests/ui/game-shell.geometry.spec.js`
- `tests/ui/game-shell.layout.spec.js`
- `tests/ui/game-shell.lifecycle.spec.js`
- `tests/ui/game-shell.cleanup.spec.js`
- `tests/ui/game-shell.effects.spec.js`
- `tests/ui/game-shell.audit.spec.js`
- `tests/ui/game-shell.presentation.spec.js`
- `tests/ui/game-shell.compact-landscape.spec.js`
- `tests/ui/game-shell.compact-topology.spec.js`

Chỉ mở rộng sang call site/import/test khác khi tìm kiếm symbol hoặc test fail chứng minh cần thiết. Không quét lại toàn repository ở mỗi gate.

## Required changes

### Gate 0 — Khóa baseline trước khi thêm Triple — ĐÃ HOÀN TẤT tại `3f89ff7`

1. Sửa selector geometry thành owner thật `.game-shell-root`; thêm assertion fail rõ khi không tìm thấy root, không dùng optional result để biến lỗi setup thành `false`.
2. Tách assertion layout:
   - normal portrait/desktop: title, progress, HUD và milestones vẫn theo flow;
   - compact landscape: title/progress/milestones `display: none`, HUD/frame/board hợp lệ và không dùng rect 0 như một mốc flow.
3. Đưa breakpoint landscape về một nguồn sự thật 600 CSS px; cập nhật generator/token/test nếu cần, không sửa tay output generated.
4. Xác nhận reflow Link Connect có được phép shuffle hay không. Nếu shuffle là chủ ý, phải có event/diagnostic và test state; nếu không, resize chỉ được reflow hình học. Không sửa luật Link trong gate Triple.
5. Chạy lại check/build và test mục tiêu ở đúng hai chuẩn thiết bị:
   - portrait: `360x640`, `411x914`;
   - landscape tương ứng: `640x360`, `914x411`.
6. Lưu baseline bundle, DOM, listener/timer/RAF và heap sau 20 chu kỳ. Không dùng profile 320 px nếu không cần tái hiện lỗi cụ thể.

**Gate 0 pass khi:** không còn pass giả, layout assertions phản ánh đúng contract, breakpoint đồng bộ, check/build/test mục tiêu xanh và không có leak tăng dần.

Không thực hiện lại hoặc sửa thêm Gate 0 trong lượt Gate 1 nếu không có regression mới có bằng chứng.

### Gate 1 — Registry game và ranh giới tích hợp

1. Giữ `gameCatalog.js` là metadata thuần. Tạo `gameRegistry.js` làm owner duy nhất cho adapter/hành vi chọn game; không đặt state, persistence, Shop hoặc luật game trong registry.
2. Gate này chỉ đăng ký adapter navigation/menu hiện có của Memory Match và Link Connect. Không thiết kế trước capability cho appearance, inventory, Shop hoặc session.
3. Trong Gate 1 lịch sử, Triple được đăng ký metadata trước khi có runtime. Sau khi vertical slice đã có đường chơi thật, `released: true` được phép dùng để hiện game trong selector theo yêu cầu chơi thử; không tạo controller/loader giả.
4. `gameSelector.js` lấy danh sách game phát hành và handler từ registry; không còn `if Memory, else Link` hoặc fallback game thứ ba về một game cũ.
5. Game ID lạ hoặc chưa phát hành phải bị từ chối có chủ ý và không thay đổi `activeGame`, DOM hoặc active shell hiện tại.
6. Chưa sửa `appearance.js`, `gameState.js`, `shop.js`, session, schema hoặc inventory. Chỉ ghi inventory call site còn hard-code vào báo cáo Gate 1 để định tuyến Gate 6/7; chúng không phải blocker Gate 1.
7. Chưa cần dynamic import Triple vì chưa có runtime Triple. Quyết định code-split được thực hiện khi Gate 4 có entry thật và đã đo bundle.
8. Contract test ban đầu phải giữ hai game cũ ổn định và từ chối ID lạ. Ở trạng thái hiện tại sau `84aa7d0`, contract được cập nhật thành ba game đều mở đúng menu/controller, registry không mặc định sang game khác và không phát sinh circular import/bootstrap lần hai.

**Gate 1 pass khi:** selector/navigation hai game cũ không đổi hành vi, registry có contract nhỏ và không kéo migration ngoài phạm vi. Trạng thái metadata-only của Gate 1 đã được thay thế hợp lệ khi Triple có vertical slice và được đưa vào menu chơi thử.

### Gate 2 — Luật thuần và state machine

1. Sơ đồ module đích và gate sở hữu file:

```text
js/tripleConnect/
├── tripleConfig.js       # Gate 2, mở rộng có kiểm soát ở Gate 3/7A
├── tripleRules.js        # Gate 2
├── tripleState.js        # Gate 2
├── tripleBoard.js        # Gate 3
├── tripleSolver.js       # Gate 3
├── tripleRenderer.js     # Gate 4/5
├── tripleShell.js        # Gate 4
├── tripleController.js   # Gate 4/5/6
└── tripleItems.js        # Chỉ tạo khi bắt đầu Gate 7B
```

Không tạo file rỗng/placeholder của gate sau. Gate nào chỉ tạo đúng module có owner ghi trong sơ đồ.

2. Gate 2 chỉ tạo module luật/state/config và unit test. Chưa tạo shell, DOM, CSS, worker, persistence, navigation, Shop hoặc asset.
3. Mỗi tile có ID instance ổn định và chỉ thuộc đúng một nơi: board, tray hoặc removed. `resolving` là presentation event/phase, không phải nơi sở hữu tile thứ hai.
4. State gameplay chứa `roundId`, `status` hữu hạn (`playing`, `won`, `lost`, `disposed`), board/layers, cover graph, tray tối đa 7, `streakType`, `streakCount`, combo, Miss, moves, score, matchedTriples và Undo history có giới hạn. Presentation phase nằm ngoài reducer state bền vững.
5. Một lần chọn tile exposed hợp lệ tăng `moves` đúng một. Chọn tile bị che, ID lạ hoặc khi không ở `playing` trả failure có lý do và không đổi state/counter.
6. Khay có thứ tự canonical xác định: nhóm được xếp theo lần đầu loại đó xuất hiện trong khay; tile mới chèn sau tile cuối cùng cùng loại; thứ tự instance trong cùng nhóm theo thứ tự được chọn. Renderer chỉ phản ánh thứ tự này.
   - Stable tray không bao giờ chứa ba tile cùng loại; bộ ba phải được resolve trong cùng reducer transition tạo ra nó.
7. Reducer nhận command và trả `{ nextState, events, result }`; events chỉ mô tả presentation/sound, không giữ DOM hoặc callback. Input state không bị mutate.
8. Reducer xử lý lựa chọn theo thứ tự nguyên tử:
   - xác nhận phase và tile exposed;
   - chuyển tile vào tray;
   - cập nhật Miss/streak;
   - canonicalize nhóm khay;
   - phát hiện và resolve bộ ba;
   - chỉ sau resolve mới kiểm tra tray 7 ô/thua;
   - kiểm tra board rỗng/thắng.
9. Match tính điểm đúng `10 + (combo - 1) × 3`; một bộ ba tăng `matchedTriples` đúng một. Win ưu tiên sau khi resolve bộ ba cuối; loss chỉ xét khi không còn triple vừa hình thành và tray chứa 7 tile.
10. Chuẩn Miss phải khớp toàn bộ bảng ví dụ trong `Triple Connect.md`; renderer không được quyết định Miss dựa trên vị trí visual.
11. Undo thuần phục hồi snapshot ngay trước command chọn gần nhất, kể cả khi command đó đã hoàn tất một bộ ba: phục hồi board/tray/counters/streak/combo/score/status và loại đúng snapshot khỏi history. Không cho Undo sau `won`, `lost`, `disposed`; failure không đổi state và sau này không được trừ vật phẩm.
12. Undo history tối đa bằng số tile đầu round, không tăng vô hạn và không persist ở Gate 2. Shuffle về sau xóa toàn bộ history.
13. Runtime, generator và solver phải gọi cùng reducer/rule primitives; không sao chép luật sang ba module.

**Gate 2 pass khi:** toàn bộ luật chạy được không DOM/browser, state immutable theo contract, replay command deterministic và mọi invariant tile/counter/tray được unit test.

### Gate 3 — Generator và solver có giới hạn

1. Gate 3 chỉ sửa board/generator/solver/config và test thuần. Chưa tạo worker trước khi benchmark chứng minh main thread vượt budget; chưa nối renderer hoặc persistence.
2. Bắt đầu bằng Easy 12 thẻ/4 bộ ba/2 lớp; layout template dùng tọa độ normalized và tạo cover graph trước khi sinh tile. Renderer sau này phải dùng cùng template, không tự tính quan hệ che phủ khác.
3. Một slot tầng cao che slot tầng thấp khi vùng card của chúng có giao nhau dương; epsilon cấu hình chỉ dùng chống sai số số thực, không phải ngưỡng phần trăm gameplay. “Exposed” nghĩa không có bất kỳ slot tầng cao còn tile nào trong danh sách blocker precomputed. Không dùng z-index/DOM rect runtime làm luật.
4. Sinh solution-first: tạo witness command sequence hợp lệ rồi phân bổ ngược lên layer. Kết quả generator phải gồm seed, layout ID, board và witness; không chỉ trả boolean “solvable”.
5. Solver dùng cùng rule primitives, mô phỏng đúng tray 7 ô, grouping, exposure và resolve-before-overflow. Miss/combo không tham gia điều kiện solvability nhưng không được làm thay đổi tray simulation.
6. Randomness được inject qua seeded RNG; core không gọi trực tiếp `Math.random`. Cùng config + seed phải cho cùng board và witness.
7. Canonical solver key chỉ chứa dữ liệu ảnh hưởng nước đi; không chứa score, animation hoặc DOM. Memo/cache có giới hạn và bị giải phóng sau mỗi job.
8. Mọi loop có `maxNodes`, `maxAttempts` và deadline theo config. Kết quả phân biệt `solved`, `unsolved`, `timeout`, `invalid`; không dùng catch rỗng hoặc retry vô hạn.
9. Fallback là một corpus seed/layout đã commit và được solver xác nhận cho đúng mode/version. Không dùng board cuối của người chơi khác, không sửa bí mật board đang chơi.
10. Gate 3 chỉ hoàn tất Easy. Template/corpus 24/36/60 tile được thêm tuần tự ở Gate 7A; không đưa trước cấu hình mode lớn vào runtime. Khi Gate 7A benchmark 36/60 vượt main-thread budget, mới tách solver worker với request ID + `roundId`, cancellation, hard timeout và terminate trong cleanup.

**Gate 3 pass khi:** 100% board generator trả witness hợp lệ hoặc fallback có nguồn rõ; cùng seed deterministic; invalid/timeout có đường thoát; Easy đạt budget trước khi mở cấu hình lớn.

### Gate 4 — Vertical slice giao diện dọc

1. Gate 4 lịch sử chỉ tích hợp Easy 12 tile/2 layer trước. Ở giai đoạn hoàn thiện hiện tại, Triple được giữ trong selector để chơi thử; save/continue, Shop, item, Endless, Challenge và Lucky vẫn phải theo Completion gate tương ứng.
2. Dùng semantic Game Shell hiện có: title, progress, HUD, milestones, frame và board. Không thêm vùng shell thứ bảy.
3. Region `board` của Triple là composite gameplay surface sở hữu cả layer board và tray 7 ô; layout engine đo composite này. Renderer Triple sở hữu node con, Game Shell chỉ sở hữu region.
4. Bố cục portrait:
   - HUD tiến trình trên;
   - thanh menu/level/timer/sao; vùng tools chỉ xuất hiện khi có item thật ở Gate 7B;
   - board nhiều lớp co trong phần chiều cao còn lại;
   - khay 7 ô nằm riêng dưới board và luôn nhìn thấy.
5. Progress HUD Easy hiển thị Moves, Miss, Combo, sao, Điểm và `matchedTriples / 4`. Hint/tool control chưa có chức năng phải được ẩn, không render nút giả hoặc bộ đếm 0 gây hiểu nhầm.
6. Card phía dưới bị che vẫn nhận diện được nhưng có `aria-disabled="true"`/không focus/không pointer; chỉ tile exposed là button tương tác. Easy target giữ vùng chạm khoảng 44 CSS px mà không mở hitbox chồng tile khác.
7. Renderer keyed theo instance ID; HUD patch không rebuild board; cập nhật một tile không dựng lại toàn bộ layer/tray. Một instance ID luôn ánh xạ tối đa một node tile thật.
8. Không dùng 10 slot, lock icon hoặc khoảng trống giả dành cho tính năng tương lai.
9. Xoay màn hình chỉ scale/fit normalized geometry; không đổi slot, layer, cover graph, seed hoặc thứ tự tray và không gọi generator/solver lại.
10. Kiểm tra portrait tại `360x640` và `411x914`; khi xoay dùng `640x360` và `914x411`, giữ state và không tái sinh board.
    - Ở compact landscape, Triple phải kế thừa nguyên contract Game Shell đã hoàn tất trong `TASK_COMPACT_LANDSCAPE_GAME_SHELL_PLAN.md`: ẩn `title`/`progress`/`milestones`, giữ `hud`/`frame`/`board`, dùng width token và breakpoint dùng chung hiện hành. Không thêm media query, tỷ lệ thu nhỏ hoặc cách bố trí HUD riêng cho Triple.
    - Desktop landscape không thỏa compact breakpoint phải giữ layout desktop có chủ ý; không dùng tỷ lệ màn hình vật lý để ép compact.
11. Development/test hook phải được guard và không dùng query/localStorage bypass. Luồng người dùng hiện tại mở Triple trực tiếp từ selector/menu; hook chỉ dùng seed/fixture phục vụ test.
12. Gate 4 dùng transition tức thời đúng state làm baseline; không viết animation tạm để rồi thay ở Gate 5.
13. Trước Gate 6, `themeId`/card provider được inject qua development hook và dùng asset catalog hiện có; không sửa hoặc fallback qua `appearance.js` để lấy theme Triple sớm.

**Gate 4 pass khi:** chơi trọn Easy tới win/loss, layout đúng bốn chiều đã chốt, tile node/state ổn định qua resize và không ảnh hưởng UI/lifecycle hai game cũ.

### Gate 5 — Timeline nối và xóa tối ưu

1. Controller gửi command vào reducer và commit `nextState` trước; renderer chỉ nhận previous/next snapshot cùng `events`. Animation callback không cộng điểm, xóa tile logic hoặc quyết định win/loss.
2. Timeline mặc định, đặt thành token/tuning có owner:
   - anticipation/select feedback: 80–120 ms;
   - tile bay vào khay: 180–240 ms bằng `transform`/`opacity`;
   - khay dồn/nhóm bằng FLIP: 160–220 ms;
   - line đi từ tâm tile 1 qua tile 2 tới tile 3: 180–240 ms;
   - impact ngắn: 80–120 ms;
   - effect xóa trang bị: dùng adapter và budget 220–320 ms, sau đó remove node/return pool.
3. Đọc toàn bộ geometry một lần trước pha ghi; không đọc/ghi layout xen kẽ, không dùng `offsetWidth` để ép reflow.
4. Dùng một SVG/polyline overlay hoặc adapter line trung lập nhận đúng ba anchor theo thứ tự tâm tile 1 → tâm tile 2 → tâm tile 3. Không tạo canvas/RAF loop nếu SVG/Web Animations đủ đáp ứng.
5. Ba tile đã resolve được trình bày bằng tối đa ba ghost node; node gameplay thật phản ánh `nextState`. Effect xóa đang trang bị chạy đồng thời trên ba ghost sau khi line hoàn tất, không copy catalog effect.
6. Tối đa một line layer, ba ghost tile và particle cap theo registry cho một lượt; không tạo animation loop liên tục hoặc pool không giới hạn.
7. Trong chuỗi flight/group/line/delete, input tile mới bị từ chối không penalty thay vì queue command. Timer gameplay vẫn chạy; menu/pause/exit vẫn hoạt động.
8. Mỗi presentation sequence trả một cancellable settlement promise. Khi hoàn tất hoặc cancel, controller reconcile DOM trực tiếp về latest committed state rồi mở input nếu cùng `roundId`.
9. Restart, unmount, đổi game, timeout hoặc `roundId` mới phải cancel line/effect/FLIP, giải phóng node/reference và không chạy callback cũ.
10. Reduced motion bỏ flight/particle/line draw dài, dùng highlight/fade tối đa 100 ms hoặc trạng thái tĩnh; settlement vẫn hoàn tất và kết quả match/score giống hệt.

**Gate 5 pass khi:** timeline đúng thứ tự bằng test event, cancel ở mọi pha không để ghost/overlay/callback, normal và reduced-motion cho state cuối giống nhau và budget frame đạt.

### Gate 6 — Persistence và tương thích

1. ID catalog/registry là `triple-connect`; key object/schema là `tripleConnect`; tiến trình nằm tại `progress.tripleConnect`; session theo mode nằm tại `progress.tripleConnect.sessionsByMode`. Mapping này có một owner, không trộn kebab/camel tùy call site.
2. Gate 6 mới được sửa `gameState.js`, `appearance.js`, `sessionProgress.js`, `sessionTiming.js`, `persistence.js` và call site hydrate cần thiết. Shop/inventory vẫn để Gate 7.
3. Snapshot round lưu tối thiểu: schema/version Triple, mode, level, seed/layout ID, tile instance + slot/layer/status, tray order, streak, combo/Miss/moves/score/matchedTriples, timer fields và state đặc thù mode đã triển khai. Không lưu DOM, effect event, worker handle, viewport geometry hoặc presentation phase.
4. Undo history không persist trong phiên bản đầu; sau reload nút Undo bị vô hiệu cho tới khi có một lượt mới. Quy tắc này phải hiện rõ trong contract test/UI khi item được thêm.
5. Chỉ persist state reducer đã commit. Reload giữa animation hydrate thẳng trạng thái ổn định mới nhất và không phát lại flight/line/delete.
6. Normalize/validate tại boundary: ID trùng, tile mất/dư, tray >7, slot/layer lạ, counter âm, seed/layout không tồn tại hoặc state không đạt invariant phải fallback về phiên an toàn/không cho Continue; không đưa dữ liệu hỏng vào renderer.
7. Dữ liệu cũ không có `tripleConnect` nhận default mới nhưng không ghi lại chỉ vì app được mở. Migration idempotent; schema version chỉ tăng khi format persisted thật sự thay đổi.
8. Ghi theo event bền vững: sau command đã settle về state ổn định, checkpoint thời gian theo nhịp hiện có, background/exit và chuyển level. Không ghi theo frame, animation tick, HUD patch hoặc resize.
9. Revision conflict/quota failure giữ runtime nhất quán và báo lỗi theo pattern hiện có; giao dịch nhiều miền rollback toàn bộ hoặc không commit.
10. Sau Gate 6, Triple được phép xuất hiện trong selector để new/continue/reload và chơi thử tích hợp. Dynamic import adapter Triple và bundle delta vẫn phải được đo; trạng thái menu không đồng nghĩa game đã đủ chức năng hoặc đã pass Web Acceptance.

**Gate 6 pass khi:** save cũ mở không đổi, Triple new/continue/reload deterministic, dữ liệu hỏng bị chặn an toàn, không lẫn namespace và không tăng write ngoài sự kiện đã định nghĩa.

### Gate 7 — Mở rộng tính năng theo sub-gate

#### Gate 7A — Mode không phụ thuộc kinh tế

1. Mở `normal` → `hard` → `superHard`; nhãn hiển thị lần lượt là Trung bình → Khó → Siêu khó. Mỗi mode là một sub-gate/diff riêng, dùng cấu hình tile/layer/time đã chốt trong `Triple Connect.md` và phải qua solver/performance trước mode kế.
2. `endless` là sub-gate riêng sau các mode đếm ngược: timer đếm xuôi, clear board sang level, không mua/thêm thời gian.
3. Challenge và Lucky Card chưa triển khai ở 7A vì tần suất/vị trí Lucky chưa chốt. Không thêm giá trị tạm vào production config.

#### Gate 7B — Vật phẩm không có Mở rộng khay

1. Chỉ bắt đầu sau khi Gate 8 đã chốt giá, số lượng khởi đầu và capability Shop/collection.
2. Thứ tự riêng từng sub-gate/diff: `hint` → `time` → `undo` → `shuffle`; mỗi lượt chỉ triển khai và review một vật phẩm.
3. Gợi ý chỉ đánh dấu tile exposed phù hợp; không tự chọn/xóa và không mutate solver state.
4. Thêm thời gian không xuất hiện/dùng trong Endless; transaction thất bại không trừ Xu hoặc item.
5. Hoàn tác gọi command thuần Gate 2; không dùng được sau terminal state hoặc ngay sau reload khi history rỗng; failure không trừ item.
6. Xáo chỉ phân bố lại tile còn trên board, giữ nguyên tray/counters/layer capacity; xóa Undo history, cần solver witness và rollback nguyên trạng nếu thất bại.
7. Mở rộng khay bị loại hoàn toàn; không có ID, button, locked slot, inventory hoặc save field.

#### Gate 7C — Challenge, Lucky và hoàn thiện tính năng web

1. Chỉ bắt đầu sau Gate 8 chốt mốc sao, Lucky frequency/vị trí/reward và kinh tế.
2. Sub-gate `challenge/lucky`: Challenge dùng dãy tile/layer/time trong `Triple Connect.md`; Lucky Card phải là một phần của bộ ba và đi qua cùng reducer/solver, không dùng nhánh renderer đặc biệt để cấp thưởng.
3. Sub-gate `integration`: tích hợp Shop/collection/theme/effect/sound/Xu qua adapter/capability đã có consumer thật; không đưa nhánh Triple vào controller hai game cũ.
4. Sub-gate kiểm tra tích hợp web: chạy regression, hai chuẩn viewport mobile đã chốt ở hai chiều, desktop landscape, browser background/resume, thiết bị thật và rollback giao dịch. Triple vẫn hiện trong menu để người dùng chơi thử; Android/PWA/offline và đóng gói không thuộc gate này.

### Gate 8 — Quyết định sản phẩm bắt buộc trước khi bật kinh tế Triple trên web

Trạng thái Gate 8 đã được cập nhật trong Addendum ngày 2026-09-13. Giá item, số lượng khởi đầu, mốc sao, phạm vi Challenge và khoảng 1–3 Lucky đã được người dùng duyệt.

Phần còn mở chỉ chặn Completion 4B:

1. quy tắc chọn số lượng cụ thể trong khoảng 1–3 và phân bố Lucky theo tile/layer;
2. giá trị chính xác của thưởng Xu/thời gian/Gợi ý và fallback khi inventory đầy;
3. quan hệ Lucky với Undo, Shuffle, reload và claim ledger.

Ngoài ra, trước Completion 5, Terra phải trỏ tới công thức phần thưởng Xu cuối màn/Endless đã được người dùng duyệt. Nếu không tìm thấy giá trị đó trong tài liệu hoặc config có nguồn rõ, phải báo đây là một thiếu dữ liệu sản phẩm riêng; không tự sao chép công thức Memory/Link.

Đầu ra quyết định còn lại phải là bảng ghi rõ giá trị, phạm vi mode, tác động kinh tế và xác nhận của người dùng. Ô chưa chốt chỉ chặn sub-gate phụ thuộc nó, không chặn Completion 0–4A.

## Edge cases

- Tray có 0–6 thẻ; tile thứ 7 tạo bộ ba phải resolve trước khi xét thua.
- Tile thứ 7 không tạo bộ ba thì thua đúng một lần.
- Nhiều nhóm giống nhau đã có trong tray; canonical grouping không làm mất instance ID.
- Chuỗi `A-B-A`, `A-A-B`, `A-A-B-B-A`, `A-A-A → B-B-B`.
- Bộ ba hình thành nhờ tile vừa chọn kết hợp hai tile đã nằm trong tray.
- Tap tile bị che, tap hai lần nhanh, multi-touch và tap trong lúc FLIP/line/delete.
- Match cuối đồng thời làm board rỗng và tray tạm chạm ngưỡng.
- Undo sau một hoặc nhiều lượt; Undo sau match; Undo bị từ chối không trừ kho.
- Shuffle xóa Undo history và rollback nếu solver không xác nhận được board mới.
- Restart/chuyển game/thoát menu giữa flight, grouping, line và delete.
- Promise/worker của round cũ trả kết quả sau khi round mới đã mount.
- Ảnh theme lỗi hoặc tải chậm; layout không giữ detached image/node sau cleanup.
- Tile lớp dưới giao hai hay nhiều blocker; chỉ sáng/chọn sau khi blocker cuối cùng rời board.
- Tile cùng layer gần nhau nhưng không được trở thành blocker của nhau; chạm đúng phần thẻ lộ của tile disabled vẫn không phát command.
- Layout v1 đang được Continue sau khi v2 được phát hành; không remap slot âm thầm.
- Ảnh dọc, ngang hoặc có vùng trong suốt khác nhau vẫn phải hiện trọn trong card ở desktop landscape.
- Portrait `360x640`, `411x914`; landscape `640x360`, `914x411`; safe area và browser bars.
- Reduced motion; background/resume; fullscreen; reload phiên.
- Solver nhận input hỏng, state trùng, timeout hoặc vượt attempt budget.

## Performance constraints

- Mục tiêu 60 FPS trên thiết bị mobile mục tiêu; frame budget trung bình khoảng 16,7 ms nhưng chỉ được đánh dấu pass sau khi đo.
- Tap đến phản hồi visual: p95 ≤ 50 ms.
- Reducer một lượt với 60 tile: p95 ≤ 4 ms.
- Tính exposed state: p95 ≤ 3 ms và chỉ duyệt dependency bị ảnh hưởng.
- DOM patch một lượt: p95 ≤ 8 ms; không rebuild toàn board.
- Không có long task > 50 ms trong lượt chơi chuẩn.
- Solver Easy 12 tile: p95 ≤ 20 ms; Hard 36 tile: p95 ≤ 100 ms; 60 tile: p95 ≤ 300 ms trên worker, timeout cứng 750 ms/attempt.
- Không allocation object/array/closure mới theo mỗi frame trong animation dài.
- Không animate layout, blur/filter vùng lớn hoặc nhiều shadow động; ưu tiên `transform` và `opacity`.
- Dim tile bị che bằng overlay/opacity tĩnh; không dùng `filter: blur()`/`backdrop-filter` trên từng tile.
- Cover graph được tính từ template/config, không đọc DOM rect trong hot path; resize chỉ thay phép chiếu tọa độ.
- Board + tray 60 tile mục tiêu ≤ 180 DOM element và một `img` cho mỗi tile đang render.
- Sau 20 mount/unmount, restart, đổi game và xoay màn hình, listener/timer/RAF/worker/node tạm trở về baseline; heap không tăng dần ngoài sai số được ghi trước.
- Vertical slice tăng JS gzip ≤ 25 kB và CSS gzip ≤ 8 kB; bản đầy đủ mục tiêu JS gzip ≤ 45 kB hoặc phải review code-split.
- Không thêm persistence/Firebase write theo frame, tick animation hoặc resize.

## Tests required

### Gate 0

- `npm run check`.
- `npm run build`.
- Geometry/layout/lifecycle/cleanup/effects/audit/presentation/compact landscape tests liên quan.
- Xác nhận không còn selector sai, assertion compact lỗi thời hoặc breakpoint 500/600 mất đồng bộ.

### Luật và solver

- Unit/contract tests cho reducer, cover graph, tray 7, Miss, combo, scoring, resolve-before-overflow, win/lose và Undo.
- Deterministic replay theo seed.
- Property tests không mất/trùng tile và mọi board phát hành có witness solution.
- Corpus seed cố định cho 12/24/36/60 tile; timeout/fallback/cancellation.
- Test canonical tray order, invalid command không mutate, Undo qua một match và không Undo sau terminal/reload.

### UI và lifecycle

- Playwright vertical slice cho cả hai chuẩn portrait và chiều xoay tương ứng.
- Các kích thước trên là viewport theo CSS pixel, không phải độ phân giải phần cứng 1920×1080 hoặc 2400×1080. Chúng mô phỏng hai lớp thiết bị phổ biến đã chốt; không thêm viewport cực nhỏ nếu không cần tái hiện lỗi thật.
- Kiểm exposed/non-exposed hit target, tray 7 slot, grouping và line ba điểm.
- Spam tap, restart/exit/switch giữa mọi animation phase.
- 20 chu kỳ mount/unmount/restart/switch/orientation; diagnostics về 0 sau cleanup.
- Reduced motion cho cùng kết quả gameplay.
- Visual comparison không cập nhật baseline để che regression.
- Xoay màn hình không đổi seed/slot/layer/cover graph/tray và không gọi generator/solver lại.
- Triple xuất hiện và mở được từ selector để chơi thử tích hợp; development/test hook chỉ dùng cho seed/fixture đặc biệt và vẫn phải được guard.
- Contract picker Bắt đầu/Tiếp tục: theme row Triple, Đổi chủ đề đúng game, label mode Việt hóa và không rơi về Memory/Link.
- Contract HUD: cùng component/semantic order với Memory/Link; action/tools menu mutual exclusion, Escape/outside-click/unmount cleanup.
- Layout validator cho từng template: đúng tổng/layer count, slot unique/in-bounds, không overlap cùng layer, layer cao tạo blocker có chủ ý và không che kín thẻ dưới.
- Interaction test: covered tile bị vô hiệu ở DOM lẫn reducer; gỡ một phần blocker vẫn khóa, gỡ blocker cuối thì exposed và chọn được.
- Geometry/image test trên hai chuẩn mobile ở hai chiều và một profile desktop landscape hiện có: scale đồng nhất, mọi card/ảnh/tray nằm trong surface, computed `object-fit: contain`, không cắt nửa ảnh.
- Visual regression riêng Easy/Hard/Super Hard; không cập nhật ảnh chuẩn trước khi kiểm tra hình layer, trạng thái dim và toàn bộ nội dung ảnh.

### Persistence và regression

- Save cũ không có Triple; field thiếu/sai kiểu; revision conflict/quota rollback.
- New/continue/replay/next/reload/background/resume cho Triple.
- Memory Match và Link Connect vẫn pass check/build/test mục tiêu sau mỗi shared-owner gate.

### Hiệu suất

- Đo production build trên một thiết bị thật phổ thông đại diện và desktop.
- Ghi p50/p95 cho tap, reducer, exposure, DOM patch và solver; ghi long task, DOM count, bundle delta và heap sau chu kỳ.
- Không dùng cảm giác “chơi mượt” thay cho số đo gate cuối.

## Acceptance criteria

- [ ] Gate 0 xanh; không còn test Game Shell pass giả hoặc breakpoint mất đồng bộ.
- [ ] Triple là adapter/module độc lập; không có logic Triple rải trong controller Memory/Link.
- [ ] Gate 1 không kéo appearance/state/Shop/session migration vào registry; ở trạng thái hiện tại Triple xuất hiện trong selector và mở đúng controller/menu của chính nó để chơi thử.
- [ ] Khay có đúng 7 ô ở mọi mode; không có code/UI/save cho 10 ô hoặc Mở rộng khay.
- [ ] Miss khớp bảng ví dụ và không phụ thuộc cách renderer nhóm khay.
- [ ] Undo phục hồi snapshot chính xác; failure không trừ vật phẩm; Shuffle xóa history.
- [ ] Runtime, generator và solver dùng cùng nguồn luật.
- [ ] Command reducer immutable, deterministic; canonical tray order và Moves/Miss/combo/score có contract rõ.
- [ ] Mọi board phát hành có witness solution và solver không thể chạy vô hạn.
- [ ] Tile bị che không tương tác; tile exposed có hit target đúng.
- [ ] Picker Triple có chọn/đổi chủ đề và mode/Continue đồng bộ Memory/Link, không hiển thị raw mode ID.
- [ ] HUD/action/tools Triple dùng contract Game Shell chung, không phụ thuộc markup/CSS Link như owner và không nhân listener.
- [ ] Popup đầu màn xuất hiện đúng một lần cho mỗi board mới, hiển thị đúng mode/level/theme/mục tiêu; Continue không phát lại và timer/input chỉ bắt đầu sau khi người chơi xác nhận.
- [ ] Popup cuối màn phân biệt thắng/hết giờ/đầy khay, tổng kết đúng sao/điểm/combo/Xu/Lucky/mốc thưởng và chỉ mở một lần sau commit + presentation cuối.
- [ ] Thanh mốc thưởng đặc biệt dùng state/config Triple, grant đúng một lần, khôi phục đúng qua Continue/reload và không sao chép reward không tương thích từ Memory/Link.
- [ ] Layout 12/24/36/60 là các mask nhiều lớp có hình dạng và bước lệch nửa thẻ giữa từng cặp layer; Layer 4 có thể lớn hơn Layer 3 nhưng Layer 5 giữ footprint nhỏ; không còn layout cột.
- [ ] Slot cùng layer không chồng nhau; blocker chỉ đến từ layer cao có giao hình học và tile dưới mở đúng khi blocker cuối được dọn.
- [ ] Ảnh tile dùng phép fit toàn ảnh và không bị cắt ở desktop landscape; board scale đồng nhất, căn giữa và tray 7 ô luôn thấy.
- [ ] Layout/session v1 không bị diễn giải bằng topology v2.
- [ ] Resolve bộ ba xảy ra trước khi xét tray đầy.
- [ ] Line đi qua đúng ba tâm tile và effect xóa chạy sau line.
- [ ] Khay 7 ô giữ nguyên geometry từ 0–7 thẻ; tile bay/thu nhỏ/regroup không làm khay hoặc board co giãn.
- [ ] Restart/đổi game giữa effect không để callback, node, listener, timer, RAF hoặc worker cũ.
- [ ] Portrait/landscape tại hai chuẩn thiết bị không overflow, overlap hoặc mất state.
- [ ] Orientation không đổi topology nghiệp vụ, cover graph, seed hoặc gọi lại generator/solver Triple.
- [ ] Reduced motion giữ nguyên kết quả gameplay.
- [ ] Save cũ tương thích; ba game không lẫn progress/session/inventory/theme.
- [ ] Không tăng write không cần thiết và không thay đổi public API/schema ngoài migration đã duyệt.
- [ ] `npm run check`, build và toàn bộ test gate liên quan pass.
- [ ] Người dùng đã chơi thử và xác nhận đầy đủ luồng trên web desktop landscape cùng hai chuẩn mobile ở portrait/landscape; không còn lỗi chức năng hoặc lỗi nhìn thấy P0/P1 trong phạm vi.
- [ ] PWA/APK, Android và QA phân phối chưa được thực hiện hoặc dùng làm điều kiện chặn; các việc này chỉ bắt đầu bằng task riêng sau Web Acceptance.
- [ ] Số đo hiệu suất, heap và bundle đạt ngân sách hoặc có quyết định chấp nhận sai lệch bằng văn bản.
- [ ] Review độc lập xác nhận diff đúng phạm vi, không debug/TODO/code chết/asset rác.
- [ ] Không có giá/mốc sao/Lucky frequency production do agent tự suy đoán; Gate 8 đã được người dùng duyệt trước 7B/7C.

## Do not do

- Không triển khai khay 10 ô, ô khóa hoặc Mở rộng khay “để dành”.
- Không sao chép `linkController.js`, `linkRenderer.js` hoặc solver thành code Triple rồi sửa nhanh.
- Không để runtime, generator và solver có ba bản luật riêng.
- Không dùng timeout/sleep để che race; không dùng catch rỗng hoặc optional chaining để che invariant.
- Không quyết định gameplay trong callback animation.
- Không rebuild toàn board khi HUD, timer, tray hoặc một tile thay đổi.
- Không dùng `innerHTML` toàn board/tray trong hot path.
- Không tạo listener/observer/RAF/worker theo tile hoặc theo mỗi lần resize.
- Không tạo pool/cache không giới hạn hoặc giữ detached node/image.
- Không animate `top/left/width/height`, filter/blur lớn hoặc particle toàn màn hình trong đường chơi chính.
- Không ghi save theo frame/tick hoặc lưu geometry/DOM/animation state.
- Không thêm nhánh `else => Memory/Link` cho game thứ ba.
- Không đổi ID/catalog/schema/save format cũ nếu chưa có migration và test.
- Không trộn Gate 0, CSS dedup, effect V2, solver, persistence, shop và toàn bộ mode vào một diff.
- Không sửa lỗi clipping bằng cách tăng board/min-height theo từng viewport, thu nhỏ riêng Super Hard hoặc giảm opacity toàn layer mà không sửa topology/fit gốc.
- Không dùng `object-fit: cover` cho asset tile cần hiển thị trọn hình và không dùng DOM/z-index làm nguồn luật che phủ.
- Không coi việc Triple đã mở được từ menu hoặc build pass là bằng chứng đủ cho Web Acceptance; bản web phải đủ chức năng, qua persistence/regression/lifecycle/rollback và được người dùng chơi thử xác nhận trên PC/mobile.
- Không chạy PWA/APK, Android lifecycle, signing hoặc QA cửa hàng ứng dụng trước khi người dùng xác nhận Completion 6 Web Acceptance và giao một task đóng gói riêng.
- Không đánh dấu hoàn thành chỉ vì game chạy được hoặc thiết bị thật chưa thấy lỗi.
