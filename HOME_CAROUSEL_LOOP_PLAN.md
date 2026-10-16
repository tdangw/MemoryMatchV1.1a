# Home nối vòng và ảnh Memory dọc — 2026-10-16

Phạm vi: vuốt/mũi tên/bàn phím qua ranh giới đầu-cuối liên tục; vẽ lại Memory Match theo khung dọc, không crop/phóng ảnh ngang cũ. Giữ3trò thật, dots/tên, dock/ads/tab/gameplay/save.

So sánh3bản sao dãy với xoay cùng3node: chọn xoay node khi native scrollend, đưa lựa chọn về slot giữa trong cùng lượt render. Không clone hoặc tăng DOM/cache theo số vòng; hỗ trợ catalog từ3trò trở lên (hiện có3). Cards array giữ thứ tự catalog làm nguồn logical index; DOM order chỉ biểu diễn. Mũi tên/ArrowLeft/Right modulo; Home/End là logicalfirst/last; ResizeObserver giữ lựa chọn, focus nằm trong track chuyển sang trò đang chọn sau rebase. Không thêm drag engine/timer/animation loop, dùng native snap/touch và reduced-motion cũ.

Phase1 (hoàn tất): imagegen redraw portrait, masterv2/WebP qua source generator ≤350KB cả3ảnh; loop renderer + tests boundary/real touch/lặp nhiều vòng/resize/focus/fallback4game. Kiểm ảnh thật, commit.
Phase2 (hoàn tất): regression navigation/ads liên quan, review độc lập, check/build web/Android, CONTEXT/ARCHITECTURE/QA và commit. Không deploy/build APK. Thiết bị S22 Ultra thật còn chờ như trước.

Phase1:19/19 đạt (Home14+registry5), gồm14swipes qua hai đầu,100lượt mỗi chiều không thêm node, normal-motion tap sidepeek, resize/focus/fallback4game/30cycles. Focus→select từng làm target đổi vị trí trước pointerup; đã bỏ listener đó, keyboard vẫn select+focus rõ ràng. Memory masterv2 1086×1448, WebP576×768/108670bytes, tổng3ảnh323366bytes≤350KB. Đã kiểm ảnh portrait và crop landscape.

Phase2: regression31ca có kết quả đạt (30lần đầu,1traceENOENT do lượt chạy song song; chạy riêng1/1 đạt), review độc lập14/14 +cacheURL1/1 approve. Cache immutable dùng memory-match-v2.webp, public chỉ giữ3ảnh; masterv1 giữ hồ sơ. Gate cuối Home14/14 và4viewport src/natural size pass; npm run check gồm15ads unit, build web và build:android đều exit0. Một lượt p95 Triple23.37>20 khi có chạy song song; script giữ nguyên, đo riêng19.99 và fullcuối19.48 đạt. Không đổi API/save/catalog; không deploy/APK. Phase1commitabc5696; phase2 là commit chứa bản nghiệm thu này.
