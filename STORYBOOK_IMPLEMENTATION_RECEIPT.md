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
- Đồ Hồ sơ dùng cục bộ trong đợt này, không đổi wire/rules bảng xếp hạng.
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
| D1 | Chưa nghiệm thu inventory/contracts |
| D2 | Chưa tạo đủ chrome, ghép thật và duyệt golden |
| S1–S2 | Chưa rollout skin |
| F1–F3 | Chưa triển khai grant/queue/cosmetics |
| Q1 | Chưa nghiệm thu sản phẩm |

Skill thực dùng: `clarify-ambiguous-requirements` chốt D0; `imagegen`
định tuyến tạo artwork. Bằng chứng mỗi phase bổ sung trong tài liệu này.
