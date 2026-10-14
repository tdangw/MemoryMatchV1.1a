# Baseline và ngân sách tiến độ level

Phase0, 2026-10-14. Runtime trước triển khai: Hành trình mở khóa chung4mode, điểm/sao theo mode:level. Runv2 restart giữ previousScore và chỉ xóa attempt hiện tại; Triple challenge chỉ1–7. Nguồn chapter/save/history phải giữ khi thêm v3.

| Game | Trần board hiện có | Sinh màn cao trong task |
|---|---|---|
| Memory Match | challenge60tile/30pair, tối đa6cột | Giữ trần60tile, biến thể bàn mới; countdown carry clamp tối đa180s |
| Link Connect | challenge60tile/30pair, tối đa6cột | Giữ trần60tile; challenge thời lượng ban đầu clamp150s thay tuyến tính vô hạn |
| Triple Connect | normal/endless120tile; challenge93tile,5layer; intro75–210s | Intro1–7 không đổi. Từ8 chọn template challenge5–7 theo chu kỳ với seed theo level; trần93tile/5layer/210s |

Triple generation giữ maxAttempts1 (ngoài Easy), maxNodes150000, maxMemo60000, deadline400ms; solution-first/witness + fallback hữu hạn. Không tăng board/solver budget theo level100.000. Bàn/layout/seed của session được lưu để resume không sinh lại. Hành trình giữ cấu hình từng độ khó đã có.

Phase0 bằng chứng: scripts/check-level-progression.mjs; check-ranking-rules/check-ranking-checkpoints xác nhận baseline restart và checkpointv2. Các script này được mở rộng trong phase sau để kiểm semanticsv3, không dùng báo cáo baseline như chứng nhận luật mới.
