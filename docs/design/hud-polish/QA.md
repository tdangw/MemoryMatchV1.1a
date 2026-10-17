# Kiểm tra hoàn thiện HUD và hoạt ảnh — 17–18/10/2026

## Kết quả triển khai

- Cửa sổ chọn màn giữ banner, chừa chiều cao thực của vùng banner khi tính khung cửa sổ; observer thuộc lifecycle cửa sổ. Các popup khác vẫn có blocker riêng.
- Profile bỏ modifier trang trí, giữ nội dung và dữ liệu.
- Ba danh sách công cụ dùng cùng class và CSS owner: SVG bên trái, tên ở giữa, số lượng bên phải. Giữ ID/data hook, hành động và nguồn inventory. Bổ sung count node cho Memory và icon cho Triple.
- Link có một node thanh đóng băng, cập nhật bằng scheduler HUD 250ms hiện có. freezeSeconds vẫn là nguồn đồng hồ nghiệp vụ, không thêm timer/RAF riêng và không đổi session. Tạm dừng/chuyển nền hủy lịch HUD, resume dùng lại cùng owner; restart khởi tạo trình bày mới.
- Rà executable JS/CSS cả ba trò: ký tự bông tuyết trong Freeze đổi sang freeze-crystal.svg; sao tổng kết/HUD đổi SVG; tia sáng và sao may mắn Triple thành hình CSS. Xu bay, vật phẩm, thưởng và các hiệu ứng đường nối/pháo hoa đã dùng SVG/canvas. Không cần sheet raster. Các ký hiệu tĩnh trên bản đồ và chữ/số nội dung trò chơi giữ nguyên.
- Timeline các hiệu ứng cũ giữ nguyên; Freeze vẫn anticipation/veil → crystal → resolve trong exit duration hiện hành, tối đa hai pseudo-element/thẻ, không thêm DOM hay loop. Summary giữ ba node sao, thêm ba SVG con cố định và tia CSS; reduced-motion dùng trạng thái tĩnh, cleanup vẫn thuộc scope hiện có.
- Quy định không dùng emoji trong hoạt ảnh đã ghi tại AGENTS.md mục9.

## Bằng chứng

- Native/web banner: 14/14.
- UI/restore ban đầu: 14/14; sau đó bổ sung kiểm tra cả hai chế độ chuyển động và hình SVG.
- Regression HUD/menu/exit/victory: lần đầu39/40; một bài victory soak ghi tổng node1326/1326/1475 trong khi listener90 cố định, heap tăng khoảng39KB. Reviewer chạy độc lập lại đúng bài đạt1/1, node1326 cả ba mẫu, không sửa hoặc nới test. Chẩn đoán: DOM còn gắn luôn460node/296element/1menu; trước/sau khi renderer xử lý hủy WAAPI qua hai frame, CDP node1326→1243 và1329→1243, ba mẫu sau đều1243/listener90, heap tăng50KB. Test lấy mẫu sau mốc renderer hoàn tất hủy, giữ nguyên toàn bộ ngưỡng và assertion. Không sửa runtime hay dùng timeout để che lỗi.
- Menu soak20 vòng/trò, exit canvas100 vòng và timer stacking/pause/background/restart đã đạt.
- CSS ownership, Effect V2 và session timing đạt.

## Giới hạn

Ảnh và phép đo từ trình duyệt máy tính; chưa nghiệm thu thao tác/hiệu suất Galaxy S22 Ultra thật. Không tuyên bố60FPS từ kiểm tra chức năng. Không đổi save/catalog/luật chơi; các API cũ giữ tương thích. Không xuất bản website/AdMob.

## Kiểm tra cuối

Hoàn tất18/10/2026:

- Matrix geometry/layout/presentation/Triple chrome và victory ownership: **145/145 đạt**, đủ desktop/mobile/landscape. Victory sampler sau renderer settle: node1243/1243/1243, listener90/90/90, heap8110588→8140216→8157076bytes (+46488bytes), không tăng resource sau cleanup.
- Review độc lập UI/restore: **17/17 đạt**; sau gom cadence về HUD_PROGRESS_TICK_MS, chạy độc lập lại normal/reduced freeze **2/2 đạt** (transition0.25s/0s). Không finding còn mở.
- Native banner cuối: **9/9 đạt**, preview giữ banner, bắt đầu gameplay native thu hồi; web gameplay vẫn giữ artwork theo phạm vi được duyệt.
- `npm run check`: đạt; quảng cáo15/15, Triple pure board p9513.94ms (Node desktop, không phải FPS điện thoại).
- `npm run android:apk`: đạt; `npm run build`: đạt; production smoke **1/1 đạt**. Không xuất bản website/AdMob.
- APK `android/app/build/outputs/apk/debug/app-debug.apk`:34250200bytes, SHA256 `ABA39E632544068D86544DB24F7FB7F4F8E803FB15AA81DDFE519314873B581A`; packagecom.memorymatch.adventure,versionCode1/versionName1.0,minSDK24,target36. Chữ ký debugv2 hợp lệ, certificateSHA256de5788a89d4cc7834594875e8fe92b2cc8e5b0f185e49ae68f62e2efc7d1eea9. Đã đối chiếu freeze-crystal.svg trong APK với source.
- Ảnh kiểm tra tại `qa/`: Profile/preview/tools ba trò ở412/844/1024, freeze412, summary normal/reduced. Đã mở ảnh và kiểm tra câu chữ/bố cục, sao chưa đạt là viền xám, sao đạt là hình vàng.
- Skill `clarify-ambiguous-requirements` dùng để chốt phạm vi thay emoji trong mọi hoạt ảnh ba trò; không dùng imagegen vì SVG/CSS đáp ứng được hình cần thay.
- Giữ nguyên các ảnh QA tab và .vscode có sẵn; không hoàn nguyên hoặc stage thay đổi của người dùng. Không còn code/log/tài nguyên chẩn đoán tạm trong diff sản phẩm.
