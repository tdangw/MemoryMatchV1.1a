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
- hiệu suất, lifecycle, cleanup và tương thích save được kiểm chứng trước khi mở game đại trà.

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
- `js/gameShell/gameShell.js`
- `js/gameShell/gameShellLayout.js`
- `js/gameShell/gameShellLifecycle.js`
- `js/gameShell/gameShellEffects.js`
- `js/gameShell/gameShellHud.js`
- `js/gameShell/gameShellConfig.js`
- `styles/game-shell/presentation.css`
- `styles/game-shell/tokens.css` — generated, không sửa tay
- `styles/hud.css`
- `styles/gameplay-ui.css`

### Effect/theme dùng chung

- `js/themeCatalog.js`
- `js/uiCatalog.js`
- `js/motion.js`
- `styles/gameplay-effects.css`

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
3. Đăng ký Triple Connect bằng metadata trạng thái `planned` hoặc `released: false`; chưa có controller/loader giả và không xuất hiện trong selector/menu.
4. `gameSelector.js` lấy danh sách game phát hành và handler từ registry; không còn `if Memory, else Link` hoặc fallback game thứ ba về một game cũ.
5. Game ID lạ hoặc chưa phát hành phải bị từ chối có chủ ý và không thay đổi `activeGame`, DOM hoặc active shell hiện tại.
6. Chưa sửa `appearance.js`, `gameState.js`, `shop.js`, session, schema hoặc inventory. Chỉ ghi inventory call site còn hard-code vào báo cáo Gate 1 để định tuyến Gate 6/7; chúng không phải blocker Gate 1.
7. Chưa cần dynamic import Triple vì chưa có runtime Triple. Quyết định code-split được thực hiện khi Gate 4 có entry thật và đã đo bundle.
8. Contract test bắt buộc: hai game hiện tại vẫn mở đúng menu; Triple không được render hoặc mở trực tiếp; ID lạ bị từ chối; registry không mặc định sang Memory/Link; không phát sinh circular import/bootstrap lần hai.

**Gate 1 pass khi:** selector/navigation hai game không đổi hành vi, Triple chỉ tồn tại như metadata chưa phát hành, registry có contract nhỏ và không kéo migration của gate sau vào diff.

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

1. Gate 4 chỉ tích hợp Easy 12 tile/2 layer bằng feature flag development. Chưa thêm save/continue, Shop, item, Endless, Challenge, Lucky Card hoặc mở selector phát hành.
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
11. Khi Triple chưa phát hành, chỉ test mở qua development/test hook được guard bằng môi trường build; không dùng query/localStorage flag có thể mở nhầm ở production. Production selector vẫn không hiển thị game.
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
10. Sau Gate 6, Triple vẫn `released: false` nhưng development flow được phép new/continue/reload. Dynamic import adapter Triple và bundle delta được chốt tại đây; chỉ Gate 7C mới được đổi trạng thái phát hành.

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

#### Gate 7C — Challenge, Lucky và phát hành

1. Chỉ bắt đầu sau Gate 8 chốt mốc sao, Lucky frequency/vị trí/reward và kinh tế.
2. Sub-gate `challenge/lucky`: Challenge dùng dãy tile/layer/time trong `Triple Connect.md`; Lucky Card phải là một phần của bộ ba và đi qua cùng reducer/solver, không dùng nhánh renderer đặc biệt để cấp thưởng.
3. Sub-gate `integration`: tích hợp Shop/collection/theme/effect/sound/Xu qua adapter/capability đã có consumer thật; không đưa nhánh Triple vào controller hai game cũ.
4. Sub-gate `release`: chạy regression, Android/PWA/offline, hai chuẩn viewport đã chốt, thiết bị thật và feature-flag rollback. Chỉ đổi `released: true` sau khi review độc lập pass và người dùng xác nhận phát hành; việc hoàn tất code không tự động cấp quyền mở game đại trà.

### Gate 8 — Quyết định sản phẩm bắt buộc trước kinh tế/phát hành

Các mục sau **không chặn Gate 1–7A**, nhưng Terra phải dừng trước 7B/7C và hỏi người dùng bằng bảng đề xuất có căn cứ playtest:

1. Giá Xu và số lượng khởi đầu của Gợi ý, Thêm thời gian, Hoàn tác và Xáo thẻ.
2. Mốc sao theo từng mode/level và cách tính sao ở Endless/Challenge.
3. Tần suất, vị trí hợp lệ và giới hạn Lucky Card theo board/layer.
4. Phân bố ba phần thưởng Lucky: thời gian, Gợi ý và Xu; giới hạn khi inventory đầy.
5. Phần thưởng Xu cuối màn/Endless và mối tương quan với giá Shop.
6. Thời gian cuối cùng nếu playtest chứng minh các mốc ban đầu cần đổi.

Terra không được tự sao chép số của Memory/Link và coi đó là quyết định phát hành. Có thể viết công cụ đo/playtest trước, nhưng không thêm giá trị production chưa được duyệt.

Đầu ra Gate 8 phải là một bảng quyết định ghi rõ giá trị đề xuất, dữ liệu/giả định, phạm vi mode, tác động kinh tế và người dùng chấp thuận hay yêu cầu sửa. Chỉ các ô đã được người dùng chấp thuận mới được đưa vào production config; ô chưa chốt tiếp tục chặn đúng sub-gate phụ thuộc nó, không chặn phần độc lập khác.

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
- Triple chưa phát hành không xuất hiện hoặc mở được từ production selector trước sub-gate `7C-release`; Gate 4–7C chỉ dùng development/test hook đã guard.

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
- [ ] Gate 1 không kéo appearance/state/Shop/session migration vào registry và Triple planned không xuất hiện trong selector.
- [ ] Khay có đúng 7 ô ở mọi mode; không có code/UI/save cho 10 ô hoặc Mở rộng khay.
- [ ] Miss khớp bảng ví dụ và không phụ thuộc cách renderer nhóm khay.
- [ ] Undo phục hồi snapshot chính xác; failure không trừ vật phẩm; Shuffle xóa history.
- [ ] Runtime, generator và solver dùng cùng nguồn luật.
- [ ] Command reducer immutable, deterministic; canonical tray order và Moves/Miss/combo/score có contract rõ.
- [ ] Mọi board phát hành có witness solution và solver không thể chạy vô hạn.
- [ ] Tile bị che không tương tác; tile exposed có hit target đúng.
- [ ] Resolve bộ ba xảy ra trước khi xét tray đầy.
- [ ] Line đi qua đúng ba tâm tile và effect xóa chạy sau line.
- [ ] Restart/đổi game giữa effect không để callback, node, listener, timer, RAF hoặc worker cũ.
- [ ] Portrait/landscape tại hai chuẩn thiết bị không overflow, overlap hoặc mất state.
- [ ] Orientation không đổi topology nghiệp vụ, cover graph, seed hoặc gọi lại generator/solver Triple.
- [ ] Reduced motion giữ nguyên kết quả gameplay.
- [ ] Save cũ tương thích; ba game không lẫn progress/session/inventory/theme.
- [ ] Không tăng write không cần thiết và không thay đổi public API/schema ngoài migration đã duyệt.
- [ ] `npm run check`, build và toàn bộ test gate liên quan pass.
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
- Không mở Triple cho người dùng trước khi vertical slice, persistence, regression và feature-flag rollback cùng pass.
- Không đánh dấu hoàn thành chỉ vì game chạy được hoặc thiết bị thật chưa thấy lỗi.
