# ARCHITECTURE — Kiến trúc V1.1a

Tài liệu này chỉ mô tả ranh giới module, quyền sở hữu dữ liệu và các hợp đồng kỹ thuật bền vững. Quy tắc gameplay chi tiết không lặp lại ở đây.

## 1. Tổng thể

```text
index.html
   ↓
js/main.js ── cấu hình callback giữa menu, controller và UI
   ├── Memory Match modules
   ├── Link Connect modules
   ├── Shared UI / shop / sound / persistence
   └── public/assets

Vite ──→ dist ──→ Web/PWA hoặc Capacitor Android
```

Kế hoạch chuẩn hóa shell/HUD/layout dùng chung trước khi thêm game mới nằm trong `GAME_SHELL_PLAN.md`.

Khảo sát ownership hiện tại, hợp đồng đích và danh sách xóa theo phase nằm trong `GAME_SHELL_PHASE1.md`. Phase 1 đã chốt giữ nguyên giao diện theo chơi thử của người dùng; kiến trúc Shell sẽ tích hợp theo từng phase.

Phase 2 đã tích hợp `js/gameShell/gameShellConfig.js`: schema/defaults và normalize UI override thuần, không phụ thuộc DOM/state/gameplay. `scripts/generate-game-shell-tokens.mjs` sinh `styles/game-shell/tokens.css` dùng cho hai shell hiện tại; sửa nguồn JS rồi chạy `npm run shell:sync`, không sửa CSS sinh bằng tay. Chi tiết nằm trong `GAME_SHELL_PHASE2.md`.

Phase 3 nối cả hai board vào `js/gameShell/gameShellLayout.js`: hàm fit thuần và kết nối đo viewport/safe area theo một RAF, một ResizeObserver cho shell hiện hành. Các adapter trong `grid.js`/`linkRenderer.js` cung cấp shape, cấu hình trình bày và chỉ ghi kết quả fit; renderer giữ quyền sở hữu tile/path. Controller hủy kết nối khi về Menu. Layout không import gameplay và không đăng ký tài nguyên lúc import; lifecycle toàn ứng dụng thuộc Phase 4. Chi tiết và giới hạn kiểm chứng nằm trong `GAME_SHELL_PHASE3.md`.

Phase 4 tích hợp `gameShell.js` và `gameShellLifecycle.js`: shell trả reference ổn định cho sáu vùng semantic, API mount/update/unmount; mỗi lượt chơi sở hữu registry tài nguyên và callback guard. Controller/selector hủy scope khi đổi round/game; modal trong game có scope con và không gọi callback đóng của round cũ. `legacyShellAdapters.js` nối ID hiện có tới contract, xóa ở Phase 7–8. HUD con thuộc Phase 5; motion strategy thuộc Phase 6. Chi tiết nằm trong `GAME_SHELL_PHASE4.md`.

Phase 5 tích hợp `gameShellHud.js`: patch stats, sao/điểm, Xu, tools, mốc và timer qua reference; so giá trị DOM trước khi ghi, không import state/gameplay. `legacyHudAdapters.js` khai báo reference, formatter và tooltip riêng cho mỗi trò; controller giữ công thức điểm, thưởng và đồng hồ. Tooltip HUD đọc `data-tooltip`, hỗ trợ focus qua `data-hud-info`. Hai trò dùng chung custom property timer, năng lượng và combo. Kiểm tra có chọn lọc và gate thủ công nằm trong `GAME_SHELL_PHASE5.md`.

Phase 6: `gameShellEffects.js` cung cấp registry theo scope, giới hạn theo loại, cleanup và animation transform/opacity. `lootEffects.js` dùng quỹ đạo chung qua preset Memory/Link; adapter Link chỉ truyền nguồn, đích, icon, timing và callback. Xu/điểm/combo, highlight, item collect và FLIP nối registry; canvas vẫn ở renderer riêng với lifecycle chung. Luật thưởng ở game. Chi tiết và gate thủ công: `GAME_SHELL_PHASE6.md`.

- Ứng dụng dùng HTML/CSS và JavaScript ES modules, không có framework UI.
- `js/main.js` là entry point duy nhất; module chức năng không tự bootstrap ứng dụng.
- Các controller phụ thuộc module dùng chung, nhưng không import lẫn nhau. Callback `configure*` nối các luồng cần điều hướng chéo.
- Không có backend. Firebase chỉ là đích Hosting.

## 2. Phân lớp và quyền sở hữu

### Lớp dùng chung

| Module | Trách nhiệm |
| --- | --- |
| `main.js` | Hydrate dữ liệu, khởi tạo dịch vụ và nối callback giữa các khu vực. |
| `gameCatalog.js` | Danh mục game/mode và mapping namespace tiến trình. |
| `gameState.js` | Trạng thái runtime dùng chung và chuẩn hóa dữ liệu đã lưu; không thao tác DOM hoặc `localStorage`. |
| `sessionProgress.js` | Đọc, ghi và xóa phiên theo game/mode. |
| `sessionTiming.js` | Giải quyết thời gian cho màn mới, chơi lại, khôi phục và chuyển màn. |
| `persistence.js` | Cổng duy nhất đọc/ghi gói dữ liệu có phiên bản trong `localStorage`. |
| `gameplayTuning.js` | Giới hạn và nhịp gameplay dùng chung. |
| `motion.js` | Tiện ích thời lượng CSS, tùy chọn giảm chuyển động và phép tính FLIP dùng chung. |
| `coinRewards.js` | Quy tắc Xu theo cặp và hoạt ảnh bộ đếm/thu thập dùng chung. |
| `lootEffects.js` | Hiệu ứng vật phẩm rơi và bay tới HUD dùng chung, không chứa luật thưởng. |
| `ui.js`, `modal.js`, `uiCatalog.js` | HUD, popup gameplay, modal, toast, copy và thời lượng UI chung. |
| `gameSelector.js`, `mainmenu.js`, `gameMenu.js` | Chọn trò, menu chính và menu trong màn. |
| `shop.js`, `shopCatalog.js` | Giao diện mua và catalog/giá sản phẩm. |
| `appearance.js`, `themeCatalog.js` | Quyền sở hữu/trang bị ngoại hình và dữ liệu chủ đề. |
| `sound.js`, `backgroundEffects.js` | Âm thanh và hiệu ứng nền theo cài đặt/vòng đời trang. |

### Memory Match

| Module | Trách nhiệm |
| --- | --- |
| `config.js` | Cấu hình mode, điểm, sao, thời gian, preview và phần thưởng may mắn. |
| `gameController.js` | Vòng đời level, timer, preview, kết thúc và điều hướng. |
| `logic.js` | Luật chọn thẻ, match, miss và hoàn thành. |
| `grid.js` | Tạo/render board và thao tác thẻ. |
| `memoryItems.js` | Catalog, màu cấp và số lượng kho Xem trước/Thời gian. |
| `memorySession.js` | Snapshot phiên Memory Match dùng chung cho controller, kho và phần thưởng. |
| `memoryPreview.js` | Hiệu ứng xem trước 4/8/12/tất cả dùng chung cho kho và phần thưởng. |
| `memorySpecial.js` | Năng lượng, vòng 10 mốc và phần thưởng từ cặp đặc biệt. |

### Link Connect

| Module | Trách nhiệm |
| --- | --- |
| `linkConfig.js` | Toàn bộ cấu hình mode, dịch chuyển, combo, thẻ cao cấp, băng, năng lượng, mốc thưởng và thời lượng hiệu ứng. |
| `linkState.js` | Trạng thái runtime riêng của Link Connect. |
| `linkController.js` | Vòng đời level, xử lý chọn cặp, timer, combo, thưởng, vật phẩm và chống kẹt. |
| `linkBoard.js` | Tạo board, xóa cặp, xáo, băng và các phép dịch chuyển dữ liệu. |
| `pathfinder.js` | Tìm đường trực giao tối đa hai lần rẽ và liệt kê nước đi hợp lệ. |
| `linkRenderer.js` | Patch DOM theo `instanceId`, vẽ đường nối và chạy hiệu ứng thẻ/phần thưởng/dịch chuyển. |
| `linkItems.js` | Catalog và số lượng vật phẩm riêng của Link Connect. |
| `linkEffects.js` | Catalog hiệu ứng đường nối và xóa thẻ. |
| `linkPerformance.js` | Đo số ô được patch và thời gian render trong chế độ debug. |

## 3. Trạng thái và lưu trữ

- `gameState` giữ Xu, cài đặt, ngoại hình và namespace tiến trình `memoryMatch`/`linkConnect`.
- `localStorage` chỉ được truy cập qua `persistence.js`; bản lưu gốc có `schemaVersion`, `revision` và toàn bộ snapshot dùng chung. Key cũ chỉ phục vụ migration.
- Giao dịch thay đổi nhiều miền dữ liệu phải ghi bằng một snapshot; nếu ghi thất bại, caller hoàn tác thay đổi runtime có tính chất mua hàng.
- `sessionsByMode` lưu phiên độc lập theo từng mode, gồm level, thời gian còn lại, giới hạn và thời gian đầu màn. Mỗi trò lưu riêng tiến trình năng lượng/chuỗi không-rơi; Link Connect lưu thêm quy tắc dịch chuyển.
- Sự kiện `storage` phát hiện revision mới từ tab khác. Tab cũ không được ghi đè; dữ liệu chỉ tự hydrate khi không có bàn đang chơi.
- Vật phẩm mỗi trò nằm trong namespace `progress.<game>.items`; không dùng chung tồn kho giữa các trò.
- Dữ liệu đọc từ storage phải được chuẩn hóa trước khi gán vào runtime. Giá trị âm, sai kiểu hoặc vượt giới hạn không được đi thẳng vào gameplay.
- `roundId` là mã phiên runtime: callback bất đồng bộ phải kiểm tra đúng round và đúng board trước khi sửa trạng thái hoặc DOM.

## 4. Luồng render và hiệu ứng

- Memory Match dùng board riêng trong `grid.js`; Link Connect dùng renderer riêng vì cần đường nối, dịch chuyển và tái sử dụng tile.
- Link Connect định danh mỗi tile bằng `instanceId`. Patch chỉ cập nhật ô thay đổi; dịch chuyển dùng FLIP/Web Animations thay vì dựng lại toàn bàn.
- Timing của một lượt FLIP được đọc một lần rồi dùng cho toàn bộ thẻ; board chặn thao tác đến khi vị trí hiển thị ổn định.
- Canvas chỉ dùng cho hiệu ứng cần vẽ theo khung hình như Sấm sét hoặc mảnh vỡ. Mật độ canvas được giới hạn theo `devicePixelRatio`.
- Hiệu ứng DOM tạm chỉ thay đổi `transform`/`opacity`, tự xóa khi kết thúc và tôn trọng `prefers-reduced-motion`.
- Hiệu ứng tạm và animation còn chạy phải được dọn khi bắt đầu round mới hoặc rời màn.
- Trong lúc xáo, board chặn tương tác đến khi hoạt ảnh ổn định. Hiệu ứng thu thập không khóa gameplay.

## 5. Vòng đời bất đồng bộ

- Controller dừng timer cũ trước khi tạo level hoặc rời màn.
- Timeout, animation callback và reward chain không được tác động một round/board mới.
- Scheduler tương thích của Game Shell đăng ký timer/RAF vào scope hiện hành; module ngoài màn chơi dùng scheduler trình duyệt. Listener toàn ứng dụng vẫn là singleton. Modal bị thay cùng ID hoặc hủy theo scope phải dọn listener, node và lịch đóng; không gọi callback tiếp tục của game cũ.
- Khi tab bị ẩn, timer gameplay tạm dừng và âm thanh dừng. Khi quay lại, chỉ khôi phục trạng thái vốn đang chạy.
- Controller checkpoint thời gian theo nhịp cấu hình và khi trang bị ẩn/rời; `sessionTiming.js` là nguồn luật duy nhất để phân biệt màn mới, chơi lại và khôi phục.
- Dữ liệu gameplay được cập nhật trước UI; hiệu ứng chỉ biểu diễn kết quả, không phải nguồn sự thật.

## 6. Tài nguyên và build

- Asset runtime nằm trong `public/assets/`; Vite copy sang `dist/assets/`.
- `themeCatalog.js` giữ metadata. `scripts/generate-theme-manifest.mjs` quét WebP và sinh manifest; mã gameplay không giữ danh sách tên ảnh thủ công.
- JavaScript tạo URL asset bằng `import.meta.env.BASE_URL`; CSS để Vite viết lại URL theo build target.
- `vite.config.js` chọn implementation trình bày chiến thắng cho web hoặc Android qua alias `victory-presentation`.
- Service worker/PWA nằm trong `js/pwa.js` và `public/sw.js`; Capacitor dùng cùng đầu ra web qua profile Android.
- Service worker chỉ cache phản hồi đầy đủ HTTP `200` và bỏ qua request `Range` để không làm lỗi audio tải từng đoạn.
- Service worker gộp yêu cầu cùng URL và giới hạn số lượt tải tài nguyên đồng thời; catalog chủ đề không tạo hoặc giải mã toàn bộ ảnh.

## 7. Nguồn cấu hình

| Nội dung | Nguồn |
| --- | --- |
| Memory Match | `js/config.js` |
| Link Connect | `js/linkConnect/linkConfig.js` |
| Giới hạn/thời lượng dùng chung | `js/gameplayTuning.js` |
| Giá và gói mua | `js/shopCatalog.js` |
| Game/mode/namespace | `js/gameCatalog.js` |
| Chủ đề | `js/themeCatalog.js`, manifest sinh tự động và `themes.md` |
| Phiên bản hiển thị | `js/appMeta.js` |

Không sao chép các con số cấu hình sang controller, renderer hoặc tài liệu kiến trúc. Khi tài liệu cần mô tả hành vi, ưu tiên nêu quy tắc và dẫn về nguồn cấu hình.

Gợi ý Memory dùng `progress.memoryMatch.items.hint`; `gameState.hints` là getter/setter tương thích để HUD, thưởng và thao tác cùng đọc/ghi một kho. Hydration nhập giá trị cao nhất từ các session cũ khi chưa có key kho; giá trị 0 là dữ liệu hợp lệ, không cấp lại. Session mới không ghi Gợi ý và resume không áp số cũ. Kho Link (`progress.linkConnect.items.hint`) giữ nguyên, độc lập với Memory. Cả hai shop cho mua ở menu và trong game.

Phase 7: `memoryMatch/memoryShellDom.js` sở hữu markup Memory, được import đầu tiên trong `main.js`; `memoryShell.js` nối vùng semantic/HUD với core chung. Legacy adapters chỉ còn Link. ID Memory vẫn là hook gameplay/CSS đang dùng. `index.html` giữ settings/audio, không còn bản markup Memory trùng. Xem `GAME_SHELL_PHASE7.md`.

Phase 8: `linkConnect/linkShell.js` sở hữu markup/vùng semantic/HUD/timing presentation của Link. Controller mount shell và cung cấp callback cho `bindLinkControls`; listener gắn scope theo lượt, node dựng một lần. Hai adapter legacy đã xóa. Renderer vẫn quản lý tile/path/shift/băng/hiệu ứng; shell không sở hữu board gameplay. Xem `GAME_SHELL_PHASE8.md`.
