# Cổ tích và Thành tích — nghiệm thu triển khai

Nguồn phạm vi duy nhất: `ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md` và
`docs/design/achievements/IMPLEMENTATION_PROMPT.md`. Ngày 23/10/2026.

## D0 — quyết định được chủ dự án duyệt

PASS về quyết định sản phẩm, theo hai câu trả lời trực tiếp trong chat:

- Duyệt hình, tên và thứ tự 30 quà của `art-kit-v1/reward-distribution.json`:
  10 màn riêng từng trò, 9 avatar, 9 khung, 6 huy hiệu, 6 hiệu ứng.
- Giữ 300 Xu cho nhóm 10 màn, receipt cũ và mọi quyền đã có; không cấp lại.
- Màn 11 trở đi tiếp tục chơi bình thường; chưa có quà Thành tích mới.
  Không modulo, random, tiền bù hoặc khóa tiến trình.
- Quyết định ban đầu là đồ Hồ sơ cục bộ. **Được thay bởi yêu cầu trực tiếp
  tiếp theo của chủ dự án:** người khác thấy avatar/khung/huy hiệu đang
  trang bị trên BXH; đồng bộ khi Lưu thay đổi trong Hồ sơ. Giữ nguyên cách
  tính điểm, so sánh kết quả và thứ tự xếp hạng. Chuẩn bị model/outbox/rules
  và kiểm thử tương thích; không tự deploy dịch vụ.
- Tên Cổ tích / `storybook`; dùng font miễn phí đủ dấu Việt.
- Bản ghép từ asset và chữ DOM thật tại 412×915 phải được chủ dự án duyệt
  trước rollout toàn ứng dụng. Đây là mốc duyệt D2 riêng, chưa đạt.

Phương án: mở rộng skin/modal/settlement/persistence owner hiện hữu,
artwork nhiều lớp và content slots. Loại phương án recolor hộp cũ vì thiếu
silhouette; loại screenshot chứa chữ làm panel vì không hỗ trợ semantic,
responsive và nội dung động. Giữ public API, key/schema cũ; field mới phải
được normalize/backup/rollback cùng transaction, không xóa quyền lịch sử.

## Baseline và quyền sở hữu

HEAD ban đầu: `27ef096`. Có 52 file tracked đã sửa và nhiều file untracked
của công việc trước, gồm registry/generator hai skin mới. Không stage những
thay đổi đó. Mỗi commit task này chỉ chứa file mới hoặc hunk do task tạo.
Không APK, push, deploy hoặc sửa ignore/quyền Windows.

Đã đọc prompt, kế hoạch, kiến trúc, contract/copy, catalog/manifest/receipt,
review ba mẫu được chọn; chạy lại `art-kit-v1/verify.cjs`: PASS 30 món,
30 gán quà, 16 slot draft, 81/81 cặp avatar–frame. Đây là kiểm asset offline,
không phải bằng chứng runtime hoặc FPS.

## Tiến độ

| Phase | Trạng thái |
|---|---|
| D0 | PASS — quyết định duyệt trong chat |
| D1 | PASS — inventory/contracts, chưa duyệt mỹ thuật D2 |
| D2 | PASS — chủ dự án duyệt cả ba bản ghép ngày 23/10/2026 |
| S1 | PASS — registry/loader, 8 unit + 3 browser |
| S2 | PASS — chrome dùng owner hiện hữu, browser S1/S2 16/16 |
| F1 | PASS — grants/normalize/backfill/atomic persistence |
| F2 | PASS — closed signal, queue, destinations, cancellation |
| F3 | PASS code/web/emulator; Firestore thật chờ duyệt triển khai riêng |
| Q1 | Chưa nghiệm thu sản phẩm |

Skill thực dùng: `clarify-ambiguous-requirements` chốt D0; `imagegen`
định tuyến tạo artwork. Bằng chứng mỗi phase bổ sung trong tài liệu này.

## D1 — inventory và hợp đồng

`design/storybook/contract.mjs` là source contract của presentation mới:
14 nhóm bề mặt, owner/file thật, slot, invariant giữ lại, 7 part dùng chung
theo vật liệu/lifecycle; trạng thái button/input/item/toggle/checkbox/slider/
progress/loading/empty/error. Họ icon lấy đủ key `ICON_PATHS` hiện hữu,
alias chỉ cùng nghĩa và có SVG fallback. Không dùng emoji/glyph trang trí.
Trạng thái pressed/disabled dùng cùng canvas/hitbox, focus riêng; slot
người chơi và metadata kỹ thuật không trộn với nhau.

Font chọn Nunito variable 400–900, license OFL-1.1 từ nguồn Google Fonts:
https://github.com/google/fonts/tree/main/ofl/nunito. Đóng gói tập Việt,
Latin và Latin mở rộng; chờ font ready trước ảnh reference. D0 duyệt quyền
chọn font miễn phí đủ dấu, golden và geometry thực vẫn chờ D2.

`node scripts/check-storybook-contract.mjs`: PASS — xác nhận owner tồn tại,
part/source đúng, alias có target, đủ họ icon và slot draft trong biên.
Các source PNG mới tạo bằng imagegen tích hợp được giữ trong `design/`,
không đặt source/QA vào public. Không thay hành vi game trong D1.

## D2 — ứng viên để duyệt hình ảnh

Source: `design/storybook/masters`, prompt chính xác ở `prompts.json`.
`scripts/prepare-storybook.mjs` cắt theo alpha, giữ provenance/hash/native
size/sourceBounds/frame/pivot/cap và sinh WebP, font CSS, geometry CSS,
manifest. Không sửa generated output bằng tay, không upscale. Bộ lõi có
panel gỗ/giấy 9-slice, ribbon và nút 3-slice, nhánh lá cố định; các vai trò
cùng vật liệu dùng lại theo contract D1. Góc và lá không bị kéo theo chiều
cao body. Chưa nhận đã rollout chrome của toàn ứng dụng.

Font Nunito variable được tải từ Google Fonts, giữ OFL và upstream CSS;
chỉ đóng gói Việt/Latin/Latin mở rộng. 5 WebP + 3 subset: **273.736 byte**;
decode ảnh lý thuyết **5.808.416 byte**, dưới ngân sách 1 MiB/24 MiB. Đây
không phải số đo GPU/heap hay FPS trên điện thoại.

`js/storybook/presentation.js` là lớp trình bày opt-in trên `openAppModal`
thật; CSS scope `storybook-surface` không đổi lựa chọn hoặc 4 skin cũ.
Ba component: thông báo thành tích chỉ Tiếp tục, Trang trí hồ sơ ba nhóm
có draft và callback Lưu, danh sách bốn độ khó. Chữ/số/tên/nhãn là DOM;
avatar/khung dùng cùng canvas 512, badge có neo riêng. Không thêm ledger,
grant, persistence hoặc network vào renderer. Callback Lưu trong bộ kiểm
tra là fixture, chưa phải lưu và đồng bộ BXH sản phẩm.

Bản ghép được mở trong trang bản đồ thật của game, dùng modal owner thật,
không dùng một trang HTML vẽ lại game. Dữ liệu hiển thị là fixture có nhãn
trong manifest kỹ thuật, không chèn ghi chú phát triển lên UI. Ba ảnh gốc
412×915, bảng đối chiếu và tọa độ neo thực nằm tại `design/storybook/review`;
`scripts/prepare-storybook-review.mjs` sinh chúng từ ảnh/geometry UI test.
Giữ `goldenApproved:false` cho đến khi chủ dự án duyệt chính bộ này.

Kiểm tra cuối:

- `node scripts/check-storybook-contract.mjs`: PASS.
- `node scripts/check-storybook-pack.mjs` (Sharp runtime đã cấu hình): PASS
  alpha/dimensions/no-upscale/source và output hash/font/cap/budget.
- `node .../playwright/test/cli.js test --config design/storybook/playwright.config.cjs`:
  **15/15 PASS** (20,5 giây). 12 case = 3 component × 412×915, 320×740,
  844×390, 1024×768; không tràn ngang, footer/close trong viewport và >=44px.
  Keyboard tab/arrow, draft, failure, cancel, success và double-click chỉ
  gọi save một lần; 20 chu kỳ/profile reduced-motion và normal: parent owner
  hết resource, không còn modal/node mounted. Không nhận đã đo heap leak.
- `npm run build`: PASS (build game hiện tại). Module opt-in được biên dịch
  thêm riêng qua `scripts/build-storybook-preview.mjs`; chưa nối menu thật.
- `npm run check`: **PASS cuối cùng, exit 0**, sau sửa tooltip boundary.
  Compiled compositor cuối cũng PASS, exit 0. Hai log `check-final.log` và
  `build-compositor-final.log` nằm trong `docs/design/achievements/runtime/qa`.

Chẩn đoán và review riêng sau implementation: lần test đầu không tắt HMR
theo cấu hình dự án nên module graph khởi động chưa sẵn sàng; dùng
`GAME_SHELL_TEST_PORT` như test chuẩn, không sửa gameplay/startup để vượt
test. Review ảnh phát hiện selector chrome cũ thắng cascade ở footer/close,
đã scope override đúng component. Tooltip của control được focus ban đầu
còn xuất hiện sau chuyển focus; adapter gọi `clearTooltip` của owner hiện
hữu tại ranh giới chuyển surface, không dùng sleep. Test đợi tooltip hidden
thật, giữ nguyên tooltip sản phẩm. Các lần fail có chẩn đoán, không tính pass.

Đây là **tự review riêng**, không nhận review độc lập. Đã xem ảnh tham chiếu
và kiểm lại source/diff/bằng chứng; chưa có kiểm chứng máy thật, grant/save/
restore/backfill/queue/motion effect/public cosmetics của F1–F3. Không đổi
API/schema/key/save/effect ID hoặc luật/xếp hạng trong D0–D2.

Mốc dừng bắt buộc: prompt yêu cầu “chốt golden rồi mới rollout”, và chủ dự
án đã duyệt quy trình xem bản ghép trước rollout. Chờ duyệt ba ảnh D2;
S1–S2/F1–F3/Q1 vẫn thuộc task đã giao, không đánh dấu hoàn tất. Yêu cầu
avatar/khung/huy hiệu công khai trên BXH đã nằm trong contract và phạm vi
F3; chưa triển khai hoặc deploy. Không có APK/push/deploy.

## S1 — skin thứ năm

Chủ dự án đã duyệt ba ảnh D2 và yêu cầu tiếp tục toàn kế hoạch. Approval
được ghi ở source contract; pack/review manifest được sinh từ đó.
Chủ dự án cũng cho phép commit baseline riêng: `3aaf0e7` giữ nguyên các
thay đổi có sẵn trước S1, không trộn chúng với implementation mới.

`generate-storybook-skin.mjs` đưa đúng WebP/font được duyệt vào public,
sinh `skin.generated.js`; registry hiện hữu nhận storybook và controller
giữ đủ năm lựa chọn. Core 5 ảnh, bundle rương 8 ảnh lazy; tái dùng artwork
rương hiện hành, không đổi luật/quà/ID rương. Giữ cache current/candidate,
generation/owner/abort và queue save hiện hữu; không tạo skin manager mới.

PASS `node --test tests/unit/ui-skin.test.js design/storybook/skin.test.mjs`
8/8; browser S1 3/3: năm lựa chọn, save/reload, thiếu ảnh thì fallback giữ
preference để retry, default giải phóng cache, 20 lựa chọn nhanh không
commit stale owner. Asset/contract validator PASS. Chưa đổi geometry game,
save format hoặc điểm/xếp hạng. S1 pass và tự chuyển S2.

## S2 — phủ presentation toàn ứng dụng

`ui-skin-storybook.css` và decorator gắn vào modal owner hiện hữu, cập nhật
cả panel đang mở khi đổi skin và gỡ khi đổi về skin cũ. Không observer,
timer hay skin state thứ hai. Home/dock/header/HUD/board/tray, shop/card/tab,
settings/input, toast/tooltip/tutorial, pause/result và popup dùng material
cùng art đã duyệt; icon chức năng lấy art hiện hữu cùng nghĩa và SVG fallback.
Giữ node SVG ngoài để không làm mất ref của HUD; chỉ đổi children ở sự kiện
đổi skin, không mỗi frame. Một panel chỉ có một decoration subtree.

Đã thêm lựa chọn Cổ tích thực trong Cài đặt (không chỉ gọi API test).
Sửa header pause để Cài đặt và Đóng có hitbox riêng; nguồn font CSS runtime
dùng URL public đúng, không tham chiếu `/public/` hoặc source docs.

Browser cuối S1/S2 **16/16 PASS**, gồm ba game × bốn viewport, đổi đủ năm
skin khi pause, cùng board DOM/kích thước trước/sau, modal/close trong
viewport, chọn Cổ tích bằng nút thật, shop/collection/settings/profile và
fallback icon khi asset fail. Xem ảnh reference Memory và landscape Triple;
CSS ownership + cú pháp PASS. Không đổi luật, persistence, card faces,
path hoặc timeline gameplay. Tự chuyển F1, chưa nghiệm thu feature grant.

## F1 — grant và dữ liệu

Catalog sinh từ đúng reward-distribution: 30 ID/game×màn, 90 WebP lazy
128/256/512; không preload toàn kho. Đăng ký effect ID trước normalize,
lọc achievement-only khỏi shop, giữ 21 effect cũ/giá/ID và fallback mặc định.
Hai preset path và hai preset exit mới dùng catalog V2; motion cụ thể được
hoàn thiện/kiểm F3, không coi cover là runtime effect đã nghiệm thu.

Phương án chọn: projection thuần ở durability boundary chung, không lặp
grant trong ba controller và không mutate kho RAM trước save. Cùng envelope
và transaction chứa kết quả, ví, ledger, quyền sở hữu và pending announcement.
Callback subscriber cập nhật appearance RAM sau commit. Lỗi không commit
phần nào; stale appearance không xóa receipt hoặc đảo announced về false.
Điều kiện tái dùng chứng nhận bốn độ khó và validation record hiện hữu,
không suy từ sao/S. Không auto-equip, không quà sau màn10, không modulo.

Thêm field versioned `appearance.achievements` và `profileCosmetics`, giữ
formatVersion2/key cũ; save cũ thiếu field được normalize. Ledger hỏng hoặc
version lạ bị từ chối, không ghi đè nguồn. Quyền effect chỉ hợp lệ ở slot
đúng trò và có receipt. Receipt là nguồn sở hữu duy nhất của đồ hồ sơ.
Backfill có marker, đọc hữu hạn ba chapter1 dù frontier đã qua chương đó;
grant cũ im lặng. Import backfill trong chính transaction restore, không
buộc chơi lại, không cấp lại/xóa 300Xu hoặc các receipt rương.

PASS: F1 unit/contract 7/7 (có IndexedDB giả lập, lỗi quota, archive,
restore cũ và future ledger), UI Chrome1/1 (durable/RAM/reload/replay/backup),
check-persistence, chapter-store, cloud-snapshot, effect-v2 và appearance.
Không đổi ranking formula, profile UID ownership hoặc luật chơi. Tự chuyển F2.

## F2 — summary → thưởng → đích đến

Modal owner bổ sung `whenClosed` phân biệt đóng xong và bị owner hủy;
promise luôn settle sau tháo DOM. API cũ của caller vẫn dùng được. Summary
đã bỏ timeout200ms, tạo continuation scope theo round/page/generation,
chờ closed signal rồi presentation receipt, sau Tiếp tục mới gọi đúng đích
đã chọn. Không để round tiếp theo chạy sau lưng thẻ thưởng.

Thẻ thưởng chỉ Tiếp tục; đọc quà đã commit, không grant hoặc tự equip.
Ack + first-hint marker persist trước đóng; lỗi giữ thẻ và thông báo tự
nhiên. Callback muộn/UID đổi/owner dispose không điều hướng hoặc ghi nhầm
profile; persistence có optional current guard, writer kiểm trước commit.
Reload khôi phục pending mới, backfill cũ đã silent. Không sleep/timer mới
để đoán việc đóng, không điều kiện xem hết hoạt ảnh.

F2 browser **8/8 PASS, 1,9 phút**: thắng bằng thao tác thật trên cả ba game,
mỗi game thử Bản đồ/reduced-motion và Chơi tiếp/normal; summary không chồng
reward, receipt bền vững trước UI, ván sau chỉ bắt đầu sau Tiếp tục. Kiểm
reload thông báo một lần, hint nhóm không lặp, 20 lần hủy owner giữa ack:
promise false, modal/node và parent resource về0, receipt còn pending,
persistence không bị đánh dấu lỗi do cancellation. Unit F1 và các contract
persistence/chapter chạy lại PASS. Tự chuyển F3.

## F3 — Hồ sơ, Thành tích, hiệu ứng và trang trí công khai

Hồ sơ dùng cùng portrait ba lớp với BXH. Ba tab chỉ cho chọn đồ có receipt;
draft không sửa dữ liệu, hủy/đổi owner không ghi, lưu thất bại giữ draft,
lưu không đổi không tạo write. Account/profile identity, replacement barrier
và modal owner chặn callback cũ. Ảnh lỗi trở về portrait an toàn. Mỗi món
ghi nguồn trò/màn; mọi skin dùng modal, focus và footer hiện hữu.

Thành tích thay tab Tranh nhưng giữ ID tab, export và ba tranh lịch sử.
Hiển thị 10 màn/trò, bốn chứng nhận/màn; nhóm 300 Xu vẫn nhận một lần, kể
cả nhóm sau màn10. Không sinh quà mới sau catalog. Sáu cover tĩnh dẫn tới
đúng slot/trò; equip chỉ cập nhật RAM sau commit, không bán đồ Thành tích.

Chọn public document riêng thay vì ghép vào ranking entry: ranking chỉ
nhận kết quả tốt hơn nên không phù hợp thay cosmetic độc lập. Projection
chỉ version/3 ID catalog/timestamp; không công khai backup, email hay kho.
Save Hồ sơ kích hoạt sync từ dữ liệu bền vững; fingerprint ack riêng,
retry hữu hạn/offline/online, guard UID+profileId; lựa chọn không đổi không
ghi lại. BXH đọc theo trang tối đa20 UID, cache100/TTL30s, fallback an toàn.
Mở lại/làm mới BXH lấy lựa chọn mới; không thêm realtime listener mỗi hàng.
Rules được sinh từ catalog, owner-only write, exact fields/type whitelist;
mọi ranking/private rule cũ giữ nguyên. Cập nhật copy quyền riêng tư từ
source dùng chung rồi sinh lại public page.

Sáu motion chạy trong engine/owner cũ: hai flip hữu hạn260/300ms, path dùng
tọa độ adapter thật, petal/crystal trên canvas dùng chung260/240ms. Trần24
hạt/round, canvas một surface/RAF; vượt trần dùng fade hiện hữu, không chặn
input. Reduced-motion tĩnh; restart/cleanup lặp idempotent. Không timer hay
engine gameplay thứ hai, không glyph/font làm particle.

PASS F3: equipment10 bài (đủ sáu slot, save/cancel/failure/20 lần hủy,
locked/image failure, 300 Xu sau màn10), motion9 bài (hai flip và cả ba
game ở normal/reduced, 20 lần interrupt), public UI1 bài với hai account
Auth/Firestore emulator: save→BXH bên kia, offline→online, rank không đổi.
Rules public + toàn bộ progression/private/leaderboard/stats emulator PASS.
Không nhận đã triển khai public trên server thật trước bước duyệt rules.
