# Thành tích, Nhiệm vụ và Sự kiện — Spark và sưu tập chữ

Cập nhật 26/10/2026. Đây là kế hoạch hiện hành duy nhất của task đã giao toàn bộ S0–S5. **S0–S5 đã hoàn tất. Chủ dự án đã cho phép deploy rules và bật Firebase thật để thử web trước APK ngày26/10.** Quyết định trực tiếp trong chat tiếp nối thay kiến trúc Functions và tiến trình cấp đồ hồ sơ theo điểm tuần. Kết quả nghiệm thu và bằng chứng cuối ở `REWARDS_MISSIONS_EVENTS_IMPLEMENTATION_RECEIPT.md`.

## 1. Phạm vi và ràng buộc

Auth + Firestore trực tiếp trên Firebase Spark; nhận thưởng/quay/bán/ghép/đổi cần mạng. Gameplay offline và phần thưởng thẻ đã nhận được giữ trong bản lưu rồi đồng bộ. Không Functions, SSV, máy chủ ngoài hoặc dịch vụ tính phí mới. Quyền bổ sung26/10: deploy Firestore rules, bật liveops và phát hành Hosting test để thử Firebase thật. Chưa push, APK, đổi giá hoặc billing.

Giữ 90 Thành tích, 30 mapping cũ, sáu hiệu ứng, thưởng 300 Xu theo nhóm 10 màn, backfill, phân trang và đồ công khai trên BXH. Quà Thành tích chỉ nhận bằng Thành tích; kho chữ riêng. Giữ save key và formatVersion2, thêm field có normalizer tương thích, không đổi nghĩa receipt cũ. Không ghi đè thay đổi gameplay/cân bằng có sẵn.

`design/rewards-liveops/{approval,liveops.source,catalog.source}.json` là hồ sơ phê duyệt lịch sử, không sửa thành phê duyệt Spark mới. Chính sách hiện hành ở `js/liveops/config.js`, model Spark và tài liệu này. Không phục hồi backend/SSV hoặc luật cấp đồ ở100 điểm đã bị thay thế.

## 2. Nhiệm vụ và điểm danh

Reset ngày07:00 Việt Nam, tuần thứ Hai07:00, theo server. Nhiệm vụ ngày/tuần là tiến trình thưởng Xu/vật phẩm hỗ trợ theo kỳ; không mất đồ hồ sơ đã sở hữu. Không tự thêm loại hỗ trợ hoặc đổi bảng thưởng đã duyệt.

| Nhiệm vụ ngày | Điều kiện | Xu |
|---|---|---:|
| Thắng3 ván | Ba trò/mode hợp lệ | 5 |
| Ghép đúng30 lần | Cặp Memory/Link, bộ ba Triple; ván thắng | 5 |
| Thắng không Gợi ý | 1 ván, có dữ liệu xác nhận | 10 |
| Hoàn tất cả ba | Bonus cùng claim cuối | 10 +1vé |

Tuần: thắng12, ghép120, thắng không Gợi ý3, điểm danh3 ngày; hoàn tất cả bốn nhận50Xu +2vé, không thưởng riêng từng hàng. Điểm danh bảy lần thực nhận:10/10/15/10/15/20/25Xu; một lần/ngày, bỏ ngày giữ ô tiếp theo, không nhận bù.

Giữ tiến trình Xu tuần **Thắp sáng hành trình** trong Nhiệm vụ: ván thắng Dễ/Trung bình/Khó/Siêu khó góp5/7/9/12điểm, Thử thách/Vô tận fallback5; cap40/ngày, điểm clamp100. Mốc20/50/80 tự cấp5/10/10Xu một lần/tuần, nhận lại tuần sau. **Không cấp đồ ở100điểm**. Rollover chốt quyền đã đạt từ kỳ đã chấp nhận trước reset; không tạo thưởng cho kỳ vắng hoặc facts hết hạn. Không còn lịch kết thúc pilot.

## 3. Bộ chữ và kho đồ hồ sơ

- Bốn công thức **MEMORY MATCH, LINK CONNECT, TRIPLE CONNECT, ADVENTURE** dùng chung bảng chữ/kho. Phân phối đều các ký tự duy nhất trong bốn tên, bỏ khoảng trắng; không nhân tỷ lệ theo chữ lặp.
- Mọi trò có thể rơi mọi chữ từ nhóm ghép thẻ đặc biệt/Lucky hợp lệ. **Thử nghiệm100%, mỗi nhóm rơi1chữ**, độc lập vé5% và thưởng khác.20% chỉ dự kiến sau thử nghiệm, chưa kích hoạt; không đổi tần suất sinh thẻ.
- Chữ không hết hạn/reset. Chữ lặp cần đúng số lượng; MEMORY MATCH cần3M. Hiển thị trái sang phải:2M+1A → **`M-M--- -A---`**. Xem trước từng bộ không giữ chỗ hoặc trừ chữ chung.
- Bán1chữ = **1.000Xu**. Ghép **3chữ giống nhau** thành1chữ ngẫu nhiên đều trong bảng chung, có thể trùng đầu vào. Bốc một lần, không reroll.
- Đổi đủ công thức tiêu đúng chữ, nhận **1món chưa sở hữu**. Cả4công thức, gồm ADVENTURE, nhận như nhau từ **toàn bộ12món dùng chung**. Đổi nhiều lần, không cấp trùng. Hết12món thì mỗi lần đổi nhận **rương10.000Xu** thay món đồ.
- Kho riêng **4avatar/4khung/4huy hiệu**: ký ức/rừng, đèn lồng/duyên nối, pha lê, hoàng gia giàu chi tiết. Chủ dự án đã duyệt số lượng/hướng hình. Source/brief/prompt/ID ở `design/rewards-letters/catalog.source.json`; generated catalog ở `js/liveops/letterCatalog.generated.js`.
- Chọn món chưa sở hữu đầu tiên theo catalog ổn định, xem trước chính xác trước đổi; không ngẫu nhiên phần quà. Đồ vĩnh viễn qua reset/đổi bộ. Quà Thành tích và acquisition cũ giữ riêng.

## 4. Vòng quay, quảng cáo và vé

**1free + tối đa10ad/ngày**, chung tài khoản/ba trò/thiết bị. Tám ô bằng nhau **5/10/10/15/15/20/20/25Xu**, kỳ vọng15. Earned thật cho một lượt; skip/dismiss/no-fill/error không thưởng hoặc trừ lượt. Web không provider thật không giả earned/quảng cáo nhận thưởng.

**1vé =1lượt** cùng bảng thưởng, tách quota free/ad. Vé không hết hạn hoặc cap kho/rơi/ngày/lượt dùng. Bonus ngày1vé, tuần2vé cộng thêm Xu. Mỗi nhóm ghép đặc biệt hợp lệ có5% rơi1vé, độc lập chữ. Nhóm nhiều cờ chỉ một lần thử; Triple thường góp thanh mốc không tự thành thẻ đặc biệt.

Vé/chữ nhận ngay cùng giao dịch ghép local, giữ kể cả thua/rời ván; không chờ thắng. Attempt/wave/group checkpoint ngăn callback/reload/Hoàn tác bốc lại. Tiêu vé/trừ chữ/cộng Xu/cấp đồ/kết quả chung marker, retry không tiêu/cấp hai lần.

Ad pending giữ UID/operation/ngày chuẩn bị/earned. Earned sát reset dùng quota ngày chuẩn bị, không ngày mới. Earned trong ngày chuẩn bị hoặc ngày kế tiếp, phục hồi tối đa48h sau earned; giữ tối đa30kết quả/ba ngày trước. Pending hết hạn loại an toàn, không khóa thao tác tương lai. App bị giết trước callback earned không có SSV để chứng minh quyền chưa ghi nhận.

## 5. Kiến trúc, conflict và phục hồi

Đã cân nhắc Functions (cần Blaze), chỉ snapshot base64 (rules không kiểm quota), và **một state thưởng có cấu trúc + snapshot hiện có**. Chọn phương án cuối: ownership/quota rõ, Spark, tái dùng queue tài khoản; đánh đổi nhiều phase khi tồn đọng nhiều loại chữ.

Một document riêng tư `gamespaces/{space}/liveops/{uid}`, liên kết root `players/{uid}` và `objects/{hash}`. Không document/ván/vé/chữ/receipt ad hoặc lịch sử vô hạn. `coins` snapshot vẫn là ví duy nhất. Local mirror giữ state/checkpoint/watermark/pending hữu hạn, không đè cloud mới hơn.

`accountService.runRewardOperation` giữ owner UID/profile/networkTask; persistence giữ queue xuyên stage/commit/apply, shop/restore/settlement không chen cùng ví. RNG candidate/operation lưu bền trước publication. Root snapshot + state thưởng công bố trong cùng Firestore transaction CAS; callback không animation/bốc lại. Commit rồi áp RAM/báo nhận; mất phản hồi đọc canonical để phục hồi. Cleanup giữ job lỗi, không xóa chunk root tham chiếu.

Facts gộp, marker settlement theo18slot game/mode và attempt; queue tối đa4096. Drop checkpoint hữu hạn theo slot/attempt/wave, tối đa1000nhóm. Vé/letter earned watermark đơn điệu; vé giữ sequence/kết quả cuối thay mảng mọi lượt.

Rules giới hạn1000biểu thức: sync chia init nếu thiếu, rollover nếu cần, progress/vé, chữ theo nhóm **tối đa4loại**, cuối cùng action. So với nới invariant để nhét một transaction, chọn phase hữu hạn; mỗi phase atomic root+state, ack đúng phần đã công bố. Crash giữ phần chưa gửi trong canonical snapshot. Guard theo số loại chữ, không write theo từng chữ rơi.

Hai thiết bị không cộng hai ví hoặc chỉ nâng expectedRevision rồi gửi bản cũ. Conflict giữ backup và dùng canonical trước thao tác mới. Đổi UID không chuyển thưởng đã ràng buộc tài khoản; backup cũ giữ lại, UID mới chưa có cloud nhận profile sạch.

Backup Spark cần online, fingerprint khớp canonical **trước hydrate/import**. Backup trước tiêu Xu/đổi chữ bị từ chối, không tạm áp ví cũ. Import thấp tầng chưa đối chiếu giữ `restoreNeedsReconcile` bền vững; bind/sync/claim không bypass. Root rewardRevision/economyRevision là guard bổ sung, scalar riêng không thay fingerprint. Backup legacy chưa Spark giữ hành vi cũ.

Server timestamp xác nhận clock phiên, cộng elapsed bằng monotonic clock; giờ máy không cấp quyền. Drift/foreground mất tin cậy yêu cầu xác nhận lại, clock-only write riêng. Kỳ cũ chốt trước reset, không tạo quà cho kỳ vắng. Hết mạng/quota giữ local/pending, ngừng nhận online, không đổi billing/retry vô hạn.

Rules kiểm owner/private, schema/type/range, kỳ/quota, monotone, sequence, recipe consumption, root/state getAfter. **Gameplay, RNG, earned callback và snapshot ví vẫn tin app**, theo mức bảo mật cơ bản đã chốt; không tuyên bố chống app sửa đổi/xác minh ad máy chủ.

## 6. UI, tài nguyên và vòng đời

Dùng owner/dock/scope có sẵn. Missions chứa nhiệm vụ/điểm danh/mốc Xu tuần. Events chứa free/ad/vé, bốn công thức, kho chữ, bán/ghép/đổi và món tiếp theo/rương. Chữ/số thật, iconSVG, ngôn ngữ sản phẩm, không emoji trang trí hoặc nhãn phát triển. Validate số lượng trước pending.

Rotor transform hữu hạn2,4s, reduced-motion tĩnh, đóng trang giữ kết quả đã commit. Không loop mới. Kiểm20chu kỳ normal/reduced-motion, node/scope/listener ổn định; viewport320/412/844/1024, năm skin.

12artwork dùng pipeline geometry/alpha hiện có, WebP128/256/512. Kiểm39avatar×39frame=**1.521cặp**, giữ catalog cũ. Budget gồm đồ mới, decode ước tính dưới24MiB. Không tuyên bố60FPS điện thoại chưa đo.

## 7. Chi phí và kinh tế

Không polling/status write mỗi lần mở trang. Auto recovery chỉ khi facts/vé/chữ dirty; status đồng thời gộp theo UID/profile. Upload gộp dirty, claim flush có mục đích. Không cloud write riêng cho thử rơi hụt hoặc từng cú ghép.

Publication có n object writes +root+state, cleanup/delete, kèm preflight/transaction/retry/rules/listener reads. Backlog chữ có nhiều publication theo nhóm4loại; clock và tính năng khác cũng tiêu quota. Không lấy11free/ad làm trần chi phí vì vé không cap.

Số đo emulator tại `runtime/qa/rewards-spark-operation-counts.json`: gộp10facts hoặc50facts đều1publication,6reads/4writes, khoảng5,9KB payload. Toàn matrix50publications:301reads/200writes/136.457B. Chỉ đếm SDK trong fixture nhỏ; **không gồm rules-dependent billed reads, transport, Auth/BXH/tính năng khác**, không phải đo hóa đơn/DAU. Số chunk/retry/phase/vé quyết định chi phí thực. Không cam kết Spark cho số người chơi cố định hoặc tự chuyển Blaze.

Giữ mức Xu duyệt:105điểm danh +210ngày +105kỳ vọng free +50tuần +25mốc tuần =**495Xu/tuần**, chưa vé/ad. Đủ70ad thêm1.050 thành**1.545**; tối đa565không ad/2.315có70ad. Dùng9vé nhiệm vụ thêm135kỳ vọng/225tối đa: **630/790**không ad, **1.680/2.540**đủ70ad. Chưa vé rơi/để dành, bán chữ1.000/rương10.000 nên **không có trần Xu tuần cố định**. Trial100% ảnh hưởng thu nhập, không lấy20% dự báo bản đang thử. Không tự giảm thưởng/tăng giá bù.

## 8. Gates và acceptance

| Gate | Phạm vi | Bằng chứng bắt buộc |
|---|---|---|
| S0 | Pure model/normalizer/quota/recipes | Save missing/corrupt/future, rollover, ad10, vé, letters/sell/fuse/12items/chest/retry |
| S1 | Atomic Firestore/rules/account/restore | Emulator UID/private/deny/races/recovery/stale backup/fullalphabet phase |
| S2 | Missions/login/mốc Xu tuần/three-game drops | 1/2bonusvé,5%ticket/trial100%letter, noHint, immediate/dedup/offline, quyền cũ |
| S3 | Free/ad/ticket và letter UI | Retry/reset/late48h, previewM, invalid quantity, exchange1item, equip/public, không giả ad |
| S4 | Retire Functions/SSV | Không import/call backend, firebase config không Functions, generated khớp source |
| S5 | Review và nghiệm thu | 38unit, emulator matrix,15web,2layout/lifecycle,assetbudget/alpha,check/build,diff review |

Trạng thái từng gate và kết quả cuối nằm trong receipt chung. Native provider, hai máy thật/live rules không được chứng nhận bởi emulator. Quyết định sản phẩm đã đủ; không còn câu hỏi về kho/ADVENTURE/số món mỗi lần đổi.

## 9. Nguồn và phát hành

Nguồn đã đối chiếu khi chọn Spark: [Functions/Blaze](https://firebase.google.com/docs/functions/get-started), [Firestore quotas](https://firebase.google.com/docs/firestore/quotas), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [rules reads](https://firebase.google.com/docs/firestore/pricing), [request.time](https://firebase.google.com/docs/reference/rules/rules.firestore.Request), [AdMob earned](https://developers.google.com/admob/android/rewarded).

Theo yêu cầu trực tiếp26/10, đã deploy rules Spark và12public ID mới lên memorymatchv1-1a, đọc lại source khớp SHA256662edab10b2cbfb626c60c32931ed0009a82e40ca6a398e90e0a8136263a2f7a. Đã bật VITE_LIVEOPS_ENABLED=1 trong .env.local (giữ public expansion=1), build và phát hành Hosting test: https://memorymatch-test.web.app. Không bật emulator, không Functions/billing/APK/push. Hosting production/beta không phát hành trong lượt này. Nghiệm thu live tiếp tục ghi trong receipt chung; APK chỉ sau khi chủ dự án thử web ổn và yêu cầu.

## 10. Bổ sung26/10 — sheet chữ và hiệu ứng nhận trong màn chơi

Yêu cầu trực tiếp: vẽ sheet chữ, thu về cỡ icon vật phẩm, chữ bật ra từ nhóm ghép rồi hiện rõ giữa màn hình và tự ẩn. Đã chốt **tự thu thập, vẫn cộng kho ngay**, không chạm nhặt, không mất chữ nếu bỏ qua hoạt ảnh. Không đổi tỷ lệ/kinh tế/save/rules.

Chọn bridge callback sau durable commit thay so sánh kho cũ/mới hoặc reroll ở renderer: callback chỉ mang chữ thực nhận, không persisted; không phát lại do sync/restore/reload/Hoàn tác. Ba adapter chỉ capture vị trí khi nhóm đặc biệt hợp lệ; scope round cũ bị hủy không vẽ lên round mới. So với overlay riêng từng game, dùng một renderer chung, owner là scope màn chơi. Không gắn animation vào quyền sở hữu chữ.

Sheet17glyph theo bảng chung, vàng–men xanh Cổ tích, nền alpha; exact prompt/source/crop ở `design/rewards-letters/drop/source.json`, PNG nguồn cùng thư mục, generator `scripts/prepare-letter-drop-atlas.mjs`. Runtime atlas5×4 ô128/256px; drop40px như icon hỗ trợ, center56–80px tùy viewport. Atlas chỉ tải khi cần hiển thị và chọn đúng DPR; không preload từ trang chủ, không load/decode riêng từng chữ/lần nhận.

Timeline tổng2.200ms (điều chỉnh theo yêu cầu tiếp theo để kịp nhìn chữ): bật tại vị trí ghép0–264ms; bay về vùng giữa đến660ms, phóng nhẹ116% tại968ms rồi thu nhỏ dần108%→85%→35% đồng thời fade và hủy. Caption “Đã nhận chữ X” nằm trên chữ để tránh toast may mắn hiện có. Chỉ transform/opacity, không particle/filter/RAF liên tục. Reduced-motion hiện tĩnh1.100ms rồi hủy.

Giới hạn5chữ đồng thời,16DOM nodes (root+5×entry/sprite/label),10animation hoặc5timer ở reduced-motion; vượt giới hạn thay presentation cũ nhất, không ảnh hưởng kho. Queue không tăng vô hạn. Scope cleanup idempotent hủy timer/animation/DOM; callback trước commit hoặc scope hết hạn không hiện. Atlas decoded tối đa5.242.880B khi chọn256px/cell, không cache biến thể riêng từng chữ. Mục tiêu không tăng cloud write; không khẳng định FPS điện thoại chưa đo.

Gate bổ sung: chuẩn bị/kiểm atlas → implementation bridge/ba trò → unit/UI20cycles×4viewport×2motion + ghép thật ba trò + regression waves → check/build/review → cập nhật Hosting test đã được cho phép. Kết quả cuối trong receipt chung, không tạo báo cáo riêng.

Gate bổ sung hiệu ứng đã hoàn tất:25unit,15UI,check/build/review đạt; Hosting test cập nhật và đọc lại đúng bundle/atlas mới. Chi tiết tại mục bổ sung hiệu ứng trong receipt chung.


## 11. Bổ sung vé rơi và thời lượng chữ —26/10/2026

Chủ dự án yêu cầu vé quay rơi như năng lượng/vật phẩm, **không hiện lớn giữa màn hình**; chỉ chữ dùng hiệu ứng giữa. Thời lượng chữ tăng **2.500ms**, giảm chuyển động vẫn1.100ms. Vé vẫn5%/nhóm đặc biệt ba trò, độc lập chữ và các thưởng khác; không đổi luật hoặc dữ liệu.

Đã xác định nguyên nhân thiếu hình: persistence đã cấp vé và callback mang outcome.ticket, nhưng renderer chỉ xử lý outcome.letter. Callback mới xử lý cả hai sau durable commit, không reroll/ghi thêm. Vé dùng **icon SVG vé vàng có vòng quay bên trong** từ createIcon('ticket'), cùng hình trong số dư vé của Sự kiện. Không cần raster/emoji hoặc sheet mới.

Chọn tái dùng playLootDrop thay thêm timeline/pool riêng: preset linkItem, tier gold, bật/rơi620ms, giữ450ms, tự thu/fade theo cơ chế vật phẩm (bay đến nút Sự kiện nếu hiện; nếu ẩn thì thu tại chỗ). Không caption giữa màn cho vé. Owner phải là active scope lúc commit; source lấy vị trí đã capture trước board thay đổi. Dùng chung cap item12 và cleanup/timer/reduced-motion của loot runtime. Giảm chuyển động không chạy loot giống các vật phẩm khác, quyền nhận vẫn áp ngay.

Nghiệm thu bao phủ cả ba trò ghép thật nhận đồng thời chữ/vé bằng RNG inject ở test boundary, không đổi tỷ lệ production; chữ/kho/dedup,20lần scope cleanup, vé không tạo central entry; syntax/unit/check/build/review và Hosting test. Bằng chứng cuối trong receipt chung.
