# Banner, mua hàng và công cụ — 18/10/2026

Phạm vi: thanh đóng băng tương phản nền băng; mở khóa cặp băng nhanh hơn nhẹ (1000→800ms); popup xác nhận mua nằm cân đối giữa vùng khả dụng, giữ banner để nền không co giãn; khung công cụ ba trò nổi theo phong cách menu tạm dừng. Giữ nguyên luật, inventory, giá, giao dịch và save; không xuất bản web/AdMob.

- [x] A. Màu thanh, timing và khung công cụ; kiểm tra rồi commit.
- [x] B. Vị trí/skin xác nhận mua và giữ banner; kiểm tra rồi commit.
- [x] C. Review độc lập, check/build, ảnh, APK và hồ sơ cuối.

Lựa chọn: dùng tương phản tím đậm + viền tối, không thêm hiệu ứng phát sáng/loop. Giữ timeline wipe hiện tại, chỉ giảm token duration20%; cùng owner và cleanup cũ. Khung công cụ dùng gradient/viền inset/shadow tĩnh từ palette menu, không thêm DOM hay timer. Popup mua dùng alignment tùy chọn trên modal chung và CSS flex center, thay vì đo chiều cao popup theo ResizeObserver (tránh feedback layout). Banner được tìm từ slot đang hiển thị, observer sẵn có theo dõi chiều cao kể cả khi quảng cáo chưa tải xong; không bỏ cơ chế chặn của các popup khác.

Tiêu chí: thanh rõ trong ảnh thật; wipe hữu hạn800ms và reduced-motion giữ tức thời; công cụ nhất quán ba trò/focus; xác nhận mua không đổi chiều cao nền hoặc tạo lại banner, cân giữa trên banner ở mobile/landscape/desktop; mua/hủy vẫn đúng và không tăng resource qua nhiều vòng. Giữ các ảnh QA tab và .vscode có sẵn.

Bằng chứng A: tool frame3viewport×3trò đạt, wipe10cycles normal/reduce đạt, ảnh thanh tím đã mở và dễ phân biệt trên nền băng. Bộ mua/commerce ban đầu19/19 đạt.

B: native/web3viewport×5cancel giữ đúng node/calls/footer; mua-inventory/rollback19ca đầu đạt; regression26/27, ca gameplay test mở quá sớm lúc Memory preview nên sửa chờ invariant; Triple test chuyển về mua mở rộng khay là luồng UI hiện hành, chạy lại1/1 đạt. Center maxHeight dùng safe viewport thay mốc board. Tests/ảnh ở tests/ui/hud-purchase-polish.spec.js và docs/design/hud-purchase/qa.

C hoàn tất18/10/2026: independent27/27, rootcommerce19/19 và regression26+rerun1/1, check (ads15/15, Triplep9510.49ms), web/AndroidAPK và production smoke2/2 đạt. Exact token test800ms cập nhật theo yêu cầu. Báo cáo/ảnh/receipt tại docs/design/hud-purchase/QA.md. Không còn gate triển khai; không deploy/publish hoặc thay save/catalog/luật.
