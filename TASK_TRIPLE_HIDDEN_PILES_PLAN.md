# TASK — Triple Connect Corner Card Stacks

## Status

- Shared Random Theme Selection đã được triển khai; Hidden Piles phải tích hợp với owner/API hiện có, không viết lại selector hoặc tạo lịch sử theme thứ hai.
- Thực hiện trước cân bằng milestone cuối.
- Layout V5 được giữ làm compatibility corpus; không sửa tọa độ V5 tại chỗ.

## Goal

Thêm một số ít xấp thẻ thật sự tại các góc cố định của board. Mỗi xấp chứa nhiều thẻ có hình khác nhau cùng một anchor, giống một quyển sách/bộ bài có độ dày; chỉ thẻ trên cùng lộ hình và chọn được, lấy thẻ trên sẽ reveal thẻ kế tiếp và làm xấp mỏng dần. Mỗi round mới random lại toàn bộ phân bố/type/thứ tự xấp, còn Continue khôi phục đúng round cũ.

## Confirmed decisions

- Thứ tự trong mỗi xấp được random khi tạo round và cố định trong snapshot; không random tại thời điểm click.
- Start, Restart, Replay và Next Level tạo seed mới; Continue giữ seed/state cũ.
- Easy giữ 27 thẻ và không có xấp góc.
- Normal thêm đúng một xấp 9 thẻ tại một góc, tổng 54 thẻ/18 type.
- Hard thêm đúng hai xấp tại hai góc, một xấp 7 thẻ và một xấp 8 thẻ, tổng 78 thẻ/26 type.
- Super Hard/Endless thêm đúng bốn xấp tại bốn góc, mỗi xấp 6 thẻ, tổng 120 thẻ/40 type.
- Các con số 9, 7, 8 và 6 là tổng số thẻ thật trong xấp mới, không phải số thẻ ẩn bên dưới một thẻ V5 có sẵn.
- Không tăng thêm visual layer; stack depth là trục riêng, không tính vào layer count V5.
- Challenge tăng dần theo bảng rollout trong Gate 5.
- Board vẫn phải solver chứng minh giải được với khay 7.
- Mỗi type vẫn xuất hiện đúng ba lần trên toàn board. Từng xấp riêng không cần và không được giả định chứa trọn một bộ ba.

## Randomization dependency

Shared Random Theme Selection đã xử lý nguồn asset và production round seed. Hidden Piles phải dùng đúng round seed đã tạo, cùng asset selection snapshot và history transaction hiện có. Không được chọn lại asset riêng cho hidden cards hoặc commit history trong từng solver attempt.

## Files to inspect

- `js/tripleConnect/tripleController.js`
- `js/tripleConnect/tripleBoard.js`
- `js/tripleConnect/tripleConfig.js`
- `js/tripleConnect/tripleSolver.js`
- `js/tripleConnect/tripleRules.js`
- `js/tripleConnect/tripleState.js`
- `js/tripleConnect/tripleRenderer.js`
- `js/tripleConnect/tripleShuffle.js`
- Triple board/solver/state/Continue/geometry tests

## Required changes

### Gate 0 — Random round contract

1. Review contract đã triển khai: Start/Restart/Replay/Next tạo seed mới; Continue giữ seed và snapshot.
2. Dùng cùng seed cho type assignment, corner-stack anchor, thứ tự trong xấp và witness; không tạo random source không lưu được.
3. Fixed seed trong test/dev phải tái tạo đúng cả asset mapping và stack topology.
4. Một round chỉ gọi shared theme selector một lần với `K = finalTileCount / 3`.
5. Chỉ commit theme history sau khi pile-aware board được solver chấp nhận; retry/failure không được ghi lịch sử nhiều lần.

### Gate 1 — Pile-aware topology version

1. Không sửa V5; tạo topology/layout version mới hoặc board schema version mới có corner-stack metadata.
2. Mỗi xấp có `stackId`, một anchor góc dành riêng và danh sách tile theo thứ tự bottom → top hoặc top → bottom được định nghĩa duy nhất.
3. Phân biệt visual layer và stack depth; không dùng layer number để ngầm biểu diễn cả hai.
4. Giữ toàn bộ anchor V5 đang hiển thị. Các xấp là các thẻ bổ sung tại anchor góc riêng, không lấy thẻ V5 khỏi slot khác và không đặt xấp lên một thẻ V5 có sẵn.
5. Tổng tile vẫn chia hết cho 3 và mỗi type đúng ba bản sao.
6. Config có single owner cho `addedTileCount`, số xấp, độ sâu từng xấp, corner anchors, final tile count và unique type count của từng mode.
7. Corner anchors nằm bên trong safe padding, không che HUD/khay và không làm board tràn viewport.

### Gate 2 — Generator và solver

1. Solution-first generator tạo type assignment, thứ tự từng xấp và witness từ cùng round RNG.
2. Chỉ top tile của mỗi xấp thuộc tập selectable.
3. Khi top rời board, tile kế tiếp được reveal như một state transition xác định.
4. Solver mô phỏng reveal, tray 7, undo-relevant state và giới hạn budget.
5. Reject/regenerate candidate không giải được; fallback corpus phải stack-aware và được solver chứng minh.
6. Asset mapping lấy từ Shared Random Theme Selection theo tổng mới 54/78/120; không modulo và không dùng cùng hình cho hai type khác nhau.
7. Cờ `special` đi theo asset metadata và giữ nguyên gameplay hiện có; Hidden Piles không thêm luật special mới.

### Gate 3 — Rules/state/save

1. State lưu stack membership/order/revealed top mà không giữ hai nguồn sự thật.
2. Select tile không phải top trả lỗi có nghĩa và không sửa state.
3. Snapshot version mới; migration/restore v1/V5 không có pile vẫn hoạt động.
4. Undo khôi phục đúng top cũ; Shuffle có contract rõ: chỉ đổi các tile hợp lệ và không tự làm lộ identity ẩn.
5. Hint không chỉ vào tile bị che; Continue không đổi thứ tự trong xấp.

### Gate 4 — Renderer/UX

1. Chỉ render mặt ảnh của top tile; thẻ dưới không lộ identity qua DOM, alt, tooltip hoặc preload ordering dễ quan sát.
2. Xấp phải nhìn như quyển sách/bộ bài dày: các cạnh thẻ dưới lệch rất nhẹ cùng hướng, không hiển thị hình và không tạo cảm giác hai thẻ riêng biệt.
3. Reveal dùng transform/opacity ngắn, interruptible; gameplay không phụ thuộc animation end.
4. Reduced motion reveal tức thời; cleanup khi restart/unmount giữa animation.
5. Không tạo một DOM node trang trí cho từng thẻ ẩn. Có thể giới hạn 5–7 backing edge/pseudo-layer, nhưng tổng độ dày phải tỷ lệ với số thẻ còn lại và giảm thấy được sau mỗi lần rút.
6. Trước khi bắt đầu mode, nếu theme không đủ asset thì hiển thị thông báo sản phẩm ngắn: **“Chủ đề này chưa sẵn sàng cho chế độ đã chọn. Hãy chọn chủ đề khác hoặc chế độ khác.”**
7. Không hiển thị cho người chơi số asset tối thiểu, đường dẫn file, manifest, type count hoặc hướng xử lý kỹ thuật.
8. Không dùng huy hiệu số `2`, `3` trên mặt thẻ để biểu diễn xấp hoặc số hình giống nhau. Nếu cần accessibility, số thẻ còn lại chỉ nằm trong aria-label của chính xấp và không tiết lộ identity.

### Gate 5 — Mode rollout

1. Easy: 27 thẻ, không có xấp góc.
2. Normal: 45 thẻ V5 + một xấp 9 thẻ tại góc trên trái; tổng 54.
3. Hard: 63 thẻ V5 + hai xấp tại hai góc trên, có kích thước 7 và 8; tổng 78. Generator có thể seed-shuffle việc góc nào nhận xấp 7/8 nhưng tập kích thước luôn là `{7, 8}`.
4. Super Hard/Endless: 96 thẻ V5 + bốn xấp tại bốn góc, mỗi xấp 6 thẻ; tổng 120.
5. Challenge rollout:

| Stage | Base | Số xấp góc | Kích thước xấp | Tổng/type |
|---:|---:|---:|---|---:|
| 1 | 18 | 0 | — | 18 / 6 |
| 2 | 24 | 1 | 3 | 27 / 9 |
| 3 | 36 | 1 | 6 | 42 / 14 |
| 4 | 42 | 2 | 4 + 5 | 51 / 17 |
| 5 | 54 | 2 | 6 + 6 | 66 / 22 |
| 6 | 60 | 3 | 5 + 5 + 5 | 75 / 25 |
| 7 | 75 | 4 | 4 + 4 + 5 + 5 | 93 / 31 |

Corner order: một xấp dùng góc trên trái; hai xấp dùng hai góc trên; ba xấp thêm góc dưới trái; bốn xấp dùng đủ bốn góc. Mọi anchor phải nằm trong board safe area.

6. Density/count nằm trong config có owner và được playtest, không rải magic number.

### Gate 5A — Theme readiness integration

1. Eligibility nội bộ dùng số asset duy nhất thực tế từ manifest/shared selector:
   - Easy: tối thiểu 9.
   - Normal: tối thiểu 18.
   - Hard: tối thiểu 26.
   - Super Hard/Endless: tối thiểu 40.
   - Challenge: theo stage, tối đa 31 ở stage 7.
2. Check readiness trước khi tạo/ghi session; theme thiếu asset không được gọi modulo, duplicate visual type hoặc tạo round nửa chừng.
3. UI chỉ dùng trạng thái “chưa sẵn sàng”; chi tiết số lượng chỉ dành cho log/test nội bộ nếu cần.
4. Theme đủ cho mode thấp vẫn được chơi mode thấp; không khóa toàn bộ theme chỉ vì chưa đủ cho Super Hard.
5. Continue session hợp lệ đã lưu không bị chặn do manifest mới; nếu asset thật sự bị xóa, dùng asset-load fallback hiện có nhưng không thay identity/state.

### Gate 6 — Final review

1. Solver corpus nhiều seed cho mọi mode.
2. Continue/Undo/Shuffle/Hint/restart và lifecycle nhiều chu kỳ.
3. Geometry/performance tại viewport mục tiêu; check/build/regression.

## Edge cases

- Xấp còn một tile; xấp rỗng; match ba top từ ba xấp khác nhau.
- Undo sau reveal; restart/replay giữa reveal; Continue khi xấp đã rút một phần.
- Shuffle khi có xấp; hint khi mọi candidate bị che.
- Asset lỗi load không được làm sai identity/state.
- Theme có 39 asset: Hard chơi được, Super Hard/Endless báo chưa sẵn sàng bằng copy sản phẩm, không crash và không lặp visual type.
- Shared selector history chỉ commit một lần sau candidate cuối được chấp nhận.
- Seed collision hiếm: nonce vẫn phải tạo round ID khác.

## Performance constraints

- Không random trong click handler ngoài state transition đã sinh sẵn.
- Không DOM/array/closure allocation mỗi animation frame.
- Cover/stack lookup dùng map/index chuẩn bị khi tạo state.
- Solver có budget, memo key bao gồm stack reveal state và đường thoát rõ ràng.

## Tests required

- Replay cùng mode/level tạo seed và board khác; fixed seed tái tạo giống; Continue giữ nguyên.
- Final counts đúng 27/54/78/120 và mỗi type xuất hiện đúng ba lần.
- Số xấp, corner anchor và kích thước xấp đúng config ở từng mode và Challenge stage.
- Non-top không chọn được; lấy top reveal đúng tile kế tiếp.
- Solver chứng minh mọi generated board với tray 7.
- Undo/Shuffle/Hint/save migration và lifecycle.
- Không lộ ảnh hidden trong accessibility/DOM trước reveal.
- Theme readiness đúng ngưỡng 9/18/26/40 và Challenge; UI không lộ thông tin kỹ thuật.
- Shared Random Theme history/asset mapping không bị ghi hai lần hoặc chọn riêng cho hidden cards.
- Viewport mục tiêu, check và build.

## Acceptance criteria

- [ ] Mỗi lượt chơi mới random lại toàn bộ assignment/pile; không còn học thuộc board cố định.
- [ ] Continue tuyệt đối không random lại.
- [ ] Hidden identity không lộ; chỉ top selectable.
- [ ] V5/save cũ vẫn khôi phục.
- [ ] Board pile-aware giải được với tray 7.
- [ ] Normal có một xấp 9; Hard có hai xấp 7/8; Super Hard/Endless có bốn xấp 6/6/6/6 tại các góc đã khóa.
- [ ] Không còn huy hiệu số hoặc nhiều cặp depth 2/3 rải rác; mỗi xấp nhìn và giảm độ dày như một bộ bài/quyển sách.
- [ ] Theme dưới 40 asset không vào Super Hard/Endless; người chơi chỉ thấy thông báo “chưa sẵn sàng”.
- [ ] Shared Random Theme Selection tiếp tục là owner duy nhất của asset selection/history.
- [ ] Không leak, loop hoặc regression hiệu suất.

## Do not do

- Không random card tại lúc click.
- Không sửa V5 tại chỗ hoặc dùng timeout che race.
- Không để renderer sở hữu stack truth.
- Không tạo nhiều pile depth 2/3 rải rác, không gắn badge số lên từng thẻ và không hiểu số trong xấp là số bản sao cùng hình.
- Không viết lại shared selector, không tạo lịch sử theme thứ hai và không chọn asset riêng cho hidden cards.
- Không hiện số lượng asset, manifest, ID hoặc hướng kỹ thuật trong thông báo cho người chơi.
- Không triển khai khay 10/milestone/effect trong task này.
