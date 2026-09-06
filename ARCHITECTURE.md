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
| `persistence.js` | Cổng duy nhất đọc/ghi các key `localStorage`. |
| `gameplayTuning.js` | Giới hạn và nhịp gameplay dùng chung. |
| `coinRewards.js` | Quy tắc Xu theo cặp và hoạt ảnh bộ đếm/thu thập dùng chung. |
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
- `localStorage` chỉ được truy cập qua `persistence.js`; các module khác gọi hàm lưu cấp cao.
- `sessionsByMode` lưu phiên độc lập theo từng mode. Trường chung là `mode` và `level`; Link Connect bổ sung quy tắc dịch chuyển, tiến trình năng lượng và chuỗi không-rơi.
- Vật phẩm Link Connect nằm trong `progress.linkConnect.items`; không dùng chung tồn kho với Memory Match.
- Dữ liệu đọc từ storage phải được chuẩn hóa trước khi gán vào runtime. Giá trị âm, sai kiểu hoặc vượt giới hạn không được đi thẳng vào gameplay.
- `roundId` là mã phiên runtime: callback bất đồng bộ phải kiểm tra đúng round và đúng board trước khi sửa trạng thái hoặc DOM.

## 4. Luồng render và hiệu ứng

- Memory Match dùng board riêng trong `grid.js`; Link Connect dùng renderer riêng vì cần đường nối, dịch chuyển và tái sử dụng tile.
- Link Connect định danh mỗi tile bằng `instanceId`. Patch chỉ cập nhật ô thay đổi; dịch chuyển dùng FLIP/Web Animations thay vì dựng lại toàn bàn.
- Canvas chỉ dùng cho hiệu ứng cần vẽ theo khung hình như Sấm sét hoặc mảnh vỡ. Mật độ canvas được giới hạn theo `devicePixelRatio`.
- Hiệu ứng DOM tạm chỉ thay đổi `transform`/`opacity`, tự xóa khi kết thúc và tôn trọng `prefers-reduced-motion`.
- Trong lúc xáo, board chặn tương tác đến khi hoạt ảnh ổn định. Hiệu ứng thu thập không khóa gameplay.

## 5. Vòng đời bất đồng bộ

- Controller dừng timer cũ trước khi tạo level hoặc rời màn.
- Timeout, animation callback và reward chain không được tác động một round/board mới.
- Khi tab bị ẩn, timer gameplay tạm dừng và âm thanh dừng. Khi quay lại, chỉ khôi phục trạng thái vốn đang chạy.
- Dữ liệu gameplay được cập nhật trước UI; hiệu ứng chỉ biểu diễn kết quả, không phải nguồn sự thật.

## 6. Tài nguyên và build

- Asset runtime nằm trong `public/assets/`; Vite copy sang `dist/assets/`.
- `themeCatalog.js` giữ metadata. `scripts/generate-theme-manifest.mjs` quét WebP và sinh manifest; mã gameplay không giữ danh sách tên ảnh thủ công.
- JavaScript tạo URL asset bằng `import.meta.env.BASE_URL`; CSS để Vite viết lại URL theo build target.
- `vite.config.js` chọn implementation trình bày chiến thắng cho web hoặc Android qua alias `victory-presentation`.
- Service worker/PWA nằm trong `js/pwa.js` và `public/sw.js`; Capacitor dùng cùng đầu ra web qua profile Android.

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
