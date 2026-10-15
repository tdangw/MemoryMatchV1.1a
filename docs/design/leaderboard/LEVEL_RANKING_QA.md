# Nghiệm thu bảng level và tiến độ màn

Cập nhật 2026-10-15. Phase0–6 hoàn tất phần mềm, mỗi phase một commit; QA thiết bị thật còn chờ riêng.

## Kết quả sản phẩm

- Mỗi trò ba bảng Hành trình/Thử thách/Vô tận. Hành trình gom bốn độ khó theo màn đã thắng; điểm và thời gian không quyết định thứ hạng. Score/star history được giữ.
- Special Chơi lại/Lượt mới bắt đầu từ1, kỷ lục chỉ tăng; resume giữ run, seed/theme, bàn thật, score, thời gian, lucky history và phần combo còn hạn. Corrupt snapshot giữ source và từ chối resume.
- Challenge Triple tiếp tục từ8 theo ladder có trần; Memory/Link/Triple kiểm qua100.000 và các biên nguyên an toàn, không tăng vô hạn DOM/solver/time.
- Game dropdown ba mục, không query khi mở/hủy; keyboard/focus/resize/outside click, pager nhỏ với ellipsis chỉ trang đã tải. Map bỏ điểm trên nút; HUD Kỷ lục đúng context. Không thêm nội dung kỹ thuật vào giao diện.

## Dữ liệu và rollout

Thêm summary/run/board v3, không đổi save formatVersion2 hoặc xóa v1/v2. Adventure import batch20 chapter với bằng chứng owner; special history không import vào v3. Marker+summary cùng transaction và không bị queued stale progress làm lùi. Queue v3 best-only tối đa9/owner kể cả firstUid adoption, canonical key/owner validation, corrupt-entry recovery, UID và higher-best wakeup.

Winner settlement local durable trước outbox. Pair settlement resolve toàn bộ base/combo/lucky/premium/energy/milestone/inventory trước lần lưu snapshot+coins+progress; presentation không cấp thưởng. Quota failure rollback toàn bộ cặp, ví, kho, lucky history; stale round không sửa round mới. Không đổi giá trị/xác suất thưởng hoặc ngưỡng sao.

Project đã đối chiếu: `memorymatchv1-1a`. Chỉ deploy Firestore Rules/indexes; không Hosting/APK. Remote source khớp bản đã kiểm, index `levelReached DESC/reachedAt ASC/__name__ ASC` READY. Ruleset sau rollout: `951360d8-c561-4d1f-9b9e-e69b87a54a17`.

- [Mốc trước rollout](qa/firebase-level-rules-before.json)
- [Mốc sau rollout và index READY](qa/firebase-level-rules-after.json)

v1/v2 Rules/index cũ được giữ để bản web đang phát hành tiếp tục hoạt động. Không tạo tài khoản test trên production. Rules kiểm quyền/shape/max-level/timestamp; backend vẫn client-trusted, chưa có anti-cheat server. reachedAt là lúc server ghi nhận, không khẳng định thời điểm thắng offline.

## Bằng chứng kiểm tra

| Phạm vi | Kết quả hiện có |
|---|---|
| `npm run check` | Pass, 135 module; bao gồm v3 migration/corruption/quota/retry, old save contracts, 60 tổ hợp pair reward Link và Memory caps |
| Generator Node | 28 high-level witness cases pass; lần check cuối max163,43ms, Triple Easy p95 14,84ms; không phải mobile FPS |
| Firestore emulator Rules | Ba script private/cloud/profile/leaderboard pass ở gate cuối; chín board v3, server timestamp, strict-higher, concurrent max, ownership, privacy shape, cursor≤11, v1/v2 isolation; negative permission errors là fixture cố ý |
| Online/offline browser | 10/10 ở gate cuối: UID switch, offline/reload/idempotency/failed settlement pass; sáu winning controller đã ghép hết bàn và commit level1 |
| Pair rewards browser | 5/5: first durable snapshot đã đủ lucky/energy/item; reload trước arrival không loss/dup; quota rollback cả hai trò; năm chu kỳ bonus/restart hủy presentation cũ |
| Independent review | Model/checkpoint/generator/store pass; hai service pending-send cases 2/2; atomic reward pure matrix và browser2/2 được reviewer chạy lại, finding đã đóng |
| Final regression | 95/95: layout/service/progression/lifecycle/cleanup/navigation/profile/map/Triple; sau thay đổi thưởng cuối, pair+lifecycle 13/13 và pair 5/5 sau chỉnh timing |
| Build web / Android wrapper | `npm run build` và `npm run build:android` pass; chỉ tạo dist, không APK/cap sync/Hosting |

Profile-stat fixture phải chạy với Firebase disabled theo contract local của nó. Một lượt ghép nhầm suite này vào môi trường emulator có3failure do namespace/identity khác; chạy lại đúng cấu hình 5/5 pass. Test Triple cũ kỳ vọng dừng ở7 được đổi thành chứng minh sang8; không bỏ assertion thắng/settlement. Các winning fixtures mới không chỉnh totalPairs/matchedPairs để giả thắng.

## Resource và hình ảnh

Chrome155 headless Windows, viewport412×915, reduced-motion. Triple dùng seed `level-qa-<level>`; Memory/Link dùng lượt mới với seed runtime. Startup bao gồm async decode/Worker; hai mẫu heap không phải phép chứng minh leak hoặc p95. Scope sau unmount được giải phóng cả sáu board. Không quan sát long task trong cửa sổ đo, không suy ra không có long task ở mọi gameplay.

| Trò | DOM tile màn1 /100.000 | Startup ms màn1 /100.000 | Node toàn trang màn1 /100.000 |
|---|---|---|---|
| Memory |12 /60|71,4 /90,5|202 /298|
| Link |12 /60|110,5 /84,8|310 /460|
| Triple |18 /79|119,9 /194,2|316 /438|

Triple DOM chỉ gồm tile được render; logical cap93 được kiểm riêng bởi generator. Không suy số tile logical từ DOM hidden piles. Dữ liệu thô gồm heap trước/sau và user agent:

- [Memory resource](qa/level-resources-memory-match.json), [Link resource](qa/level-resources-link-connect.json), [Triple resource](qa/level-resources-triple-connect.json).
- [30 chu kỳ bảng](qa/level-ranking-30-cycles.json): node256→256, listener6→6, timeout/interval/frame0→0, ảnh tải1lần. Mount/menu-cancel/family-switch kiểm owner/node/image decode trở về baseline; 100 game switches và repeated mount/restart kiểm timer/listener/board stability trong regression lifecycle.
- [Mobile](qa/mobile-level.png), [Dropdown](qa/mobile-family-menu.png), [Landscape](qa/landscape-level.png), [Desktop](qa/desktop-level.png).

## Giới hạn nghiệm thu

Galaxy S22 Ultra thật chưa có thiết bị/remote debugging, theo xác nhận của người dùng; chưa nghiệm thu60FPS/frame/memory trên điện thoại. Dashboard admin ngoài repository, OAuth hosted và phát hành Hosting/APK không thuộc task. Không nhận browser headless là QA vật lý hay kiểm anti-cheat.

## Commits

| Phase | Commit |
|---|---|
|0|`4adcde9` baseline/budget|
|1|`7c6c6c1` v3 model và migration|
|2|`7d3814f` generated high levels|
|3|`2104ce8` progression/replay/resume|
|4|`ae5caa9` v3 sync/Rules/indexes|
|5|`b79b0f7` dropdown/level UI/HUD/map|
|6|Commit nghiệm thu cuối; xem Git log theo title `test: verify level rankings and generated progression`|
