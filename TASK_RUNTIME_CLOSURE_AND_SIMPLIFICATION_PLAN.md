# TASK — Runtime Closure và Giảm Kiểm Tra Dư Thừa

## 1. Trạng thái và nguồn phạm vi

- Trạng thái: **active**, là kế hoạch duy nhất còn mở sau review ngày 2026-09-28.
- Nguồn bằng chứng: review diff hiện tại, `npm run check`, production build và ma trận Playwright 312 test trên desktop, mobile, mobile hẹp và landscape.
- Baseline hiện tại: `npm run check` pass; `npm run build` pass; Playwright **284 pass / 28 fail**.
- Không mở lại Hidden Piles, Tray Expansion, Milestone 10/30 hoặc Effect V2 runtime nếu test chuyên trách tiếp tục pass. Chỉ sửa regression trực tiếp.
- Visual polish của line effect được giữ thành gate cuối, độc lập với gameplay correctness; có thể thực hiện sau khi các gate runtime pass.

## 2. Kết luận review hiện tại

### Đã đạt

1. Hidden Piles dùng topology V6 cho round mới, có vùng loại trừ quanh xấp góc; V5 và layout cũ vẫn phục vụ Continue.
2. Witness tương tác thật hoàn tất trên mọi mode/Challenge stage ở cả bốn profile Playwright.
3. Renderer chỉ tạo đúng số slot khay hiệu lực: 7 hoặc 10; quyền mở rộng khay được persist và rollback khi save fail.
4. Pile view được dẫn xuất một lần cho mỗi render thay vì validation/Map/reverse theo từng tile.
5. Milestone có 10 marker, target 30, ledger và rollback pass suite chuyên trách.
6. Effect V2 runtime dùng pool hữu hạn, cleanup/reduced-motion/2–3 target pass toàn bộ suite connection, exit và performance.
7. Shared selector cho image theme đạt `O(A log K)`, lịch sử tối đa ba board và mapping Triple không trùng ảnh.

### Chưa đạt hoặc chưa có bằng chứng đủ

1. Bốn generated theme (`alphabet`, `numbers-2`, `numbers-3`, `computer-symbols`) chưa có stable selection ID trong history/snapshot; Memory/Link đang lọc bỏ `assetPath: null`, Triple chỉ tạo mapping cho image theme.
2. Commit history của Memory/Link chưa cùng transaction với save session; save fail có thể để state RAM của history lệch với dữ liệu bền vững.
3. `triple-connect.progression.spec.js` còn sáu contract cũ lặp trên bốn viewport:
   - layout V5 thay vì V6;
   - seed production cố định thay vì seed mới;
   - completion reward chưa tính milestone;
   - kiểm tra class/ghost effect DOM cũ dù suite effect chuyên trách đã thay owner;
   - Challenge layout cũ;
   - timeout 75 giây thay vì đọc config 93 giây.
4. Ba presentation test dùng direct DOM click và `setTimeout(320/340/520)`; chúng flake theo viewport và có thể làm đầy khay dù witness UI thật vẫn pass.
5. Chưa có số đo riêng cho generated-theme restore/history hoặc transaction failure của history.

## 3. Nguyên tắc giảm phần dư thừa

- Mỗi contract chỉ có một test owner. Progression kiểm tra state/economy/session; Effect suite kiểm tra DOM/SVG/canvas; Geometry kiểm tra viewport; Witness kiểm tra khả năng chơi thật.
- Test không phụ thuộc viewport chỉ chạy một profile. Chỉ layout, hit target, overflow và presentation geometry mới chạy matrix viewport.
- Không dùng fixed sleep để suy animation đã xong. Chờ trạng thái hữu hạn có owner: flight detached, handle finished, state revision hoặc node active/cleanup tương ứng.
- Giá trị đã có trong config phải được import/derive trong test, không chép lại layout ID, thời gian, số Xu hoặc capacity.
- Không xóa legacy layout/schema chỉ vì không còn active; đó là compatibility corpus, không phải file dư thừa.
- Không hợp nhất module chỉ vì tên gần nhau. Chỉ gom khi cùng ngữ nghĩa, ownership và lifecycle.

## 4. Hai phương án và lựa chọn

### Phương án A — vá từng assertion và tiếp tục chạy mọi test trên bốn profile

- Ưu: diff nhỏ.
- Nhược: tiếp tục trùng ownership, runtime test dài, dễ tái xuất hiện stale expectation và timing flake.
- Kết luận: không chọn.

### Phương án B — sửa contract gốc rồi phân tầng lại test (chọn)

- Generated selection có model ID chung; history/session commit theo một transaction.
- Mỗi suite chỉ kiểm tra owner của mình; responsive matrix chỉ dành cho hành vi thực sự phụ thuộc viewport.
- Dùng observable lifecycle thay fixed sleep.
- Chi phí đầu tư cao hơn một lần nhưng giảm số test lặp và giảm false failure lâu dài.

## 5. Gate 0 — Đóng regression và sửa test ownership

1. Phân loại lại 28 fail bằng test mục tiêu một profile trước khi sửa.
2. Cập nhật progression từ nguồn thật:
   - chấp nhận seed production mới và xác nhận Continue giữ nguyên seed;
   - dùng V6 cho round mới, giữ riêng test restore V4/V5;
   - tính reward cuối màn và milestone thành hai ledger rõ ràng;
   - đọc time/layout/stage từ config;
   - bỏ kiểm tra class/ghost effect chi tiết khỏi progression, thay bằng event/adapter ID semantic.
3. Giữ DOM/family/pool/cleanup trong `effect-v2.connection`, `effect-v2.exit` và `effect-v2.performance`.
4. Viết lại presentation test:
   - thao tác qua locator thật hoặc helper witness có assert node hiện diện;
   - chờ tray flight/exit handle theo trạng thái, không ngủ số mili-giây cố định;
   - xác nhận state commit trước animation và cleanup sau unmount.
5. Chạy lại riêng 28 case, sau đó suite Triple một profile; chỉ mở matrix cho geometry/presentation/witness.

**Gate pass:** không còn fail do contract cũ hoặc timing flake; test fail còn lại phải tái hiện được thành lỗi runtime.

## 6. Gate 1 — Hoàn tất shared selection cho generated theme

1. Chuẩn hóa selection ID:
   - image: relative asset path hiện tại;
   - generated: ID có namespace ổn định, ví dụ `generated:<theme-id>:<encoded-value>`;
   - không lưu data URL/SVG vào save.
2. Giữ tương thích field `assetPaths`/`assetPathsByType` hiện có; coi giá trị bên trong là selection ID và resolve tại boundary.
3. Selector nhận pool chung cho cả image/generated, vẫn weighted sampling without replacement và inject RNG.
4. Memory/Link snapshot đúng ID, Continue resolve đúng tập, Restart/Replay/Next chọn tập mới.
5. Triple lưu type → selection ID cho generated theme; legacy snapshot thiếu mapping dùng fallback cũ.
6. History normalizer biết pool hợp lệ của generated theme và vẫn giới hạn ba board.
7. Eligibility dựa trên số ID duy nhất thật của từng theme/mode; không modulo hoặc duplicate visual.

**Gate pass:** bốn generated theme qua Memory/Link/Triple, reload/Continue/history/seed deterministic fixture và save cũ.

## 7. Gate 2 — Transaction history/session

1. Tạo một boundary chọn → validate board → stage history + session → persist.
2. Nếu save fail, rollback cả history, session và state liên quan; không để RAM báo đã dùng ảnh nhưng reload không có lịch sử đó.
3. Continue, render, shuffle và resize không commit history.
4. Một Start/Restart/Replay/Next hợp lệ commit đúng một board vào history.
5. Không tăng write theo tick/frame; giữ checkpoint hiện tại.

**Gate pass:** fault-injection cho Memory, Link, Triple chứng minh commit một lần và rollback nguyên tử.

## 8. Gate 3 — Thu gọn ma trận kiểm thử

1. Gắn owner cho từng suite:
   - pure/static: selector, migration, rule, solver, config;
   - one-profile UI: progression, persistence, economy, tools;
   - viewport matrix: geometry, presentation geometry, hit testing, witness;
   - effect matrix: representative 2/3-target, reduced-motion và lifecycle; catalog ID coverage bằng pure contract.
2. Loại assertion trùng, không xóa coverage độc nhất.
3. Tách smoke gate nhanh dùng khi sửa cục bộ và release gate đầy đủ dùng khi chạm shared runtime.
4. Ghi thời gian chạy trước/sau và số test theo profile; mục tiêu giảm ít nhất 30% lượt browser lặp mà không giảm contract coverage.
5. Không giảm retries bằng cách thêm retry; flake phải được sửa ở synchronization/fixture.

**Gate pass:** ma trận mới có mapping coverage rõ, không còn test viewport-invariant bị nhân bốn vô ích và không có retry che lỗi.

## 9. Gate 4 — Visual polish Effect V2 (được phép làm sau)

1. Đây là thay đổi hiển thị, không đổi luật, score, save ID hoặc kết quả gameplay.
2. Chốt visual signature cho 21 path effect sau khi runtime gates pass.
3. Mỗi family có anticipation → impact → resolve, giới hạn node/particle, cleanup/cancel/reduced-motion và fallback tĩnh.
4. Review ảnh trên Link 2-target và Triple 3-target, desktop/mobile; đo lại frame/repaint trước khi duyệt.
5. Không đánh dấu visual 21/21 hoàn thành chỉ vì runtime test pass.

## 10. Gate 5 — Final review

1. `npm run check`.
2. `npm run build`.
3. Chạy smoke UI rồi release matrix theo ownership mới.
4. Chạy 20 vòng restart/mode/orientation và 100 chu kỳ representative effect.
5. Review diff: không debug, fixed sleep, forced click, duplicate test, listener/timer/RAF leak hoặc thay đổi ngoài phạm vi.
6. Cập nhật `CONTEXT.md` và tài liệu bền vững; xóa kế hoạch này khi toàn bộ gate đã hoàn tất.

## 11. Acceptance criteria cuối

- [ ] 28 regression hiện tại được đóng bằng contract đúng, không chỉ đổi expectation mù quáng.
- [ ] Generated theme có shared history/snapshot/Continue đúng trên ba game.
- [ ] History và session commit/rollback nguyên tử.
- [ ] Hidden Piles, tray 7/10, milestone 10/30 và Effect runtime tiếp tục pass.
- [ ] Test ownership không trùng và browser matrix giảm ít nhất 30% lượt lặp không cần thiết.
- [ ] Không đổi public effect ID, save key hoặc phá restore layout/schema cũ.
- [ ] Check, build và release regression pass; phần visual chưa làm được ghi rõ là deferred.

