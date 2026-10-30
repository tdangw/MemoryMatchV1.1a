# Rương ưu tiên chưa có và quà nhóm thẻ — nghiệm thu

Ngày30/10/2026. Nguồn phạm vi: COSMETIC_COMPLETION_GROUP_DROPS_PLAN.md.

P0: giữ API/schema/candidate/receipt, energy/support, hourly gift. Chọn lọc
pool chưa có thay pity; bảng normal/special không thay đổi phân loại gameplay.
Feedback sẽ lấy vị trí sau commit khi thực sự trúng thay vì đo mọi miss;
callback đồng bộ trong persistence chạy trước controller tháo DOM.
Không deploy hoặc tạo APK. Sáu ảnh QA đã tracked từ lượt trước được lưu
riêng cùng baseline theo yêu cầu commit phần còn sót.

C1: chọn đều pool chưa có, full100 trước RNG, giữ category20%, race và
legacy. Kiểm tra độc lập12/12 unit rương/kho/queue pass.

D1: bảng5/2/6 và25/10/30, ba RNG độc lập; marker cả miss,1000/wave,
17chữ, disabled source, replay và sáu mode. Agent kiểm80/80;
review độc lập86/86, check-letter-policy và generator --check pass.

V1: callback cả ba trò mở cho mọi nhóm hợp lệ. Chọn lazy capture vì
DOM ba controller còn kết nối đến khi persistence callback trả về;
reuse rect không có sẵn đồng nhất. Miss không đo layout. Chữ/vé/huy hiệu
và loot năng lượng/hỗ trợ dùng chung cap12, chữ tối đa5. Timeline cũ:
chữ2500ms (reduced1100ms), vé/huy hiệu drop620/hold450/flight820ms.
Chỉ transform/opacity, scope hủy hình không hủy phần thưởng đã lưu.
Mô hình read-only xác nhận90/10 →7chữ/2,8vé/8,4huy hiệu và completion
190/190/110 rương;2/2 unit mô hình pass.

Q1: đã hoàn tất review độc lập, regression/emulator và diff cuối.


Kiểm chứng Q1:
- npm run check pass; npm run build pass. Hai warning asset marker và
  static/dynamic import có sẵn; output không còn marker chưa resolve.
- UI mới4/4: normal cả ba trò lưu/hiện ba quà và tải lại giữ thưởng;
  matrix5skin×4viewport×2motion×20owner=800chu kỳ, font20px, hidden,
  cap12, miss không đọc rect, hủy hai lần/stale không còn node/timer.
- UI cũ8/8: Quà tặng bất ngờ4 và letter/ticket4. Lần đầu atlas bị lỗi
  tệp trace do hai runner dùng chung output; chạy lại output riêng pass.
- Reviewer độc lập:86 unit thưởng/rương +14 persistence/queue pass;
  pair-reward/Triple-rules/generator/letter-policy pass. Ba emulator
  liveops, huy hiệu/rương, quà60phút pass (UID/race/mất phản hồi/replay/
  crash/restore/quota/giả timestamp). Không đổi/deploy rules.
- Marker qua30wave chỉ giữ wave hiện tại: fixture30nhóm Memory/Link
  809byte so với269byte khi chỉ3nhóm đặc biệt; Triple40nhóm1371byte so
  với327byte/4nhóm. Cap1000 không tăng. ID fixture không đại diện mọi save.
- Fixture emulator50publication:301SDKreads/200writes/137310byte;
  batch10/50facts mỗi1publication/6reads/4writes/5951 hoặc5953byte.
  Fixture rương22publication:130reads/87writes/30934byte. Đây là thao tác
  SDK/JSON, không phải hóa đơn hoặc byte transport/rule-dependent reads.
  Resolver không thêm gọi mạng; snapshot gameplay vẫn ghi mỗi commit,
  không tuyên bố0write/drop. Không thêm document/Functions/telemetry.
- Chưa có S22 vật lý; không chứng nhận60FPS hoặc mức tiêu hao/cân bằng
  thực tế. Không deploy Hosting/rules, không APK. API/save/catalog giữ nguyên.

- PC Chrome viewport412×915,30restart/179frame: P95=21ms,
  P99=62,7ms, max395,8ms;1longtask55ms; heap23.215.850→26.145.855byte
  không épGC. Max12node và0sau dọn. Sample khởi tạo/restart trên máy
  phát triển, không chứng minh60FPS hoặc leak từ chênh heap. Test đo1/1
  pass tiêu chí bounded/cleanup; hiệu suất S22 vẫn cần thiết bị thật.
- V1 reviewer thứ hai đọc diff riêng: không phát hiện lỗi lifecycle,
  origin, budget hay thay đổi API/schema. Build cuối sau toàn bộ code pass.

Commit phase: P0 7248de2; C1 8642dca; D1 5e6959f; V1 a5bf8a6.
Q1 ghi bằng chứng và chốt context/plan. Các file tracked còn sót đã lưu;
không đưa log, runtime QA tạm hoặc ảnh phát sinh từ test vào commit.
