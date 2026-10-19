# Nghiệm thu gameplay progression

Ngày: 19/10/2026. Phạm vi được giao: toàn bộ GAMEPLAY_PROGRESSION_PLAN.md, với điều kiện không xung đột task UI. Trạng thái: P0 chờ quyết định; P1 hoàn tất phần model độc lập, chưa bật runtime; chưa hoàn tất toàn kế hoạch.

## Ranh giới và phương án

- Baseline working tree đã có nhiều thay đổi UI/kỹ thuật/tài liệu. Không stage, hoàn nguyên hoặc format các thay đổi đó.
- Đọc trạng thái task `Triển khai kế hoạch cải tiến G0–G9`: lượt hiện tại chỉ đang sửa HUD một hàng/tiêu đề popup và kiểm UI. Không gửi tin hay can thiệp task đó. Phần gameplay này chỉ tạo model/test mới, không sửa controller/CSS/UI/package.
- Chọn module thuần dùng chung, tách khỏi cấu hình runtime cũ; tránh sửa ba config đang hoạt động riêng lẻ rồi để save/settlement chạy nửa luật mới nửa luật cũ. Việc bật phiên bản luật phải đi cùng persistence và controller sau khi chốt P0.
- Model không có DOM/listener/timer/cache/IO; không đổi API, ID hay save/schema hiện tại. Các accessor nhận dữ liệu đã chuẩn hóa tại boundary tương lai, không tự suy ra win hợp lệ từ score/sao cũ.

## Đã thực hiện

- `js/progression/gameplayRules.js`: wave 2/3/4/5, điểm combo 10/12/14/16/18, auto-match 10 điểm, xu toàn màn với tỷ lệ số nguyên để tránh sai số decimal.
- `js/progression/difficultyProgress.js`: luật Dễ mở màn sau và độ khó mở theo cùng màn; tiến độ mười màn theo bốn độ khó và mảnh khi đủ bốn kết quả đã chứng nhận. Không grant, claim hoặc quyết định chính sách EXP replay.
- `tests/unit/progression.test.js`: golden examples xu ba trò; biên wave, combo, automatic, invalid/unsafe inputs; unlock, legacy record không tự được chứng nhận, tiến độ rương/mảnh và tính bất biến. Truy cập cụm xa đọc đúng 40 record, không scan lịch sử.
- Chưa thực hiện: wave runtime, migration, cấp thưởng, 20 layout, trọng lực mới, UI hoặc luật thời gian chưa duyệt.

## Kiểm tra

- `node --test tests/unit/progression.test.js`: 9/9 đạt lần đầu và sau bước đọc/kiểm lại source (log `unit-review.log`).
- Đối chiếu số học riêng: 16.200 tổ hợp game/mode/N/sao khớp bảng hệ số; chuỗi 30 nhóm cho 520 điểm (log `arithmetic-review.log`). Đây là kiểm lại bởi cùng agent, không phải review độc lập của người/agent thứ hai; gate review toàn kế hoạch chưa được đánh dấu đạt.
- `node --check` hai module mới đạt; `git diff --check` đạt. Không tìm thấy import model mới trong runtime đang hoạt động.
- `npm run check`: lần đầu không đạt kiểm hiệu năng generator Triple có sẵn p95=29,25ms >20ms; chạy riêng lần hai=21,32ms >20ms. Không sửa generator/solver/test hoặc nới ngưỡng. Lần chạy tổng cuối đạt toàn bộ, gồm technical checks và ads15/15 (`check-final.log`, exit0). Ngưỡng hiệu năng nhạy tải máy, giữ hai log fail làm bằng chứng; không suy từ lần pass thành số đo điện thoại.
- `npm run build`: đạt, Vite build23,34s, 244module (`build.log`, exit0). Build này chưa bao gồm gameplay mới vì module chưa được bật.
- Không chạy UI cho file chưa được nối runtime; không tuyên bố các luồng wave/claim/save đã được nghiệm thu.

## Quyết định đang chờ

Đã hỏi qua công cụ: EXP chỉ lần đầu hay replay; ngân sách và tiếp tế wave/bỏ giây combo/kích thước bàn; cách bảo toàn/tách tiến độ luật cũ; chọn mảnh tranh/bản đồ kho báu và duyệt bảng thưởng. Các câu trả lời ảnh hưởng behavior/schema/kinh tế nên chưa tự chọn để tích hợp. Các vấn đề chi tiết còn lại theo P0 trong kế hoạch.

Không phải blocker UI đối với các model đã làm. P2 và việc bật P3–P9 phụ thuộc các quyết định sản phẩm/dữ liệu chưa có câu trả lời; không lấy yêu cầu triển khai làm quyết định reset dữ liệu hoặc giá trị đồ thưởng. Không dừng vì hết gate hay vì một lần test fail.

## P0/P1 — cập nhật sau khi chủ dự án trả lời

Đã duyệt EXP lần đầu, full board mỗi wave, bỏ giây combo, ngân sách wave sau cộng vào giây dư; reset dữ liệu thử toàn dự án Firebase; mảnh tranh và bảng thưởng C30/B60/A100/S160xu +1/2/3/4gợi ý, bộ300xu. Không còn blocker sản phẩm ở những mục này. Quyền project Firebase đã kiểm tra qua CLI (không xuất thông tin tài khoản lên chat), chưa xóa gì.

P1 bổ sung model wave/snapshot chuẩn hóa/chuyển trạng thái, ngân sách và thưởng nhanh toàn màn, sao, chuỗi rương/giá trị thưởng đã duyệt. `node --test tests/unit/progression.test.js tests/unit/wave-progress.test.js tests/unit/mastery-rewards.test.js`:15/15 đạt. Có ma trận3game×6mode×4mốcwave, serialize/restore giữa mọi bước và chặn clear lặp. Chưa tuyên bố runtime/schema/claim đã được nghiệm thu.

## P2 — boundary dữ liệu wave và kết quả

`sessionProgress`/`gameState` giữ metadata wave có version; dữ liệu wave sai bị từ chối khi stage và được đánh dấu chặn resume khi hydrate, không tự chuyển về luật một board. Triple có thể giữ checkpoint board won ở biên wave khi metadata hợp lệ. Best có chứng nhận số wave, settled attempt theo mode có giới hạn để chặn quyết toán trùng; không scan attempt history.

Unit mới và trước đó19/19 đạt. Thêm test IndexedDB thật qua fake-indexeddb: metadata wave + giây tiếp tế cùng revision, conflict write không sửa checkpoint. Các script persistence, chapter-store, migration-recovery hiện có đều đạt. Hai lỗi phát hiện trong lúc thêm test (flag invalid chỉ chặn save nhưng chưa chặn stage, test gọi sai contract hydrateChapterProfile) đã sửa và chạy lại. Chưa thực hiện reset thực hoặc grant mới ở runtime. Các public API cũ vẫn nhận session không có wave để bảo toàn khả năng đọc trước rollout/reset.

## P3 — Memory wave runtime

Memory dùng ngân sách wave, giữ điểm/moves/miss và playMetrics xuyên wave, combo reset; lưu checkpoint advance cùng giây tiếp tế, sinh board mới sau durability. Wave đầu không chứng nhận ranking hoặc record màn; chỉ wave cuối chốt xu/sao/kỷ lục. Bỏ xu/giây combo và điểm nhân special, next Hành trình về Dễ màn sau. Session invalid chặn resume; pending advance tiếp tục không cấp giây lần hai.

Playwright `progression-waves.spec.js` desktop:1/1 đạt với12cặp ghép qua adapter DOM thật, tải lại sau wave1, resume wave2, kiểm budget130giây không cấp lại, kết quả chứng nhận2wave và gọi settle lại không tăng xu. Lần chạy sandbox không khởi động Vite ổn định đã dừng; chạy browser ngoài sandbox thành công. Hai lỗi fixture (chờ5s không bao gồm preview+hide, truyền model thay DOM vào adapter) đã sửa bằng chờ readiness và node thật; không giảm delay runtime. Source parse đạt. Chưa tuyên bố gate regression/UI/performance cuối đạt.

Working tree có baseline kỹ thuật/UI chưa commit từ task khác. Commit P3 chọn riêng hunk gameplay; Hint/model selection và thứ tự patch UI sau persistence của task khác vẫn unstaged. Không đưa các file cũ hoặc controller hunk của họ vào commit; test thực hiện trên working tree tích hợp, không tuyên bố snapshot HEAD bỏ baseline của task khác đã được nghiệm thu độc lập.
