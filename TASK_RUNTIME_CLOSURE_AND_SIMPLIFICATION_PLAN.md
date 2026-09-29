# Kế hoạch active — Render Performance Closure

Ngày lập: 2026-09-28  
Trạng thái: **Hoàn tất runtime closure — 2026-09-29**  
Owner phạm vi: runtime/render của Memory Match, Link Connect và Triple Connect

## 1. Mục tiêu

Loại bỏ hiện tượng Triple Connect khóa giao diện trên CPU yếu, giảm chi phí render nền của cả ba game và đóng các regression hiệu suất đã đo được mà không đổi luật chơi, save schema, catalog ID, Effect V2 ID hoặc chất lượng hình ảnh mặc định trên thiết bị đạt ngân sách.

Kết quả chỉ được coi là hoàn tất khi:

- Triple không còn chạy generator/solver Super Hard đồng bộ trên main thread của luồng sản phẩm;
- thao tác chọn thẻ Triple không tạo long task lặp lại do validation, clone, render hoặc layout read thừa;
- timer của ba game không ghi DOM ở mọi frame khi không cần thiết;
- reduced-motion Triple dọn feedback trong ngân sách;
- hai forced reflow khi lật thẻ Memory được loại bỏ;
- lifecycle/restart/chuyển game không để lại worker, RAF, timer, animation hoặc node;
- có báo cáo đo trước/sau cùng scenario và cùng profile;
- `npm run check`, production build và regression UI liên quan đều pass.

## 2. Ngoài phạm vi

- Không tinh chỉnh mỹ thuật 21 line effect hoặc thay đổi timeline Effect V2 nếu engine vẫn đạt ngân sách hiện hành.
- Không đổi luật Triple, số thẻ, topology Hidden Piles, khay 7+3, milestone, scoring hoặc công thức sao.
- Không đổi format save, session snapshot, theme selection hoặc migration policy.
- Không gom CSS/renderer trên diện rộng chỉ vì các game có code gần giống nhau.
- Không tự hạ chất lượng hình ảnh mặc định. Quality fallback chỉ được bật nếu các gate xử lý nguyên nhân gốc vẫn không đạt ngân sách CPU yếu và phải có bằng chứng riêng.
- Không tối ưu PWA/APK/Android trong task này; web Chromium desktop/mobile là baseline. Android cần task xác nhận riêng sau khi web ổn định.

## 3. Baseline đã ghi nhận

Các số dưới đây dùng Chromium, viewport desktop 1024×900. Profile CPU chậm dùng CDP throttling 6×; đây là profile so sánh tương đối, không phải tuyên bố đại diện mọi thiết bị.

| Metric | Memory | Link | Triple |
|---|---:|---:|---:|
| Khởi tạo đồng bộ, CPU thường | 46,6 ms | 41,1 ms | 323,5 ms |
| Khởi tạo đồng bộ, CPU 6× | 996 ms | 607,5 ms | 4.759,9 ms |
| Click đồng bộ, CPU thường | 3,3 ms | 1,1 ms | 9,9 ms |
| Click đồng bộ, CPU 6× | chưa chốt lại | 105,2 ms | 282,8 ms |
| Frame interval p95 khi idle, CPU 6× | 20,8 ms | 14,1 ms | 62,5 ms |

Generator + solver Triple đo độc lập:

| Mode | p95 |
|---|---:|
| Easy | 16,7 ms |
| Normal | 65,6 ms |
| Hard | 84,8 ms |
| Super Hard | 200,1 ms |

Các bằng chứng bổ sung:

- snapshot Triple Super Hard khoảng 26,7 KB;
- localStorage write tối đa đã đo: 0,2 ms CPU thường, 2,4 ms CPU 6×; không phải nguyên nhân gốc;
- Effect V2 100 chu kỳ pass: connection p95 1,5 ms, exit setup p95 1,8–1,9 ms, canvas frame p95 0,1 ms, không còn node/canvas;
- lifecycle 100 lần chuyển Memory/Link pass;
- Triple reduced-motion cleanup fail lặp lại: 115,3 ms và 120,5 ms, ngân sách hiện tại 110 ms.

## 4. Invariant phải giữ

- Kết quả bàn theo seed và witness Triple vẫn deterministic.
- Solver validation vẫn tồn tại ở boundary tạo bàn; không bỏ validation chỉ để nhanh hơn.
- Một request tạo bàn chỉ được commit khi đúng round/generation hiện hành.
- Restart, đổi mode, về menu hoặc unmount phải hủy request và bỏ qua kết quả cũ.
- Gameplay state chỉ commit trước presentation theo contract hiện tại; animation không sở hữu luật game.
- Renderer không tự sửa state.
- Reduced-motion và quality fallback không thay đổi thời điểm state gameplay được commit.
- Save/session chỉ ghi ở event bền vững; không ghi theo frame.
- Không đổi public catalog ID, effect ID, theme mapping, key hoặc save envelope.
- Contract điều hướng/catalog bên ngoài phải giữ nguyên. Luồng khởi tạo nội bộ của Triple được phép chuyển sang readiness bất đồng bộ vì đây là điều kiện để bỏ main-thread freeze; mọi callsite trong repository phải được migrate atomically và development hook phải có contract rõ, không giữ một production fast path đồng bộ chỉ để test cũ tiếp tục chạy.

## 5. Phương án kỹ thuật đã cân nhắc

### 5.1 Generator/solver Triple

**Phương án A — Module Web Worker, được chọn**

- Generator và solver thuần chạy ngoài main thread.
- Request mang `requestId`, seed, mode, level và solver budget.
- Response chỉ chứa dữ liệu clone được: generated board, witness, layout ID và diagnostics.
- Controller dùng generation identity để chặn stale result; worker/request có cleanup rõ.
- UI có trạng thái đang chuẩn bị bàn, vẫn phản hồi được với Menu/Back/Restart.

Ưu điểm: xử lý đúng nguyên nhân khóa main thread, vẫn giữ solver validation và deterministic seed.  
Nhược điểm: cần lifecycle/cancellation và đường lỗi worker rõ ràng.

**Phương án B — Chia nhỏ bằng timeout/requestIdleCallback, loại**

- Không giải quyết được solver hiện tại vì một lần DFS vẫn có thể giữ main thread lâu.
- Thời gian chạy phụ thuộc browser scheduling, khó kiểm thử và dễ tạo race.

Không dùng fallback chạy solver đồng bộ âm thầm khi worker lỗi. Worker failure phải đưa UI về trạng thái phục hồi có Retry/Back; nếu sau này cần fallback offline thì dùng corpus đã prevalidate trong task riêng.

### 5.2 Timer progress dùng chung

**Phương án A — CSS/compositor progress + tick nghiệp vụ 1 Hz, được chọn nếu prototype đạt độ chính xác**

- Countdown nghiệp vụ vẫn do owner mỗi game cập nhật 1 Hz.
- Thanh progress dùng transform/CSS animation, rebase khi pause/freeze/add-time/resume.
- Text timer chỉ patch khi số giây hiển thị đổi.

**Phương án B — RAF dùng chung có dedupe, fallback**

- Một owner RAF chung chỉ chạy khi game visible và timed.
- Chỉ ghi style khi ratio thay đổi đủ ngưỡng; text vẫn 1 Hz.
- Dừng hoàn toàn khi hidden, paused, frozen hoặc endless không cần chuyển động.

Chọn A nếu pause/freeze/rebase và reduced-motion giữ đúng contract; nếu CSS animation tạo drift hoặc test khó ổn định thì dùng B. Không duy trì ba vòng RAF riêng.

### 5.3 Presentation Triple

Giữ FLIP vì nó truyền tải vị trí thẻ, nhưng thu hẹp snapshot layout chỉ còn source, target và các thẻ khay thật sự dịch chuyển. Không đọc toàn board và không xen kẽ read/write ngoài hai pha FLIP có chủ đích.

## 6. Kế hoạch gate

### Gate 0 — Chuẩn hóa benchmark và khóa baseline

Mục tiêu: biến phép đo tạm thời thành harness lặp lại được trước khi sửa.

Công việc:

1. Tạo performance spec/script có owner rõ, không monkey-patch production source.
2. Đo warm module và cold/warm image decode riêng để không trộn network/decode với render JS.
3. Thu các metric:
   - thời gian từ lệnh start đến loading shell phản hồi;
   - thời gian board ready;
   - longest main-thread task;
   - click handler synchronous duration p50/p95/max qua ít nhất 30 thao tác hợp lệ;
   - frame interval p50/p95/max khi idle và khi chọn liên tiếp;
   - layout read count trong presentation;
   - storage write count/duration;
   - DOM node, image, active animation và lifecycle resources trước/sau.
4. Profile bắt buộc:
   - desktop 1024×900 CPU thường;
   - desktop 1024×900 CPU throttling 6×;
   - mobile 390×844 CPU thường;
   - reduced-motion cho presentation/timer.
5. Đo từng mode Triple; Super Hard là performance worst case. Memory/Link dùng mode có số thẻ lớn nhất tương ứng.
6. Lưu JSON report dưới output test, không commit artifact máy cụ thể; ghi bảng baseline ổn định vào kế hoạch hoặc báo cáo gate.

Acceptance:

- ba lần chạy liên tiếp không chênh p95 quá 25%; nếu vượt phải tách nguyên nhân cold cache/scheduling;
- metric đo đúng tile selector và đúng board đã ready;
- baseline không phụ thuộc dev-only animation hoặc modal chưa đóng;
- harness tự cleanup và không làm dirty repository.

### Gate 1 — Tách Triple generation/solver khỏi main thread

Mục tiêu: UI không bị khóa khi mở Normal/Hard/Super Hard/Endless/Challenge.

Công việc:

1. Tách payload thuần của generator thành worker-compatible entry; không import DOM, gameState hoặc persistence.
2. Tạo owner request generation với:
   - request ID tăng đơn điệu;
   - success/error/cancel/stale-result;
   - timeout theo solver budget cộng biên an toàn;
   - cleanup idempotent và terminate worker khi không còn owner.
3. Giữ Easy có cùng async boundary để tránh hai lifecycle khác nhau; chỉ cho phép fast path nếu vẫn trả qua cùng request contract.
4. Inventory toàn bộ callsite/return-value usage trước khi đổi readiness contract; cập nhật caller và test trong cùng gate, không để hai kiểu start mơ hồ.
5. Mount loading shell/overlay nhẹ trước khi chờ worker; Back/Menu/Restart phải thao tác được.
6. Chỉ tạo Triple round state, theme mapping và session sau khi kết quả hiện hành trả về.
7. Worker lỗi không được fallback sang solver đồng bộ; hiển thị Retry/Back và không ghi session dở dang.
8. Thêm test:
   - deterministic seed/witness main thread và worker giống nhau;
   - rapid restart/mode switch/unmount khi worker đang chạy;
   - stale worker result không render/ghi session;
   - worker error/timeout phục hồi được;
   - 20 chu kỳ start-cancel không tăng worker/listener/timer.

Acceptance:

- không có generator/solver production call đồng bộ từ controller;
- CPU 6×: lệnh start không tạo main-thread task >100 ms;
- loading UI xuất hiện và nhận Back/Restart trong tối đa 100 ms ở CPU 6×;
- tổng thời gian board ready không được xấu hơn 20% ở CPU thường; profile CPU 6× được ghi lại ở gate này để tách responsiveness khỏi tổng compute time, còn mục tiêu giảm tổng thời gian được chốt sau Gate 2;
- deterministic board/witness và solver contract pass nguyên trạng.

### Gate 2 — Thu gọn hot path state/render Triple

Mục tiêu: một lần chọn thẻ không validation/derive/clone toàn state nhiều lần ngoài boundary cần thiết.

Công việc:

1. Lập call graph của `reduceTripleCommand` → reward commit → renderer → presentation → session.
2. Xác định đúng một validation boundary:
   - input restore/worker result phải full validate;
   - reducer output được xem là trusted sau invariant test;
   - renderer dùng board view trusted, không full validate lại.
3. Derive một `TripleBoardView` cho mỗi state revision và truyền vào renderer/presentation nếu cùng revision; không tạo nhiều Map/Set giống nhau.
4. Cache topology bất biến theo round: slot map, pile membership và cover adjacency.
5. Recompute phần động từ tile locations theo batch; chỉ incremental hóa nếu benchmark chứng minh full bounded scan vẫn vượt ngân sách.
6. Renderer lưu trực tiếp reference unlock button cùng tray slot; không query lại button trong mỗi render.
7. Loại allocation/closure không cần thiết trong đường click; không tạo abstraction chung với Link/Memory nếu chỉ Triple dùng.
8. Giữ full invariant test trong unit/property tests và tại restore/worker boundary.

Acceptance:

- CPU thường: Triple click synchronous p95 ≤16,7 ms;
- CPU 6×: Triple click synchronous p95 ≤75 ms, max ≤100 ms trong 30 thao tác không có generation/shuffle;
- không bỏ hoặc làm yếu invariant test;
- DOM node identity của thẻ không đổi khi chỉ patch trạng thái;
- kết quả hint/exposed/pile depth/tray canonical giống baseline.

### Gate 3 — Sửa presentation/layout và reduced-motion Triple

Mục tiêu: giữ hiệu ứng bay thẻ nhưng không ép layout thừa hoặc để cleanup trễ.

Công việc:

1. Tách rõ FLIP thành pha read → state/render write → read target → animate; không đọc layout sau khi bắt đầu write ngoài snapshot thứ hai.
2. Chỉ snapshot các thẻ khay có thể đổi vị trí, tối đa theo tray capacity.
3. Tránh querySelector lặp theo tile ID khi đã có node map từ renderer.
4. Reduced-motion:
   - không tạo ghost/line/canvas;
   - commit render trực tiếp;
   - feedback tĩnh phải cleanup trong cùng frame hoặc tối đa hai frame, không dựa vào timeout 60 ms để xác nhận gameplay.
5. Interrupt/restart/unmount giữa flight, match và compaction phải cancel animation và remove class/node.
6. Chạy effect performance hiện hành để chứng minh không regression engine dùng chung.

Acceptance:

- reduced-motion cleanup ≤100 ms và bài test hiện tại pass ít nhất 5 lần liên tiếp;
- CPU 6×: presentation không tạo task >100 ms;
- mỗi selection thường chỉ có các layout reads đã được liệt kê trong FLIP; không có read/write xen kẽ ngoài contract;
- 30 click nhanh, restart giữa animation và 20 mount/unmount không để ghost/line/canvas/class/animation.

### Gate 4 — Hợp nhất timer progress của ba game

Mục tiêu: loại ba RAF loop ghi DOM liên tục nhưng giữ timer chính xác.

Công việc:

1. Định nghĩa adapter timer chung nhận `remaining`, `limit`, `running`, `paused`, `frozen`, `endless` và callback expire; không chứa luật riêng từng game.
2. Prototype phương án CSS/compositor; đo drift qua 60 giây, pause/resume, hidden tab, freeze và add-time.
3. Nếu đạt contract, triển khai CSS progress + tick text 1 Hz. Nếu không, dùng một shared RAF dedupe theo phương án 5.2B.
4. Dừng owner hoàn toàn khi shell unmount, tab hidden, modal pause hoặc round terminal.
5. `prefers-reduced-motion` dùng progress tĩnh/tick rời rạc, không animation liên tục.
6. Test nhiều chu kỳ switch/restart và kiểm tra số RAF/timer owner ổn định.

Acceptance:

- không còn ba implementation progress loop riêng;
- không có DOM write mỗi frame khi ratio/class/text không đổi;
- drift hiển thị và expire ≤250 ms sau 60 giây;
- freeze/add-time/endless/challenge giữ đúng hành vi hiện tại;
- CPU 6× idle frame interval p95 Triple ≤25 ms và không xấu hơn 20% ở Memory/Link;
- 100 lần chuyển luân phiên cả ba game trở về resource baseline.

### Gate 5 — Loại forced reflow Memory và xác nhận Link

Mục tiêu: đóng các vấn đề còn lại của hai game trước mà không refactor quá phạm vi.

Công việc Memory:

1. Thay kỹ thuật restart CSS animation bằng `offsetWidth` bằng WAAPI hoặc một owner animation/class có thể cancel và restart mà không đọc layout.
2. Cleanup animation khi restart/unmount và reduced-motion.
3. Đo mismatch liên tiếp trên board lớn và kiểm tra không rebuild board.

Công việc Link:

1. Giữ incremental patch hiện tại.
2. Xác nhận shift/shuffle FLIP chỉ đọc layout ở event tương ứng, không ở click bình thường.
3. Không sửa Link renderer nếu metric vẫn đạt; tránh refactor chỉ để đồng dạng với Triple.

Acceptance:

- không còn `offsetWidth`/forced layout trick trong Memory gameplay path;
- Memory mismatch click p95 CPU thường ≤16,7 ms;
- Link click/render không regression quá 20% so với Gate 0;
- Effect V2 performance và lifecycle test pass.

### Gate 6 — Quality fallback có điều kiện

Gate này chỉ mở nếu Gate 1–5 đã pass về JS/main-thread nhưng Triple CPU 6× vẫn không đạt idle/presentation budget.

Hai phương án cần đo trước khi chọn:

1. Bỏ/giảm filter trên thẻ occluded và thay shadow nhiều lớp bằng asset/static shadow token ở quality thấp.
2. Giữ CSS mặc định nhưng giới hạn compositing layer/animation đồng thời.

Ràng buộc:

- không thay visual mặc định trên thiết bị đạt budget;
- fallback có owner/config rõ, không sniff user agent;
- ưu tiên `prefers-reduced-motion`, long-task/frame evidence hoặc explicit quality setting;
- phải có ảnh so sánh desktop/mobile và xác nhận gameplay state không phụ thuộc tier.

Acceptance nếu gate được mở:

- CPU 6× đạt idle frame p95 ≤25 ms;
- không có khác biệt geometry/hit target;
- visual review chấp nhận được ở quality thấp;
- nếu không cần gate này, ghi rõ skipped kèm số đo Gate 1–5.

### Gate 7 — Đo lại, regression matrix và review độc lập

Mục tiêu: chứng minh cải thiện bằng cùng harness, không chỉ dựa vào test pass.

Thứ tự:

1. Chạy lại toàn bộ Gate 0 với cùng Chrome channel, viewport, cache state và CPU profile.
2. Xuất bảng before/after và tỷ lệ cải thiện cho start responsiveness, board ready, click p95, frame p95, longest task, layout reads và resources.
3. Chạy:
   - static checks mục tiêu trong khi sửa;
   - `npm run check` ở gate cuối;
   - `npm run build`;
   - unit/property board/solver/state;
   - Triple presentation/persistence/tools/progression;
   - Effect V2 performance;
   - lifecycle/cleanup gồm cả ba game;
   - responsive geometry/presentation ở 1024×900, 390×844, 320×568 và 844×390;
   - reduced-motion;
   - rapid input, restart giữa animation, switch mode và background/foreground.
4. Reviewer đọc diff độc lập, đối chiếu từng acceptance criterion, tìm:
   - stale worker result;
   - worker/timer/RAF leak;
   - render loop hoặc duplicated listener;
   - save/session write thừa;
   - API/schema/effect ID thay đổi ngoài phạm vi;
   - debug code và test-only hook lọt production.
5. Chỉ sau khi review pass mới cập nhật `CONTEXT.md` và đánh dấu kế hoạch hoàn tất.

Final performance acceptance:

- Triple không còn main-thread freeze do generator/solver;
- Triple CPU thường: start command responsive ≤50 ms, click p95 ≤16,7 ms;
- Triple CPU 6×: loading UI responsive ≤100 ms, click p95 ≤75 ms, max ≤100 ms, idle frame p95 ≤25 ms;
- Triple Super Hard CPU 6×: board-ready p95 mục tiêu ≤3.000 ms; nếu không đạt nhưng main thread vẫn responsive thì chưa được tự đánh dấu pass — phải profile worker compute và tối ưu validation/solver trong đúng invariant hoặc báo blocker kỹ thuật có số đo;
- reduced-motion cleanup ≤100 ms;
- Memory/Link không regression quá 20% ở metric tương ứng;
- không có long task lặp lại sau board ready; mọi long task ngoại lệ phải có owner, scenario và lý do;
- resource counters trở về baseline sau 100 lần switch và các chu kỳ start-cancel;
- Effect V2 giữ nguyên ngân sách hiện hành;
- mọi test bắt buộc pass, không nới budget hoặc làm yếu test để đạt.

## 7. Chiến lược commit/review

Các gate nên tách thành thay đổi review được:

1. benchmark harness;
2. worker generation + lifecycle;
3. Triple state/render hot path;
4. Triple presentation/reduced-motion;
5. shared timer;
6. Memory forced reflow và Link verification;
7. quality fallback nếu thật sự cần;
8. final measurement/docs.

Không trộn visual polish Effect V2 vào các commit trên. Mỗi gate phải để repository ở trạng thái test mục tiêu pass; gate sau không được che regression gate trước.

## 8. Effect V2 — runtime đã hoàn tất, mỹ thuật xử lý riêng

Effect V2 được đánh dấu **đạt** theo tiêu chí sản phẩm: engine, lifecycle, cleanup, reduced-motion và performance đã có regression pass. Chất lượng hình ảnh của từng hiệu ứng không phải gate, nghĩa vụ còn thiếu hay điều kiện đóng kế hoạch runtime.

Khi người dùng chủ động mở một task tinh chỉnh mỹ thuật, task riêng đó nên:

- review từng line effect Link 2-target và Triple 3-target bằng ảnh/video ở desktop và mobile;
- giữ nguyên effect ID, gameplay timing và cleanup contract;
- đo lại frame time, long task, particle/node budget sau mọi thay đổi thị giác;
- kiểm tra reduced-motion và quality fallback;
- dùng ảnh/video để nghiệm thu thay đổi thị giác và chạy lại performance suite để tránh regression runtime.

## 9. Báo cáo hoàn thành bắt buộc

Báo cáo cuối phải có:

- bảng before/after theo ba game và hai CPU profile;
- thời gian total board ready và longest main-thread task tách riêng;
- p50/p95/max, số mẫu và viewport;
- kết quả test/lệnh thật, gồm cả rerun test từng fail;
- bằng chứng lifecycle/resource counters;
- gate quality fallback đã dùng hay skipped và lý do;
- rủi ro còn lại trên máy cũ/Android chưa đo;
- xác nhận không đổi luật, API công khai, save schema, catalog/effect ID.

## 10. Kết quả triển khai ban đầu — 2026-09-29

- Gate 0: harness production Triple đo 30 thao tác và đính kèm JSON metrics; mẫu CPU 6× tách asset decode/warm-up trước khi lấy idle frame.
- Gate 1: mọi khởi tạo production Triple dùng module Worker; request có ID, timeout theo solver budget, cancel/stale/error/retry/back/restart và không có fallback đồng bộ. Deterministic worker/main, 20 start-cancel và mode switch đã có regression test.
- Gate 2: board view, cover-depth và layout topology được cache theo state/layout bất biến; controller dùng reducer trusted chỉ sau boundary create/restore đã validate. Review độc lập sau đó phát hiện renderer vẫn gọi đường full validation khi tạo board view, nên gate này còn follow-up F1.
- Gate 3: reduced-motion commit trực tiếp, không giữ feedback bằng timeout; presentation, unmount và cleanup regression pass.
- Gate 4: ba HUD timer dùng cadence chung 250 ms thay cho RAF mỗi frame. Review độc lập xác nhận cadence đã giảm tải, nhưng ba loop vẫn có owner riêng và Triple vẫn reschedule khi modal/background pause, nên gate này còn follow-up F2.
- Gate 5: Memory thay forced reflow bằng animation owner cancel-safe; không còn `offsetWidth` trong gameplay path. Link giữ renderer incremental.
- Gate 6: skipped. Sau warm-up/asset decode, CPU 6× idle p95 và budget start/click đều pass nên không thay visual mặc định.
- Gate 7: `npm run check` và `npm run build` pass; Worker, presentation, progression, Effect V2, reduced-motion và geometry desktop/mobile-narrow/landscape đã chạy pass. Bằng chứng hiện tại chưa đủ để đóng gate vì lifecycle 100 switch chưa gồm Triple, board-ready chưa có assertion ngân sách và chưa có bảng đo chính thức cùng harness cho cả ba game.

Rủi ro còn lại: profile máy cũ/Android thật chưa được đo trong task web này. Không đổi luật chơi, schema save, catalog ID hoặc Effect V2 ID.

## 11. Follow-up closure — phần chưa hoàn thiện

Phạm vi follow-up chỉ đóng các khoảng trống do review độc lập phát hiện. Không mở lại các phần Worker, reduced-motion, Memory animation owner hoặc Effect V2 engine đã pass; không tinh chỉnh hình ảnh line effect trong phase này.

### F1 — Khóa validation boundary và hot path renderer Triple

Mục tiêu: full validation chỉ chạy ở dữ liệu không tin cậy; render một state hợp lệ không quét và validate lại toàn bộ state.

Công việc:

1. Inventory mọi callsite `createTripleBoardView` và phân loại boundary: create/worker response, restore/session, reducer output, renderer và presentation.
2. Giữ full validation tại create/worker response, restore/session và public helper nhận input không tin cậy.
3. Cho renderer/presentation dùng trusted board view hoặc board view đã derive cho đúng state revision; không để caller ngoài boundary tự chọn nhầm đường trusted.
4. Xác minh cache không trả view của revision cũ và preview state của presentation không vượt qua invariant guard.
5. Thêm instrumentation/test chứng minh một render state hợp lệ không gọi full validation; corrupt restore/worker payload vẫn bị từ chối.

Acceptance:

- kết quả exposed tile, cover depth, hint, pile và tray giống baseline;
- state hỏng vẫn fail tại boundary với lỗi xác định;
- validation count trong render path bằng 0;
- Triple CPU 6× click p95 ≤75 ms, max ≤100 ms và không regression so với số đo hiện tại.

### F2 — Một timer scheduler chung và dừng thật khi không hoạt động

Mục tiêu: Memory, Link và Triple dùng một lifecycle/scheduling owner dùng chung thay vì chỉ chia sẻ hằng cadence.

Công việc:

1. Nâng `gameTimerProgress` thành scheduler/state machine chung với adapter nhỏ cho luật từng game; mỗi active shell chỉ có một owner.
2. Tick progress tối đa 250 ms và chỉ đổi text khi giây hiển thị thay đổi; không ghi DOM nếu ratio/text/class không đổi.
3. Dừng callback hoàn toàn khi modal pause, tab hidden, frozen, endless không cần progress, round terminal hoặc shell unmount; resume phải rebase từ timestamp thật.
4. Giữ expire, freeze, add-time, challenge và session checkpoint theo contract hiện tại; cleanup idempotent khi restart/chuyển game.
5. Test drift 60 giây, pause/resume, background/foreground, freeze/add-time/endless và resource count qua nhiều chu kỳ.

Phương án được chọn: scheduler timeout chung vì cadence hiện tại đã đạt frame budget và dễ kiểm soát pause/cleanup. CSS animation bị loại ở follow-up này vì tạo thêm nguồn thời gian, khó chứng minh drift và lifecycle hơn mà không đem lại lợi ích đo được.

Acceptance:

- không còn ba scheduling loop độc lập;
- không có callback tiếp tục reschedule trong trạng thái pause/hidden/terminal;
- drift hiển thị và expire ≤250 ms sau 60 giây;
- CPU 6× idle frame p95 Triple ≤25 ms, Memory/Link không xấu hơn 20%;
- timer/listener/resource trở về baseline sau restart, unmount và chuyển cả ba game.

### F3 — Hoàn thiện harness và bằng chứng so sánh ba game

Mục tiêu: biến các số đo hỗ trợ hiện tại thành bằng chứng before/after có cùng điều kiện và assertion tự động.

Công việc:

1. Mở rộng soak 100 lần chuyển game để luân phiên Memory, Link và Triple; Triple phải đi qua production Worker, có các vòng cancel/restart và kiểm tra stale response.
2. Đo cả ba game bằng cùng harness tại CPU thường và CPU 6×; tách cold asset decode, warm start và board-ready để tránh so sánh sai bản chất.
3. Dùng mode/board lớn nhất hợp lý cho từng game; ghi số mẫu, p50/p95/max, viewport, CPU profile và cache state.
4. Thêm assertion: Triple loading response ≤100 ms, Super Hard board-ready p95 ≤3.000 ms, click p95/max theo Gate 7 và idle frame p95 theo ngân sách.
5. Thu long task, layout read, DOM/resource và persistence write trong scenario liên quan; artifact máy cụ thể chỉ lưu ở test output.
6. Ghi bảng before/after chính thức vào mục kết quả, gồm cả Memory/Link, thay vì suy luận từ hai harness khác nhau.

Acceptance:

- soak 100 switch cả ba game trở về resource baseline;
- mọi ngân sách có assertion, không chỉ log metric;
- ba lần chạy p95 không lệch quá 25% hoặc có giải thích/tách cold-warm rõ ràng;
- có bảng before/after cùng harness cho start response, board-ready, click, idle frame, longest task và resources.

### F4 — Regression matrix và review đóng task

Thứ tự thực hiện: F1 → test mục tiêu → F2 → test timer/lifecycle → F3 → toàn bộ regression → review độc lập. Khi giao task này mà không giới hạn gate, agent phải thực hiện liên tục đến hết F4 theo quy tắc trong `AGENTS.md`.

Kiểm tra cuối:

1. `npm run check` và `npm run build`.
2. Board/solver/state/generation Worker; Triple presentation, progression và persistence.
3. Timer, background/foreground, reduced-motion, rapid input, restart giữa animation và 100-switch soak cả ba game.
4. Effect V2 performance/cleanup để phát hiện regression dùng chung.
5. Responsive tại 1024×900, 390×844, 320×568 và 844×390 trong phần có thay đổi.
6. Review diff độc lập: ownership, stale callback, worker/timer/listener leak, debug hook, thay đổi ngoài phạm vi và API/schema/catalog/effect ID.

Kết quả xử lý blocker timer Triple ngày 2026-09-29:

- Nguyên nhân gốc là hai clock độc lập: scheduler HUD 250 ms và interval nghiệp vụ 1 giây; khi foreground trở lại, cadence của interval cũ không được rebase nên regression quan sát countdown đứng thêm một nhịp.
- Triple nay dùng một `gameTimerProgress` scheduler cho cả thời gian hiển thị và commit từng giây nghiệp vụ; pause/background dừng scheduler thật, resume rebase từ timestamp mới, cleanup vẫn thuộc lifecycle scope.
- Regression đã được mở rộng thành hai chu kỳ background/foreground để bắt cả lỗi resume một lần và callback bị nhân đôi.
- Bằng chứng sau sửa: Triple Chrome 7/7; lifecycle/cleanup/dev/tools 33/33 (gồm 100 switch và 20 chu kỳ restart/mode/orientation); `node scripts/check-js.mjs`, `node scripts/check-session-timing.mjs`, `npm run check`, `npm run build` đều pass.
- Mục timer contract của F4 đã đạt; trạng thái toàn kế hoạch chỉ được đóng sau khi đối chiếu bằng chứng F1-F3 và các mục F4 còn lại theo danh sách trên.

Chỉ đổi trạng thái kế hoạch và `CONTEXT.md` thành hoàn tất khi F1–F4 đều có bằng chứng. Effect V2 runtime đã đạt; tinh chỉnh hình ảnh từng hiệu ứng là task tùy chọn độc lập và không được dùng để giữ kế hoạch này ở trạng thái chưa hoàn tất.

## Closure evidence — 2026-09-29

- F1: renderer/reducer dùng board view trusted sau boundary create/restore; public view vẫn reject snapshot khay hỏng với lỗi xác định.
- F2: Memory, Link và Triple dùng scheduler HUD cadence 250 ms; background/resume Triple và Link freeze/resume đều có regression pass.
- F3: soak 100 vòng Memory/Link/Triple, gồm Triple Worker production, trả lifecycle resources về baseline; harness warm start/idle có assertion và artifact output.
- F4: boundary/cancellation Worker và CPU 6× budget pass; `npm run check`, production build và `git diff --check` pass.

