# Nền động — receipt triển khai chung

Ngày 26/10/2026. Phạm vi: `ANIMATED_BACKGROUNDS_PLAN.md`, toàn G0–G5;
commit riêng từng phase theo yêu cầu bổ sung. Không deploy/APK/push/rules.

## Trạng thái

- G0: hoàn thành inventory và baseline PC độc lập; thiếu thiết bị S22 thật.
- G1: đã có ứng viên Home/Memory tách khỏi entry sản phẩm; đang kiểm và chuẩn bị mẫu duyệt.
- G2–G5: chưa triển khai; rollout phụ thuộc phê duyệt mẫu cụ thể tại G1.
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
- Home: một lòng thác nguồn độc lập dọc/ngang, 2dải nước opacity.14,
  native translateY32px/3.2–3.55s. Không thêm scheduler sao băng; hai slot
  sao băng sản phẩm vẫn là baseline. Nước chỉ nằm trong clip nhỏ.
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
- Performance G1 và hình/video: đang chạy, chưa kết luận pass.
- Chưa chạy full check/build cuối task,100chu kỳ toàn app,10phút soak,
  regression G2–G4 hoặc đo S22. Không dùng một phase thay nghiệm thu G5.

## Review và skill

- Chưa review sau implementation cuối. Review G1 sẽ là tự review riêng;
  không gọi là review độc lập. Chưa có reviewer độc lập được giao.
- Đã đọc skill computer-use để kiểm routing; chưa điều khiển Windows bằng
  skill này nên không nhận là đã dùng. SVG/CSS đủ cho pilot, không imagegen.
