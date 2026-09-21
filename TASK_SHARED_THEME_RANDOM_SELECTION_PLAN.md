# TASK — Shared Random Theme Selection

## Status

- Trạng thái: sẵn sàng triển khai sau Layout V5.
- Game áp dụng: Memory Match, Link Connect, Triple Connect; mọi mode.
- Layout V5 đã hoàn thành, ngoài phạm vi task này; chỉ sửa nếu test chứng minh có regression trực tiếp.
- Không thay đổi luật, điểm hoặc hiệu ứng hiện có của asset `special`.

## Goal

Tạo một bộ chọn ảnh ngẫu nhiên dùng chung cho ba game, lấy động toàn bộ asset thực tế của từng theme và giảm xác suất lặp lại ảnh trong ba board gần nhất mà không cấm lặp tuyệt đối.

## Confirmed product decisions

1. Không hardcode 160 ảnh; số lượng lấy từ manifest của từng theme.
2. Manifest quét đệ quy mọi thư mục con, bao gồm `special/`.
3. Ảnh từng xuất hiện vẫn có thể xuất hiện ngay board kế tiếp.
4. Không áp giới hạn phần trăm overlap cứng; chỉ giảm xác suất bằng trọng số.
5. Lịch sử dùng chung giữa Memory, Link và Triple theo `themeId`, lưu qua lần mở lại game.
6. Asset trong `special/` được chọn bình thường và tiếp tục giữ nguyên toàn bộ gameplay hiện tại.
7. Không thay đổi Layout V5 trong task này.

## Problem

- Memory và Link tự chọn ảnh tại nơi tạo board, chưa có lịch sử dùng chung.
- Triple dùng type `triple-N` ánh xạ vào các asset đầu danh sách nên dễ lặp cùng nhóm ảnh.
- Triple dùng modulo khi số type vượt số asset, có thể khiến hai type khác nhau hiển thị cùng hình.
- Eligibility của theme đang dùng ngưỡng chung, chưa xét số ảnh khác nhau cần cho từng game/mode.
- Continue phải giữ nguyên ảnh của round, không được chọn lại khi render hoặc restore.

## Files to inspect

- `scripts/generate-theme-manifest.mjs`
- `js/generated/themeAssetManifest.js` — generated output, không sửa tay
- `js/themeCatalog.js`
- `js/gameState.js`
- `js/grid.js`
- `js/linkConnect/linkBoard.js`
- `js/linkConnect/linkController.js`
- `js/tripleConnect/tripleBoard.js`
- `js/tripleConnect/tripleRenderer.js`
- `js/tripleConnect/tripleState.js`
- Các contract/unit/Playwright test liên quan theme, board và Continue

## Selection contract

Với `T` là tổng thẻ và `M` là số thẻ cần ghép:

```text
K = T / M
Memory, Link: M = 2
Triple: M = 3
```

Selector nhận danh sách asset thực tế của theme và chọn đúng `K` asset khác nhau bằng weighted sampling without replacement.

Lịch sử tối đa ba board gần nhất. Với mỗi asset:

```text
recentScore =
    3 nếu có trong board gần nhất
  + 2 nếu có trong board thứ hai
  + 1 nếu có trong board thứ ba

weight = 1 / (1 + recentScore)
key = -ln(max(random, epsilon)) / weight
```

Chọn `K` asset có key nhỏ nhất. Asset gần đây vẫn có trọng số lớn hơn 0 nên vẫn có thể xuất hiện lại.

## Persistence contract

Thêm state dùng chung, normalize tại boundary:

```text
themeSelectionHistory[themeId] = [
  [assetId...],
  [assetId...],
  [assetId...]
]
```

- Chỉ lưu theme đã chơi và tối đa ba board/theme.
- Chỉ lưu ID/đường dẫn tương đối, không lưu URL hoặc dữ liệu ảnh.
- Bỏ qua ID không còn trong manifest khi normalize.
- Save cũ thiếu field mặc định thành lịch sử rỗng.
- Chỉ commit lịch sử sau khi board đã tạo và xác nhận hợp lệ.
- Continue/restore/render lại không được đẩy lịch sử thêm lần nữa.
- Asset mới tự tham gia pool với trọng số 1.

## Required changes

### Gate 0 — Inventory và contract test

1. Ghi lại call site hiện chọn theme card của ba game.
2. Khóa bằng test các hành vi `special` hiện tại của Memory và Link.
3. Khóa compatibility của Triple save cũ và Layout V5.
4. Xác nhận generated manifest đã quét đệ quy và đánh dấu đúng thư mục `special`.

### Gate 1 — Shared selector thuần

1. Tạo một module owner chung cho việc chọn asset; không chứa luật gameplay của game cụ thể.
2. Nhận `assets`, `count`, `history`, `random`; trả về danh sách asset duy nhất và không tự ghi state.
3. Thực hiện công thức trọng số đã chốt.
4. RNG phải inject được để test ổn định.
5. Clamp RNG trước logarithm; không có vòng retry vô hạn.
6. Throw lỗi có nghĩa nếu `assets.length < K`.

### Gate 2 — Shared history và migration

1. Thêm state lịch sử dùng chung theo `themeId`.
2. Normalize dữ liệu thiếu, sai kiểu, trùng ID, theme/asset đã bị xóa.
3. Giới hạn cứng ba board để tránh save tăng vô hạn.
4. Cung cấp transaction nhỏ: chọn trước, commit history sau khi board hợp lệ.
5. Không tăng persistence write theo render, timer hoặc thao tác lật/chọn thẻ.

### Gate 3 — Memory integration

1. Thay điểm chọn ảnh hiện tại bằng selector chung.
2. Mỗi asset đã chọn được nhân đúng hai bản sao.
3. Giữ nguyên Lucky Card và `special` bonus hiện tại.
4. Chỉ commit history sau khi board và round đã mount hợp lệ.

### Gate 4 — Link integration

1. Dùng cùng selector và lịch sử theme.
2. Mỗi asset xuất hiện đúng hai lần.
3. Giữ nguyên playable-board validation, freeze, premium/special và Lucky Card.
4. Shuffle trong round chỉ đổi vị trí, không chọn tập asset mới và không ghi history.

### Gate 5 — Triple integration và compatibility

1. Chọn `K = tileCount / 3` asset thật trước khi gán type cho board mới.
2. Lưu ánh xạ type → asset ID trong snapshot/session mới.
3. Renderer đọc ánh xạ snapshot, không suy asset từ số đuôi `triple-N` cho round mới.
4. Mỗi asset xuất hiện đúng ba lần.
5. Save cũ không có ánh xạ tiếp tục dùng legacy mapping; không migration phá hủy.
6. Xóa modulo khỏi đường round mới; legacy fallback chỉ phục vụ save cũ.
7. Generator/solver và Layout V5 giữ nguyên ownership và invariant.

### Gate 6 — Eligibility theo game/mode

1. Kiểm tra `availableAssetCount >= K` tại boundary trước khi tạo round.
2. Mode nhỏ vẫn có thể dùng theme ít ảnh nếu đủ `K`.
3. Triple Super Hard/Endless V5 96 thẻ cần ít nhất 32 asset.
4. Khi thiếu asset: không modulo, không ghi history, báo rõ theme chưa đủ cho mode và cho phép chọn theme khác.
5. Không âm thầm đổi theme sau khi round đã được xác nhận.

### Gate 7 — Documentation và final review

1. Cập nhật tài liệu theme về lựa chọn động, lịch sử ba board và eligibility theo mode.
2. Không sửa generated manifest bằng tay.
3. Review diff để loại debug, duplicate selector và thay đổi ngoài scope.
4. Đối chiếu toàn bộ acceptance criteria trước khi kết thúc.

## Edge cases

- Theme có ít hơn, bằng hoặc nhiều hơn 160 ảnh.
- Asset nằm trong nhiều cấp thư mục con.
- Hai file cùng tên nhưng khác đường dẫn tương đối.
- Asset thêm/xóa/đổi tên sau cập nhật.
- Lịch sử chứa theme hoặc asset không còn tồn tại.
- Board trước cần 32 ảnh, board sau cần 6 ảnh.
- Chuyển Memory → Link → Triple với cùng theme.
- Continue session cũ/mới; restart tạo round mới.
- Pool vừa đủ đúng `K` nên buộc chọn toàn bộ.
- RNG trả 0 hoặc giá trị biên.
- Special xuất hiện trong lịch sử: áp cùng trọng số nhưng giữ nguyên gameplay.

## Performance constraints

- Selector chỉ chạy khi tạo round mới.
- Mục tiêu `O(A log K)` với `A` là số asset thực tế của theme.
- Không chạy chọn ảnh trong renderer, timer hoặc RAF.
- Không preload toàn bộ pool; chỉ tải asset của board.
- Không lưu bitmap, base64 hoặc URL đầy đủ.
- Không có cache/history không giới hạn.
- Không tạo listener, observer, timer hoặc animation mới.

## Tests required

- Manifest recursive và cờ `special`.
- Selector trả đúng `K` ID duy nhất.
- Asset gần đây có trọng số thấp hơn nhưng khác 0.
- Fixed RNG/seed cho kết quả tái tạo được.
- Tập seed cố định chứng minh tỷ lệ chọn asset gần đây thấp hơn asset mới; không dùng test ngẫu nhiên dễ flaky.
- Memory/Link mỗi asset đúng 2 bản; Triple đúng 3 bản.
- Memory special vẫn cộng điểm; Link special/premium không đổi.
- Triple 96 thẻ dùng đúng 32 asset khác nhau.
- Triple save cũ và mới Continue đúng hình.
- Continue/Shuffle không cập nhật history; round mới cập nhật đúng một lần.
- Save cũ thiếu history load bình thường; history hỏng được normalize.
- Theme thiếu asset bị chặn theo đúng mode.
- Regression mục tiêu cho cả ba game.
- `npm run check` và production build.

## Acceptance criteria

- [ ] Không có số 160 hardcode trong runtime.
- [ ] Asset được lấy động từ manifest và mọi thư mục con.
- [ ] Kết quả ngẫu nhiên, không có overlap cap cứng.
- [ ] Ảnh gần đây vẫn chọn được nhưng có xác suất thấp hơn.
- [ ] Lịch sử ba board dùng chung giữa ba game và tồn tại sau reload.
- [ ] Mỗi board có đúng số asset duy nhất theo luật 2/3 thẻ.
- [ ] Hành vi `special` của Memory và Link không thay đổi.
- [ ] Triple không còn luôn dùng nhóm asset đầu.
- [ ] Round mới không dùng modulo; hai type khác nhau không hiện cùng hình.
- [ ] Continue giữ nguyên hình và không ghi history lần hai.
- [ ] Layout V5 và solver không bị thay đổi hành vi.
- [ ] Save/API cũ tương thích.
- [ ] Check, build và regression liên quan pass.

## Do not do

- Không hardcode 160 hoặc danh sách ID thủ công.
- Không cấm tuyệt đối asset của board trước.
- Không thêm quota hay tính năng mới cho `special`.
- Không đổi điểm, premium, Lucky Card hoặc milestone hiện có.
- Không sửa Layout V5 để phục vụ selector.
- Không tạo selector riêng cho từng game.
- Không dùng modulo hoặc duplicate visual để che việc thiếu asset.
- Không sửa generated manifest trực tiếp.
- Không đóng gói APK trong task này.

## Recommended execution order

Thực hiện Gate 0 → 2 trước, sau đó tích hợp tuần tự Memory → Link → Triple. Chạy test mục tiêu sau từng integration; chỉ chạy check/build và regression ba game ở gate cuối. Một lượt triển khai phải tiếp tục đến khi toàn bộ task pass hoặc gặp blocker thật theo `AGENTS.md`.
