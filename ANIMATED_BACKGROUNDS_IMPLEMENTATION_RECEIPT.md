# Nền động — receipt triển khai chung

> Hồ sơ lịch sử của task đã hoàn tất. Kế hoạch cũ đã được xóa29/10/2026;
> contract hiện hành ở ARCHITECTURE.md và CONTEXT.md. Những gate/chờ duyệt
> trong diễn biến bên dưới không phải yêu cầu triển khai mới.

Ngày 26/10/2026. Phạm vi: `ANIMATED_BACKGROUNDS_PLAN.md`, toàn G0–G5;
commit riêng từng phase theo yêu cầu bổ sung. Không deploy/APK/push/rules.

## Trạng thái

- G0: hoàn thành inventory và baseline PC độc lập; thiếu thiết bị S22 thật.
- G1: chủ dự án đã duyệt mẫu Memory hiện tại qua câu hỏi trong chat;
  Home giữ ảnh vườn/tĩnh như quyết định bổ sung. Có mẫu dọc/ngang, A/B và
  LayerTree sơ bộ,2/2unit,8/8Playwright,check pass.
- G2 commit `dfea4bd`; G3 đã triển khai/phủ cảnh và kiểm chức năng dọc.
- G4/G5: còn thực hiện, chưa nghiệm thu cuối.
  Không coi việc có pilot là đạt lifecycle/runtime hoặc nghiệm thu cuối.

## Baseline và ranh giới

- Git ban đầu có nhiều thay đổi của người dùng/agent khác. Danh sách:
  `docs/design/animated-backgrounds/qa/baseline-status.txt`. Snapshot binary
  local: `runtime/qa/animated-backgrounds/baseline-working-tree.patch` (không
  commit bản sao tài nguyên của task khác). Index ban đầu rỗng.
- Không sửa owner sản phẩm trong G0/G1. `js/background/*` là module ứng viên
  chỉ được trang duyệt riêng import; main/bootstrap không tải chúng.
- `body` dùng cover/center và isolation:isolate. Static background ở body;
  transition fixed z=-1. Host pilot fixed z=-1, prepend trước UI; không
  promote host bằng transform/opacity/will-change. `.meteor-layer` z=1;
  Home overlay z=100. Xác minh hình ghép thật trước phê duyệt.
- `mainmenu.js:518` thực sự tạo 1 fog + 2 cloud tồn tại toàn app, CSS có
  timeline dài và vùng lớn. Đây là baseline cũ, không xóa tiện trong G1;
  cần xử lý ownership trong G2, không để chồng animation mới khi rollout.
- Facade hiện có: initialize/dispose/setEnabled/setEligible/getDiagnostics;
  hai meteor, một timer. Eligibility false ở activateGameScope/disposePage;
  master key `meteorEffects` khác eligibility. Không sửa public exports.
- Map: trail width min(100%,440px), texture size 440×660px repeat-y;
  backgroundPositionY được owner adventureMap cập nhật khi render range.
  Wrapper viewport ở map-scroll; path/node nằm trên texture. G3 phải tái
  dùng token này, không áp cover của body lên map.
- Nền tĩnh preload/decode có deadline8s và revision ở
  gameBackgroundTransition; bootstrap chờ ba nguồn theo orientation.
  Không thêm pilot/motion asset vào dependency startup.
- G0 chọn chưa thêm sampler tự hạ quality: chưa có số đo chứng minh cần.
  Unknown device vẫn phải Light khi rollout; ngân sách giữ nguyên mục8.

**Đính chính owner Home tại G1:** `styles/home-menu.css:5` dùng ảnh
`leaderboard-night-garden.webp` trên `.game-selector.adventure-page`,
phủ kín body background. Inventory của kế hoạch đã bỏ sót owner này.
Chủ dự án xác nhận qua câu hỏi trong chat: giữ ảnh vườn hiện tại, Home
giữ tĩnh khi không có vùng phù hợp. Pilot cull toàn bộ vùng Home với lý
do `home-source-covered`,0handle/0timer; không vẽ thác trên card chọn trò.
Source ảnh vườn được thêm vào inventory10nguồn tại `qa/pilot.json`.

## Môi trường

- Windows PC: AMD Ryzen7 4800H; GPU hệ thống Radeon Graphics và NVIDIA
  GTX1650Ti (CIM). GPU thực dùng bởi Chrome/refresh/presentation cần trace,
  không suy từ danh sách GPU. Browser/version/DPR trong JSON đo.
- ADB đã khởi động thành công sau khi chạy ngoài môi trường hạn chế;
  `adb devices -l` trả danh sách rỗng. Chưa có S22/SoC/Android/browser/Hz,
  nhiệt độ/pin hay trace Android. Không gọi viewport giả lập là S22.

## Lựa chọn và pilot

- Chọn DOM vùng nhỏ + SVG/CSS tĩnh + WAAPI transform/opacity, không thư viện.
  CSS keyframes khả thi nhưng WAAPI cho handle cleanup/cancel rõ hơn;
  video/canvas toàn màn bị loại theo kế hoạch vì chi phí/ownership.
- Ứng viên thác ban đầu: một lòng thác nguồn độc lập dọc/ngang,2dải nước opacity.14,
  native translateY32px/3.2–3.55s. Không thêm scheduler sao băng; hai slot
  sao băng sản phẩm vẫn là baseline. Nước chỉ nằm trong clip nhỏ. Sau chốt
  Home giữ ảnh vườn, ứng viên này không chạy; nguồn được giữ như metadata
  tham chiếu của pilot, chưa rollout vào sản phẩm.
- Memory: 1cá SVG opacity.24 bơi trong envelope hữu hạn, 2glow nhỏ và
  1lá SVG. Timeline20–24s gồm vào/chuyển động/ra và nghỉ60%; không tween
  layout/filter/path, không RAF steady-state hoặc timer sinh hạt.
- `geometry.js` dùng source pixel cover/center; toàn envelope phải nằm
  trong viewport và không đụng snapshot board/HUD/card/dock/header/ad.
  Crop hoặc UI che thì bỏ vùng, không dời chi tiết sang vị trí giả.
- Mỗi scene pilot có dispose idempotent, AbortController cho listeners,
  cancel toàn handle, RAF chỉ phục vụ resize/preference/visibility events.
  Đây chưa phải coordinator sản phẩm G2; chưa kiểm popup/ad/round ownership.
- Không tạo bitmap mới, không motion request/decode/cache. Byte raster
  mới=0; SVG/path/CSS nằm trong module tách riêng. Chưa suy GPU allocation
  từ DOM/heap hay coi transform là bằng chứng compositor.

## Bằng chứng và kiểm tra

- Build baseline sản phẩm: exit0 (`qa/baseline-build.log`).
- Build G1 riêng, Firebase disabled bằng build env: exit0
  (`qa/pilot-build.log`). Không đổi build config hay Firebase sản phẩm.
- Unit geometry: 2/2 pass; cover portrait/landscape, input invalid, crop và
  collision toàn envelope. Các kiểm thử tiếp theo sẽ cập nhật cùng receipt.
- Baseline PC master off: Home120s p50/p95/p99=6,9/7,1/7,4ms,
  max597,2ms, ratio RAF>25ms0,035%; Memory Vô tận120s cùng quantile,
  max27,1ms, ratio0,012%. Đây là RAF indicator khoảng144Hz, không phải
  presentation/FPS GPU. Home outlier giữ nguyên, cần tách warm/trace G4.
  JSON `qa/baseline.json`, `qa/baseline-memory.json` kèm9hash/dimension.
- Lần baseline đầu dừng sau Home do hướng dẫn lần đầu chặn launch Memory;
  log lỗi giữ lại. Đã sửa harness dùng thao tác Bỏ qua/Đã hiểu thật, đo lại
  Memory trong Vô tận để không bị hết75s khi lấy mẫu120s. Không sửa game.
- G1 matrix320×740/DPR2,412×915/DPR3,844×390/DPR2,1024×900 và1366×768/DPR1:
  bình thường/reduced-motion,100lần mount/dispose mỗi cảnh; scene/animation
  DOM về0. JSON `qa/pilot.json`. Bàn Vô tận dọc412che hết vùng động nên
  fallback tĩnh,320chỉ còn1đom đóm; không ép đủ nhóm vào vùng bàn.
- Mẫu duyệt bàn Dễ dọc/ngang và desktop có đủ1cá/2đom đóm/1lá:
  `qa/easy-{portrait,landscape,desktop}-memory.png`,
  `qa/pilot-easy-{portrait,landscape}.webm`. Đã xem screenshot thật;
  không thay hình nền, UI/câu chữ hoặc thêm emoji/font art.
- `qa/pilot-audit.json`:11node/4handle/0timer/0RAF steady-state; LayerTree
  resolve backendNodeId về đúng `.ambient-bg-*` xác định4layer của pilot,
  kích thước20×13,5×5,5×5,12×9CSSpx. Ước tính w×h×4×DPR²=15.048bytes ở
  DPR3; đây không phải GPU/driver allocation đo thực. Không layer động
  toàn màn thuộc pilot. Counts riêng pilot trong ngân sách Light; fog/cloud
  cũ còn là baseline và phải được G2 đóng ownership trước nghiệm thu tổng.
- A/B PC sau preview/guide boundary thật: `qa/pilot-memory.json`,3cặp
  đảo thứ tự,10s mỗi nhánh (sơ bộ G1, chưa120s mỗi nhánh của G4).
  Delta p95≤0,000000001ms (noise float, xấp xỉ0), delta p99≤0,3ms;
  p95on7,1ms, p99on7,2/7,4/13,9ms. Outlier maxoff55,5ms/maxon25,6ms
  giữ nguyên. LongTask observer được hỗ trợ,0entry>50ms trong cả6mẫu.
  RAF period khoảng6,9ms, không chứng minh presentation/jank GPU144Hz.
- Trace Memory10s off/on ghi39/35Paint và13/12Layout của toàn app,
  không suy giảm paint từ chênh lệch nhỏ này. Layer/paint toàn app còn có
  HUD/fog/cloud và hoạt ảnh sản phẩm cũ; G4 phải đo ownership/presentation/
  input/heap đầy đủ. Trace local ở `runtime/qa/animated-backgrounds/`.
  Bản gzip commit cùng phase ở `qa/traces/memory-{off,on}.trace.json.gz`.
- Matrix đầu dùng wait3s chưa đủ chờ preview/guide; số đo đầu trong
  `qa/pilot.json` chỉ giữ làm raw screening. Harness đã sửa chờ
  `#grid-container:not(.is-locked)` và guide đóng; đo lại Memory độc lập,
  chụp/quay lại mẫu duyệt. Không dùng timeout để sửa đồng bộ trong game.
- Chưa chạy full check/build cuối task,100chu kỳ toàn app,10phút soak,
  regression G2–G4 hoặc đo S22. Không dùng một phase thay nghiệm thu G5.

## Review và skill

### G3 — phủ cảnh thật

- `bindings.js` nối page/round owner; game adapters truyền identity vào
  shared shell, startup ready/pause báo lại đúng scope. Không nhánh luật
  game trong runtime, không sửa gameplay/persistence/API cũ.
- `scene.js` + `primitives.js` dùng chung cho sản phẩm/mẫu duyệt, chỉ WAAPI
  transform/opacity, SVG/CSS tĩnh. Không bitmap hoặc preload motion mới.
  Home tĩnh theo quyết định mới; Memory tối đa2cá/1glow/1lá, Link thác,
  Triple thác/lá tím; envelope bị crop/board/HUD/banner che thì bỏ.
- Map đọc440×660 từ CSS owner, không nhân bản token. Tối đa3tile nhìn
  thấy, chọn tối đa1thác/2cá/1glow/1lá trong5handle. Chặn convex hull đường,
  cell/rương/decor; host chỉ cao viewport, nằm trước path/node trong trail.
  Không node theo màn/chapter, không đo layout mỗi frame. Native scrollend
  hoặc debounce140ms dùng chung timer của coordinator, không scheduler thứ2.
- Map source cache giữ tối đa1promise readiness, không giữ Image sau settle;
  abort bỏ deadline/listener/image khi owner/preparation bị hủy. Game source
  dùng preload/cache hiện hữu; orientation promise/actor callback có guard
  generation; lỗi không retry khi resize.7hash/source/region lock được sinh
  bằng `scripts/ambient-source-lock.mjs`, kiểm bằng `--check`.
- Đã sửa thêm hai rủi ro qua review: timer scroll-idle không bị popup khác
  xóa làm kẹt token; dispose facade cũng hủy binding scroll ngay cả khi page
  còn active. Unit chứng minh cả hai và stale rejection sau off→on.
-9/9Playwright3viewport dọc pass;4/4portrait kiểm lại (404/decode boundary/
  route trong tải chậm),10/10unit pass. Build sản phẩm exit0; ảnh thật được
  xem trong runtime/qa, không đưa ảnh/log mới vào commit. Đây chưa là A/B
  production/100round/soak G4. Giao diện ngang sau chỉnh do chủ dự án tự kiểm.

### Điều chỉnh G1 và G2 — 27/10

- Theo yêu cầu trực tiếp sau duyệt: mirror path cá để đầu đi trước; cá thứ2
  ở hồ giữa lộ, bớt1đom đóm. Game vẫn4animation,12node/4layer nhỏ.
  Bản đồ được ưu tiên hoàn thiện; chỉ kiểm live dọc từ mốc này, ngang chủ
  dự án tự kiểm. Mẫu/JSON/video dọc local đã cập nhật; ngang cũ là lịch sử.
-6/6Playwright dọc320/412/900pass; A/B bàn Dễ900×1024 với assertion đủ2cá
  active: delta p95=-0,2/-0,1/-0,1ms; delta p99=-0,1/0/-0,2ms;0LongTask
  >50ms, giữ outlier on27,8ms. Không lấy case Vô tận đã cull cá làm chứng
  nhận hiệu suất2cá. Vẫn là số đo sơ bộ, chưa G4 hoặc S22.
- G2: một runtime owner/state machine, một scheduler sao băng, nested
  suspension token, stale preparation guard, failed-source không retry
  khi resize, queued layout RAF bị hủy khi dispose. Master off/reduced/
  hidden/pagehide/freeze, resume/pageshow đúng owner; gameplay không phụ
  thuộc meteor eligibility. Scope dispose bỏ reference root/factory.
- Modal, context guide, wave notice và intro overlay release token theo
  scope. Consent/privacy/rewarded dùng finally; native foreground có guard
  scope và cleanup nếu đăng ký listener lỗi. Không đổi provider/reward.
- Chọn bỏ fog/cloud vô chủ và blur lớn cũ; phương án giữ chúng như primitive
  được loại vì không hợp bố cục đã chốt và làm tăng chi phí toàn màn.
  Hai meteor CSS/pool/hành vi facade cũ giữ nguyên, scheduler chuyển về runtime.
-21/21unit runtime+ads pass;2/2regression meteor pool/cancel pass. Test cũ
  bổ sung đúng boundary sự kiện MQL bất đồng bộ và chờ pool trước soak;
  giữ nguyên assertion0resource,100chu kỳ,10phút/ngưỡng heap. JS217module
  và CSS ownership pass. Chưa rollout preset G3; chưa nghiệm thu G4/G5.
- Lệnh commit chỉnh G1 trước đó không chạy do automatic approval review
  báo hết usage. Không có nhận định hành động không an toàn. Sau yêu cầu
  tiếp tục sẽ gom phần chỉnh G1 vào phase G2; không commit log/ảnh QA mới.

- Review G1 riêng: đọc source/diff, phát hiện và sửa tham chiếu host còn
  giữ sau dispose; thêm assertion disposed nodes=0/pendingFrames=0 ở100chu
  kỳ, chạy lại audit/browser tests sau build. Pilot guard generation tránh
  callback lỗi animation cũ ảnh hưởng scene mới; pagehide/control action
  hủy mẫu an toàn.8/8Playwright4viewport pass, CSS ownership pass,
  unit2/2 chạy lại pass, npm run check exit0.
- Chưa review sau implementation cuối. Review G1 là tự review riêng;
  không gọi là review độc lập. Chưa có reviewer độc lập được giao.
- Đã đọc skill computer-use để kiểm routing; chưa điều khiển Windows bằng
  skill này nên không nhận là đã dùng. SVG/CSS đủ cho pilot, không imagegen.

### G4 — kiểm chứng sản phẩm, đang thực hiện 27/10

- Dùng build production riêng có QA entry, không HMR; entry này không nằm
  trong build sản phẩm thông thường. Firebase tắt trong môi trường đo.
  Fixture dùng cùng seed/profile cho hai nhánh; cấp item thời gian bằng
  owner hiện hữu và dùng item thật trước warm, không đóng băng clock game.
- Đã sửa hai nguyên nhân phát hiện khi kiểm production: transition CSS có
  thể không phát transitionend khi browser gộp frame ban đầu, làm nguồn
  nền chưa commit; thay bằng fade WAAPI hữu hạn220ms/cancel/reduced/hidden.
  Sau commit nguồn, owner scene nhận refresh. Không đổi preload/deadline.
- Map ban đầu tạo thêm backing layer440×10461px khi host nằm trước trail.
  Host chuyển thành con cuối của chính scroller, giữ cuộn cùng texture;
  envelope tránh cả special modes/treasure card. Đo A/B lại không còn lớp
  dài phụ;4lớp vẽ nhỏ10×62,20×13,20×13,5×5px tại900×1024DPR1.
  Có pause khi map bận/rebase chapter, không thêm RAF/timer nền.
-11/11case áp dụng qua3viewport dọc pass;4case viewport-independent skip
  có chủ đích. Bao gồm12fade không ép layout và cancel/reduced, map3game,
  lifecycle/master/hidden/popup,404/chậm/stale owner.100chuyển route thật
  giữ pool2 và eligibility gameplay. Ca hoàn tất meteor pass sau sửa
  fixture chờ Home mount xong; giữ assertion100chu kỳ/2slot/heap10phút.
- Production900×1024: Memory Dễ4target(2cá/đom đóm/lá), Siêu khó2target
  do bàn che cá; Link Dễ/Siêu khó tĩnh(no-safe-region); Triple2target
  thác/lá. Không dùng fallback tĩnh làm bằng chứng chuyển động đầy đủ.
- A/B120s×3cặp/cảnh đang chạy; chưa kết luận G4. Soak10phút, matrix skin,
  cold startup, review cuối/check/build và S22 còn phải đối chiếu riêng.
  Không đưa ảnh/log/JSON QA mới vào commit theo chỉ dẫn hiện hành.

#### Bằng chứng G4 đã thu được

-60mẫu120s,30cặp đảo off/on trên cùng build QA production: Home,3map,
  Memory/Link/Triple Dễ và Siêu khó. Cả30cặp đạt delta p95≤0,06B,
  p99≤0,12B, gap ratio≤+0,5điểm phần trăm, input-dispatch p95≤+8ms.
  B thực từng mẫu off khoảng6,9–7,6ms; không ép thành profile60Hz.
  Delta lớn nhất: p95≈0ms,p99≈0ms,gap+0,0696điểm phần trăm,
  dispatch p95+0,4ms.0LongTask>50ms,0pageerror. Input ở đây là thời gian
  event tới capture handler của trusted pointerdown; EventTiming chỉ thu
  entry vượt ngưỡng browser, không gọi đây là độ trễ vật lý tới màn hình.
- Giữ mọi outlier: max off67,6ms; max on1006,8ms ở Triple Dễ/cặp0.
  LoAF có20entry:17Memory off,1Link off,2Triple on; scripts rỗng và
  blockingDuration=0. Chưa quy được outlier1giây cho nền hoặc OS/GPU;
  không dùng percentile đạt để tuyên bố mọi frame mượt/đạt GPU FPS.
- Chrome155.0.8059.86, ANGLE AMD Radeon Graphics Direct3D11, GPU
  compositing/rasterization enabled; GTX1650Ti có trong inventory nhưng
  renderer thực là AMD. Không coi headless PC là S22/browser Android.
-600mount sau warm:100mỗi map/game của3trò. p95 map3,2/3,3/3,0ms,
  gameplay1,1/0,8/1,4ms, đều≤4ms. Max riêng map5,0ms; hai lần reconcile
  Link trong A/B5,3/6,2ms vẫn giữ. Không thay ngưỡng hoặc bỏ mẫu xấu.
-90tổ hợp3viewport dọc(320×740DPR2,412×915DPR3,900×1024DPR1)×5skin
  ×6scene map/Siêu khó: không envelope đè UI, không overflow,≤1host,
  ≤24node/5handle; reduced-motion về0host. Các game có vùng không an toàn
  giữ tĩnh, đặc biệt Link và phần lớn bàn Siêu khó trên mobile.
- Cold startup đo lại tuần tự3cặp: off/on334/248ms,307/354ms,374/383ms;
  delta -86/+47/+9ms, không có regression lặp>100ms. Preference được lưu
  trước navigation bằng API persistence và restore cả IndexedDB. Không
  dùng homeUsableMs của helper toggle sau load làm chứng nhận cold A/B.
- LayerTree qua30cặp: layer tổng tăng tối đa5 ở map/Memory Dễ,3 ở
  Memory Siêu khó/Triple,0 ở Home/Link; trong ngưỡng Light≤6. Layer vẽ
  mới có kích thước nhỏ; root clipping không draw. RGBA thô từ bounds
  PC của target lớn nhất trong mẫu≈9.132byte, không gồm padding/tile/cache
  driver và không được gọi là số đo GPU allocation. Không bitmap mới,
  nên decoded motion pixel mới=0; JS/CSS lazy vẫn có transfer riêng.
-8trace15s cùng build/off-on cho map,Memory Dễ,Triple Dễ/Siêu khó:
  root Paint count off/on lần lượt3/3,18/18,18/18,18/18. Map có thêm4
  Paint nhỏ của target; không tăng root Paint lặp do nền. Một số Paint
  clip dùng sentinel±8.388.608 của Chromium, không dùng sentinel để tính
  raster memory; dùng LayerTree bounds. Các raw DroppedFrame counter
  headless khác rất lớn giữa static/damaged frames, chưa được hiệu chuẩn
  thành missed physical presentation; không dùng chúng làm GPU FPS.
  LayerTree.layerPainted không emit trong runner này, ghi0event thu được,
  không đồng nghĩa toàn app không paint; trace vẫn có Paint của HUD/ad.
- Cold không request chunk scene/ambient trước Home usable; warning duy
  nhất ở cả hai nhánh là Service Worker bị Playwright chặn có chủ đích.
  Không có preload-unused warning mới. S22/pin/nhiệt độ/physical
  presentation/GPU driver allocation thực vẫn chưa đo.

CDP CPU trung bình ba mẫu mỗi nhánh, **ms trong120s**, off/on (bao gồm
sampler chẩn đoán giống nhau ở hai nhánh, HUD và quảng cáo hiện hữu):

| Cảnh | Script | Layout | Recalc style | Task |
|---|---:|---:|---:|---:|
| Home |367,8/367,1|2,7/2,8|2400,4/2388,1|8573,2/8543,3|
| Map Memory |376,6/423,5|3,0/3,0|2485,5/3542,7|9081,1/12508,3|
| Map Link |372,1/422,4|3,0/3,1|2469,9/3535,7|8988,0/12426,5|
| Map Triple |350,5/426,6|2,9/3,2|2322,5/3529,5|8551,4/12450,0|
| Memory Dễ |433,7/464,8|81,4/89,3|2375,7/3177,4|8711,7/10973,3|
| Memory Siêu khó |441,7/465,2|130,1/137,5|2395,1/2942,2|8886,5/10336,4|
| Link Dễ |489,1/483,7|2,5/2,6|3284,0/3258,2|11524,2/11424,9|
| Link Siêu khó |485,2/498,9|2,7/2,7|3364,2/3429,8|12222,1/12521,2|
| Triple Dễ |526,8/555,3|63,7/66,8|2963,4/3690,2|10740,8/12720,8|
| Triple Siêu khó |614,8/635,5|65,5/67,6|3195,5/4061,3|12185,6/14200,6|

Native animation vẫn có chi phí style/compositor; không gọi transform/opacity
là miễn phí. Mức tăng Task lớn nhất≈3,90s/120s ở map Triple; không có vòng
JS animation nền liên tục. Năng lượng/pin chưa đo, không suy từ số frame.

-100chu kỳ active Home→map→game→Home và20restart bổ sung qua đủ3game:
  pass. Native DOM listener sau GC giữ193 ở mọi checkpoint0–100;
  Home node2856–2857, background host/animation/timer/preparing/blocker=0,
  pool meteor vẫn2. Heap6,17→7,68MB sau warm nhiều owner/cache/JIT, chững
  lại ở đoạn cuối; không dùng phép đo này thay cho plateau soak10phút.
- Bằng chứng60mẫu/trace/soak ban đầu dùng cùng build QA fingerprint
  `476fe059065a316342861d535cd201cb87d3ce9ee0ae47fe0027e94849dc1578`
  (SHA256 index+QA entry). Rà soát tiếp phát hiện đường lỗi cần siết:
  callback orientation cũ không được thay ready source hiện tại; cache
  thất bại giữ cả hai orientation; native cancel ngoài owner phải fallback
  Static. Đã sửa guard và thêm contract test riêng; timeline/geometry của
  đường thành công không đổi. Kết quả benchmark cũ không được trình bày
  thành việc đã chạy lại toàn bộ matrix trên build sửa guard cuối.
- Soak production10phút/cảnh hoàn tất: post-GC plateau phút2–10
  Home8.640byte,map9.296byte,Triple Siêu khó234.116byte (<2MiB).
  Native listener từng cảnh giữ135/131/246; animation0/4/2, observer0/1/1,
  không tăng theo thời gian; dispose idempotent về0host/meteor/timer/
  animation/listener scene. Node toàn trang dao động theo web banner cũ.
- Build sau siết guard:28/28unit runtime/geometry/ads pass; đo lại900mount
  (100mỗi map và mỗi Dễ/Siêu khó của3game), tất cả p95≤4ms.
  Observer map theo dõi thêm scroller trong cùng1ResizeObserver để nhận
  thay đổi chiều cao banner khi root/trail không đổi; có contract UI riêng.
  Reconcile hủy meteor trước khi tăng target, không có batch vượt5slot.
-900mount build cuối: p95 map Memory/Link/Triple2,8/2,6/2,6ms;
  gameplay Dễ/Siêu khó lần lượt1,3/1,1;1,0/0,9;1,3/1,4ms.
  Matrix90tổ hợp dọc/skin chạy lại sau guard pass, thêm18lượt giảm/khôi
  phục chiều cao vùng nhìn và reduced-motion. Lazy scene chunk9,91kB
  (gzip3,88kB), CSS0,96kB(gzip0,46kB); đây là transfer code/CSS,
  phân biệt với0byte bitmap motion mới. Build QA exit0; hai warning
  VITE_PUBLIC_ASSET và sound mixed import đã có trong baseline G0.

#### Phản hồi hình ảnh và thanh cuộn —27/10

- Chủ dự án mới thấy cá trong mẫu trước: xác nhận rollout đã có thác,
  đom đóm/lá theo vùng an toàn; gợn sóng và cây lắc lư chưa thuộc4nhóm
  đã chốt, không tự bổ sung. Map tăng nhận biết trong ngân sách: nước0,20,
  điểm đom đóm6px, lá sáng hơn; game giữ mật độ/nhịp cũ. Texture nước
  bỏ cạnh oval di chuyển cùng dải để chu kỳ32px nối khít, clip vẫn tĩnh.
- Phát hiện sprite dùng travel cố định làm đom đóm/lá bị cắt ở vùng nhỏ.
  Geometry nay fit cả hình chữ nhật sau xoay và travel vào envelope;
  tính một lần khi dựng, không per-frame. Native DOM kiểm sáu mốc timeline
  ở320/412/900dọc pass, pure math kiểm cả các envelope nhỏ và map=true.
  Tổng29/29unit;16/16case UI áp dụng qua3profile pass,8skip có chủ đích.
- Theo yêu cầu mới, chỉ ẩn scrollbar của `.adventure-map-scroll`, giữ
  overflow-y:auto/tabIndex/chuột/cảm ứng. Không ẩn scroll ở popup/toàn app.
  Source CSS và bbox cập nhật trong preview4194; video dọc32s thực tế
  lưu tại runtime/qa/animated-backgrounds/map-current.webm, không commit.
-75/75regression dọc pass (ngoài real meteor soak đã có kết quả riêng):
  shell/layout/startup/cleanup/effects/fullscreen/restart/wave/media.
  Fixture layout cũ bị khóa độ khó đã được cấp prerequisite hợp lệ theo
  rulesVersion hiện hành; không thay luật game/threshold/assertion.
  Các test resize dùng metadata portraitOnly để giữ4lần resize dọc trong
  config task; config chuẩn vẫn kiểm dọc/ngang như cũ. Wave12/12pass.
- Real meteor soak10phút pass:114animationend thật, pool2 không đổi,
  post-GC plateau≈5.224byte;1scheduler. Không thay10phút bằng clock giả.
  Các lượt chạy trước đã dừng có chủ đích để sửa fixture/chọn profile dọc;
  kết quả75/75 cuối là process hoàn tất exit0, không suy từ partial output.
- Đã đo thêm3cặp120s trên build có chỉnh hình/thanh cuộn, tự tìm pose
  có5target thật(water,fish,fish,firefly,leaf) rồi dùng cùng pose cho off/on.
  Không gọi số đo4target cũ là bằng chứng đầy đủ cho5target cuối.
-6/6mẫu cuối pass cùng pose scrollTop7536/900×1024DPR1:5target,14node,
  0timer,1observer; p95 delta tối đa0,20ms,p99≈0,input-dispatch+0,60ms,
  gap delta tối đa+0,01935điểm phần trăm. Layer tổng24→30(+6, đúng trần
  Light), không layer vẽ cả trail. Giữ outlier off1072,8ms/on553,7ms,
  0LongTask>50ms; không bỏ mẫu hoặc tuyên bố không có jank.
  Fingerprint build đo lại:
  `ca349da4a48f39542a3150eac600a468820b788e1560afcd6f51a239869af0ed`.
- Chốt29/29unit,16/16UI dọc áp dụng/8skip có chủ đích, wheel thật vẫn
  cuộn sau khi ẩn scrollbar. Ca pause tổng hợp giữ pose đã có chuyển động;
  trace xác nhận pose khác có thể no-safe-region hợp lệ, không giảm
  assertion để ép pass.900mount cuối: p95 map3,1/2,7/2,9ms;
  game Dễ/Siêu khó1,5/1,2;0,8/0,8;1,1/1,5ms, đều≤4ms.
- Matrix90tổ hợp/3viewport/5skin và8trace15s đã chạy lại trên nguồn cuối.
  Root Paint off/on map5target2/2,Memory18/18,Triple Dễ18/18,
  Triple Siêu khó17/17; layer target map8×54,17×11,17×11,6×6,12×9.
  Không có vùng raster dài mới; raw RGBA bounds chỉ là ước tính.
- Cold cuối chờ loading biến mất và trial click xác nhận nút nhận thao tác:
  off/on666/553ms,547/667ms,599/616ms (delta−113/+120/+17ms).
  Có1mẫu on chậm>100ms, không lặp theo nhánh on; giữ toàn bộ mẫu.
  Không request scene/ambient trước usable, không preload-unused mới.
  Số đo DOM-visible trước đó là mức readiness yếu hơn, không thay cho bộ này.
- WMI cuối: màn PC1920×1080/144Hz trên AMD; GTX1650Ti không có mode active.
  Kiểm lại cả33cặp với B=1000/144 thay cho median RAF vẫn đạt ngưỡng
  delta frame/gap. Đây vẫn là screening bằng RAF, không chứng nhận mọi
  physical presentation. S22/Android browser thực, GPU allocation driver,
  pin/nhiệt độ còn chưa xác minh. ADB27/10 danh sách thiết bị rỗng.
- Live fade bị hủy ngoài owner nay commit ảnh đã decode bằng fallback tĩnh;
  cancellation do owner vẫn trả cancelled. Nguồn orientation thất bại báo
  về owner FAILED để không tự thử lại khi popup đóng; callback stale bị bỏ.

### G5 — review riêng và bàn giao27/10

- G4 commit `c43e087`. Sau commit, cùng agent đọc lại diff riêng, đối chiếu
  plan với ownership/coordinator/facade/geometry/source/transition/CSS và
  test changes. Không gọi đây là review độc lập; chưa có reviewer độc lập.
  Không tìm thấy lỗi còn lại trong phạm vi local đã kiểm chứng.
- Chạy lại sau review:
  - `node --test tests/unit/ambient-background-runtime.test.js tests/unit/ambient-background-geometry.test.js tests/unit/ads.test.js`:29pass.
  - `node scripts/ambient-source-lock.mjs --check`:7nguồn/metadata khớp.
  - `npm run check`:exit0,223moduleJS/CSS ownership và các regression
    contract hiện hữu pass,17ads test pass; không làm yếu assertion/budget.
  - `npm run build`:exit0,build sản phẩm thông thường; không có
    `ambientProbe` trong dist. Warning public-asset/mixed sound import
    đã có ở baseline, không thêm preload-unused do motion.
  - `npx playwright test --config playwright.ambient-runtime.config.js tests/ui/ambient-background-scenes.spec.js`:
    16pass/8skip có chủ đích qua3profile dọc, process exit0. Bao gồm
    native bounds, source/fade/cancel, wheel thật/scrollbar, banner-height,
    popup/hidden/master/reduced-motion/stale-load. Không lặp suite rộng
    hoặc soak khi nguồn sản phẩm không đổi sau G4.
- Rà diff cuối: không QA/log/ảnh/video/file thử tạm trong commit G4/G5;
  công cụ đo lặp lại được giữ làm source. Không stage thay đổi có sẵn,
  Firebase/config hay kế hoạch Sự kiện/Nhiệm vụ khác. CONTEXT chỉ stage
  riêng section nền động, giữ nguyên phần working tree của task khác.
- API facade cũ, `meteorEffects`, effect ID/catalog, save format2,
  gameplay/kinh tế và Firebase giữ tương thích. Không dependency/video/
  GIF/WebGL/RAF nền liên tục, không bitmap mới, không APK/deploy/push/rules.
  Skill trong lượt triển khai: không skill tạo ảnh; SVG/CSS đủ. Chỉ đọc
  computer-use để định tuyến, không nhận là đã dùng runtime skill đó.

| Gate | Kết quả thật |
|---|---|
| G0 | PC baseline/inventory/contract đã có; thiếu baseline S22 thật |
| G1 | Mẫu Memory đã duyệt; Home tĩnh theo quyết định chủ dự án |
| G2 | Lifecycle/owner/scheduler/facade và release đã kiểm chứng local |
| G3 | Map/ba game và fallback/crop/source đã triển khai, kiểm live dọc |
| G4 | PC software A/B,100chu kỳ/soak/skin/trace đạt; chưa chốt S22/physical GPU |
| G5 | Tự review riêng, critical rerun/check/build và receipt hoàn tất |

Phần chưa xác minh: S22 thật (ADB không có thiết bị), browser Android/
WebView thực và native fullscreen ad/foreground trên máy đó, physical
presentation/end-to-end input/GPU driver allocation, pin/nhiệt độ. Màn
ngang sau chỉnh do chủ dự án tự kiểm. Không dùng PC emulation hoặc RAF
để thay các bằng chứng này, không nhận toàn bộ nghiệm thu thiết bị đã đạt.

## M1 — mẫu chi tiết bản đồ, 27/10/2026

- Yêu cầu bổ sung và câu trả lời chủ dự án: chỉ bản đồ có đèn sáng/tối,
  gợn nước, ếch nhỏ trên lá; game/Home giữ nguyên. Mẫu opt-in qua QA probe,
  giữ mặc định cũ trong M1; phê duyệt cụ thể được ghi bên dưới, cho phép
  tiếp tục M2 sau kiểm chứng M1. Không mở lại G0–G5.
- `mapDetails.js` sở hữu metadata/SVG và timeline28s: nghỉ, lấy đà, nhảy
  xuống/gợn, bơi và quay về. Đèn9s/đom đóm7s, không timer hay RAF sản phẩm
  mới. Chọn WAAPI thay điều phối JS từng pha để hủy trọn theo scene cũ.
- Native map sample412×915/DPR2:15node,4handle,1observer,0timer; LayerTree
  có lá22×16, gợn21×7, ếch14×11, fly6×6, lamp31×37 CSSpx. Toàn envelope
  tránh đường/node/chest/UI, không layer toàn trail. Các vùng130×110source
  bổ sung cho320px; source lớn hơn bị cell150px che nên fallback đúng.
- Tự review riêng phát hiện lá tĩnh cần một compositor slot. Đã thêm
  `reservedSlots` hữu hạn vào phép tính capacity của owner, không đổi
  meteor eligibility. Renderer tính pond cost3 (2timeline+1backing),
  runtime chặn oversubscribe kể cả lúc layout refresh/sao băng đang chạy.
  Giữ nguyên5handle/24node/6layer, không sửa budget file.
- Kiểm tra:13/13unit geometry/runtime, gồm meteor/static-slot contract mới;
 19pass/8skip UI qua320/412/900dọc. Mỗi khổ kiểm101pose của quỹ đạo thực,
  100toggle, reduced-motion/suspend/dispose; regression nguồn lỗi/stale,
  wheel/popup/ba trò vẫn đạt. Source-lock7ảnh/metadata cũ khớp; không bitmap
  mới. Tại M1, metadata chi tiết mới chưa nằm trong source-lock cũ;
  M2 bổ sung lock sau khi chủ dự án duyệt mẫu.
- Giữ log lần fail: thử đầu chưa có pond an toàn trên320; đã bổ sung vùng
  nhỏ, không giảm buffer tránhUI. Assertion0timer trong test mẫu ban đầu
  sai hợp đồng vì map vẫn đủchỗ cho scheduler sao băng gốc; sửa thành≤1,
  off vẫn bắt buộc0. Budget nguồn không đổi. Lần check song song browser
  vượt Triple generator p9527,50ms/20ms; chạy lại riêng đạt, không đổi test.
- Chứng cứ mới nằm tại `runtime/qa/animated-backgrounds/map-details-*`;
  không stage log/ảnh/video/file QA tạm. Skill đã thực dùng:
  `clarify-ambiguous-requirements` để chốt phạm vi map-only; không imagegen,
  SVG/CSS đủ cho mẫu. Chưa đo S22 thật; ngang do chủ dự án tự kiểm.
- Chủ dự án đã trả lời **“Duyệt mẫu hiện tại”** sau video32s và3cặp A/B
  sơ bộ10s/arm. p95 off/on7,1/7,1;7,1/7,1;7,2/7,1ms; p99 tối đa+0,1ms.
  Trusted pointer dispatch max off2,6/2,9/2,9ms, on2,5/2,1/2,6ms (không
  thay end-to-end input). LayerTree off27/on32 ở cả3cặp; LayoutCount2/2,
  style recalc on không tăng,0LongTask/0layerPainted event trong cửa sổ
  đo; đây là quan sát CDP, không chứng nhận physical GPU presentation.
  100mount warm p952,0ms≤4ms, listener131 ở mọi checkpoint20chu kỳ;
  post-GC heap4.870.832→5.054.060B; node/handle nền giữ15/4 qua checkpoint.
- Soak đủ10phút:11checkpoint, plateau phút2–10 chỉ2.604B≤2MiB,
  listener131 ổn định; dispose node/handle/observer/timer scene về0,
  chỉ còn9listener của app owner chung. Build hash index/probe giữ nguyên
  suốt phép đo. A/B sàng lọc đạt cả Bmedian6,9ms và Bphysical1000/144ms;
  max gap delta0,0699điểm%≤0,5; giữ outlier off34,7ms/on41,6ms, không
  xóa mẫu. Đây là3cặp sơ bộ10s/arm, M2 sẽ kiểm đủchu kỳ trước bàn giao.
- Sau tự review: `npm run check` exit0 (224JS/17ads), `npm run build`
  exit0 và `git diff --check` đạt. Không gọi tự review là độc lập.

## M2 — bật chi tiết bản đồ đã duyệt

- M1 commit `62d1156`; chủ dự án duyệt mẫu trước rollout. Bật mặc định
  `mapDetails` trong binding của cả ba bản đồ. Game/Home giữ preset cũ;
  `meteorEffects`, facade, gameplay/save/Firebase không đổi.
- Source lock tái sinh từ generator, thêm12vùng nguồn pond/lamp đã duyệt
  vào metadata ảnh map; hash7bitmap gốc không đổi. Không sửa output tay.
- Regression bản mặc định:19UIpass/8skip qua320/412/900dọc, gồm100toggle
  và101pose mới mỗi khổ, nguồn lỗi/cancel, scroll/popup/reduced/ba trò.
  `npm run check` sau rollout exit0,224JS/17ads và contract hiện hữu đạt.
- Production matrix:45tổ hợp tại vị trí mở map +45tại vùng cóếch
  (3map×5skin×3khổdọc), tất cả đạt. 45poseếch gồm15pose chỉpond và30pose
  pond/fly/lamp; không chồngUI/tràn ngang hoặc lỗi trang. Mỗi lượt kiểm
  chiều cao trừ80px/khôi phục và reduced-motion. Đã xem ảnh thật mẫu
  Storybook412px sau rollout; hình nhỏ, không đè đường/node, nội dung UI
  tự nhiên. Fallback khi không có vùng phù hợp vẫn hợp lệ.
- Build sản phẩm sau rollout exit0, không chứa `ambientProbe`; QA probe
  chỉ ở build QA riêng. Chưa có S22 qua ADB lần kiểm27/10; không APK,
  deploy/push/rules. Phần bộ nhớ10phút dùng đúng cùng implementation
  của M1; M2 chỉ đổi default binding và metadata lock, không đổi timeline.
- Lượt A/B32s đầu không hoàn tất vì công cụ QA bật lại LayerTree nhưng
  Chrome không phát snapshot mới (`LayerTree snapshot unavailable`). Giữ
  log lỗi riêng; sửa công cụ local để lấy snapshot đầu một lần và giữ
  cập nhật từ event trong cùng cửa sổ đo. Không sửa game/ngưỡng để chạy lại.
- A/B rollout cuối:3cặp×off/on×32s, đủ chu kỳ28s; cùng hashindex/probe
  trước/sau, chạy tuần tự không chồng browser benchmark/check/build.
  Delta p95 tối đa+0,2ms, p99+0,3ms, missed-gap+0,0218điểm%, pointer
  dispatch p95+0,6ms; đều đạt ngưỡng cũ ở Bmedian6,9ms và144Hz.
  LayerTree off27/on32 (+5≤6), LayoutCount5/5 mỗi cặp,0LongTask/
  layerPainted event/pageerror trong cửa sổ. Giữ max off28,5/on18,2ms,
  không loại outlier. Không nhận đo được physical presentation/GPU/pin.
- Tự review M2 riêng: chỉ đổi default và generator/source-lock được duyệt,
  không đụng timeline sau M1; chạy lại13unit và source-lock đều đạt.
  Critical rerun3UI trên3khổdọc sau tự review đạt, diff whitespace sạch.
  Các file/log/ảnh QA và nội dung CONTEXT/task gameplay đồng thời không
  thuộc commit. Đã tách ghi chú task khác lọt vào commitM1 ngay khi kiểm
  phát hiện, giữ nguyên working file của task đó; M1 cuối là62d1156.
