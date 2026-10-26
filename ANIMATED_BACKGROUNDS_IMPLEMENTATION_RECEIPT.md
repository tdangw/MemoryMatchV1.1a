# Nền động — receipt triển khai chung

Ngày 26/10/2026. Phạm vi: `ANIMATED_BACKGROUNDS_PLAN.md`, toàn G0–G5;
commit riêng từng phase theo yêu cầu bổ sung. Không deploy/APK/push/rules.

## Trạng thái

- G0: hoàn thành inventory và baseline PC độc lập; thiếu thiết bị S22 thật.
- G1: chủ dự án đã duyệt mẫu Memory hiện tại qua câu hỏi trong chat;
  Home giữ ảnh vườn/tĩnh như quyết định bổ sung. Có mẫu dọc/ngang, A/B và
  LayerTree sơ bộ,2/2unit,8/8Playwright,check pass.
- G2–G5: đang tiếp tục sau phê duyệt G1.
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
