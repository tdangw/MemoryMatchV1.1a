# Hoàn thiện banner, công cụ và hoạt ảnh — 17/10/2026

Phạm vi được duyệt: giữ banner ở cửa sổ chọn màn; danh sách công cụ ba trò theo Link Connect; bỏ trang trí nhỏ của Profile; thanh thời gian đóng băng Link Connect; thay emoji trong mọi hoạt ảnh ba trò bằng hình vẽ bằng mã. Không đổi luật chơi, save, API, catalog; không xuất bản website/AdMob.

## Các phase

- [x] A. Banner chọn màn và Profile; kiểm tra rồi commit.
- [x] B. Công cụ ba trò dùng cùng bố cục biểu tượng/tên/số lượng; kiểm tra rồi commit.
- [x] C. Thanh đóng băng theo đồng hồ hiện có, hỗ trợ pause/restart/restore; kiểm tra rồi commit.
- [x] D. Rà hoạt ảnh ba trò và thay emoji, giữ ownership/cleanup/reduced-motion; kiểm tra rồi commit.
- [ ] E. Review độc lập, regression liên quan, check/build và ghi bằng chứng cuối.

## Lựa chọn

Banner: dùng tùy chọn rõ nghĩa trên modal thay vì kiểm tra ID riêng trong modal chung. Các cửa sổ khác vẫn có blocker riêng.

Công cụ: dùng class bố cục chung cho ba danh sách thay vì sao chép CSS Link sang hai trò; giữ hook và hành động hiện tại.

Đóng băng: ưu tiên dùng scheduler trình bày HUD hiện có và giá trị freezeSeconds làm nguồn sự thật. Phương án thêm đồng hồ/RAF độc lập bị loại vì làm khó pause, restore và cleanup. Thanh xanh giảm dần, không ảnh hưởng số giây của ván; số node cố định, chỉ đổi transform/opacity, giảm chuyển động giữ trạng thái đọc được.

Hoạt ảnh: ưu tiên SVG/CSS sẵn có, không thêm sprite nếu hình vẽ bằng mã đáp ứng được. Giữ timeline và owner của hiệu ứng; thay nội dung hình, không mở task viết lại runtime.

## Tiêu chí nghiệm thu

Banner còn ở preview cả ba trò; overlay khác vẫn ẩn. Profile không còn flourish. Công cụ có cùng geometry/count/icon, hành động cũ hoạt động. Thanh đóng băng đếm riêng và dừng/tiếp tục cùng ván, không tồn tại sau restart. Không còn emoji dùng làm hình trong hoạt ảnh được rà. Không nhân đôi node/listener/scheduler qua vòng đời. Kiểm tra ảnh giao diện, mobile 412×915, landscape/desktop, reduced-motion và test phù hợp; npm run check và npm run build ở phase cuối.

## Bằng chứng

Phase A: ads native/web 14/14; ảnh Profile và preview ở 412/844/1024 đã kiểm tra. Các ảnh QA tab đã sửa trước task và .vscode không thuộc phạm vi, phải giữ nguyên.

Phase B: công cụ cùng geometry ở 412/844/1024; badge số lượng có ở cả ba trò, icon SVG, hook/action không đổi.

Phase C: cùng scheduler HUD 250ms, thêm một node cố định; test dùng vật phẩm/cộng dồn/pause/background/restart đã đạt ở reduce và no-preference. Session đóng băng khôi phục từ freezeSeconds cũ, không đổi schema.

Phase D: rà emoji và ký hiệu font có chuyển động; SVG/CSS thay hình, không đổi effect ID/timeline/cleanup. Review độc lập source và UI/restore17/17, ảnh summary kiểm tra đúng trạng thái2sao đạt/1sao chưa đạt.
