# Nghiệm thu rơi vật phẩm, năng lượng và thẻ đặc biệt — 28–29/10/2026

> Kế hoạch triển khai đã hoàn tất, được xóa29/10/2026 sau rà soát.
> Đây là bằng chứng lịch sử; đánh giá mới và giới hạn cân bằng ở
> GAMEPLAY_ECONOMY_AUDIT.md, contract ở ARCHITECTURE/ba tài liệu game.

## Trạng thái

Đã hoàn tất P0 → Q1, gồm phần mở rộng khởi động được chủ dự án duyệt29/10. Ngưỡng CPU6x đạt trên3lượt/9lần khởi động; không dùng ngoại lệ baseline. Không commit/push/deploy/rules deployment/APK.

## Quyết định và implementation

- P0 duyệt qua skill `clarify-ambiguous-requirements`: năng lượng80/20; hỗ trợ5/10/30 độc lập, không pity; pool Memory chia đều3nhóm, tier60/30/10; Link3món và Triple4món chia đều. Lucky/Magnet là đặc biệt; nhóm phá phụ không bốc.
- Memory Lucky mọi mode:1–3cặp đợt đầu; special run chỉ màn1/đợt1, Continue giữ checkpoint. Quà cố định15giây/1Gợi ý/10Xu; nhánh thời gian Vô tận đổi10Xu. Mốc giữ bảng duyệt; time30 luôn vào kho cho chính sách mới.
- Link Cyan rã1cặp băng hoặc10Xu; Blue30% hỗ trợ; Red50% phá/50%xáo miễn phí. Phá không có cặp thường đổi10Xu; xáo không có cấu hình hợp lệ trả bàn cũ sau số lần thử hữu hạn. Lucky50Xu/30giây; mốc phá2/10, tổng250Xu/4item/2lần phá mỗi vòng trước fallback.
- Triple Magnet1thẻ/đợt, không Lucky; metadata không đổi số lượng/type. Gắn trước replay/solver hiện hữu, không kiểm solver lần hai. Chọn có exposed guard; ưu tiên khay rồi board theo ID ổn định, resolve3thẻ nguyên tử trước xét đầy khay. Solver, hint, shuffle cùng reducer; memo gồm type/Magnet. Lucky mới15giây, giữ30/3 và bảng10mốc.
- Ledger theo ID hữu hạn của round ghi cả trượt; undo giữ Lucky/ledger, nhóm trộn thẻ cũ không bốc lại năng lượng/hỗ trợ/sự kiện. Board+thời gian+ví+kho+claim+session vẫn commit trước presentation, rollback hiện hữu được test.
- Kho9999; hỗ trợ gameplay/mốc/Lucky và hỗ trợ rương vượt kho đổi10Xu/đơn vị. Mua và nguồn rương hành trình hiện hữu vẫn có guard đầy kho, không tự đổi luật nguồn đó.
- Rương ngoại hình trùng/đủ bộ và fallback chữ100Xu. Receipt đã commit200/300/10000Xu vẫn đọc/replay được, không hồi tố ví. Candidate quy đổi cũ chưa commit được định giá100Xu, không bốc lại loại quà.

## Owner và tương thích

`config.js` và `linkConfig.js` tham chiếu cùng `GROUP_DROP_RATES` tại `groupDropPolicy.js` cho xác suất; các pair resolver và Triple milestones/transactions sở hữu kết quả bền. Grid/session/controller quản ranh giới Lucky và chính sách. Triple state/rules/board/solver/hint/renderer/presentation cùng quản Magnet. `gameplayTuning.js`, persistence/supportInventory và chests đồng bộ giới hạn kho; liveops config/model/presentation và rules source/generator đồng bộ100Xu.

Giữ public call sites, save keys, formatVersion2, snapshot version1, milestone version2, progress/cycle/claim cũ và effect IDs. Bổ sung `pairSnapshot.rewardPolicyVersion` cho Memory/Link, `session.rewardPolicyVersion` cho Triple:2cho bàn mới, thiếu field=1. Phiên cũ giữ luật thưởng đến hết đợt; đợt mới dùng2. Metadata `tiles[].magnet` thiếu=không có, không tự thêm Magnet khi restore. Tooltip mốc theo cùng phiên bản chính sách. Không đổi giá shop,2Xu/nhóm cơ bản, luật sao/ranking, rate vé/chữ/huy hiệu hoặc backend.

Chọn mở rộng resolver/reducer và ledger hiện hữu; loại giả ba lượt chọn/DOM mutation và reward engine mới. Đổi lại cần giữ catalog tương thích cho phiên1. Sửa nguồn template và chạy `generate-liveops-model.mjs`, không lấy generated rules làm nguồn.

## Bằng chứng

- `node --test` pack9file: **95/95**; gồm biên RNG0.05/0.10/0.20/0.30/0.80, độc lập hai nhánh, legacy,20vòng mốc/sáu mode, kho đầy, Red/mốc, Magnet khay0/1/2đồng loại ở6/7và9/10, covered target, undo/replay, invalid metadata, queued write và receipt cũ.
- Lịch sử chẩn đoán28/10: Playwright pack33case **32pass,1fail CPU6x**. Kết quả nghiệm thu sau mở rộng29/10 nằm ở phần dưới. Lượt xác nhận sau sửa cuối: **12/12** (Magnet, pair transactions, Triple milestones); pack mốc Memory/Link/Triple và worker đã qua trong các lượt trước; metadata cuối được chạy lại2/2Magnet (40chu kỳ) và95/95unit. Sửa fixture chờ boot/hydration và mở độ khó; không giảm ngưỡng hoặc bỏ test thất bại.
- Magnet40chu kỳ (20normal/20reduced), viewport320/360/412/1024/ngang844,5skin. Mỗi round27node thẻ, chỉ1badge; ghost≤3; sau restart/chuyển trò scope listener/timer/RAF/animation/node về0. Xem ảnh thật xác nhận badge gỡ đúng khi tái sử dụng node. UI/QA mới giữ local theo `.gitignore`, không force-add.
- Probe toàn kịch bản gồm đổi skin/resize/restart (không phải chỉ chi phí Magnet): reduced p95/p99 **20.9/55.5ms**,1long task60ms; normal **20.9/41.7ms**,1long task73ms. Heap chưa ép GC:26.2→31.5MB và26.2→34.3MB; số này chứa decode/warmup, không chứng minh tăng giữ lại hay không leak vĩnh viễn.
- Easy generator+solver p95 **12.94ms** ở lần check cuối, dưới gate20ms. CPU6x sync-start gate100ms: mã mới đo riêng **137.9ms**; phục vụ source Triple từ tree `bbf8729bb07c0c1f216d85f421ad75606749f6e9` trước task qua plugin read-only, cùng test/fixture: **407.4ms**, cũng fail. Các số CPU kèm trace này là lịch sử chẩn đoán; phép so sánh cùng harness và sửa startup29/10 ở dưới.
- Firebase emulator: `check-liveops-emulator.mjs` và `check-festival-emulator.mjs` **pass**, gồm account isolation/CAS/race/retry/snapshot/rules. Festival trace22publications,130reads/87writes,30940bytes tổng encoded snapshot; đây là workload test, không phải số write trên mỗi drop. Không thêm document/drop hoặc ghi theo frame.
- Metadata chỉ ghi cho thẻ Magnet, không thêm false trên mọi thẻ. Snapshot ASCII fixture tăng **14byte** ở cả27và120thẻ (4909→4923;26684→26698). Ledger tối đa số thẻ round; không log vô hạn.
- `npm run check`: pass. `npm run build`: pass ở lượt cuối sau sửa candidate cũ và rút gọn metadata; build26.74s, không còn token asset chưa thay thế trong dist.

## Mô phỏng có seed, tách khỏi chơi thật

10000nhóm,9000thường/1000đặc biệt, RNG theo chỉ số nhóm seed727; mỗi resolver dùng cùng chuỗi đầu vào nhóm. Link reset board hợp lệ6cặp cho mỗi nhóm để cô lập reward; các thẻ đặc biệt luân phiênCyan/Blue/Red. Không Lucky, không shop, không nguồn ngoài task. Xu bảng chỉ quà resolver (không gồm20000Xu ghép cơ bản giống nhau). Không sử dụng item nên số item nhận=tồn, dùng=0; không quy đổi thành phút hoặc kết luận hành vi tiêu hao thật.

|Mode/chính sách|Memory năng lượng/Xu/item|Link năng lượng/Xu/item|Triple năng lượng/Xu/item|
|---|---|---|---|
|Có giờ/cũ|1000/21000/1404|1000/22645/1062|10000/69960/2998|
|Có giờ/mới|2582/54190/3050|2603/68370/1637|2582/18060/1303|
|Vô tận/cũ|1000/45000/1104|1000/32278/862|10000/96600/2332|
|Vô tận/mới|2582/54190/3050|2603/68370/1637|2582/18060/1303|

Đây là fixture tổng hợp, không dự đoán tỷ lệ đặc biệt thật. Memory/Link có thêm tiến độ từ thường; Triple giảm so với cộng chắc chắn. Giữ bảng đã duyệt; không tự đổi cân bằng lần hai.

## Còn cần quyết định/kiểm thực tế

- Q1 đã đóng29/10 theo quyền mở rộng rõ của chủ dự án; không chấp nhận ngoại lệ CPU.
- Chưa kiểm S22 vật lý/FPS/heap thiết bị, chưa có dữ liệu người chơi về quà nhận/dùng/tồn và mốc/phút. Không tuyên bố60FPS hoặc kinh tế đã cân bằng.
- Rules và bản web chỉ thay tại workspace, chưa triển khai; dịch vụ thật chưa nhận quy đổi mới. Không tự deploy.
- Repo có thay đổi giao diện từ task khác đang diễn ra; giữ nguyên, không đưa vào phạm vi receipt này. Review là tự đọc diff và chạy bằng chứng lại, không gọi là review độc lập.

## Nghiệm thu mở rộng startup — 29/10/2026

### Nguyên nhân và cách sửa

Đo từng owner ghi nhận một lượt teardown trang cũ153.7ms. Shell cũ dựng icon trên DOM đang gắn và cleanup con trước khi tách root. Bộ ghi trace của Playwright cũng chạy snapshot traversal (`visitNode`) trên cây DOM, làm sai lệch phép đo CPU. Phần tạo icon lạnh vẫn có lượt vượt100ms sau khi chỉ đổi thứ tự cleanup, nên được đưa vào batch startup.

- `appPageLifecycle.js`: một owner record chứa scope/root; vô hiệu hóa scope trước, tách root trước cleanup con; cleanup cũ không xóa owner mới được tạo trong callback.
- `gameShellLifecycle.js`: `dispose(detach)` giữ lời gọi không đối số, chạy detach sau khi scope đã inactive; lỗi detach vẫn giải phóng các resource còn lại. `gameShell.js` cleanup root tách rời, giữ nguyên root/ref và thứ tự DOM khi ẩn, hoàn thiện presentation theo scope một lần, hủy được khi thay round.
- `tripleShell.js`: tạo markup/controls tách rời, gắn sau khi hoàn thiện cấu trúc. Icon được hoàn thiện qua `prepareTripleShellArtwork` trong `startup.batch` có budget8ms; batch bị hủy giữa chừng có thể tiếp tục ở scope mới mà không nhân icon.
- `tripleController.js`: dọn page trước dựng shell lạnh; hoàn tất presentation/artwork trong startup trước generation/render/decode/readiness. Timer, input và lưu thưởng giữ ranh giới sẵn sàng hiện hữu. Không thêm delay hoặc vòng lặp animation.
- `playwright.config.js`: project `cpu-budget` tắt trace riêng cho phép đo, vẫn được thu thập trong suite mặc định. Các test chức năng giữ trace. Ngưỡng giữ100ms sync-start/25ms framep95/75ms clickp95/100ms clickmax. Test CPU chờ `whenIdle()` sau đo dispatch để không chọn thẻ mới trước durable commit; bỏ chờ cố định320ms gây race.

Chọn phối hợp batching DOM và phase startup có owner hiện hữu. Chi phí thêm là một lượt hoàn thiện artwork trước ready; cache vẫn chỉ một shell/game, ID/control không đổi. Không thay schema/save key/luật/thưởng/rate/timing gameplay.

### Kết quả hiện hành

So sánh cùng project không trace, cùng seed/fixture/CPU6x:

|Đo|Baseline trước task|Mã cuối: cao nhất qua3lượt/9mode-start|Ngưỡng|
|---|---:|---:|---:|
|Gọi khởi động|198.9ms|61.3ms|100ms|
|Frame p95 sau ready|8.7ms|10.1ms|25ms|
|Click p95|1.3ms|1.3ms|75ms|
|Click tối đa|2.2ms|2.9ms|100ms|

Các lượt mã cuối theo Normal/Hard/SuperHard:61.3/37.6/12.8ms;23.2/33.7/20.5ms;26.4/40.1/13.4ms. Baseline lấy source tree`bbf8729bb07c0c1f216d85f421ad75606749f6e9` qua Vite loader cục bộ, không đổi checkout. Đây là số đo desktop giả lập, không phải S22/FPS máy thật.

- CPU: `npx playwright test tests/ui/triple-generation.spec.js --project=cpu-budget --repeat-each=3`: **3/3 pass**, mọi assertion gốc đạt. Thu thập mặc định đã kiểm qua `--list`:12test desktop +1CPU, không bỏ bài đo.
- Hồi quy startup/lifecycle/HUD/worker và ownership: **38/38 pass**. Gồm100chuyển trò,40mount Memory/Link,20mount kiểm root/order,30hủy decode,20hủy worker, dispose lỗi/reentrant, deferred presentation bị hủy và partial icon batch phục hồi không nhân node. Resource sau dispose về0.
- Responsive: **6/6** Memory/Link bàn Challenge lớn/đổi hướng/resize/modal và **6/6** Triple khay10ô/đổi hướng trên desktop/mobile/landscape. Giữ board identity và không lỗi trang.
- Pack logic/persistence/reward: **95/95 pass** trên mã cuối.
- `npm run check` và `npm run build`: **pass** trên mã cuối; build26.74s. Không còn token asset chưa thay thế trong dist. Rà diff không có debug đo tạm, log QA hoặc thay đổi ngoài scope do task này tạo. QA local theo quy tắc `.gitignore`; không force-add test/capture.
- Đồng bộ các đoạn rơi/mốc/Lucky/Nam châm/kho trong ba tài liệu game; nguồn xác suất/catalog vẫn là code/config và plan đã duyệt.

Q1 đóng; giữ giới hạn kiểm S22 và dữ liệu tiêu hao người chơi thật như trên. Không triển khai dịch vụ/web thật hoặc APK.
