# Nền động nhẹ — kế hoạch trước triển khai

Ngày 26/10/2026. **Chỉ phân tích và lập kế hoạch chi tiết. Chưa triển khai
runtime, tạo asset động, đổi giao diện hoặc phát hành.** Đây là kế hoạch
hiện hành duy nhất của task nền động; các kế hoạch phần thưởng trước đó đã
hoàn tất, giữ làm lịch sử và không mở lại.

**Cập nhật triển khai26/10:** Chủ dự án đã giao toàn G0–G5, commit từng
phase; trạng thái ở receipt và CONTEXT. Phần “chỉ lập kế hoạch” là lịch sử.
Kiểm ảnh G1 phát hiện Home thực tế dùng ảnh vườn tại `home-menu.css`, che
kín nền body sao/thác. Chủ dự án đã chốt **giữ ảnh vườn hiện tại; Home giữ
tĩnh khi không có vùng phù hợp**. Không đổi ảnh Home hoặc animate hình
trong card chọn trò. Quyết định này thay ứng viên thác Home trong bảng
cảnh/G1 bên dưới; pilot động duyệt trên hồ Memory, Home kiểm fallback.

**Điều chỉnh sau duyệt mẫu:** cá phải bơi đầu đi trước; thêm cá ở vùng hồ
giữa còn lộ, đổi bớt một đom đóm để tổng chuyển động trong Memory không
tăng. Trong game tiết chế, ưu tiên độ hoàn thiện và chi tiết ở bản đồ.
Chủ dự án chỉ yêu cầu agent kiểm dọc từ mốc này; màn ngang chủ dự án tự
kiểm. Vẫn triển khai đúng metadata/crop ngang, không nhận đã kiểm live
ngang sau mốc điều chỉnh. Không tăng ngân sách tổng hay sửa gameplay.

## 1. Mục tiêu, quyết định đã chốt và giới hạn

Chủ dự án đã xác nhận:

- Áp dụng ở **trang chủ, bản đồ và cả ba màn chơi** Memory Match, Link
  Connect, Triple Connect. Các tab Hồ sơ/Nhiệm vụ/Sự kiện/Cửa hàng/BXH/Cài
  đặt và nội dung popup không thuộc phạm vi thêm nền động.
- **Giữ ảnh nền hiện có**, bổ sung chuyển động nhẹ ở cảnh vật phù hợp.
  Không thay bố cục, theme thẻ, skin hoặc vẽ lại bộ nền.
- Thiết bị thử: **Web PC và Samsung S22 Android**. PC/browser/OS, biến thể
  S22/SoC, Android/browser/WebView, DPR và tần số quét phải ghi trong lần đo;
  chưa có kết quả trực tiếp trên các thiết bị này cho task mới.
- Thác nước, cá bơi, đom đóm, lá rơi là các nhóm chuyển động cần thiết kế;
  không bắt mỗi nền đều chứa đủ bốn nhóm.

Thành công nghĩa là cảnh sinh động, thao tác/gameplay/độ rõ thẻ giữ nguyên,
không leak, có mức nhẹ/tĩnh và có bằng chứng chi phí trong ngân sách bên
dưới. Không cam kết chi phí tuyệt đối bằng0: chuyển động vẫn dùng GPU/CPU/
pin. Chỉ kết luận không gây suy giảm đáng kể sau so sánh A/B cùng thiết bị.

Ngoài phạm vi: gameplay, kinh tế, Xu/vé/chữ, Firebase/rules, schema/key save,
âm thanh cảnh nền, camera/parallax theo con trỏ/gyro, thời tiết toàn màn,
video/GIF nền, WebGL engine, quảng cáo, APK và deploy. Không khôi phục các
kế hoạch runtime cũ từ Git history. Lượt kế hoạch này không sửa code.

## 2. Kết quả kiểm tra hiện trạng

| Owner/source hiện có | Kết quả | Hệ quả thiết kế |
|---|---|---|
| `style.css` body background | `cover`, center; đổi theo `data-active-game`, có ảnh dọc/ngang; Android build đổi background attachment | Lớp động cần cùng phép crop, không tự vẽ toàn cảnh khác |
| `js/gameShell/gameBackgroundTransition.js` | Preload/decode3nền đúng orientation, cache URL, timeout8s, generation và lớp fade220ms | Giữ nguyên startup/transition; motion chỉ chạy khi nền đúng cảnh đã ổn định |
| `js/bootstrap.js` | Đã chờ nhóm nền tĩnh khi startup | Không thêm motion asset vào điều kiện hoàn tất loading |
| `js/backgroundEffects.js` | Hai sao băng tái sử dụng, tối đa1timer; setting/visibility/reduced-motion/eligibility đã có | Tái dùng quyền bật/tắt; không thêm một scheduler sao băng chạy chồng |
| `appPageLifecycle`, `appNavigation`, `gameShellLifecycle` | Page/round có scope; sao băng chỉ hợp lệ Home/map, tắt lúc gameplay | Giữ eligibility sao băng; scene mới có scope gameplay riêng |
| `js/gameShell/gameShell.js` | Mount/unmount/restart qua scope, `data-shell-paused` | Nối vào shell owner; không điều khiển vòng đời từ HUD tick |
| `adventureMap.js`, `styles/adventure.css` | Trail cuộn, ảnh lặp theo chiều dọc; token hiện tại660px, background width440px | Không tạo node theo mỗi màn/chapter; khác hệ tọa độ `cover` |
| Cài đặt `Hiệu ứng nền` | UI đã có; key bền vững `settings.meteorEffects` | Dùng làm master switch, không thêm setting/key tương tự |
| `js/effects/effectQuality.js` | Quality/particle budget dành cho gameplay effect | Tham khảo cách fallback, không dùng chung pool/quota của gameplay |
| `js/modal.js`, `ads/adService.js` | Modal có owner; ad subscribe hiện chỉ là consent, chưa là trạng thái fullscreen | Cần suspend hook cụ thể; không giả rằng subscribe consent phát sự kiện che màn |

Đã xem trực tiếp **9ảnh nguồn**: Home dọc/ngang, ba game dọc/ngang và
`public/assets/adventure/moonlit-garden.webp`. Đây là xem ảnh nguồn, chưa
phải nghiệm thu screenshot game thật ở các viewport.

- Home/Link: vách núi, thác ở rìa; khoảng trời giữa giữ yên.
- Triple: thác, lá tím và pha lê ở rìa; không thêm cá vào vực trời.
- Memory: hồ, cổng hoa và đèn; phù hợp cá/đom đóm/lá quanh bờ.
- Map: hồ/thác nhỏ/cây ở hai bờ, ảnh texture lặp; đường và node màn ở giữa.
- Một số CSS fog/cloud cũ còn trong `style.css`; phải inventory call site
  và DOM thực ở G0, không mặc định chúng đang chạy hoặc xóa tiện trong task.

## 3. So sánh phương án và lựa chọn

| Phương án | Ưu điểm | Failure mode/chi phí | Quyết định |
|---|---|---|---|
| Animated WebP/GIF/video toàn màn | Ít logic điều khiển từng vật thể | Decode/băng thông/pin, khó giảm từng phần, crop/loop, vùng lớn, đổi ảnh gốc | Loại |
| Canvas/WebGL phủ toàn màn | Linh hoạt nhiều hạt/biến dạng nước | Vòng render liên tục, buffer theo DPR, context/lifecycle, thừa cho vài chi tiết | Loại cho phạm vi này |
| CSS keyframes cho vài lớp nhỏ | Gọn, trình duyệt chạy timeline | Ownership/pause/completion phải quản lý rõ; class restart dễ phát sinh mẹo reflow | Khả thi, dùng làm phương án dự phòng kỹ thuật nếu pilot chứng minh tốt hơn |
| **Lớp DOM nhỏ + SVG/texture tĩnh, Web Animations API chỉ transform/opacity** | Pause/cancel theo handle/scope, không JS mỗi frame, dễ kiểm số animation | Vẫn có layer/GPU cost; cần đo clipping/compositing thực | **Chọn làm pilot và rollout** |

Không thêm thư viện animation. Chỉ một đường animation cho mỗi phần tử;
không cho CSS keyframe và WAAPI cùng điều khiển transform của cùng node.
Wrapper định vị và child chuyển động có ownership rõ. Không tạo engine
particle tổng quát hoặc abstraction để dành.

Transform/opacity là hướng giảm layout/paint, **không tự bảo đảm compositor
hay miễn phí**. `clip-path`, mask, SVG và layer lớn đều cần trace. Không
animate filter/blur/shadow/path/mask/background-position/top/left/size;
`will-change` chỉ đặt trên target đang chạy khi phép đo cho thấy cần, gỡ
khi dừng. Không promote root toàn màn hoặc toàn ảnh nền thành một layer
động chỉ để vài điểm sáng chuyển động.

## 4. Phân bổ cảnh và mật độ đề xuất

Đây là art direction đề xuất trong kế hoạch; vị trí/mask cuối đóng băng ở
G1 sau thử ghép trên screenshot thật. Không bắt tăng mật độ nếu vùng lộ ít.

| Cảnh | Chuyển động chính | Điểm phụ | Tránh |
|---|---|---|---|
| Trang chủ | Tối đa2vùng thác nhỏ ở mép | Sao băng hiện có thưa, cùng tổng ngân sách | Cá/đom đóm bay giữa trời; mây lớn phủ màn |
| Bản đồ cả ba trò | Thác nhỏ đúng texture,1cá ở vùng hồ lộ | Vài đom đóm, tối đa1lá khi đủ khoảng trống | Node theo từng màn, cá xuyên đường/node, overlay toàn trail dài |
| Memory | 1–2cá nhỏ sát bờ hồ nhìn thấy | Đom đóm,1lá thưa | Bơi qua bàn thẻ/HUD; nhấp nháy như báo nhận quà |
| Link | 1–2vùng thác nhìn thấy ngoài bàn | Sao sáng rất nhẹ nếu còn ngân sách; mặc định không sao băng trong game | Chạy hạt theo đường nối hoặc giả feedback gameplay |
| Triple | 1–2vùng thác rìa | 1lá tím thưa; pha lê vẫn tĩnh trong đợt đầu | Hạt che khay, lá bay qua thẻ/khay, thêm shimmer nhiều lớp |

Số tối đa trong bảng là theo cảnh, không cộng thành hàng chục vật thể.
Giới hạn tổng ở mục8 thắng mọi preset. Màn320px hoặc bàn lớn che gần hết
cảnh thì loại bớt hoặc giữ tĩnh; không ép hiệu ứng chen vào vùng thao tác.

## 5. Timeline và cách vẽ từng nhóm

Các chuyển động này chỉ trang trí, không truyền tải trạng thái game. Không
gắn completion của animation với gameplay, thưởng hoặc lưu dữ liệu.

### 5.1. Thác nước

- Ý nghĩa: làm thác có sẵn chảy nhẹ, giữ phong cách/trật tự lớp của ảnh gốc.
- Vùng clip tĩnh bám lòng thác, tránh đè đá/kiến trúc. Dùng texture nước nhỏ
  có alpha và mép mềm được bake sẵn; hai dải lặp khít bằng translateY,
  không animate background-position hoặc blur.
- Pha vào150–250ms opacity thấp; pha chảy2,5–4s/chu kỳ theo tỷ lệ cảnh;
  pha resolve về nền tĩnh khi pause/ẩn/chuyển cảnh. Chu kỳ native liên tục
  chỉ được bật khi gate hiệu suất đạt; không RAF JS.
- Tối đa2vùng thác, mỗi vùng2dải; vùng cao không làm texture dài cả màn.
  Opacity dự kiến0,08–0,20, dịch chuyển theo chu kỳ texture, không nhấp sáng.
- Vùng raster/repaint mong đợi chỉ trong lòng thác; trace xác minh. Mask
  tĩnh vẫn gây paint lớn thì đơn giản hóa vùng, giảm hoặc tắt primitive.
- Interrupt/cancel xóa lớp động, ảnh gốc còn nguyên. Reduced-motion và tier
  tĩnh không có animation hoặc texture motion cần tải.

### 5.2. Cá bơi

- Chỉ ở hồ Memory/map; silhouette nhỏ màu trầm, không cá trên trời/vực.
- Tĩnh dưới mặt nước, opacity khoảng0,12–0,28, chiều dài12–22CSSpx.
  Fade vào200–300ms → bơi theo đường keyframe ngắn6–10s → fade ra300ms;
  nghỉ8–16s trước lượt kế tiếp. Không chạy xuyên toàn màn.
- Tối đa2cá standard,1cá light,0cá khi không có đường bơi an toàn. Thân cá
  là SVG tĩnh rasterized theo trình duyệt, chuyển transform/rotate/opacity;
  chưa làm rig vây/đuôi độc lập hoặc sheet nhiều frame.
- Đường bơi được duyệt trước theo vùng hồ, không collision simulation mỗi
  frame. Một nhóm có tối đa1animation/target. Tránh board/HUD/node/ad từ
  lúc định tuyến; không dùng opacity của bàn để che lỗi vị trí cá.
- Rời trang/hide/cancel dừng ngay, không bù quãng đường khi quay lại.

### 5.3. Đom đóm

- Chỉ gần bờ cây của Memory/map, không cạnh badge/quota/nút nhận quà.
- Mỗi điểm là glow nhỏ tĩnh bằng radial-gradient hoặc bitmap rất nhỏ;
  không animated box-shadow/filter. Di chuyển8–18px, opacity0,10–0,40,
  nhịp chậm3–6s lệch pha, không chớp nhanh.
- Tối đa4điểm standard/2light trong cảnh phù hợp; cụm hoạt động8–12s rồi
  nghỉ8–15s. Không sinh/tạo node theo từng frame; tái dùng slot hữu hạn.
- Pause/cancel giữ nền tĩnh, không báo trạng thái hoặc phát âm thanh.

### 5.4. Lá rơi

- SVG lá nhỏ theo màu tán cây trong ảnh; Memory/map xanh-vàng, Triple tím.
  Không dùng emoji/ký tự font hoặc đổi màu cả bộ cảnh bằng filter động.
- Pha vào150–250ms → trôi xuống quanh bờ4–7s với rotate nhẹ → mờ200–400ms;
  nghỉ10–20s. Tối đa2lá standard/1light, chỉ1lá trong gameplay.
- Đường ngắn trong vùng rìa được duyệt, không phủ toàn viewport. Không có
  vùng an toàn thì bỏ lá đó; không dịch lá qua board để giữ đủ số.
- Cancel/ẩn không tái phát dồn nhiều lá sau resume. Reduced-motion bỏ lá.

## 6. Tọa độ, crop và thứ tự lớp

### Nền body phủ kín

Mỗi asset dọc/ngang có metadata riêng: natural width/height, vùng thác/hồ/
tán, safe zones, đường bơi, vùng fade, hash nguồn. Không suy tọa độ bản dọc
từ bản ngang vì chúng là hai bố cục riêng, không chỉ một ảnh được crop.

Với cover/center: `s=max(W/Iw,H/Ih)`, `ox=(W-Iw*s)/2`,
`oy=(H-Ih*s)/2`, điểm ảnh nguồn `(x,y)` thành `(ox+x*s,oy+y*s)`.
W/H phải là positioning area thực của background, đúng fixed/scroll và
viewport trên từng build; không lấy innerHeight làm chân lý ở mọi browser.
Phần ngoài crop hoặc dưới board/HUD/banner/dock/safe-area không animate.

Đọc geometry khi mount/orientation/viewport/layout thay đổi, ghi theo batch
ở tối đa1RAF được yêu cầu bởi sự kiện; không loop đo layout mỗi frame,
không offsetWidth để restart. Tái dùng số đo/sự kiện layout hiện có khi
đúng owner; không thêm observer toàn DOM. Không khớp tọa độ thì fallback
tĩnh ở vùng đó, không làm sai ảnh để che lệch.

### Bản đồ lặp và cuộn

- Tách descriptor map khỏi body cover. Tái dùng token chiều texture660px
  và background width/position hiện hành từ một nguồn, không lặp magic
  number trong runtime mới hoặc resize texture nền để vừa hiệu ứng.
- Host clip theo viewport bản đồ, nằm dưới path/node. Slot neo theo tile
  texture đang nhìn thấy, tính cả scroll offset và center crop ngang.
- Chỉ tối đa3slot tile giao viewport, vẫn chịu tổng ngân sách. Không dựng
  mọi tile của100màn hoặc mọi chapter. Khi viewport cao hơn ngân sách slot,
  các vùng dư giữ tĩnh thay vì tăng pool.
- Khi cuộn, ưu tiên tạm ẩn hoạt ảnh rồi cập nhật slot theo sự kiện tối đa
  1RAF; resume sau scrollend. Browser thiếu scrollend có debounce hữu hạn
  để nhận biết kết thúc thao tác, không dùng timeout che lỗi đồng bộ.
- Tính exclusion cho node/đường/nút/rương trong vùng đang thấy bằng số đo
  layout hiện có hoặc snapshot geometry hữu hạn; không query toàn map mỗi
  frame. Lá/cá không chặn touch hay tạo vùng cuộn mới.

### Z-order và chuyển cảnh

Thứ tự logic: nền tĩnh → cảnh động → board/HUD/path/node → modal/dock/ads/
feedback gameplay. Root trang trí `pointer-events:none`, `aria-hidden`,
không focus; không thay geometry hoặc stacking context của mọi nút.

Giữ `body.isolation`, kiểm numeric z-index cụ thể ở G0/G1. Không gắn scene
vào `.game-background-transition` ngắn hạn. Trong fade/chuyển source: dừng
và ẩn scene cũ, commit đúng game+orientation+generation rồi mới mở scene
mới; ảnh/animation decode muộn không được mount vào trang kế tiếp.

## 7. Ownership, API và vòng đời

### Nguồn sự thật và ranh giới

- Một coordinator app quản preference/system visibility và **tối đa1scene
  đang sở hữu chuyển động**. Page/round scope được truyền từ caller; module
  nền không import ngược lifecycle để tránh vòng dependency.
- Scene instance sở hữu toàn bộ node, animation handle, observer/listener
  theo scene, decode generation và scheduler của nó. Dispose idempotent.
- Mỗi primitive có slot hữu hạn, tạo lúc mount/reconcile, tái sử dụng;
  không particle pool chung với loot/chữ/gameplay hoặc cache node detached.
- Giữ public exports hiện có của `backgroundEffects.js`. Có thể dùng facade
  gọi coordinator nhưng không đổi API hoặc key `meteorEffects`.
- `initializeMeteorEffects` được gọi lại ở các đường khôi phục hiện có:
  phải idempotent, không thêm coordinator/listener/timer. `disposeMeteorEffects`
  dọn các resource nền do facade sở hữu và gọi hai lần vẫn an toàn.
- `setMeteorSceneEligible(false)` hiện được gọi lúc activate game: nó vẫn
  chỉ chặn sao băng, **không được vô tình chặn cả scene gameplay mới**.
  Master toggle `setMeteorEffectsEnabled(false)` phải dừng mọi nền động.
- Sao băng là phần trong tổng ngân sách, không có scheduler thứ hai độc
  lập. Nếu refactor ownership sao băng, thực hiện gate riêng, giữ2slot và
  hành vi/diagnostics cũ; bổ sung aggregate diagnostics cho toàn scene.

### State machine

Một state machine `STATIC → PREPARING → RUNNING ↔ SUSPENDED → DISPOSED`;
decode fail/capability thiếu/perf hạ mức về STATIC. Không thêm cờ rời rạc
thay source trạng thái. Các lý do suspend dùng token có owner và release
idempotent: đóng một trong hai popup không được resume khi popup kia còn.

Ưu tiên: dispose/scope cũ → user off/reduced-motion → trang ẩn/fullscreen
ad → chuyển nền/modal/paused/scroll → không có vùng visible → quality → chạy.

- Off/reduced-motion: cancel animation, clear scheduler, không tải motion
  asset chưa cần; giữ nguyên nền tĩnh. Thay OS preference có hiệu lực ngay.
- `document.hidden`, pagehide/freeze: pause/cancel, không timer/spawn mới;
  pageshow/BFCache kiểm owner/setting trước resume, không chạy bù thời gian.
- Modal/screen che cảnh: suspend bằng token của modal owner; modal lỗi/
  destroy vẫn release qua cleanup. Không MutationObserver quét mọi modal.
- Quảng cáo/consent fullscreen: hook suspension quanh service call/thời
  gian hiển thị thực, release trong finally/owner cleanup; không giả định
  consent snapshot hiện tại có sự kiện fullscreen. Không sửa provider,
  consent, thưởng quảng cáo hoặc vẽ đè lên quảng cáo thật.
- Gameplay pause/restart/chuyển mode/thắng-thua: nối shell lifecycle và
  paused state; cảnh không quyết định timer/game pause. Feedback chữ/vé/
  thẻ/summary ưu tiên, background có thể suspend bằng token của owner đang
  trình bày khi pilot thấy cạnh tranh GPU; không sửa effect ID/timeline.
- Animation.finished resolve/reject có guard generation; cancellation là
  đường dự kiến, lỗi khác được chẩn đoán. Không catch rỗng hoặc unhandled
  AbortError. Không callback cũ mount node/schedule tiếp sau dispose.

### Scheduler và asset

WAAPI/native timeline lo nội suy. Steady state **không JS RAF/interval**
cho nền. Tối đa1timeout đang chờ cho một đợt cá/lá/đom đóm/sao băng;
scheduler chỉ có mặt khi scene đủ điều kiện. Layout RAF chỉ theo sự kiện,
không tạo object/array/closure mỗi frame.

Không thêm preload vào index/bootstrap; sau cảnh tĩnh sẵn mới lazy load
đúng motion texture cần dùng, `decode()` có stale/cancel/failure path.
Lỗi/tải chậm giữ tĩnh và không khóa navigation; chỉ retry ở lần kích hoạt
hợp lệ tiếp theo, không retry loop. Cache asset hữu hạn theo bytes/entries,
giữ cảnh hiện tại và tối đa1cảnh chuẩn bị; release reference/animation khi
đổi cảnh. Không nhầm HTTP cache với object/decoded texture không giới hạn.

Ưu tiên cá/lá SVG đơn giản, glow procedural tĩnh, một vài texture alpha
nước. Không tạo sheet raster nếu SVG/CSS đủ chất lượng. Nếu G1 cần tạo
bitmap mới thì đọc/dùng skill imagegen ở lượt đó, giữ prompt/source/alpha/
size/hash và đóng gói bằng generator; không tạo asset trong lượt kế hoạch.

## 8. Ngân sách chốt trước pilot

Đây là **mức đề xuất để nghiệm thu**, chưa là số đo hoặc bằng chứng đạt.
Nếu vượt phải giảm/tắt scene, không tăng ngưỡng sau khi test fail.

| Chỉ tiêu tăng thêm do task | Standard | Light | Static |
|---|---:|---:|---:|
| Scene active toàn app | 1 | 1 | 0 |
| Node trang trí mới gồm wrapper/SVG descendants trong scene | ≤40 | ≤24 | 0 hoặc host rỗng |
| Animated targets/handles đồng thời, tính cả sao băng | ≤10 | ≤5 | 0 |
| Timer spawn/đợt đang chờ | ≤1 | ≤1 | 0 |
| RAF/interval nền trong steady state | 0 | 0 | 0 |
| Compositor layers tăng thêm cần đo | ≤12 | ≤6 | 0 |
| Motion asset nén tải cho cảnh hiện tại | ≤180KiB | ≤100KiB | 0 |
| Tổng motion asset public mới cả task | ≤500KiB | cùng bộ dùng lại | 0 tải mới |
| Decoded pixel ước tính cảnh hiện tại | ≤4MiB | ≤2MiB | 0 thêm |
| Đỉnh decode gồm cảnh đang chuẩn bị | ≤8MiB | ≤4MiB | 0 thêm |
| GPU/layer allocation tăng thêm dự toán | ≤8MiB | ≤4MiB | về baseline sau giải phóng |

Node/layer/memory tổng của gameplay có baseline riêng; không lấy ngân sách
particle Effect V2 để chi cho background. Byte decode tính `w*h*4`, chưa
đại diện heap/GPU/driver; trace/LayerTree/Perfetto phải phân biệt ước tính
và số đo. Clip vùng nhỏ nhưng raster thành layer toàn màn vẫn không đạt.
Hai slot meteor cũ nếu được giữ thường trực/ẩn là baseline node đã có,
phải báo riêng, không nhân bản và không giữ animation/timer khi tắt.
Release nghĩa là app bỏ reference/handle không còn cần; không hứa trình
duyệt trả texture/GPU cache cho hệ điều hành tức thì. Kiểm plateau qua
nhiều chu kỳ, không dùng một lần đọc heap để khẳng định GPU đã giải phóng.

**Quality policy:** dùng master Hiệu ứng nền hiện có. Unknown device khởi
động Light; Standard chỉ dùng theo policy đã qua pilot trên nhóm mục tiêu.
Không coi tên S22/deviceMemory/hardwareConcurrency là giấy chứng nhận FPS;
hints thiếu không bị diễn giải thành RAM0. Không thêm dropdown/key save.

Nếu thêm bảo vệ tự hạ chất lượng: tối đa2cửa sổ đo hữu hạn3s sau cảnh ổn
định, bỏ mẫu hidden/transition, không monitor RAF vĩnh viễn. Chỉ hạ
Standard→Light→Static trong phiên, không tự nâng lại gây dao động. Hết
thời hạn phải hủy sampler; route/scope cũ không được hạ scene mới bằng mẫu
cũ. G0 chốt có cần sampler dựa baseline; không thêm vòng đo nếu không cần.

## 9. Đo trước/sau trên PC và S22

### Phương pháp

- So cùng build/cùng save/cùng viewport/DPR/browser/device, motion off và
  on; chỉ thay một yếu tố. Warm cùng asset, chạy ít nhất3cặp mẫu đảo thứ tự
  A/B, tuần tự để tránh runner cạnh tranh. Không dùng Git code lịch sử làm
  baseline của task mới; baseline là working tree đầu lượt triển khai.
- PC: Chrome/Chromium thực dùng, ghi CPU/GPU/refresh; thêm viewport
  1024×900,1366×768/1920×1080 khi kiểm crop. Mobile automation320×740,
  412×915,844×390; thử DPR2/3. S22: dùng kích thước/DPR thực, không ép nó
  bằng viewport412 hoặc coi PC throttle là S22.
- S22 đo browser đang thử web; nếu dùng bản Android/WebView hiện có thì
  ghi riêng runtime/version và lặp kịch bản tương ứng. Không tự tạo APK
  chỉ để hoàn tất task web; không suy số đo browser thành pass WebView.
- Mỗi scenario120s sau warm;10phút soak Home/map và một cảnh gameplay
  nặng nhất trên S22. Ghi nhiệt độ/trạng thái pin/brightness/refresh/power
  saver khi có; không benchmark đồng thời sạc nóng hoặc các tác vụ khác.
- Ghi p50/p95/p99/max frame interval, missed presentation/jank, main-thread
  script/layout/paint/composite, long tasks/LoAF nếu hỗ trợ, input latency,
  node/animation/listener/timer/cache, bytes/heap và layer memory.
- RAF chỉ là chỉ báo, không chứng minh compositor/GPU không drop. Dùng
  Performance trace/Frame track/LayerTree và Android trace khi cần. API
  LongTask/LoAF không hỗ trợ thì ghi thiếu dữ liệu, không coi là0.

### Kịch bản bắt buộc

1. Home idle, đổi card chọn trò; scene không bám vào card/label.
2. Map cuộn chậm/nhanh, đổi chapter/mode, mở/đóng màn chọn độ khó/rương;
   pool không tăng theo100màn/chapter hoặc scroll distance.
3. Cả ba game: bàn phổ biến và bàn lớn nhất hợp lệ, ghép nhanh, hint/shuffle,
   hiệu ứng đặc biệt; chữ/vé/loot xuất hiện đồng thời khi scenario có.
4. Restart giữa cá/lá/thác, chuyển game liên tiếp, thắng/thua/summary,
   fullscreen/orientation/dynamic browser toolbar/safe-area/banner.
5. Toggle nền off/on, reduced-motion thay đổi khi đang chạy, hide/show,
   pagehide/pageshow, mất focus do native overlay, popup lồng, ad lỗi/đóng.
6. Offline/cache-cold, texture404/decode error/chậm, navigation khi decode
   chưa xong; game vẫn mở bằng nền tĩnh, không retry/spawn bù.

### Ngưỡng chấp nhận đề xuất

Tại profile60Hz, mục tiêu chung60FPS tương ứng16,7ms/frame; phải tách mẫu
steady state khỏi startup/network. Nếu thiết bị đang dùng tần số khác,
ghi chu kỳ presentation thực `B`, không áp16,7ms để gọi120Hz là đạt.

- Delta p95 frame interval on−off ≤0,06B (xấp xỉ1ms ở60Hz), delta p99
  ≤0,12B; missed-frame ratio tăng không quá0,5điểm phần trăm.
- Ở scenario60Hz mục tiêu, p95≤18ms/p99≤33,4ms là cổng sàng lọc cùng trace,
  không đổi thành tuyên bố mọi frame dưới16,7ms. Nếu baseline đã ngoài
  ngưỡng thì không báo pass60FPS hoặc mở rộng sửa gameplay ngoài task.
- Input latency p95 tăng≤8ms với cùng chuỗi thao tác; không thêm long task
  >50ms quy được cho module nền. Ghi cả outlier, không bỏ mẫu chỉ vì xấu.
- Mount/reconcile scene CPU p95≤4ms trên thiết bị mục tiêu sau asset sẵn;
  không layout/paint toàn màn lặp lại do nền, không forced synchronous
  layout trong đường animation. Nếu không phân loại được phải trace thêm.
- Sau warm,100chu kỳ Home/map/game/toggle có count tài nguyên trở lại
  baseline. Soak10phút post-GC heap dao động≤2MiB trên PC khi GC đo được,
  không tăng đơn điệu; S22 ghi heap/layers thực có thể quan sát, không suy
  GPU từ JS heap. Dispose không còn animation/timer/listener scene.
- Nền động không nằm trên critical path loading; cold A/B báo thời gian
  home usable, phát hiện regression lặp lại>100ms phải điều tra, không chặn
  startup chờ motion. Không phát sinh preload-unused warning mới.
- Không tăng bất kỳ read/write Firebase theo frame/cảnh; toggle chỉ dùng
  persistence có sẵn như trước. Không asset request/decode lặp vô hạn.

Đạt ngân sách bằng Light/Static là fallback hợp lệ, nhưng nghiệm thu phải
ghi effect nào bị tắt trên cấu hình nào. Không báo “đủ bốn nhóm chuyển
động trên S22” nếu kiểm chỉ chạy nền tĩnh. Năng lượng/pin không có số đo
thì ghi chưa đo, không tuyên bố không tốn pin dựa FPS.

## 10. File dự kiến và ranh giới thay đổi

Chỉ là danh sách dự kiến, G0 chốt sau inventory/diff; không cho phép sửa
toàn bộ các file chỉ vì chúng có tên trong bảng.

| Nhóm | File/module dự kiến | Mục đích |
|---|---|---|
| Orchestration | `js/backgroundEffects.js`, module `js/background/` nhỏ nếu cần | Giữ facade cũ, coordinator/scene/budget; không module server |
| Preset/geometry | Scene descriptors/region metadata cùng module nền | Source/hash/crop/timeline/budget có owner, không nhánh game rải rác |
| Nối route/page | `gameSelector.js`, `appNavigation.js`, `appPageLifecycle.js`, `adventureMap.js` | Truyền scene/owner/map viewport, stop đúng route |
| Nối game | `gameShell.js`, layout/lifecycle hooks đúng nơi cần | Truyền owner/layout/pause, không sửa ba luật game |
| Transition | `gameBackgroundTransition.js` | Chỉ expose/reuse source/orientation/transition boundary nếu cần, giữ preload/cache behavior |
| Blocking overlay | `modal.js`, service ad/owner feedback khi cần | Token suspend/release; không đổi ad hoặc effect nghiệp vụ |
| Presentation | `styles/ambient-background.css` mới, owner hiện hữu tối thiểu | Namespace `.ambient-bg-*`, `--ambient-bg-*`; tránh cascade ngẫu nhiên |
| Asset | SVG/texture nhỏ + metadata/generator nếu bitmap | Không thay9ảnh gốc; source/QA ngoài public bundle |
| Kiểm thử | Contract/unit mới, `tests/ui/ambient-background*.spec.js`, suite cũ liên quan | Ownership/crop/quality/lifecycle/perf/visual |

Không động đến catalog, ledger, cloud/account sync, rewards model, schema,
key setting, Firebase/rules hoặc cổng deploy. Không sửa generated file tay.

## 11. Gate cho lượt triển khai được giao sau

| Gate | Việc làm | Điều kiện đạt |
|---|---|---|
| G0 — baseline/contract | Snapshot working diff, route/stack/texture inventory, đo tĩnh/off trênPC/S22, chốt budget và thiết bị | Có baseline thực; crop/visible zones, API/lifecycle/source owner rõ |
| G1 — pilot ảnh thật | Pilot một vùng thác Home + hồ Memory hoặc map với cá/đom đóm/lá; ghép dọc/ngang ở viewport thật | Giữ ảnh gốc; vị trí không lệch, không che UI, mật độ dịu; kiểm compositor/số đo sơ bộ. Chủ dự án duyệt mẫu trước rollout rộng |
| G2 — lifecycle riêng | Coordinator, facade sao băng, setting/hidden/reduced/modal/pause/cancel; chưa rollout tất cả preset | Idempotent,1scene/1scheduler, no stale decode/loop; test cũ giữ invariant |
| G3 — phủ cảnh | Home/map/ba game, source dọc/ngang, map pool/crop/exclusion và asset lazy/bounded | Mọi cảnh có preset hoặc fallback đúng lý do; no duplicated scenes/startup block |
| G4 — regression và hiệu suất | UI/lifecycle100chu kỳ,10phút soak, A/B PC+S22; tune giảm chi phí trong budget | Đạt ngưỡng/trace/copy/reduced/safe-area; báo đúng phần tĩnh/chưa đo |
| G5 — review/bàn giao | Đọc diff riêng, chạy lại critical evidence, check/build, ghi một receipt chung | Không sửa ngoài scope/leak/rác; đủ evidence; không APK/deploy khi chưa yêu cầu riêng |

**Lượt hiện tại chỉ tạo kế hoạch. G0–G5 chưa thực hiện.** Khi giao triển khai
toàn bộ, đi liên tục qua các gate; chỉ chờ ở G1 khi cần quyết định mỹ thuật
về mẫu cụ thể hoặc blocker thật. Không tự bắt đầu pilot/asset/runtime từ
yêu cầu “chỉ lên kế hoạch”. Không tạo receipt/ảnh QA giả trước triển khai.

### Kiểm thử và lệnh dự kiến

- Unit/contract cho cover transform, region clipping, map repeat slot,
  budget tiers, state precedence, token release, generation, cache LRU,
  rejected/cancelled decode/animation; không test chỉ mirror implementation.
- Giữ regression `background-effects.spec.js` (hai meteor/eligibility/
  100chu kỳ/10phút), game background orientation/preload/error/abort/retry,
  shell geometry/layout/startup/lifecycle/cleanup, map, ad và loot/chữ nếu
  hook owner đó thực sự đổi. Không nới test chỉ để cho phép chạy chồng.
- Mở rộng config hoặc config chuyên dụng: hiện test filename mới không tự
  được mobile projects chọn, và mặc định Playwright đang reduced-motion.
  Phải chọn rõ `no-preference` cho motion/perf và thêm case `reduce`, thêm
  viewport320; không báo matrix đạt chỉ từ default desktop/reduced test.
- Khi triển khai: test mục tiêu trước; cuối `npm run check`, `npm run build`
  cùng browser chạy production preview, không test performance trên Vite
  dev/HMR. Bằng chứng mới vào một receipt của task, không ghi đè log rewards.
- Review sau implementation là bước riêng: đối chiếu plan/diff và chạy lại
  critical tests, ghi rõ reviewer/tự review; không gọi tự đọc là độc lập.

## 12. Nguồn kỹ thuật và trạng thái kiểm chứng lượt này

- [web.dev: high-performance animations](https://web.dev/articles/animations-guide):
  ưu tiên transform/opacity, đo paint và hạn chế will-change.
- [web.dev: compositor layers](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count):
  layer cũng có chi phí quản lý/bộ nhớ.
- [MDN: Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API),
  [cancel](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel):
  quản handle/pause/cancel và đường promise bị hủy.
- [MDN: Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API),
  [reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion):
  tắt chuyển động không thiết yếu theo trạng thái/preference.
- [MDN: Long Animation Frame](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongAnimationFrameTiming):
  chỉ dùng khi hỗ trợ, không thay toàn bộ frame/presentation trace.

Đã đọc source/test/CONTEXT và xem9ảnh tĩnh, đối chiếu tài liệu kỹ thuật
chính thức. Skill `clarify-ambiguous-requirements` thực dùng để chốt phạm
vi, giữ nền và thiết bị PC/S22. Chỉ tạo file kế hoạch này và ghi nguồn mới
trong CONTEXT; không sửa/tạo code, asset, save, rules hoặc setting runtime.
Chưa chạy test/build/benchmark hay kiểm UI live/điện thoại trong lượt lập
kế hoạch; mọi ngưỡng ở trên là acceptance dự kiến, không phải kết quả pass.
