# Home chọn trò bằng vuốt — 2026-10-16

Phạm vi: thay bố cục1+2 bằng một trò ở giữa, vuốt trái/phải, hé trò bên cạnh. Giữ tranh hiện tại, bấm trò mở map, dock/ad slot/save/catalog/navigation không đổi. Không tạo art hoặc đổi popup/tab.

Chọn native horizontal scroll-snap thay custom pointer-drag: browser sở hữu momentum/touch cancellation, không RAF loop/timer; JS chỉ đồng bộ lựa chọn và điều khiển bàn phím/mũi tên/chấm. Transform/opacity hữu hạn cho trọng tâm, reduced-motion tắt transition. Scope sở hữu listener/frame/observer và cleanup. Không carousel tự chạy hoặc clone slide.

Phase1 (hoàn tất): renderer/CSS carousel, chỉ số từ vị trí cuộn, keyboard/controls/resize, asset fallback và kiểm tra mobile/landscape/desktop, touch thật qua browser. Commit khi test mục tiêu đạt.

Phase2: regression Home/tab/map,30cycles cleanup, review độc lập; check/build web/Android, context/architecture/QA, commit. S22 Ultra thật còn chờ, không deploy. Không dừng ở phase trung gian.

Phase1 đạt17/17 (Home12 +registry5), gồm touch CDP trái/phải không mở map, viewport thấp và chuyển động thường. Sửa intrinsic-width từ wrapper center cũ, title border-box và safe vertical overflow bằng auto margins.30cycles:28listeners,0timer/frame/animation, observer cleanup; owner cũ về0.
