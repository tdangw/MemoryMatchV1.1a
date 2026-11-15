# Bàn giao ngoại hình và bản thử — 11/11/2026

Đây là báo cáo chung, không phải kế hoạch active mới. Chủ dự án cho phép gom toàn bộ thay đổi hiện có, commit/push, cập nhật Hosting test và tạo APK. Sau bàn giao tạm dừng; Android thật do chủ dự án kiểm.

## Đã hoàn tất

- Đủ101 món với202 thiết kế mới;606WebP trong suốt128/256/512, giữ nguyên303ảnh gốc. Manifest complete; catalog sinh lại xác nhận202/202ready.
- Có236master gồm các bản sửa được giữ lại, prompt nguyên văn và nguồn/hash. Dùng imagegen cho sáu khung sửa cuối. Căn bằng scale đồng đều/translate; không thêm lớp trang trí chung vào runtime.
- Xem so sánh ba hình thái từng món,303mẫu phối ba lớp ở116/52px và toàn bộ huy hiệu32px trên nền sáng/tối. Kiểm alpha/lỗ khung/vùng mặt/crop. Các cặp có thể phối được kiểm bằng hình học vùng mặt chung; không tuyên bố đã xem riêng mọi tổ hợp. IoU lỗ nhỏ nhất0,879; không tuyên bố contour hay landmark mặt trùng từng pixel.
- Tổng export51.737.686byte:128px3.431.912;256px10.936.566;512px37.369.208. Hash/dimensions của606export và606file tương ứng bên trong APK khớp manifest.
- APK release1.1a.2 đã build thành công, chữ ký v2 được apksigner xác minh;98.407.125byte. SHA256 `4db79d2f21fb2633f9efe7a15b53154334383bd34daca58d1e4391eb08c865c6`.

## Kiểm chứng

| Nhóm | Kết quả |
|---|---|
| npm run check; npm run build | PASS; build còn cảnh báo chunk lớn hơn500kB, không phải lỗi build |
| Unit toàn thư mục |269/269PASS; sửa kỳ vọng cũ/pin phiên bản legacy, không đổi luật game để ép pass |
| UI hồ sơ/kho/local-first/shop |49PASS,3ca cấu hình riêng không chạy trong lượt này |
| UI art sau tích hợp đầy đủ |5/5PASS:202lượt decode, đúng3lớp,0DOM dư, heap sauGC tăng552.044byte; không suy ra leak dài hạn hoặc60FPSAndroid |
| Production worker/offline |3/3PASS: cold boot/chơi, art fallback/cache, ô kho mua offline |
| Gameplay offline với emulator |1PASS: thắng/next/resume/checkpoint/raw fact |
| Emulator backend |3suitePASS:101migration/mốc level/overflow/CAS/phí/replay; quyền public/owner; snapshot backup/restore/watermark/CAS |
| Hồi quy mở rộng |90/98PASS ban đầu.1ca forge sai nhãn nút cũ đã sửa và retryPASS.7ca âm thanh còn chưa đạt; không đổi assertion để che lỗi |
| UI sao lưu tài khoản với emulator |Chưa đạt: timeout ở bound trước bước sao lưu, qua3lượt cấu hình/cổng/long-polling. Auth nhận200, FirestoreListen có phản hồi; chưa kết luận nguyên nhân là môi trường hay sản phẩm. Backend snapshot/CASPASS không thay thế ca này |

Đã đọc diff các owner quan trọng và kiểm tra riêng sau triển khai; không có reviewer agent độc lập trong lượt này. Không nhận các kiểm tra chưa chạy hoặc thất bại là đạt. Log/ảnh QA giữ tại runtime/qa, không đưa vào bundle hay commit ảnh QA.

## Chưa làm / cần tiếp tục sau khi tạm dừng

1. Chủ dự án kiểm APK trên Android thật: cài/cập nhật, đăng nhập/khôi phục, offline/cold boot, chân dung/khung/huy hiệu ởLevel6/7/20/21, bộ nhớ/FPS/chuyển nền/âm thanh/quảng cáo.
2. Chẩn đoán UI sao lưu tài khoản emulator bị timeout tại bound; xác minh lại backup→restore và tình huống nhiều thiết bị. Chưa tái hiện/xác nhận dứt điểm lỗi QUIC từng được chủ dự án báo trên mạng thật.
3. Rà7ca audio chưa đạt: achievement popup chặn mở rương; fixture mở rương lỗi dùng giả định overflow cũ; thao tác “Trò sau” cũ; visibility event; Memory/Link phát thêm cue so với kỳ vọng; mốc thưởng Triple không có cue mong đợi. Cần đối chiếu test với chính sách/thao tác hiện hành trước khi sửa source; chưa kết luận tất cả là lỗi sản phẩm.
4. Sau các mục trên mới nghiệm thu toàn phần Gate6/O6/Gate7. Gate5 đã hoàn thành. Không phát hành Hosting production hoặc Rules trong lượt này.
5. Match3Connect và MemorySequence vẫn chỉ chờ phân tích, không triển khai.

APK bàn giao: `runtime/releases/MemoryMatchAdventure-1.1a.2-cosmetics-2026-11-11.apk`. Link test dự kiến dùng target Hosting `test` hiện hữu (`memorymatch-test.web.app`); trạng thái phát hành thực tế được ghi sau khi lệnh hoàn tất và đối chiếu artifact.

## Bổ sung nghiệm thu 16/11/2026

Các tồn đọng emulator backup/restore và retry đồng bộ được chạy lại sau sửa: local-first account 1/1; offline→online 1/1; commit mất phản hồi rồi reload browser 1/1; server fault/403/quyền/giờ tương lai 4/4; hai thiết bị 1/1. Phần khôi phục dùng snapshot intent bền, fingerprint và revision, ACK đúng operation ID đã publish, giữ các operation mới phát sinh, và settle raw reward fact theo ngày máy chủ xác nhận. Các kịch bản xác nhận giao dịch đã commit không cấp/trừ lần hai và lỗi mạng không chặn phiên chơi.

Hồi quy âm thanh đã chạy lại: 29 PASS, 2 SKIP theo điều kiện skip có sẵn. `npm run check` và `npm run build` PASS; build còn cảnh báo chunk main 545.90KB vượt ngưỡng cảnh báo 500KB. Manifest 202/202 sẵn sàng; UI art decode 202 chân dung, tối đa3 lớp, không DOM dư, viewport profile320/412/1024. Không xác nhận FPS/heap Android vật lý; chưa có reviewer độc lập. Do đó các ca backup timeout/audio trước đây được cập nhật là đã chạy lại đạt hoặc skip như nêu; Gate6/O6/Gate7 vẫn chưa đóng cho tới khi có reviewer độc lập và kiểm chứng Android/performance còn thuộc tiêu chí nghiệm thu. Chi tiết technical tại design/expedition/IMPLEMENTATION_NOTES.md. Không deploy Rules/Hosting hoặc tạo APK trong lượt này.
