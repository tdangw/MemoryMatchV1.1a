# Ghi chú triển khai theo kế hoạch đã duyệt

Đây là ghi chú kỹ thuật, không thay kế hoạch hiện hành ở root. Chỉ ghi
những boundary đã đọc; kết quả nghiệm thu nằm trong receipt chung.

## A2: mở rộng danh mục và quyền sở hữu

Đã đọc generator catalog, achievementModel, persistence backfill,
achievementCollection, renderer Hồ sơ, appearance và public model.

- Phương án tăng catalogVersion và tạo grant mới bị loại: grant identity
  đang là game+level/catalogVersion=1; đổi version không được cấp lại quà.
- Giữ version/30 mapping, thêm coverage revision riêng cho cấp bù. Marker
  cũ phải tương ứng phạm vi 1–10; revision mới quét 1–30. Chỉ đánh dấu sau
  cùng transaction thành công. Đọc chapter 1 đúng ba trò, kể cả frontier ở
  chapter 2; nhóm thưởng 10 màn không được dùng làm chapter lưu 100 màn.
- Không thêm đồ event/cơ bản vào ledger Thành tích giả. Catalog đồ hồ sơ
  hợp nhất các nguồn: Thành tích, acquisition event, bộ cơ bản luôn sẵn có.
  Bộ cơ bản không cần receipt và không thay lựa chọn đang dùng của hồ sơ cũ.
- Collection dựng 10 màn theo nhóm đang xem; kho Hồ sơ dựng tối đa 12 món
  theo category/page, giữ draft khi đổi trang. Loại phương án dựng hết rồi
  chỉ dùng CSS để ẩn vì vẫn tải/giữ ảnh và DOM của toàn bộ danh mục.
- Public projection chỉ giữ ba ID đang trang bị, giữ query và rank. Model,
  whitelist generator và rules đều cần nhận ID mới trước kiểm hai tài khoản.

## L1: giao dịch phần thưởng

Đã đọc persistence queue/CAS, profile/chapter transaction, cloud snapshot,
Firebase backend và account-bound profile service hiện hữu.

- Loại clock/RNG/quota thuần client: đổi giờ, restore và hai thiết bị có thể
  tạo nhiều quyền nhận. Dùng service Firebase theo tài khoản để quyết định
  kỳ, quota, kết quả và receipt. Code/emulator được duyệt; chưa deploy.
- Server receipt và local applied receipt là hai trạng thái. Local grant
  phải đọc ví bền vững trong queue, cộng delta và marker cùng envelope;
  không cộng RAM rồi ghi số dư cũ. Callback server thành công/local lỗi
  phải đọc lại cùng receipt, không tạo quyền thưởng khác.
- Receipt nguồn sống cùng dữ liệu được cloud backup/restore. Metadata
  hàng đợi thuộc UID, không thể lấy marker UID cũ làm quyền UID mới. Restore
  và cloud conflict phải kiểm lại receipt trước đồng bộ tiếp.
- Facts xuất sau settlement hợp lệ qua adapter riêng của ba trò; một cặp
  Memory/Link = một lần ghép, một bộ ba Triple = một lần ghép. Round identity
  mới cho replay hợp lệ; không lấy counter round tăng trong RAM làm khóa
  toàn cục qua reload. Tutorial/abort/settlement lỗi không được xuất facts.
- Chỉ kỳ server đã xác nhận, upload trước hết kỳ; không tự suy thời gian
  offline hoặc nhận bù facts quá kỳ. Không ghi theo click hoặc frame.

## L2–L4: owner và presentation

Điểm vào Home đang ở main.js; page/modal, năm mục điều hướng và skin là
owner hiện hữu. Native ads hiện chỉ export banner; adService owns consent.

- Thao tác tài khoản/receipt có vòng đời dài hơn trang; animation/DOM thuộc
  page scope. Loại hủy toàn bộ request khi close và loại để callback thao
  tác trực tiếp vào modal đã đóng. Kết quả bền vững trước presentation.
- Một rotor transform hữu hạn; hủy/reduced-motion đi tới trạng thái tĩnh,
  không quyết định cấp thưởng. Không timeout hoặc RAF mới để cấp quà.
- Rewarded mở theo yêu cầu qua consent service hiện hữu. Earned/dismiss/
  error/no-fill tách biệt; duplicate callback và SSV hội tụ cùng quyền.
  Web không provider không được giả earned. Không preload video startup.
- Quà event cấp từ receipt nguồn hợp lệ vào cùng resolver Hồ sơ. Pilot
  chưa có startAt: không tự khởi động, không tạo countdown. Hết bảy ngày
  dừng điểm; grace 48 giờ chỉ xử lý quyền đã đạt. Không popup vào summary.
