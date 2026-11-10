# Kế hoạch cập nhật Bảng xếp hạng — 09/11/2026

Trạng thái: **đã hoàn tất triển khai và nghiệm thu web Gate0–4 ngày10/11/2026**. Đã phát hành BXH v4 lên web test và backend dùng chung theo yêu cầu10/11; không phát hành Hosting production. Kế hoạch ngoại hình/offline hiện hành vẫn giữ ownership hiện có. Tài liệu này là đặc tả riêng cho lượt BXH tiếp theo, không thay thế hoặc mở rộng công việc của agent khác.

## 1. Phạm vi và quyết định đã chốt

- Áp dụng Memory Match, Link Connect và Triple Connect.
- Ảnh mẫu chỉ tham khảo bố cục. Giữ nguyên kiểu tab ba trò, bộ chọn Hành trình/Thử thách/Vô tận, header, dock, phân trang, bảng màu, font, icon độ khó và ngoại hình hiện có. Không dùng ảnh mẫu làm asset UI, không vẽ lại tab theo ảnh.
- Hành trình có bốn bảng riêng C/B/A/S, tương ứng easy/normal/hard/superHard. Chỉ Hành trình có bộ chọn này.
- Hành trình xếp theo: màn đã vượt qua cao hơn → điểm cao hơn → sai ít hơn → lượt ít hơn. Chơi lại dùng cùng bộ so sánh để giữ kết quả tốt hơn.
- Lưu nguyên bộ chỉ số của một lần hoàn thành cùng màn, cùng độ khó. Không ghép điểm cao nhất, số sai thấp nhất và lượt thấp nhất từ các ván khác nhau.
- Thử thách/Vô tận chỉ đồng bộ bố cục; giữ nguyên ý nghĩa dữ liệu và thứ tự xếp hạng hiện tại. Không tự thêm thống kê chưa có hoặc đổi sang luật của Hành trình.
- Chủ dự án đã giao triển khai toàn bộ kế hoạch. Chủ dự án đã cho phép phát hành web test và Rules/chỉ mục ngày10/11; không phát hành Hosting production hoặc tạo APK.

## 2. Bố cục dành cho người chơi

### Hành trình

1. Giữ header và tab ba trò đúng giao diện đang dùng trong game, kể cả trạng thái chọn và kích thước.
2. Hàng bộ lọc giữ bộ chọn chế độ hiện có; vùng bên phải thay nhãn “Màn” bằng bốn nút C/B/A/S gọn. Dùng token/icon/nút có sẵn, không tạo phong cách tab mới. Nếu 320px không đủ vùng chạm, cho riêng bộ lọc xuống hàng; không thu chữ quá nhỏ hoặc ép nút mất khả năng bấm.
3. Mỗi hàng người chơi gồm hai dòng: tên bắt đầu từ bên trái phía trên huy chương/avatar; nhãn “Màn N” ở bên phải. Dòng dưới đặt hạng và avatar bên trái, ba cột Lượt/Sai/Điểm bên phải.
4. Không thêm dòng “kỷ lục màn…”, ghi chú thử nghiệm hoặc lời giải thích kỹ thuật. Màn và độ khó không lặp lại ở từng hàng vì bộ lọc đã thể hiện độ khó.
5. Top 1–3 dùng huy chương đang có; avatar/khung/huy hiệu dùng renderer hồ sơ chung. Không tạo ảnh đại diện thay cho lựa chọn thật.
6. Hàng “Bạn” giữ ở cuối như hiện tại, cùng ngữ nghĩa và cách căn chỉ số với danh sách. Chỉ hiển thị hạng máy chủ đã xác nhận/cached đúng bảng; không tự tăng hạng theo kết quả còn chờ đồng bộ.
7. Giữ 10 người/trang và khả năng cuộn danh sách; không ép số hàng theo ảnh minh họa. Tên dài có ellipsis và tên đầy đủ trong tên truy cập; số có phân cách hàng nghìn, không thay bằng số giả khi thiếu dữ liệu.

### Thử thách và Vô tận

- Tái dùng bố cục tên trên, hạng/avatar dưới và chỉ số thật bên phải.
- Hiện tại cả hai đang dùng bảng tiến độ v3 với “Màn”; tiếp tục hiển thị giá trị đó, không dựng ba cột Lượt/Sai/Điểm bằng 0 hay lấy từ ván khác để lấp khoảng trống.
- Không hiển thị C/B/A/S, không đổi bộ so sánh, board ID hoặc dữ liệu v3 của hai chế độ này.

## 3. Những khoảng trống đã xác nhận trong code

- `js/progressRankingModel.js`: kết quả v3 chỉ có game/family/màn/owner/identity; Hành trình không tách độ khó. `keepProgressBest` chỉ thay khi màn cao hơn.
- `js/leaderboardPanel.js`: cả ba family đọc bảng `kind:progress`, `rulesVersion:3`; danh sách và hàng cá nhân hiện chỉ render màn.
- `js/leaderboardStore.js`: progress chỉ gửi màn và mốc thời gian; query theo màn giảm dần, thời điểm tăng dần. Chưa có điểm/lượt/sai cho yêu cầu mới.
- `js/leaderboardService.js`: queue/receipts giới hạn 9 bảng và kiểm tra key v3 cố định. Chỉ thêm field ở UI sẽ không đủ; phải xử lý queue, cache và định danh bảng.
- `js/gameState.js` normalize `levelBestsV3`; migration/chapter data và checkpoint kết thúc màn cũng thuộc phạm vi dữ liệu cần kiểm tra.
- `firestore.rules`: danh sách field cho phép cố định, cập nhật progress cùng màn bị từ chối. Cần contract mới có kiểm thử, không chỉ sửa client.
- `styles/leaderboard.css` sở hữu layout; ngoại hình hồ sơ có owner dùng chung. Không sửa artwork/cosmetic store để đạt bố cục BXH.

## 4. Phương án dữ liệu

### So sánh hai hướng

- Sửa trực tiếp bảng v3: ít loại dữ liệu hơn, nhưng bảng đang gộp độ khó; client cũ, thứ tự query, queue, cache và Rules có thể hiểu sai. Không chọn.
- Kết quả/bảng phiên bản mới riêng cho Hành trình theo độ khó: tách biệt rõ và tương thích client cũ; phải cập nhật adapter, normalize, queue, migration, Rules và indexes. **Chọn hướng này**. Không tạo hệ persistence hay cơ chế đồng bộ song song.

### Contract cần đóng băng ở gate đầu

- Một record có game, mode, màn đã hoàn thành, điểm, lượt, sai, completion/result identity, owner và version. Public projection chỉ chứa thông tin công khai cần thiết; không đưa save hay identity riêng tư lên BXH.
- `moves/misses/score` là kết quả **toàn màn qua đủ các vòng**, không chỉ vòng cuối, không tổng cả hành trình. Adapter mỗi trò lấy từ settlement hoàn tất bền vững; xác định rõ điểm cuối cùng có bonus theo hành vi game hiện có, tránh cộng hai lần.
- Ván thua, bỏ dở hoặc mới đạt một phần vòng không trở thành kết quả hoàn thành màn. Không ghi theo tick/frame. Replay cùng completion ID không tạo thêm write.
- Bộ so sánh thuần duy nhất dùng bởi chọn best local, merge, queue, submit và query contract. Nếu bốn chỉ số bằng nhau, giữ record cũ; BXH dùng thời điểm máy chủ và UID để phân định ổn định khi bằng nhau. Timestamp không đổi khi retry hoặc ván không tốt hơn.
- Đề xuất board version mới cho 3 trò × 4 độ khó; 6 bảng Thử thách/Vô tận v3 vẫn hoạt động. Queue tối thiểu đủ 18 bảng của một owner, cache/receipts/cursor tách đúng version/game/family/mode; mọi cấu trúc vẫn có giới hạn.
- Một best public cho màn cao nhất ở mỗi độ khó; kỷ lục màn thấp hơn không thay màn cao hơn. Kết quả đã lưu theo từng màn giữ trong nguồn dữ liệu hiện có, không bắt buộc thêm màn xem chi tiết hoặc bảng xếp hạng từng màn trong task này.

## 5. Dữ liệu cũ và offline

- Giữ nguyên dữ liệu v1/v2/v3; không gán màn cao nhất đang gộp cho cả bốn độ khó.
- Chỉ khôi phục màn theo độ khó từ completion có chứng cứ, owner và số vòng hợp lệ. Chỉ khôi phục ba chỉ số nếu chứng minh cùng một lần hoàn thành; không mặc định các best cũ là một bộ thống nhất.
- Trường hợp có chứng cứ màn nhưng thiếu bộ chỉ số: bảo toàn tiến độ, hiển thị “—” cho chỉ số chưa có; không coi thiếu là 0 sai/0 lượt, không tạo lợi thế so với kết quả đầy đủ. Contract mới phải biểu diễn rõ mức đầy đủ và thống nhất query/Rules; record đầy đủ cùng màn được phép bổ sung, record thiếu không được hạ cấp record đầy đủ. Kiểm tra giải pháp query và sort ở gate 0 trước khi chốt fields/indexes.
- Nếu chỉ có record gộp cũ và không xác định được mode, giữ record cũ để tương thích, chưa phát thành tích vào bảng độ khó mới. Chơi/hoàn thành lại tạo record mới hợp lệ; không làm mất màn mở khóa hay tiến trình.
- Migration idempotent, theo batch giới hạn, không suy diễn owner khi đổi tài khoản. Máy khách cũ tiếp tục dùng bảng cũ.
- Dùng persistence/queue local-first đang có; lưu kết quả trước rồi đồng bộ nền. Offline xem cache đúng bộ lọc nếu có; chưa có cache dùng trạng thái mất kết nối tự nhiên hiện có, không làm game bị khóa.
- Đồng bộ nhiều thiết bị giữ record tốt hơn cùng owner/game/mode; kết quả kém, retry, đăng xuất/đăng nhập không ghi đè best hoặc lẫn bảng. Bản local chờ gửi không được giả thành hạng công khai đã xác nhận.

## 6. Các gate triển khai tuần tự

### Gate 0 — đóng băng contract và ranh giới ownership

- Lập inventory checkpoint/settlement của 3 trò, normalize save/chapter, merge cloud và receipt/queue/cursor; đối chiếu cách cộng chỉ số qua nhiều vòng.
- Chốt tên/version record mới, public projection, missing-data ordering, board IDs, queue bound và composite indexes. Viết bảng ví dụ vào/ra cho comparator và migration.
- Phối hợp agent sở hữu persistence/ngoại hình/offline trước khi cùng sửa module. UI-only có thể chuẩn bị độc lập nhưng không mock số liệu thành sản phẩm đã hoàn tất.
- Điều kiện qua: contract biểu diễn được mọi dữ liệu cũ/mới, query cho cùng thứ tự với local và Rules; không còn quyết định sản phẩm mơ hồ.

### Gate 1 — model, settlement, save và migration

- Thêm model/comparator/normalizer version mới qua adapter phù hợp; thu thập tuple cùng một lần hoàn thành cho từng trò/mode.
- Kết nối settlement lưu bền, resume/replay, merge và migration theo contract. Không sửa điểm hay luật gameplay để thuận tiện cho BXH.
- Điều kiện qua: unit/contract qua với 4 độ khó, 3 trò, nhiều vòng, replay tốt/kém/bằng, save thiếu/hỏng/cũ, owner khác, migration lặp và hoàn thành dở dang.

### Gate 2 — queue, máy chủ và cache

- Cập nhật service/store, queue/receipt, retry và query/indexes version mới; giữ đường đọc/ghi v3 của Thử thách/Vô tận.
- Cập nhật đúng owner Rules, tránh chạm khối generated của ngoại hình/liveops; nếu phần được sinh tự động thì sửa source generator.
- Test emulator: schema invalid/âm/thiếu, sai game/mode/owner, giới hạn số nguyên, ván kém hoặc hạ màn, cải thiện cùng màn, bổ sung metric thiếu, concurrent writes, retry, cache/pagination/rank ties, offline rồi reconnect.
- Điều kiện qua: thứ tự local/query/Rules thống nhất, không mất best, không mất queue khi số bảng tăng, không lẫn cache khi đổi bộ lọc nhanh.

### Gate 3 — UI đồng bộ giao diện game

- Chỉ đổi layout ở leaderboard panel/CSS owner. Giữ nguyên DOM/hình thức tab trò chơi và bộ chọn family trừ điểm kết nối cần thiết; thêm bộ chọn độ khó theo token/nút hiện có.
- Dùng chung cách dựng identity/metric cho danh sách và hàng “Bạn” nếu cùng ngữ nghĩa. Thẻ tên/avatar không rebuild chỉ vì trạng thái tải hoặc metric đổi.
- Khi đổi game/family/mode: reset trang/cursor phù hợp, không để request cũ cập nhật màn mới, nhớ độ khó gần nhất trong vòng đời bảng; không cần thêm save preference mới.
- Test 320px, S22U tham chiếu384×824, 390/412px, 844×390 và desktop1024px; kiểm tra cả5skin, tên dài, điểm lớn, thiếu ảnh, thiếu metric, không có hạng, loading/error/offline và font thực tế.
- Điều kiện qua: không tràn/chồng/cắt, các tab giữ đúng thiết kế hiện tại, hàng “Bạn” và phân trang không che danh sách, focus/keyboard/scroll an toàn.

### Gate 4 — nghiệm thu và chuẩn bị phát hành

- Review diff theo acceptance criteria; chạy lại suite trọng yếu, kiểm tra mở/đóng/đổi bộ lọc/chuyển trò nhiều chu kỳ, account switch và mất mạng trong lúc gửi. Không gom sửa ngoài phạm vi.
- Test mục tiêu: progress/ranking/checkpoints/leaderboard/Rules và UI leaderboard layout/service; bổ sung test cần thiết cho contract mới. Static/CSS checks và build web khi nghiệm thu; không chạy test không liên quan để thay cho bằng chứng.
- Ghi ngắn kết quả và giới hạn trong CONTEXT; gom commit theo phase hoàn chỉnh nếu được yêu cầu, không đưa runtime/ảnh QA vào commit.
- Nếu cần phát hành backend: chuẩn bị diff Rules/indexes, bằng chứng emulator và rollback trước; chỉ deploy khi có yêu cầu/quyền phát hành. Không cho client mới dùng board trước khi contract máy chủ sẵn sàng. Không tự deploy hoặc tạo APK trong task lập kế hoạch.

## 7. Acceptance criteria tổng

- [x] Tab trò chơi, selector family, header/dock và phong cách5skin đồng bộ game hiện tại, không bê thiết kế ảnh mẫu.
- [x] Mỗi game có4bảng Hành trình C/B/A/S độc lập; bộ lọc không xuất hiện ở Thử thách/Vô tận.
- [x] Tên phía trên rank/avatar; màn bên phải; Lượt/Sai/Điểm là cùng một record hoàn thành màn đúng độ khó.
- [x] Xếp hạng và chơi lại theo thứ tự đã chốt; kết quả kém/bằng không làm mất best hoặc đổi timestamp.
- [x] Hai family còn lại giữ dữ liệu/luật đang có, chỉ đổi bố cục; không hiện số giả.
- [x] Save cũ/thiếu chỉ số, migration, nhiều owner/thiết bị, queue và cache đều có kiểm chứng; không lùi tiến độ hay đổi luật chơi.
- [x] Offline vẫn chơi/lưu máy được; reconnect gửi đúng một record tốt nhất, không lẫn hạng công khai và thành tích đang chờ.
- [x] Mobile hẹp,384px tham chiếu S22U, ngang, desktop và5skin không lỗi layout; không gọi là đã test S22U thật nếu chỉ đo viewport.
- [x] Unit, emulator, UI và build cần thiết đạt trước bàn giao triển khai; không dùng riêng ảnh minh họa làm bằng chứng.

## 8. Ngoài phạm vi

Không thêm mùa giải, phần thưởng BXH, chia sẻ ảnh, màn chi tiết hồ sơ mới, chống gian lận phía server mới, thay cách tính điểm, tạo asset/skin mới, viết lại persistence hoặc chỉnh schema của Thử thách/Vô tận. Các nhu cầu này phải thành yêu cầu riêng.


## Ghi nhận Gate0 — contract đã chốt khi triển khai

- Hành trình mới: kind adventure/rulesVersion4/family adventure, board v4_<game>_adventure_<mode>. Định danh lần hoàn thành lấy wave.attemptId; metrics từ completedMoves/completedMisses và điểm settlement có bonus cuối màn đúng một lần.
- Kết quả thiếu metric có metricsComplete=false, score=-1 và counters0 chỉ làm sentinel lưu/query, UI luôn hiện —. Score đo được≥0 nên luôn xếp trên record thiếu cùng màn mà không phải thêm thứ tự ưu tiên sản phẩm. Record đủ dùng score≥0/misses≥0/moves≥misses. Query: level DESC, score DESC, misses ASC, moves ASC, reachedAt ASC, documentId ASC.
- Giữ v3 nguyên vẹn; giới hạn queue/receipt21 để chứa cả9bảngv3 +12bảngv4 trong giai đoạn tương thích. Không tạo queue mới.
- Phối hợp chat “Giữ tiến trình mốc thưởng” bằng tin nhắn đã được chủ dự án cho phép. Chỉ chạm gameState normalize/recordGameResult và chapterStore ranking; không sửa controller/persistence/account/liveops của chat đó. Cờ VITE_ADVENTURE_RANKING_V4: dev tắt Firebase thật hoặc emulator mở mặc định, production tắt mặc định cho tới khi Rules/indexes được phát hành có phép. Production tắt cờ giữ nguyên đường đọc/ghi v3, không đưa v4 vào queue gửi.
- Model đầu tiên và4unit về12board/tuple/comparator/migration/owner đã đạt. Chưa coi Gate1–4 hoàn tất.


## Nghiệm thu Gate1–4 — 10/11/2026

- Gate1: adventureRankingModel và điểm tích hợp recordGameResult lấy đúng bộ chỉ số toàn màn/bonus; giữ best theo mode và record cùng nguồn trong bestByLevel. Normalize/save thêm adventureBestsV4, marker migration4 và record phụ; giữ nguyên SAVE_FORMAT_VERSION2/IDB3 cùng API/bảngv1–v3. Chapter writer giữ best khi stale write, khi bằng tuple giữ ID durable; restore cùng UID giữ best summary, không trộn owner.
- Gate2: rankingResult/store/service hỗ trợ version4, comparator thống nhất với query và Rules, queue/receipt21bảng có giới hạn. Rules/indexes là bổ sung; không sửa generated reward/cosmetic contract của chat khác. Cờ production mặc định tắt, không gửi record4 hay đổi query/UI public khi chưa bật.
- Gate3: tab ba trò giữ nguyên; family picker giữ nguyên; thêm4nút C/B/A/S chuẩn vùng chạm44px, 320px tự xuống hàng riêng. Tên trên/avatar+hạng trái, Lượt/Sai/Điểm phải, Màn trên phải, hàngBạn ghim; Challenge/Endless vẫn chỉ sốMàn thật. Skin Cổ tích dùng giấy/mực của skin và chỉnh lá trang trí gọn trong panel, không dùng chữ nâu trên nền tối. Dữ liệu thiếu hiện —; tên dài/số lớn/ảnh lỗi vẫn dùng được.
- Gate4: đã đọc lại diff, kiểm tra owner/cleanup/generation guard và compatibility. Không tạo listener/timer nền mới ngoài listener bộ lọc do scope hiện hữu sở hữu; 30chu kỳ mount/unmount đạt. Không thêm asset hoặc can thiệp controller/liveops/account của agent khác.

### Bằng chứng đã đạt

- `npm run check`: toàn bộ cổng hiện có đạt; sau đó thêm `check:adventure-ranking` vào chính chuỗi check và chạy nhóm mới đạt riêng. `npm run check:adventure-ranking`:4unit + hợp đồng12settlement/normalize/atomic rollback/migration/chapter stale write/queue21/adoption/restore đạt.
- Rules emulator mới:12board, mọi tầng comparator, replay cùng màn, tie không đổi timestamp, concurrent writes, từ chối owner/schema giả, nâng cấp record thiếu,3trang và hạngcá nhân/cache đạt. `scripts/check-leaderboard-rules.mjs` cũ cũng đạt với0/1/10/11/20/21row, UIDties, v1/v2/v3 và history isolation. Lỗi permission-denied trong log là các ca cố tình phải bị từ chối.
- UI:25ca layout/service độc lập đã đạt (22ca hồi quy,1matrix12bộ lọc/5skin/6viewport,2edgecase dữ liệu thiếu/cờrelease tắt). Các ca giữ tên game/tab, pagination, bàn phím, ảnh lỗi, resource30chu kỳ, request stale, cache offline, account switch và best mới trong lúc gửi đều được giữ. Một lần service test chạy chung không nhận send đúng thời hạn; chạy riêng rồi chạy cả nhóm lần2 đều đạt, không thêm sleep hoặc làm yếu kiểm tra.
- UI Firebase thật qua emulator riêng Auth9399/Firestore8380:3ca cho3trò lưu tuple khi offline, reload, gửi đúng ID một lần, không đổi reachedAt khi recover lại, đọc đúng chỉ số ở hàngBạn. Không gọi backend production.
- Đã xem ảnh thật ở default và storybook384px. Matrix320/384/390/412/844×390/1024px đạt; đây là viewport tham chiếu, chưa thử S22Ultra thật.
- Build mặc định và build bật `VITE_ADVENTURE_RANKING_V4=1` vào runtime/qa-leaderboard-build và runtime/qa-leaderboard-enabled-build;387module. Chứng cứ runtime/qa-leaderboard-refresh-v2, runtime/qa-leaderboard-matrix, runtime/qa-leaderboard-edge-cases, runtime/qa-leaderboard-v4-live. Test source mới tests/ui/leaderboard-v4.spec.js và tests/unit/adventure-ranking.test.js; không đưa ảnh/log/runtime vào commit.

### Quy trình phát hành — đã thực hiện cho web test10/11

1. Review/deploy bổ sung Rules BXH và composite index trong firestore.indexes.json; chờ index READY. Không xóa bảng hoặc index cũ.
2. Sau khi backend sẵn sàng, build với VITE_ADVENTURE_RANKING_V4=1 và phát hành Hosting theo quyền chủ dự án. Build mặc định không bật tính năng mới.
3. Xác minh12board, migration record cũ, hạng cá nhân và reload/offline trên bản public. Không báo đã đạt bước này từ emulator.
4. Rollback: tắt cờ và phát hành bản tương ứng, giữ nguyên records4/Rules/indexes; client quay về bảngv3 cũ, không xóa tiến trình.

Khi dev kết nối Firebase thật cũng phải bật cờ rõ ràng sau khi backend sẵn sàng, tránh truy vấn bảng chưa có Rules/index. Dev VITE_FIREBASE_DISABLED=1 và emulator mở mặc định.

Đã deploy đúng site memorymatch-test và backend BXH dùng chung; không phát hành Hosting production hoặc APK. Commit chỉ gom phần BXH, giữ thay đổi của chat khác ngoài index Git.


## Phát hành web test — 10/11/2026

- Quyền mới: chủ dự án yêu cầu “push web test, rules nếu có, comit và cập nhật context”. Không bao gồm Hosting production hoặc APK.
- URL: https://memorymatch-test.web.app. Build87b12ffae370b5bf,387module/3292file; build riêng runtime/qa-leaderboard-test-release với VITE_ADVENTURE_RANKING_V4=1,VITE_FIREBASE_ENV=test,VITE_FIREBASE_USE_EMULATORS=0. Không ghi đè dist. Cấu hình deploy runtime/leaderboard-hosting-release.json chỉ trỏ site memorymatch-test.
- Rules projectmemorymatchv1-1a: backup ruleset28a5e576-4e28-4213-b2cb-b972183e4861; đối chiếu chỉ khác phần BXH. CLI kiểm tra từ xa503 hai lần; Rules mới được máy chủ tạo/biên dịch qua API và cập nhật release thành công sau retry. Ruleset mới d6bbe9d7-ab3c-4736-81a9-ad2b620f83d3, canonicalSHA256 11473f0e5cb75c9ab040082a4face7da8ef330bef7cd99ab2bcfbc36b2d2ec9a; đọc lại khớp nguồn. Chỉ mục CICAgOi3kJAK đã READY; giữ hai index cũ, không xóa gì.
- Xác minh bản public test: manifest đúng buildID,12/12board tải thành công, mọi request quan sát được đúng test-waves1. Các bảng hiện rỗng, không tạo thành tích giả để lấp UI. Screenshot/receipt ở runtime/leaderboard-test-live.png và runtime/leaderboard-test-verified.json.
- Kiểm tra độc lập ranh giới offline trên chính web test: mở bàn Memory khi online, ngắt mạng, ghép một cặp và xác nhận session được lưu vàoIndexedDB; dùng một gợi ý offline và xác nhận tồn kho giảm đúng một. BXH đọc cache khi offline; không có pageerror. Không coi đây là chứng nhận toàn bộ cold-start/asset offline hoặc S22U thật.
- Lỗi503 là dịch vụ phát hành Rules, không phải lỗi nhận/dùng quà. Giữ nguyên luồng local-first của chat “Giữ tiến trình mốc thưởng”; chỉ hunk BXH trong gameState/Rules được đưa vào commit, không gom logic thưởng/ngoại hình của các chat khác. Những thay đổi ngoài BXH đang có trong workspace vẫn giữ nguyên.
- Kiểm tra trước commit: check:adventure-ranking và staged diff check đạt; không stage runtime/log/ảnh QA. Phát hành Hosting production vẫn ngoài phạm vi lượt này; rollback web test bằng bản build tắt cờ và giữ nguyên dữ liệu/indexes.


## Phát hành theo yêu cầu chủ dự án — 10/11/2026

Chủ dự án đã giao tiếp hai bước backend→Hosting và hoàn tất kế hoạch; quyền này thay ghi chú chưa có quyền phát hành ở trên. Đã đối chiếu bản local-first vừa phát hành với source ghép: service/persistence/account/cloud và controller mốc thưởng không thay đổi; gameState/chapterStore chỉ bổ sung record/migration BXH v4. Không có xung đột behavior/schema cần chủ dự án quyết định.

- [x] R0: sao lưu/read-back backend. Máy chủ đã có Rules khớp source (ruleset d6bbe9d7-ab3c-4736-81a9-ad2b620f83d3) và3composite indexes READY, gồm index v4; không deploy lại cấu hình giống hệt hoặc xóa index cũ. Backup trong runtime/qa/leaderboard-release.
- [x] R1: nghiệm thu bản ghép local-first+BXH bật cờ, emulator và production build.
- [x] R2: Hosting production bật VITE_ADVENTURE_RANKING_V4=1; xác minh artifact public và12boardv4/6boardv3 bằng truy vấn thật không tạo thành tích giả.

Snapshot phát hành `runtime/leaderboard-release` lấy bản local-first đã chạy và overlay riêng owner BXH, giữ rollback tại runtime/local-first-release. Không build từ checkout nhiều task đang cùng sửa.


### Kết quả phát hành cuối — 10/11/2026

- Không có xung đột với local-first: tám owner service/persistence/account/cloud/controller thưởng khớp bản đã chạy. GameState/chapterStore chỉ ghép các record/migration BXH theo kế hoạch. Rules thực tế đã bằng source và index v4 READY cùng hai index cũ, nên không redeploy backend trùng lặp hoặc xóa dữ liệu/index.
- Snapshot runtime/leaderboard-release: full `npm run check` PASS gồm check:adventure-ranking; build bật v4 PASS387modules/18,29s.35UI PASS gồm23layout/filter/style/cached/stale và12offline/mốc thưởng;10ca service legacy được skip ở lượt không bật emulator, không tính là pass. Lượt emulator riêng sau đó: Rules mới12board/comparator/owner/deny/concurrency/missing/pagination/rank PASS; Rules legacy và snapshot backup PASS;4UI Firebase thật PASS (3trò offline→reload→publish đúng tuple, không đổi timestamp;1account backup giữ local-first).
- Artifact production:4/4 UI PASS (320/384/1024px, đủ12filter, Challenge/Endless không hiện độ khó và cold boot offline thật). Không sửa source sản phẩm sau build. Đã lưu cờ `VITE_ADVENTURE_RANKING_V4=1` trong .env.production để những lần build production tiếp theo không tự quay lại BXH cũ; có thể override0 khi rollback.
- Production read-only:12boardv4 và6boardv3 truy vấn thành công, kiểm ordering/schema và hạng1 cho dòng đầu nếu bảng có dữ liệu. Tài khoản anonymous dùng để xác minh đã xóa; không ghi thành tích giả. Bằng chứng runtime/qa/leaderboard-release/public-queries.json.
- `npx firebase deploy --only hosting:production --project memorymatchv1-1a --non-interactive` từ snapshot exit0,3292file, release complete. URL https://memorymatchv1-1a.web.app. HTTPS index/sw/main/achievement bundle đều khớp SHA256 artifact; mở chính trang public ở384px và chọn đủ12filter thành công. Bằng chứng hosting-verified.json/public-384.png trong cùng thư mục QA; deploy/build/check/UI logs ở runtime/leaderboard-release/runtime/qa.
- Hạng cá nhân khi có record, migration và exactly-once đã kiểm bằng emulator; các bảng public trống được giữ trống, không thêm dữ liệu để chụp ảnh. Không tuyên bố test điện thoại S22U vật lý. Không APK/commit, không đưa log/ảnh QA vào commit. Lượt phát hành này hoàn tất kế hoạch BXH; không đóng thay các gate ảnh/Android của task khác.
- Rollback sẵn: artifact local-first trước tại runtime/local-first-release/dist; hoặc build với cờ0. Giữ nguyên Rules/indexes/record v4 khi rollback, không xóa tiến trình.

### Bổ sung cấu hình localhost — 10/11/2026

Ảnh chủ dự án gửi là Vite local cổng4173, không phải Hosting. Production đã bật nhưng .env.local thiếu VITE_ADVENTURE_RANKING_V4 nên dev kết nối Firebase thật vẫn theo mặc định v3. Đã thêm cờ1 vào cấu hình local, xác nhận module đang phục vụ DEV=true/cờ1 và mở chính localhost bằng browser riêng: cả3trò đều có4độ khó. Ảnh QA runtime/qa/leaderboard-release/local-384-enabled.png. Không thay dữ liệu, không build/deploy lại, không xóa cache/save người chơi.
