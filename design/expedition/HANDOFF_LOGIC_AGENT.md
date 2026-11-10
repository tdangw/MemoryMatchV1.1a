# Prompt bàn giao — Agent B: logic, UI và offline

Đây là hướng dẫn tiếp nhận, không phải kế hoạch active thứ hai. Có thể gửi nguyên nội dung phần Nhiệm vụ cho chat mới. Bàn giao ngày 08/11/2026.

## Nhiệm vụ

Bạn tiếp nhận phần **logic, giao diện Kho lưu trữ/Hồ sơ và offline** của Memory Match Adventure trong `C:/Users/Dang/MyProject/MemoryMatchV1.1a`.

Đọc theo thứ tự: `AGENTS.md`, `CONTEXT.md`, `COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md`, rồi `design/expedition/IMPLEMENTATION_NOTES.md`. Dùng cùng kế hoạch hiện hành; không tạo kế hoạch active khác. Agent A tạo ảnh độc lập; không ghi đè master, prompt hoặc manifest họ đang làm. Không tự deploy Hosting/rules, tạo APK, push hoặc gom commit thay đổi của người khác.

**Hai trò Match 3 Connect và Memory Sequence chưa triển khai.** `NEW_GAMES_OUTLINE.md` chỉ là phác thảo chờ phân tích thêm, ngoài phạm vi công việc này.

## Luật đã chốt, không hỏi lại

| Nội dung | Luật |
|---|---|
| Catalog | 101 món: 39 avatar, 39 khung, 23 huy hiệu; giữ ID và quyền sở hữu/trang bị cũ |
| Level | Lần đầu Level 1; mỗi bản trùng hợp lệ tăng 1 tới 21; ở 21 ghi đúng **Level Max** |
| Hình thái | Level 1–6 gốc, 7–20 form 2, 21 form 3; không nâng thủ công, không tiêu mảnh để lên level |
| Sau Max | 1 bản trùng thành 1 mảnh đúng loại avatar/frame/badge |
| Bán mảnh | 100 Xu/mảnh |
| Ghép mảnh | 3 mảnh bất kỳ, được trộn loại, +20 Xu thành 1 rương Avatar/Khung/Huy hiệu; mỗi loại 1/3 |
| Rương ghép | Vào kho, không tự mở; khi mở vẫn có nhánh Xu/hỗ trợ/ngoại hình |
| Ghép chữ | Phí 10 Xu/lần 3 chữ, giữ luật ưu tiên chữ thiếu hiện hành; pending/receipt miễn phí cũ giữ luật cũ |
| Pool ngoại hình | Chọn cả món mới và đã có trong 101 món đúng loại, gồm 3 starter; giữ trọng số loại quà |
| Bán rương | Avatar/Khung/Huy hiệu: 200 Xu mỗi loại; C: 58 Xu |
| Giá mua rương | 10.000 Xu/rương ngoại hình là giá dự kiến đã ghi; không tự thêm chức năng cửa hàng ngoài phạm vi đã giao |

Giá bán C đã tính theo yêu cầu một nửa giá trị quà trung bình: 40%×50 Xu +60%×mean(158,6667;158,5;158,5)=115,1333 Xu. Một nửa là 57,5667, làm tròn thành 58 Xu. Dùng giá hỗ trợ hiện tại, không gán giá tùy ý cho ngoại hình. Đóng băng giá theo phiên bản receipt; không sửa hồi tố lịch sử.

## UI đã chốt

- Đổi nhãn tab **Kho rương** thành **Kho lưu trữ**, giữ ID `chests`. Chứa rương chưa mở và mảnh dư; có thể bổ sung loại vật phẩm sau. Không thêm tab Mảnh riêng.
- Một lưới icon có phân trang, mỗi loại vật phẩm đang có chiếm một ô. Dự kiến 4 cột × 6 hàng trên điện thoại, 6×6 khi đủ rộng; đo thật ở 320/384/412/ngang/desktop. Ô **chỉ hiện icon**; tên và số lượng nằm trong popup và nhãn truy cập.
- Rương: popup **Xem tỷ lệ / Mở / Bán**. Mảnh: popup **Bán / Ghép** giống bộ chữ. Mở và bán rương có thanh trượt chọn số lượng, hiện đúng tổng trước xác nhận.
- Mở nhiều: mỗi rương là một operation lưu bền và xác nhận riêng; hiệu ứng lần lượt, cuối cùng một popup tổng quà. Đóng hoặc mất mạng dừng mở các rương tiếp theo. Operation đang gửi vẫn phục hồi đúng một lần; rương chưa bắt đầu vẫn ở kho. Không trừ cả lô rồi mới mở dần.
- Hồ sơ/Bộ sưu tập theo mẫu `design/expedition/profile-preview/profile-mobile.png` và `collection-preview/collection-mobile.png`. Nhãn Level/Level Max ở góc, không che ảnh; một ô mỗi ID, không biến ba form thành ba món. Thử một món giữ hai slot còn lại. Chi tiết cho xem ba form; không có nút nâng thủ công hoặc đếm mảnh riêng theo món.
- Chữ sản phẩm tự nhiên, không ghi chú nội bộ; trang trí không dùng emoji/font. Giữ các thay đổi UI đang có của task khác.

## Offline đã chốt

Chơi, qua màn, tiếp tục ván và lưu checkpoint/kết quả/raw facts/drop markers trên thiết bị trước khi báo thành công. Mất mạng, Firebase lỗi hoặc 403 không được khóa gameplay hay thay trang đã lưu bằng màn lỗi.

Tận dụng **một hệ persistence, inventory, journal, receipt và đồng bộ hiện hữu**. Không tạo ví/save/sync cạnh tranh. Mỗi operation có ID, UID/profile/environment và phiên bản policy; lưu yêu cầu bền trước gửi, giữ entropy/candidate qua retry/restart. Tài sản cần máy chủ xác nhận chỉ hiện **Chờ đồng bộ**, chưa cộng quà hoặc cho tiêu sớm. Mất phản hồi sau commit phải truy hồi đúng một lần.

Hai quyết định sản phẩm đã chốt:

1. Ván offline không xác định được ngày tính vào nhiệm vụ của **ngày máy chủ xác nhận**. Chỉ hạn mức/quà kỳ đó, không cấp bù ngày cũ, tự điểm danh hoặc bỏ thời gian chờ bằng đồng hồ máy. Gán kỳ cùng ID ván/receipt phải lưu bền, không đổi ngày khi retry.
2. Được dùng offline **hỗ trợ đã được máy chủ giữ riêng cho thiết bị**. Phân bổ bảo toàn tổng tồn; máy khác không dùng phần đã giữ. Mỗi lần dùng lưu bền trước tác dụng. Phần chưa dùng không tự trả về kho chung khi mất mạng, hết giờ hoặc đăng xuất mà chưa đối chiếu. Nếu chưa có/hết phần được giữ, chỉ thao tác hỗ trợ cần mạng, không khóa chơi. Mua bằng Xu và quà mới chưa xác nhận vẫn chờ máy chủ.

Tự đồng bộ khi mở ứng dụng, có mạng và foreground. Retry có backoff/jitter, giới hạn concurrency và không nhân scheduler. 403 hoặc phiên bản không hỗ trợ phải giữ dữ liệu, dừng gửi vô ích. Bảo vệ owner qua cold boot offline, guest→Google, đổi UID, logout, restore/reset/xóa.

Không dùng snapshot mới nhất thắng làm mất tiến độ máy khác. Rebase theo domain và receipt; không cộng/max tùy ý ví và kho tiêu hao. Conflict chưa giải quyết an toàn thì giữ các nguồn/pending để đối chiếu nhưng vẫn cho chơi.

Android dùng tài nguyên đóng gói. Web phải kiểm shell/theme/resource availability với production worker; không hứa mọi theme offline khi ảnh/âm thanh chưa có. Cache Firestore không thay thế local-first, không preload toàn bộ 909 ảnh ngoại hình.

## Source đang dở, không bắt đầu lại

Chi tiết từng hàm ở `IMPLEMENTATION_NOTES.md`. Các owner chính:

- Mới `js/progression/cosmeticCatalog.js`, `cosmeticProgression.js`: catalog 101, model thuần/version 1, level/mảnh/giá/phí/seed/projection/replay.
- `js/liveops/chestConfig.js`, `chests.js`: pool v2 gồm 101, legacy v1 gồm 98; item mới nhận trùng giữ loại item. Thêm `sellChest`, journal kind `sale`. `chests.sequence` hiện bằng tổng spent; bán quantity làm sequence tăng quantity, không đổi mù sang số operation.
- `wheelRewards.js`: v3 nhận trùng ngoại hình, vẫn đọc v2; nhóm khác ngoại hình giữ cách xử lý cũ.
- `letters.js`, `config.js`: `paid-missing-first-v2`, phí 10 Xu, legacy miễn phí vẫn đọc được; receipt phí âm.
- `sparkModel.js`: optional `cosmeticProgress`, nhận bản từ chest/wheel mới applied, fragment commands và sellChest. Cờ `cosmeticEnabled` mặc định false; service bật sau preflight. Kiểm tra mọi nguồn thưởng đi qua boundary đúng một lần.
- `service.js`: preflight seed, số dư canonical, sequence/version/candidate/phí đã bắt đầu; vẫn online-only, chưa sửa offline. Không ghi đè receipt quyền sở hữu theo item khi tăng level.
- Rules SOURCE: `design/rewards-liveops/{cosmetic,spark,chest,wheel}-rules.template.txt` và `scripts/generate-liveops-model.mjs`. `firestore.rules` là output, không sửa tay.
- Chưa hoàn tất renderer/profile/header/public cosmetics/leaderboard, Kho lưu trữ, popup, mở nhiều hoặc offline. Model và ảnh mẫu không chứng minh UI đã triển khai.

## Bằng chứng và lỗi cần xử lý

**50/50 unit đạt** trong 6 file `cosmetic-progression`, `cosmetic-rewards`, `festival-chests`, `liveops-letters`, `wheel-rewards`, `liveops-spark` dưới `tests/unit`. Đã chạy lại sau source bán rương nhưng chưa có kiểm thử chuyên biệt `sellChest`, không đánh dấu method này đã nghiệm thu. Thư mục tests có thể đang ignore; không bỏ qua file chỉ vì git status không liệt kê.

**Emulator chưa đạt.** Lệnh hiện có:

```text
npx firebase emulators:exec --only firestore --project demo-memory-match "node scripts/check-cosmetic-emulator.mjs"
```

Script dùng DB/cloud snapshot/CAS thật. Log: `runtime/cosmetic-emulator.log`. Sau migration 101, scenario nhận ngoại hình bị PERMISSION_DENIED, báo vượt 1000 biểu thức. Thêm step markers, dùng coverage và tìm đúng thao tác thất bại; không bỏ validation để pass. Đối chiếu membership legacy 98/mới 101: generated regex chưa hoàn thiện việc tách starter theo phiên bản. Chưa check/build/UI/performance/nghiệm thu chung; không deploy rules hiện tại.

Audit offline mục 13 đã tìm thấy:

- `commitSparkOperation` giữ hàng đợi ghi thiết bị trong I/O mạng.
- `runRewardOperation` giữ `replaceProfileSafely`, có thể khóa `canLaunchGame` khi chờ thưởng; khóa thay profile thật vẫn phải giữ.
- `settlementAdapters` bỏ fact khi thiếu `trustedRewardPeriod`; cần lưu raw fact dù chưa có ngày/clock.
- Account retry chưa tách 403/version; conflict chọn toàn bản local/cloud chưa đáp ứng hợp nhất theo domain.
- Worker chỉ cache asset đã tải; DEV unregister/xóa cache, không chứng nhận production offline.

## Hợp đồng với agent ảnh

Đọc `HANDOFF_ART_AGENT.md`. Agent A sở hữu master/prompt/QA/journal/manifest trong `design/expedition/art-production/`, manifest lô ảnh và namespace export:

`public/assets/achievements/evolution/v1/{item-id}-form{2|3}-{128|256|512}.webp`

Bạn sở hữu generator/bộ đọc/catalog runtime để gắn ảnh ready theo level. Manifest dự kiến: `design/expedition/art-production/manifest.json`, version 1, từng ID/form/files/hash/anchor/QA. Journal ứng viên hiện có không phải manifest ready. Chỉ nhập form đã QA; không import master PNG vào bundle, không coi fallback gốc là đã đủ ảnh. Public cosmetics phải mang đúng hình thái của UID đó, không mượn level của chủ máy để vẽ người khác.

Hiện có 12 ứng viên cho 6 món, chưa có 606 export sản phẩm đạt QA. Agent ảnh còn làm tiếp; bạn có thể xử lý logic/offline/UI độc lập rồi gắn catalog khi nhận lô ready.

## Quy trình kết thúc

Đọc git status/diff trước khi sửa; không coi toàn bộ dirty là của bạn. Có thay đổi khác về map/home/sound/link layout/badge rewards/achievement modal/header/reward indicators cần giữ nguyên. Không reset, format hoặc commit gộp chúng.

Thực hiện Gate 1–4,6–7 và O1–O6 thuộc logic/offline của cùng kế hoạch. Gate 5 ảnh do Agent A, không tự đánh dấu xong; nghiệm thu toàn task phụ thuộc cả ảnh và tích hợp. Chạy kiểm tra theo rủi ro: unit/contract/migration/emulator, UI thật với lỗi mạng và hai thiết bị, rồi check/build ở gate cuối. Review diff riêng, chạy lại bằng chứng trọng yếu, nêu đúng phần chưa xác minh và trình tự phát hành rules/client tương thích. Không APK/deploy.

## Cập nhật sau tiếp nhận — 09/11/2026

Các trạng thái source/test ở trên đã cũ; đọc mục mới nhất trong IMPLEMENTATION_NOTES.md trước khi tiếp tục. Chính sách offline thay thế cuối kế hoạch có ưu tiên: dùng kho hỗ trợ cached bình thường, mở quà/quay vé offline, local projection bền vững dùng ngay; không escrow thiết bị và không hỏi lại cách phân bổ. Raw fact không biết ngày vẫn bind một lần vào ngày máy chủ xác nhận. Có outbox trong Spark save, publication proof trong sync metadata và overflow batch trong reward ledger; không tạo ví/writer khác.

Manifest ảnh hiện có10/202 form và30/606 export ready. Generator chỉ nhập lô đã QA, kiểm hash/dimensions/provenance; Agent A đã xác nhận hợp đồng không đổi và việc tạo ảnh đang tạm dừng. Không tự sửa master/prompt/journal/manifest hoặc nhận ảnh đã đủ.

Chủ dự án vừa cho phép **deploy rules nếu cần**; quyền này thay lệnh cấm rules deploy phía trên. Chỉ Firestore rules, đúng `memorymatchv1-1a`, sau kiểm thử và đối chiếu rules đang dùng; không Hosting/indexes/APK/client release. Bản rules trước và hash lưu runtime, kết quả triển khai phải ghi thật trong notes/CONTEXT khi hoàn tất. Chưa deploy ở thời điểm ghi mục này.

Đã thực hiện quyền này sau8 nhóm emulator PASS: ruleset `28a5e576-4e28-4213-b2cb-b972183e4861`, SHA256 `c568d95bb3a781bc948568091e6f09b796e0b8b7cd0f1c26cf7f89335ffeb282`, đọc lại trùng bản local. Check/build và các matrix logic/UI/offline đã đạt trên web/emulator; xem mục kết quả cuối IMPLEMENTATION_NOTES.md. Chỉ Gate5/ảnh đủ bộ, phần nghiệm thu ảnh/Android thực và Gate7 chung còn mở; không bắt đầu lại implementation hoặc hỏi lại phân bổ hỗ trợ. Không tự deploy Hosting/APK.
