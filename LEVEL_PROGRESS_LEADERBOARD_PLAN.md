# Kế hoạch tiến độ màn và bảng xếp hạng

Ngày lập: 2026-10-14. Cập nhật: 2026-10-15. Trạng thái: Phase0–6 hoàn tất phần mềm, mỗi phase một commit. Không còn kế hoạch triển khai active; tài liệu này là hồ sơ nghiệm thu. QA Galaxy S22 Ultra thật còn chờ theo xác nhận người dùng. LEADERBOARD_REDESIGN_PLAN.md và EFFECTS_LEADERBOARD_PLAN.md là hồ sơ lịch sử. Yêu cầu mới trong kế hoạch này thay luật xếp hạng time/run-score, sáu bộ lọc và picker màn của các hồ sơ trước.

## 1. Quyết định sản phẩm đã chốt

- Level là số màn chơi, không phải cấp profile; không thêm XP/cấp.
- Mỗi trò có ba bảng: Hành trình / Thử thách / Vô tận. Không cộng thành tích ba trò vào một bảng.
- Hành trình: màn cao nhất đã thắng ở bất kỳ độ khó thường nào. Mở khóa giữa Dễ/Trung bình/Khó/Siêu khó tiếp tục dùng chung; điểm và sao vẫn riêng theo màn/độ khó.
- Thử thách/Vô tận: số màn thắng liên tiếp trong một lượt bắt đầu từ màn1. Thua rồi Chơi lại bắt đầu lượt mới từ màn1, giữ kỷ lục tốt nhất trước đó.
- Cả ba kiểu chơi tiếp tục sinh màn mới, không có mốc kết thúc100.000. Con số100.000 là mẫu kiểm khả năng mở rộng; không quảng cáo vô hạn toán học vượt giới hạn số/lưu trữ.
- Điểm tiếp tục phục vụ gameplay và sao; điểm/thời gian không quyết định bảng xếp hạng mới.
- Bấm vào tên từng trò trên bảng xếp hạng sẽ mở danh sách chọn ba bảng. Chọn một mục mới tải bảng; không đặt ba nút thường trực bên dưới.
- Giữ nền Vườn đêm, dòng top3/self, phân trang số nhỏ cùng dấu… chỉ cho trang đã tải. Bỏ strip sáu mode và picker chọn màn khỏi ranking.

## 2. Phạm vi và giới hạn

Triển khai luật tiến độ/bảng mới, lượt chơi lại, sinh màn cao, dữ liệu tương thích và UI tương ứng. Cập nhật nhãn điểm/kỷ lục và bỏ điểm trên nút bản đồ để nội dung nhất quán.

- Giữ Xu, kho, giá vật phẩm, chủ đề, profile private, ngày tham gia và thời gian chơi. Không thay luật thưởng hoặc ngưỡng sao bằng các tỷ lệ35%/70% đã đề xuất trong chat: các tỷ lệ đó chưa được chốt. Tinh chỉnh công thức/ngưỡng sao là công việc cân bằng riêng.
- Hành trình Chơi lại vẫn chơi lại màn hiện tại. Trong hai chế độ đặc biệt, Chơi lại được hiểu là lượt mới từ1, kể cả gọi từ menu Tạm dừng; nhãn hành động phải phản ánh rõ điều đó.
- Tiếp tục một lượt đang dở qua lưu/khôi phục không phải Chơi lại: giữ runId, bàn, seed, thời gian và số màn đã thắng. Thoát menu khi đang chơi giữ phiên theo hành vi hiện có. Lượt đã thua không được resume như đang chơi.
- Vật phẩm tiếp tục/cứu lượt nếu hiện có giữ nguyên khả năng và chi phí; đó là tiếp tục cùng lượt, không cấp sẵn màn thắng. Không âm thầm xóa đường cứu lượt để làm bảng mới.
- Giữ điều kiện thua riêng từng trò/mode; không thêm countdown vào Vô tận hoặc tạo điều kiện thua mới chỉ vì chuẩn hóa lượt. Kỷ lục được checkpoint theo màn thắng ngay cả khi lượt Vô tận đang tiếp tục.
- Không deploy Hosting, build APK, đổi billing, làm admin dashboard hoặc anti-cheat server mới. Backend hiện vẫn client-trusted; Rules kiểm quyền/shape/monotonic, không chứng minh người chơi thật sự thắng.
- Chỉ thêm contract/schema có phiên bản cần thiết. Không đổi ID game/mode, effect ID, save formatVersion2 hoặc xóa bảng/kỷ lục v1/v2. Giữ dữ liệu cũ để phục hồi và đọc tương thích.

## 3. Luật xếp hạng và đồng bộ

### Ba bảng cho mỗi trò

| Bảng | Nguồn thành tích | Điều kiện cập nhật |
|---|---|---|
| Hành trình | max(level đã thắng thuộc bốn mode thường) | Một màn cao hơn đã thắng và settlement local commit thành công |
| Thử thách | số màn đã thắng trong một lượt hợp lệ từ1 | Checkpoint thắng nâng kỷ lục số màn của lượt |
| Vô tận | như Thử thách, luật bàn/thời gian riêng | như Thử thách |

- Thắng100, mở/chơi/thua101 vẫn ghi100. Thắng màn cũ hoặc đạt điểm cao hơn ở cùng màn không sửa thành tích level.
- Mỗi UID chỉ có một kỷ lục mỗi bảng; không có bảng riêng theo màn hoặc độ khó thường nữa.
- Sort: levelReached giảm dần, reachedAt tăng dần, UID tăng dần để ổn định. reachedAt là thời điểm server ghi nhận kỷ lục tại mốc hiện tại, không dùng đồng hồ client và không tuyên bố đó là thời điểm thắng khi chơi offline. Cùng level, người được ghi nhận trước đứng trước; không dùng score/duration làm tie-break.
- Query11, render10; cursor đủ bộ khóa sort. Giữ limit cache12bảng×5trang, TTL120s, refresh15s, tối đa100trang đã có cursor. Đây là giới hạn duyệt hiện hành, không phải giới hạn level hay tổng người chơi; không giả tổng số trang.
- Giữ `loadedPages` từ trang thực sự tải thành công; không lấy cursor trang kế tiếp làm trang đã tải. Số cuối trong pager là cuối dãy đã tải, không phải số trang toàn bảng.

### Dữ liệu mới

- Tách family `adventure/challenge/endless` của ranking khỏi mode gameplay. Không tạo mode gameplay mới tênadventure và không gom bốn độ khó trong save.
- Đề xuất board mới `v3_<gameId>_<family>`; public record dùng rulesVersion3, kindprogress, gameId, family, resultId, levelReached, playerName, reachedAt. Owner/profileId/runId và thông tin nội bộ phục hồi giữ private/local khi không cần public.
- Root profile bổ sung model tiến độ xếp hạng nhỏ theo game/family, marker migration và active run có phiên bản. Kỷ lục điểm/sao màn thường vẫn trong chapter records hiện có.
- Winner settlement, tăng level, private best/checkpoint và xóa phiên kết thúc phải cùng transaction local; không publish trước durability. Failure rollback về trạng thái bền vững, không tạo outbox chứng nhận màn chưa commit.
- Outbox mới best-only theo UID/game/family, tối đa9record sống cho một owner. Receipt và recovery không sinh một record public cho mỗi màn; chỉ persist theo sự kiện thắng có ý nghĩa.
- Store chỉ ghi khi level mới lớn hơn server best; bằng/thấp hơn là no-op, reachedAt cũ giữ nguyên. Hai thiết bị/racing write phải giữ maxlevel và retry có giới hạn. Rename không được lợi dụng để thay reachedAt của mốc cũ.
- Không trộn queue v1/v2 với v3; queue lịch sử và receipts được phân namespace/version, có đường xử lý rõ và không gửi v2 vào boardv3. Recovery v3 đọc summary bền vững, không export/scanning mọi chapter mỗi lần thắng.

### Dữ liệu cũ và chuyển đổi

- So sánh hai cách: sửa trực tiếp bảng/save cũ ít file nhưng làm mất nghĩa time/score và khó rollback; thêm board/model v3 tách biệt cần adapter/migration nhưng giữ lịch sử và checkpoint đúng version. Chọn v3 bổ sung.
- Hành trình: import maxlevel từ record thắng hợp lệ ở cả bốn độ khó; không suy từ unlockedThrough, currentChapter hoặc phiên đang chơi. Quét chapter theo batch giới hạn, có checkpoint để tiếp tục khi interrupted; không nạp tất cả vào RAM. Không có timestamp server cũ phù hợp thì reachedAt là lần backend chấp nhận record v3 đầu tiên.
- Chỉ gắn thành tích vào đúng owner đã chứng minh; dữ liệu offline chưa có UID chỉ được bind một lần theo cơ chế firstUid/profileOwner hiện có. Không chuyển best/outbox của UID cũ sang người vừa đăng nhập.
- Với Thử thách/Vô tận v2: đã chốt với người dùng xử lý bảng mới từ lượt mới vì sản phẩm chưa phát hành. Giữ v1/v2 làm lịch sử, không import kỷ lục special cũ vào v3. Không xóa bảng/session cũ. Phiên cũ vẫn được phục hồi/thoát an toàn nhưng không chứng nhận thành lượt v3; lượt mới từ1 dùng luật mới. Hành trình vẫn chuyển tiến độ thắng cũ có bằng chứng/owner hợp lệ sang v3.
- Migration idempotent, có marker sau commit thành công, tách owner/version. Record thiếu/corrupt/unknown version không bị ép thành chiến thắng. Save/quota failure phải giữ nguồn và retry đúng phần chưa commit.

## 4. Lượt chơi và sinh màn không có điểm kết thúc cố định

### Ownership lượt

- State chính: runId, rulesVersion, owner, family, status, currentLevel, clearedLevels và snapshot bàn hiện tại. Các giá trị cần thiết là một model có invariant, không thêm cờ rời rạc ở từng controller.
- New/replay special: currentLevel1, clearedLevels0, trạng thái playing, runId mới; kỷ lục cũ giữ nguyên. Advance chỉ sau một settlement thắng đã commit và tăng đúng1.
- Pause/resume/reload/tiếp tục: giữ cùng runId, không tăng clearedLevels. Loss kết thúc lượt; lại từ1 khi chọn Chơi lại. Double-click/reentrant callback không tạo hai lượt hoặc hai settlement.
- Session mới phải lưu seed + version/config identity đủ để khôi phục đúng bàn; không sinh bàn khác rồi gắn số màn/điểm/thời gian cũ. Callback Worker/asset/timer của lượt cũ không được sửa lượt mới.

### Sinh bàn

- So sánh tăng tile/layer/time trực tiếp theolevel với ladder có giới hạn và biến thể seed. Cách đầu bùng DOM/solver/time ở levelcao; chọn ladder/cycle có trần tài nguyên và seed gắn với level/run/generatorVersion.
- Memory/Link đã có challenge layout cuối dùng tớiInfinity; kiểm mọi phép tính level/time/gravity/theme, không coi có untilInfinity là đã xong. Link hiện có thời gian challenge tăng tuyến tính theolevel cần giới hạn/cấu hình tương thích, không để100.000 thành lượng giờ quá lớn.
- Triple hiện getTripleChallengeStage chỉ nhận1–7 và controller tự finalize ở7. Giữ intro1–7 làm baseline; từ8 dùng ladder biến thể từ layout corpus hợp lệ, seed mới và solver budget hữu hạn, không chỉ quay về màn1 hoặc gọi sai stage7 với identitymàn8.
- Tất cả trò/family: bàn được tạo theo nhu cầu, layout/tile/particle/solver cache có trần. Tile/pair/triple counts hợp lệ, không chia lẻ cặp/bộ ba; bàn giải được hoặc dùng fallback được kiểm chứng.
- Không tăng không giới hạn số node/layer/tray hoặc số lần retry. Giới hạn cấu hình từng game lấy từ ngân sách đã xác minh; phase sinh màn phải ghi bảng token/budget cụ thể trước khi sửa runtime, không tự tăng vượt baseline mobile.
- Vô tận giữ không có countdown; elapsed time không tăng thành giới hạn layout. Thử thách giữ countdown và nguồn cấp/carry phù hợp từng trò; các hệ số thời gian cao được clamp để không overflow hoặc làm chế độ hết tính thử thách.
- Vẫn dùng số nguyên an toàn trong contract hiện hành. Level vượt range được từ chối ở boundary có đường thoát; không đổi toàn save sang BigInt chỉ để gọi vô hạn.
- Lịch sử màn thường theo chặng100, runtime chỉ hydrate cửa sổ đang cần. Lượt special cần summary + current session + best có giới hạn, không giữ mọi bàn đã chơi trong RAM hoặc danh sách runId không giới hạn. Nếu giữ best điểm special theo màn lịch sử, lưu theo chặng và hydrate bounded; không tạo tổng/ledger mới không có nhu cầu UI.

## 5. Giao diện cuối

### Chọn trò và bảng

- Header Bảng xếp hạng, icon làm mới và đóng; giữ nền hiện có, không wordmark/subtitle hướng dẫn.
- Một hàng ba nút Memory Match / Link Connect / Triple Connect, mỗi nút có dấu▾. Bấm chỉ mở danh sách của trò đó; không gửi query khi chưa chọn mục.
- Danh sách3mục Hành trình / Thử thách / Vô tận neo vào nút trò; tự chọn hướng theo khoảng trống và clamp trong viewport. Tối đa một danh sách; chọn mục đóng và tải đúng game/family trang1. Bấm trò khác đóng danh sách cũ, Escape/click ngoài hủy, focus trả trigger; Arrow/Home/End/Enter và ARIA hợp lệ.
- Mặc định khi mở: trò theo ngữ cảnh map/recent, bảng Hành trình; nhớ lựa chọn trong phiên cho từng trò sau khi đã chọn. Chỉ trò/bảng thực sự đang xem được đánh dấu selected; mở menu của trò khác chưa thay dữ liệu hay highlight thành selected.
- Trong nút trò đang chọn có nhãn ngắn của bảng đang xem, ví dụ Memory Match + Hành trình trên hai dòng nhỏ. Hai trò còn lại chỉ tên +▾. Không thêm hàng ba nút hoặc hàng mô tả lặp lại.
- Danh sách có hit target44px; xử lý tên dài/safe-area/mobile; không đổi danh sách game/mode dùng cho gameplay.

### Bảng và footer

- Cột Hạng / Người chơi / Màn. Số màn formatvi-VN, hỗ trợ100.000 và số dài, không nhét điểm/thời gian vào cùng cột.
- Giữ top3, avatar dự phòng, tên textContent, self highlight, own ngoài trang không bịa hạng; empty/loading/offline/error ngắn như hiện hành.
- Bỏ toàn bộ mode strip, picker màn và CSS/listener chỉ còn phục vụ hai phần đã bỏ. Không để source/import hoặc component thử nghiệm không còn call site.
- Footer chỉ còn pager giữa panel. Giữ nút số nhỏ28×32, ellipsis theo loadedPages; trước/sau, biên trang và loading disabled đúng. Không thêm countquery, dropdown độ khó hoặc tổng trang giả.
- Bản đồ bỏ điểm trên nút màn; giữ sao theo độ khó đang chọn, trạng thái mở/đã thắng và progress chung. Không xóa điểm đã lưu.
- HUD điểm hiện tại vẫn tăng theo gameplay. Nhãn Kỷ lục của Hành trình lấy bestscore đúnggame/mode/level; hai trò Memory/Link không dùng tổngbest nhiều màn, Triple không gọi roundscore là tổngđiểm. Special hiển thị kỷ lục màn của đúngfamily, tránh lẫn điểm/số màn.

## 6. Phases và commit

Mỗi phase triển khai có commit riêng sau gate; đi tuần tự tới hết khi được giao thực hiện. Kế hoạch đã được giao triển khai toàn bộ; kết quả thực thi ở mục9 và hồ sơ QA.

| Phase | Công việc / owner chính | Gate | Commit dự kiến |
|---|---|---|---|
| 0 | Baseline fixtures/contract và ngân sách generator; ghi inventory current restart/session/time. Chốt token cụ thể trong budget đã có, không tự tăng scope cân bằng sao. | Evidence normal/sharedunlock, v2checkpoint, replay/loss/resume; nguồn save được giữ, repo status/diff rõ | test: capture level progression and run baselines |
| 1 | Model v3, invariant/sort/board family; summary private, migration batch/owner/version. rankingRules/rankingResult/gameState/chapterStore/persistence/sessionProgress. Chưa đổi UI | Migration replay/interruption/quota/corrupt/archived100k, không mất Xu/session/history; comparator và maxbest thuần pass | feat: add versioned level ranking progress |
| 2 | Generator ladder và level cao cho3game; Triple8+, remove terminal7, time clamp, seed/version resume. Config/board/generator/controller adapter | Bàn giải được, retrybounded, chuẩngeometry, số node/budget không tăng ở100k; fixtures nhiều seed và boundary pass | feat: extend generated levels beyond fixed stages |
| 3 | Wiring v3 vào thắng/thua/chơi lại/advance/resume trong3controller; normalrecordlevel chung4mode; specialreplay1 và rollback/clock/session ownership | Mỗi thắng đúng1, thua không cộng, replaynewrun1, resume cùngrun, checkpoint saucommit; rapidactions/stalecallbacks và lifecycle pass | feat: rank completed levels and restart special runs |
| 4 | Public v3 store/service/outbox, Firebase Rules/indexes và chuyển namespace; emulator trước deploy | Owner/others/publicshape, timestampserver, stricthigherlevel, 2device/concurrent/offline/reload/UID/outbox/oldboard isolation; querylimit11 không tăng | feat: sync level ranking boards with versioned rules |
| 5 | UI game dropdown3family, bảnglevel, xóa6modes/picker, giữellipsis; map bỏđiểm và HUDkỷlục đúngcontext |9bảng đúng data, dropdowntouch/keyboard/focus/position, responsive, nointernalcopy, stale/error/offline, 30cycles cleanup | feat: simplify leaderboard selection and show level records |
| 6 | Review độc lập, check/build, regression/mobile/resource QA; tài liệu và cutover | Các acceptance có evidence, build web/Android wrapper nếu asset/runtime chung ảnh hưởng; giới hạn device/deploy báo thật | test: verify level rankings and generated progression |

Phase4 phải pass emulator/negative Rules rồi mới deploy riêng Rules/indexes của project đã xác minh khi được giao rollout. Phase5 không gửi queryv3 lên Rules/indexes chưa sẵn sàng. Không deploy Hosting tự động; giữ phiên bản web cũ hoạt động với boardv1/v2. Nếu phát hiện Firebase remote khác bản đã đối chiếu, review diff trước mutation. Ghi release trước/sau để rollback cấu hình, không rollback bằng xóa dữ liệu mới.

## 7. Matrix kiểm thử bắt buộc

- Logic: normal4mode gom1family, thắng/khôngthắng, highestcleared != unlocked/currentlevel; samelevel/noop; score/duration không đổi rank; tiedlevel/server timestamp/UID ổn định.
- Special3game×2mode: win10/thua11 ghi10; newrun1; replay tốt/xấu; resume/savedclock; mua giờ/cứu lượt; quit/reopen; restart/advance/settlement doubleclick và failure rollback.
- Migration: absent/old/corrupt/unknownversion, multiowner/firstUid/adoption, archivedchapter; 100.000 không load tất cả records; bị dừng giữa batch/chạy lại; quota/secondwrite failure không markcomplete.
- Generator: 1,7,8,9,19,20,99,100,101,999,1.000,99.999,100.000,100.001,1.000.000 và biên integer/config; chọn mẫu cấu hình ngoài mốc20 để không chỉ đo intro. Seed lặp cho deterministic restore, nhiều seed khác để kiểm biến thể; solve/witness và fallback cả3game, Worker cancel/restart nhiều chu kỳ.
- UI:9bảng, dropdown không query khi mở/hủy, chọn1query, đổi game/family/UID nhanh; menu gần mép viewport/resize, focus keyboard, backdrop/close pending; số100.000/tên dài/own0/1/10/11/21; pagerknownloaded/cacheeviction/TTL/refresh/offline.
- Viewport chính412×915, landscape844×390, desktop1024×900; thêm320 nếu gặp lại lỗi geometry cụ thể. Reduced-motion, safe-area, fonts/contrast và node/resource30mountclose; gameplay restart/mode switches tối thiểu30chu kỳ theo scenario liên quan.
- Scripts npm run check và npm run build ở gate cuối. Bổ sung contract model/generator/migration và cập nhật scripts/check-ranking-rules.mjs, check-ranking-checkpoints.mjs, check-leaderboard.mjs, check-leaderboard-rules.mjs cùng Playwright leaderboard/layout/account/profile-stats/navigation/lifecycle/cleanup liên quan. Không làm yếu test để đổi nghĩa kết quả mà không sửa fixture/contract tương ứng.
- Đo generator time/longtask/heap/resource theo game/seed/viewport/browser ở level thấp/cao; không gọi60FPS pass từ headlessdesktop. Galaxy S22 Ultra thật vẫn chờ thiết bị/remote debugging đã xác nhận, ghi riêng phần chưa nghiệm thu.

## 8. Acceptance và review

- [x] Mỗi trò đúng3bảng, normal4độkhó cùngHành trình; chỉ level đãthắng quyết địnhkỷlục.
- [x] Thử thách/Vô tận córun mới từ1 khi Chơi lại; resumecũ không tăng thànhtích hoặc bị âm thầm xóa.
- [x] Cả3game tiếp tục qua mốc kết thúc cũ và100.000; không cấp sẵnlevel, không buộc tăng board/solver/time vô hạn.
- [x] Điểm/sao/kỷlục đúngcontext, bỏtổngđiểm gây nhầm trongHUD và điểm trênmap; dữ liệu điểm/sao cũ giữ nguyên.
- [x] Game dropdown chỉ một menu, đúngfamily hiện tại, không6mode/picker màn hoặc UIcopy nội bộ dư.
- [x] v3/private summaries/outbox/migration owner-safe, idempotent, transactional; v1/v2/save/Xu/kho/theme/privateprofile tương thích.
- [x] Rules/indexes/query/sort/page/cache/UID/offline đã có evidence; không publish khi savefail.
- [x] Check/build/regression/generator/resource và review độc lập pass; diff không có code chết, asset rác hoặc leak.
- [x] Báo commit từngphase, deploy thực tế, số đo thật và các giới hạn device/admin; không nhận phần chưa xác minh là hoàn thành.

## 9. Kết quả thực thi

Phase0 `4adcde9`, Phase1 `7c6c6c1`, Phase2 `7d3814f`, Phase3 `2104ce8`, Phase4 `ae5caa9`, Phase5 `b79b0f7`. Phase6 hoàn tất review, kiểm tra/build và hồ sơ QA; commit có title `test: verify level rankings and generated progression`. Chi tiết: `docs/design/leaderboard/LEVEL_RANKING_QA.md`.

Review độc lập đã phát hiện và đóng các lỗi owner/migration marker, corrupt queue, UID/higher-best wakeup, combo/lucky restore, corrupted snapshot và stale Triple rollback. Review cuối phát hiện khoảng hở reward trong animation: chọn atomic pair settlement thay pending ledger. Resolve mutation đồng bộ, snapshot+ví+kho commit trước hiệu ứng; các giá trị/xác suất lấy nguyên config, không đổi ngưỡng sao.

Timeline trình bày giữ anticipation/path/flip, impact/exit/loot, resolve/board render hữu hạn. Chỉ transform/opacity và renderer hiện có; Link bonus dùng một thunder canvas với tối đa4target, dưới cap6target của item hiện hành. Memory tối đa năng lượng + lucky +4reward cues trong một match (registry giữ giới hạn effect hiện có). Timer/animation thuộc shell, hủy/restart không cấp thưởng lại; reduced-motion vẫn nhận cùng mutation đã commit. Không thêm animation loop hoặc network/tick. Bằng chứng reload trước arrival, rollback quota, resource/lifecycle trong hồ sơ QA. Không coi các số desktop là 60FPS trên S22 Ultra.
