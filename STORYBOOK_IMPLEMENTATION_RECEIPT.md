# Cổ tích và Thành tích — nghiệm thu triển khai

Nguồn phạm vi duy nhất: `ILLUSTRATED_UI_ACHIEVEMENTS_PLAN.md` và
`docs/design/achievements/IMPLEMENTATION_PROMPT.md`. Ngày 23/10/2026.

## D0 — quyết định được chủ dự án duyệt

PASS về quyết định sản phẩm, theo hai câu trả lời trực tiếp trong chat:

- Duyệt hình, tên và thứ tự 30 quà của `art-kit-v1/reward-distribution.json`:
  10 màn riêng từng trò, 9 avatar, 9 khung, 6 huy hiệu, 6 hiệu ứng.
- Giữ 300 Xu cho nhóm 10 màn, receipt cũ và mọi quyền đã có; không cấp lại.
- Màn 11 trở đi tiếp tục chơi bình thường; chưa có quà Thành tích mới.
  Không modulo, random, tiền bù hoặc khóa tiến trình.
- Quyết định ban đầu là đồ Hồ sơ cục bộ. **Được thay bởi yêu cầu trực tiếp
  tiếp theo của chủ dự án:** người khác thấy avatar/khung/huy hiệu đang
  trang bị trên BXH; đồng bộ khi Lưu thay đổi trong Hồ sơ. Giữ nguyên cách
  tính điểm, so sánh kết quả và thứ tự xếp hạng. Chuẩn bị model/outbox/rules
  và kiểm thử tương thích; không tự deploy dịch vụ.
- Tên Cổ tích / `storybook`; dùng font miễn phí đủ dấu Việt.
- Bản ghép từ asset và chữ DOM thật tại 412×915 phải được chủ dự án duyệt
  trước rollout toàn ứng dụng. Đây là mốc duyệt D2 riêng, chưa đạt.

Phương án: mở rộng skin/modal/settlement/persistence owner hiện hữu,
artwork nhiều lớp và content slots. Loại phương án recolor hộp cũ vì thiếu
silhouette; loại screenshot chứa chữ làm panel vì không hỗ trợ semantic,
responsive và nội dung động. Giữ public API, key/schema cũ; field mới phải
được normalize/backup/rollback cùng transaction, không xóa quyền lịch sử.

## Baseline và quyền sở hữu

HEAD ban đầu: `27ef096`. Có 52 file tracked đã sửa và nhiều file untracked
của công việc trước, gồm registry/generator hai skin mới. Không stage những
thay đổi đó. Mỗi commit task này chỉ chứa file mới hoặc hunk do task tạo.
Không APK, push, deploy hoặc sửa ignore/quyền Windows.

Đã đọc prompt, kế hoạch, kiến trúc, contract/copy, catalog/manifest/receipt,
review ba mẫu được chọn; chạy lại `art-kit-v1/verify.cjs`: PASS 30 món,
30 gán quà, 16 slot draft, 81/81 cặp avatar–frame. Đây là kiểm asset offline,
không phải bằng chứng runtime hoặc FPS.

## Tiến độ

| Phase | Trạng thái |
|---|---|
| D0 | PASS — quyết định duyệt trong chat |
| D1 | PASS — inventory/contracts, chưa duyệt mỹ thuật D2 |
| D2 | Chưa tạo đủ chrome, ghép thật và duyệt golden |
| S1–S2 | Chưa rollout skin |
| F1–F3 | Chưa triển khai grant/queue/cosmetics |
| Q1 | Chưa nghiệm thu sản phẩm |

Skill thực dùng: `clarify-ambiguous-requirements` chốt D0; `imagegen`
định tuyến tạo artwork. Bằng chứng mỗi phase bổ sung trong tài liệu này.

## D1 — inventory và hợp đồng

`design/storybook/contract.mjs` là source contract của presentation mới:
14 nhóm bề mặt, owner/file thật, slot, invariant giữ lại, 7 part dùng chung
theo vật liệu/lifecycle; trạng thái button/input/item/toggle/checkbox/slider/
progress/loading/empty/error. Họ icon lấy đủ key `ICON_PATHS` hiện hữu,
alias chỉ cùng nghĩa và có SVG fallback. Không dùng emoji/glyph trang trí.
Trạng thái pressed/disabled dùng cùng canvas/hitbox, focus riêng; slot
người chơi và metadata kỹ thuật không trộn với nhau.

Font chọn Nunito variable 400–900, license OFL-1.1 từ nguồn Google Fonts:
https://github.com/google/fonts/tree/main/ofl/nunito. Đóng gói tập Việt,
Latin và Latin mở rộng; chờ font ready trước ảnh reference. D0 duyệt quyền
chọn font miễn phí đủ dấu, golden và geometry thực vẫn chờ D2.

`node scripts/check-storybook-contract.mjs`: PASS — xác nhận owner tồn tại,
part/source đúng, alias có target, đủ họ icon và slot draft trong biên.
Các source PNG mới tạo bằng imagegen tích hợp được giữ trong `design/`,
không đặt source/QA vào public. Không thay hành vi game trong D1.
