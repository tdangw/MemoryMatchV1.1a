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

Game Shell đã ổn định. `js/gameShell/` sở hữu config, sáu vùng semantic, HUD patch, phép đo layout, lifecycle và registry hiệu ứng. Shell của từng game nối vào contract chung; controller và renderer riêng vẫn sở hữu luật, tile và đường nối. Không còn adapter legacy. Contract đang hoạt động được kiểm bằng `scripts/check-game-shell-contract.mjs` và UI audit; tài liệu phase lịch sử đã được xóa để tránh dùng nhầm làm kế hoạch hiện hành.

`scripts/generate-game-shell-tokens.mjs` sinh `styles/game-shell/tokens.css` từ cấu hình dùng chung; sửa nguồn JavaScript rồi chạy `npm run shell:sync`, không sửa file sinh bằng tay. `ADD_GAME.md` là checklist để tích hợp trò tiếp theo; tài liệu này không cho phép tự động triển khai Triple Connect.

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
| `gameShell/*` | Contract shell, config, HUD patch, layout, lifecycle và registry hiệu ứng dùng chung. Không chứa luật game. |
| `ui.js`, `modal.js`, `uiCatalog.js` | HUD, popup gameplay, modal, toast, copy và thời lượng UI chung. |
| `gameSelector.js`, `mainmenu.js`, `gameMenu.js` | Chọn trò, menu chính và menu trong màn. |
| `shop.js`, `shopCatalog.js` | Giao diện mua và catalog/giá sản phẩm. |
| `appearance.js`, `themeCatalog.js` | Quyền sở hữu/trang bị ngoại hình và dữ liệu chủ đề. |
| `sound.js`, `backgroundEffects.js` | Âm thanh và hiệu ứng nền theo cài đặt/vòng đời trang. |

Game Shell giữ đủ sáu region công khai: `title`, `progress`, `hud`, `milestones`, `frame`, `board`. `progress` là placeholder tương thích rỗng, luôn ẩn; metric thật thuộc `refs.hud`, còn Xu/mốc/sao màn thuộc `refs.milestones`. `gameHudMenus.js` sở hữu trạng thái mở duy nhất, ARIA, Escape/click ngoài và cleanup theo scope mount. `styles/game-shell/hud-unified.css` sở hữu geometry và presentation thanh HUD một hàng; CSS game chỉ giữ trạng thái có ngữ nghĩa và phần board/milestone đặc thù.

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

- `gameState` giữ Xu, cài đặt, ngoại hình và namespace tiến trình `memoryMatch`/`linkConnect`/`tripleConnect`; lịch sử chỉ hydrate các chặng cần dùng.
- Persistence có một owner trong `persistence.js`; `chapterStore.js` sở hữu IndexedDB `memoryMatchAdventure` với transaction profile + chapter. `formatVersion=2`, revision tăng sau durability; các caller phải await boolean kết quả. Migration từ nguồn v1 giữ bản phục hồi, không tự reset hoặc ghi đè bản hỏng/version lạ. localStorage là fallback khai báo rõ cho trình duyệt chưa dùng backend mới; marker primary ngăn đọc/ghi bản v1 cũ khi IndexedDB không khả dụng.
- Giao dịch nhiều miền có một snapshot/transaction; thất bại hoàn tác và chặn các snapshot xếp hàng phụ thuộc, dùng recovery toàn cục để tải lại nguồn đã commit. Cleanup/lifecycle vẫn đồng bộ; snapshot ghi bất đồng bộ không trì hoãn invalidate/cleanup hoặc điều hướng.
- `sessionsByMode` lưu phiên độc lập theo từng mode, gồm level, thời gian còn lại, giới hạn và thời gian đầu màn. Mỗi trò lưu riêng tiến trình năng lượng/chuỗi không-rơi; Link Connect lưu thêm quy tắc dịch chuyển.
- Sự kiện `storage` phát hiện revision mới từ tab khác. Tab cũ không được ghi đè; dữ liệu chỉ tự hydrate khi không có bàn đang chơi.
- Vật phẩm mỗi trò nằm trong namespace `progress.<game>.items`; không dùng chung tồn kho giữa các trò.
- Dữ liệu đọc từ storage phải được chuẩn hóa trước khi gán vào runtime. Giá trị âm, sai kiểu hoặc vượt giới hạn không được đi thẳng vào gameplay.
- `roundId` là mã phiên runtime: callback bất đồng bộ phải kiểm tra đúng round và đúng board trước khi sửa trạng thái hoặc DOM.
- `adventureProgress.js` sở hữu N+3/completion/chặng/rương; `adventureLaunch.js` tải kỷ lục canonical trước replay và giữ cache giới hạn. `adventureRewards.js` sở hữu catalog grant có type và claim một lần, commit cùng wallet.
- `playMetrics.js` đo thời gian thực theo ready/pause/modal/visibility/outcome, không có loop đo hoặc ghi theo frame. `rankingRules.js` sở hữu comparator và lượt liên tục: advance chuyển điểm một lần, restart thay điểm hiện tại, chỉ finalize khi kết thúc thật.

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
- Production build dùng để phát hiện lỗi đóng gói và đo kích thước gzip tại mốc lớn hoặc trước phát hành. Trong phát triển thường ngày, chạy check/test đúng phạm vi thay đổi; không lặp build hoặc toàn bộ UI suite nếu thay đổi không chạm đường build.
- `dist/`, báo cáo Playwright, `node_modules/` và manifest sinh là đầu ra có thể tái tạo và đã được Git ignore.

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

`memoryMatch/memoryShellDom.js` sở hữu markup Memory, được import đầu tiên trong `main.js`; `memoryShell.js` nối vùng semantic/HUD với core chung. ID Memory vẫn là hook gameplay/CSS đang dùng. `index.html` giữ settings/audio, không còn bản markup Memory trùng.

`linkConnect/linkShell.js` sở hữu markup/vùng semantic/HUD/timing presentation của Link. Controller mount shell và cung cấp callback cho `bindLinkControls`; listener gắn scope theo lượt, node dựng một lần. Hai adapter legacy đã xóa. Renderer vẫn quản lý tile/path/shift/băng/hiệu ứng; shell không sở hữu board gameplay.

`check-game-shell-contract.mjs` khóa import/ownership và contract sáu vùng semantic. UI audit kiểm ID trùng, `aria-controls`, geometry toolbar và tương tác giữa các nút con. Toolbar Memory ngang dùng token `hud.landscapeMinWidth`; thay đổi shared shell phải chạy lại contract và audit liên quan.
