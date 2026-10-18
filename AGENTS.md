# AGENTS.md — Chuẩn thực hiện cho Memory Match Adventure

## 1. Mục đích và phạm vi

File này áp dụng cho toàn bộ repository. Mọi agent phải ưu tiên một giải pháp đúng, ổn định, có thể bảo trì và mở rộng; việc “chạy được” chỉ là điều kiện cần, không phải điều kiện hoàn thành.

Thứ tự ưu tiên mặc định:

1. Đúng hành vi và không làm mất dữ liệu.
2. Không tạo regression, lỗi render, race condition, vòng lặp vô hạn hoặc rò rỉ tài nguyên.
3. Kiến trúc rõ ownership, dễ mở rộng và dễ kiểm thử.
4. Hiệu suất ổn định trên mobile mục tiêu.
5. Thay đổi nhỏ nhất vẫn giải quyết đúng nguyên nhân gốc.

Tuân theo chỉ dẫn cấp cao hơn của hệ thống và yêu cầu trực tiếp của người dùng. Nếu các tài liệu trong repository xung đột hoặc không còn khớp code, dừng phần bị ảnh hưởng, nêu rõ xung đột và xin quyết định; không tự chọn âm thầm.

## 2. Definition of Done

Một task chỉ được coi là hoàn thành khi agent đã:

- xác định và xử lý nguyên nhân gốc, không chỉ che triệu chứng;
- kiểm tra tác động đến lifecycle, render, dữ liệu lưu, responsive và hiệu suất trong phạm vi liên quan;
- giữ nguyên public API, schema save, effect ID và hành vi tương thích trừ khi task cho phép đổi;
- thêm hoặc cập nhật kiểm thử phù hợp với rủi ro;
- chạy các cổng kiểm tra cần thiết và báo kết quả thật;
- kiểm tra diff cuối để loại bỏ code tạm, log debug, tài nguyên không được giải phóng và thay đổi ngoài phạm vi;
- nêu rõ phần chưa xác minh hoặc rủi ro còn lại. Không dùng “có vẻ ổn” thay cho bằng chứng.

## 3. Làm rõ ngữ cảnh trước khi thực hiện

Agent phải hỏi lại, có thể qua nhiều lượt, cho đến khi đủ dữ liệu nếu câu trả lời có thể làm thay đổi đáng kể thiết kế hoặc kết quả. Bắt buộc hỏi khi thiếu một trong các thông tin sau:

- hành vi mong muốn hoặc acceptance criteria có nhiều cách hiểu hợp lý;
- game/mode/màn hình, thiết bị mục tiêu hoặc điều kiện tái hiện chưa xác định;
- phạm vi file hay ownership giữa các module chưa rõ;
- lựa chọn làm thay đổi public API, schema save, dữ liệu người dùng hoặc khả năng tương thích;
- hướng mỹ thuật, timeline hoặc mức chất lượng hiệu ứng chưa được chốt;
- giới hạn hiệu suất, browser/Android mục tiêu hoặc baseline cần so sánh chưa có;
- thao tác phá hủy, di chuyển dữ liệu, xóa file hoặc mở rộng phạm vi chưa được cho phép.

Câu hỏi phải ngắn, gom theo quyết định và giải thích vì sao câu trả lời ảnh hưởng cách làm. Không hỏi về chi tiết kỹ thuật nhỏ, có thể đảo ngược và không đổi kết quả; trong trường hợp đó dùng giả định an toàn, ghi rõ giả định rồi tiếp tục.

Trước khi sửa code, agent phải diễn đạt lại ngắn gọn: mục tiêu, ngoài phạm vi, ràng buộc, tiêu chí hoàn thành và điều chưa chắc chắn. Nếu task đã có tài liệu được phê duyệt thì tài liệu đó là nguồn phạm vi chính.

## 4. Chọn phương án kỹ thuật

Đối với thay đổi kiến trúc, lifecycle, animation, persistence hoặc hiệu suất, agent phải cân nhắc ít nhất hai phương án khả thi trước khi code. Đánh giá theo:

- tính đúng đắn và các failure mode;
- ownership và cleanup;
- khả năng tái sử dụng/mở rộng mà không tạo abstraction giả;
- chi phí CPU, GPU, bộ nhớ, DOM và I/O;
- khả năng kiểm thử và quan sát lỗi;
- tương thích ngược và chi phí migration;
- độ phức tạp dài hạn.

Chọn phương án đơn giản nhất đáp ứng đầy đủ các tiêu chí trên, không mặc định chọn diff ít dòng nhất. Nếu phương án tối ưu hơn vượt phạm vi hoặc cần dữ liệu chưa có, phải trình bày trade-off và hỏi trước khi mở rộng.

Không được:

- dùng timeout/sleep để che race condition;
- thêm cờ trạng thái rời rạc khi đã có một state machine hoặc nguồn sự thật phù hợp;
- sao chép logic chỉ để hoàn thành nhanh;
- dùng optional chaining hoặc catch rỗng để che invariant bị hỏng;
- làm yếu/xóa test chỉ để test pass;
- thêm abstraction “để dành” khi chưa có ít nhất hai nhu cầu thực sự giống nhau;
- để TODO, code chết, listener, timer hoặc asset thử nghiệm mà không nêu và được chấp thuận.

## 5. Tách biệt công việc, tiếp tục đến hết gate và tránh xung đột

- Mỗi lượt triển khai phải có một task hoặc mục tiêu rõ ràng. Một task có thể gồm nhiều gate; gate chỉ là checkpoint nội bộ để kiểm soát phạm vi, review và rollback, **không phải điều kiện mặc định để kết thúc lượt**.
- Khi người dùng giao toàn bộ task hoặc dẫn tới một file kế hoạch mà không giới hạn gate, phạm vi được giao là **toàn bộ các gate chưa hoàn thành trong kế hoạch đó**. Agent phải thực hiện tuần tự từ gate hiện tại đến gate cuối, gồm mọi lần đọc, sửa, chạy lệnh, chờ tiến trình, chẩn đoán và chạy lại test cần thiết. Không được hiểu một lượt chỉ làm một gate, một hàm, một file, một test hoặc một bước trung gian.
- Sau khi một gate pass, agent phải tự động ghi nhận kết quả ở commentary rồi bắt đầu gate kế tiếp ngay trong cùng lượt. Không hỏi “có tiếp tục không”, không chờ người dùng nhắn “tiếp tục”, và không gửi final chỉ vì vừa hoàn thành một gate.
- Chỉ dừng ở ranh giới gate khi người dùng ghi rõ chỉ thực hiện gate đó, chủ động yêu cầu dừng, hoặc gate kế tiếp gặp blocker thực sự thuộc danh sách bên dưới và cần quyết định/quyền mới từ người dùng.
- Không trộn sửa baseline, dọn CSS, viết lại effect và thêm Triple Connect trong cùng một thay đổi nếu chưa được yêu cầu rõ.
- Trước và sau khi sửa, kiểm tra trạng thái/diff; mọi thay đổi có sẵn được coi là của người dùng.
- Không hoàn nguyên, format hàng loạt hoặc “dọn tiện” file ngoài phạm vi.
- Nếu hai task cùng sửa một owner/module, thực hiện tuần tự hoặc chia ranh giới file/API rõ ràng trước khi bắt đầu.
- Refactor cấu trúc và thay đổi hành vi nên ở các gate riêng để dễ review và rollback.
- Implementation và đánh giá sau implementation là hai bước riêng: reviewer phải đọc diff và chạy lại bằng chứng, không chỉ tin báo cáo của agent viết code.

### Quy tắc tiếp tục và điều kiện kết thúc lượt

- Khi người dùng yêu cầu thực hiện một task/gate, agent phải tiếp tục tự chủ cho tới khi **toàn bộ acceptance criteria của task/gate đó đạt** hoặc gặp blocker thực sự. Không cần người dùng nhắn “tiếp tục” sau từng bước nội bộ.
- Nếu yêu cầu là toàn bộ task, “hoàn thành” nghĩa là mọi gate thuộc task đã pass; pass Gate 0, Gate 1 hoặc bất kỳ gate trung gian nào chỉ là tiến độ, không phải kết quả cuối. Nếu yêu cầu chỉ đích danh một gate, agent hoàn thành đầy đủ gate đó rồi mới được kết thúc.
- Kết quả trung gian chỉ được gửi ở commentary. Không gửi final nếu vẫn còn hành động an toàn, đã được cho phép và nằm trong phạm vi mà agent có thể tự thực hiện.
- Không kết thúc lượt bằng các câu như “bước tiếp theo là…”, “cần chạy tiếp…”, “chưa có kết quả đầy đủ…” hoặc “có thể tiếp tục…” nếu chính agent có thể thực hiện bước đó ngay trong lượt hiện tại.
- Nếu lệnh/test trả session đang chạy hoặc mới có output một phần, phải tiếp tục chờ/poll bằng cơ chế của tool cho tới khi process kết thúc. Một profile pass không đại diện cho toàn bộ matrix; chỉ báo pass sau khi mọi profile bắt buộc đã có kết quả cuối.
- Nếu test, lint, type-check hoặc build fail, phải đọc lỗi, xác định nguyên nhân, sửa trong đúng phạm vi và chạy lại kiểm tra liên quan. Test fail là tín hiệu để tiếp tục chẩn đoán, không phải lý do tự động kết thúc lượt.
- Tool timeout, output bị cắt, process còn chạy hoặc một lần gọi lệnh thất bại do cú pháp/path không phải blocker. Agent phải dùng session hiện có, đọc output tiếp, thu hẹp lệnh hoặc chạy lại cách an toàn phù hợp.
- Không dừng chỉ để tiết kiệm token, thời gian hoặc số tool call. Dùng progressive discovery, kết quả đã ghi và test mục tiêu để làm việc hiệu quả; khi context được compact, tiếp tục từ trạng thái hiện tại thay vì bắt đầu lại.
- Chỉ được kết thúc khi chưa hoàn thành nếu có blocker thật thuộc một trong các nhóm: thiếu quyết định sản phẩm làm thay đổi đáng kể behavior/schema/API; cần quyền hoặc thao tác phá hủy chưa được phép; tài nguyên/dịch vụ bên ngoài bắt buộc không khả dụng; tài liệu và code xung đột mà thứ tự ưu tiên không giải quyết được; hoặc lỗi môi trường lặp lại sau khi đã thử các phương án an toàn hợp lý.
- Khi bị blocker, báo đúng một lần với bằng chứng cụ thể: điều đã hoàn thành, lệnh/lỗi liên quan, phần còn lại, vì sao không thể tiếp tục và quyết định tối thiểu cần từ người dùng. Không dùng blocker giả cho việc khó, lâu hoặc còn nhiều bước.
- Ngoại lệ: nếu người dùng chỉ yêu cầu đánh giá, giải thích, review, báo trạng thái hoặc chủ động yêu cầu dừng, agent trả đúng phạm vi đó và không tự triển khai thêm.

Hiện không có file kế hoạch active. Các kế hoạch Runtime Closure, Triple, Theme Selection, Hidden Piles, Tray Expansion, Milestone và Effect V2 đã hoàn tất hoặc được hợp nhất rồi xóa; không khôi phục chúng từ Git history làm nguồn thực thi. Task mới cần kế hoạch phải tạo một kế hoạch hiện hành duy nhất và ghi rõ trong `CONTEXT.md`. Effect V2 được coi là hoàn tất khi runtime, lifecycle, cleanup, reduced-motion và ngân sách hiệu suất đạt. Tinh chỉnh hình ảnh từng hiệu ứng là công việc mỹ thuật tùy chọn, thực hiện riêng khi người dùng yêu cầu và không được dùng làm gate hay phần chưa hoàn tất của kế hoạch runtime.

## 6. Kiến trúc và khả năng mở rộng

- Mỗi trạng thái nghiệp vụ có một nguồn sự thật duy nhất.
- Mỗi DOM subtree, timer, listener, animation và resource có một owner chịu trách nhiệm tạo và hủy.
- Logic luật game phải tách khỏi renderer và side effect khi có thể.
- Chỉ gom module/CSS khi chúng có cùng ngữ nghĩa và vòng đời; không gom chỉ vì tên hoặc vài dòng giống nhau.
- Dùng adapter cho khác biệt giữa Memory Match, Link Connect và Triple Connect; không thêm nhánh game rải rác trong shared runtime.
- Giữ ranh giới public API nhỏ, có tên rõ và có invariant. Không để module ngoài can thiệp trực tiếp state nội bộ.
- Magic number về timing, kích thước và ngân sách phải thành token/config có owner rõ nếu được dùng ở nhiều nơi.
- Generated file phải được sửa từ source generator, không chỉnh tay output.

## 7. An toàn lifecycle, render và bộ nhớ

Mọi tính năng UI/effect phải chứng minh các invariant sau:

- tại một thời điểm chỉ có đúng số shell/board/overlay được thiết kế;
- mount/unmount/restart/replay không nhân đôi listener, timer, `requestAnimationFrame` hoặc observer;
- callback bất đồng bộ cũ không được sửa round mới; dùng identity/generation guard khi cần;
- cleanup idempotent, hủy được khi animation đang chạy và giải phóng reference đến DOM/asset;
- pool/cache có giới hạn, có chính sách thu hồi và không giữ node đã detach;
- cập nhật HUD không rebuild board nếu không thực sự cần;
- DOM thay đổi theo batch, tránh đọc layout xen giữa nhiều lần ghi style;
- không buộc reflow bằng `offsetWidth` hoặc thủ thuật tương tự trong đường nóng nếu chưa có số đo và lý do;
- không tạo object/array/closure mới mỗi frame trong animation dài;
- vòng lặp có điều kiện dừng kiểm chứng được, giới hạn retry/iteration và đường thoát khi input không hợp lệ;
- mọi promise quan trọng có đường success, failure và cancellation/stale-result rõ ràng.

Khi sửa lỗi lifecycle hoặc leak, phải test nhiều chu kỳ, không chỉ một lần: tối thiểu mở/đóng, restart và chuyển mode lặp lại theo scenario liên quan.

## 8. Hiệu suất mobile và hiệu ứng thị giác

Mục tiêu mặc định là 60 FPS trên thiết bị mobile mục tiêu, tức ngân sách trung bình khoảng 16,7 ms/frame; không biến con số này thành tuyên bố pass nếu chưa đo.

- Ưu tiên `transform` và `opacity`; hạn chế animate layout, filter lớn, shadow/blur nhiều lớp và vùng repaint toàn màn hình.
- Ảnh tĩnh là lựa chọn tốt cho trạng thái kéo dài như đóng băng thời gian khi chuyển động không truyền tải thông tin thiết yếu.
- Texture phải đúng kích thước hiển thị/DPR, được nén phù hợp và tái sử dụng; không tải/giải mã lại mỗi lần bấm.
- Hiệu ứng ngắn phải có timeline hữu hạn, cleanup chắc chắn và quality tier/fallback cho thiết bị yếu khi chi phí đáng kể.
- Hỗ trợ `prefers-reduced-motion`; trạng thái gameplay không được phụ thuộc vào việc animation có chạy hết hay không.
- Không thêm animation loop liên tục chỉ để tạo “cảm giác sống” nếu không có ngân sách và đo đạc.
- Không tăng số lần ghi persistence/Firebase hoặc thao tác mạng theo frame/tick. Ghi theo sự kiện có ý nghĩa và debounce/batch khi phù hợp.

Với effect mới hoặc viết lại effect, mô tả trước khi code:

1. Ý nghĩa gameplay và điểm nhấn thị giác.
2. Timeline theo pha: anticipation, action/impact, resolve.
3. Thuộc tính nào thay đổi ở mỗi pha.
4. Số node/particle tối đa và vùng repaint dự kiến.
5. Cách interrupt, cleanup, reduced-motion và fallback tĩnh.
6. Tiêu chí so sánh hình ảnh và ngân sách frame/memory.

## 9. CSS và asset

- Một base selector có một owner; biến thể dùng scope/modifier rõ thay vì phụ thuộc thứ tự load ngẫu nhiên.
- Keyframe, custom property và utility dùng chung phải có namespace hoặc ownership rõ.
- Trước khi gom CSS, lập inventory: selector trùng không đồng nghĩa ngữ nghĩa trùng.
- Kiểm tra cascade, specificity, responsive, focus, reduced-motion và safe-area sau thay đổi.
- Không tạo nhiều bản asset gần giống nếu một source có thể dùng qua crop/tint/token mà vẫn giữ chất lượng.
- Asset mới phải có tên ổn định, kích thước hợp lý, format/nén phù hợp và không để file nguồn tạm trong bundle.
- Với hình thẻ Memory Match hoặc raster theme asset, dùng skill chuyên dụng nếu có thay vì tự sinh theo quy trình tùy ý.

### Quy định câu chữ dành cho người chơi (yêu cầu trực tiếp của chủ dự án)

- Hình trong mọi hoạt ảnh của cả ba trò không dùng emoji hoặc ký tự font làm hình trang trí. Dùng SVG/CSS/canvas; chỉ tạo sheet ảnh khi cần thiết. Chữ/số mang ý nghĩa điểm, thời gian và nội dung trò chơi vẫn giữ bình thường.

- Mọi nội dung người chơi nhìn thấy trên giao diện, ảnh bàn giao và tài liệu dành cho người chơi phải dùng ngôn ngữ sản phẩm tự nhiên; không đưa thuật ngữ lập trình, ghi chú triển khai, lời hướng dẫn phát triển hoặc trạng thái thử nghiệm vào đó.
- Kể cả khi chức năng đang dùng dữ liệu hoặc phần hiển thị thay thế, giao diện vẫn phải là giao diện sản phẩm hoàn chỉnh. Vùng quảng cáo có thể dùng hình ảnh/hoạt ảnh không chữ theo hướng đã được chủ dự án chọn; nếu cần nhãn thì dùng **Quảng cáo**. Tuyệt đối không ghi “mô phỏng”, “placeholder”, “mock”, “API”, “SDK”, “debug” hoặc hướng dẫn tích hợp trên giao diện. Không vẽ đè hoạt ảnh hoặc che nhãn bắt buộc trên quảng cáo thật của nhà cung cấp.
- Giải thích kỹ thuật và giới hạn kiểm chứng chỉ ghi trong báo cáo kỹ thuật cho chủ dự án; không chèn vào trải nghiệm người chơi. Trước bàn giao, kiểm tra câu chữ trong ảnh giao diện thật cùng với bố cục.

## 10. Dữ liệu và tương thích

- Không đổi key, schema save, ID catalog, public API hoặc format dữ liệu nếu task không cho phép.
- Input từ save cũ phải được normalize/validate tại boundary; code bên trong dùng model nhất quán.
- Migration phải idempotent, có fallback an toàn và test dữ liệu cũ, thiếu field, field lạ, dữ liệu hỏng.
- Thao tác nhiều bước có thể lỗi giữa chừng phải có transaction/rollback hoặc trạng thái phục hồi rõ.
- Không tăng write không cần thiết; chỉ persist khi trạng thái bền vững thực sự thay đổi.

## 11. Quy trình đọc dự án tiết kiệm token

Áp dụng progressive discovery:

1. Đọc yêu cầu và tài liệu task được chỉ định.
2. Dùng tìm kiếm theo symbol/selector/import để xác định owner và call sites.
3. Đọc phần liên quan; trước khi sửa một file, hiểu trọn module hoặc lifecycle liên quan, không chỉ dòng khớp từ khóa.
4. Mở rộng sang module kế cận chỉ khi dependency, test fail hoặc bằng chứng cho thấy cần thiết.
5. Ghi kết luận quan trọng vào plan/task note để không quét lại.

Không quét toàn repository lặp đi lặp lại. Không đọc lại file không đổi nếu đã có kết quả đáng tin. Chạy test mục tiêu trước, suite rộng sau khi thay đổi đã ổn. Chỉ chạy lại full check khi có thay đổi kể từ lần chạy gần nhất hoặc cần xác nhận gate cuối.

## 12. Dùng skill đúng cách

Skill là quy trình chuyên biệt, còn `AGENTS.md` là chỉ dẫn dự án. Khi task khớp một skill đang được cung cấp:

1. Nêu ngắn gọn skill nào sẽ dùng và vì sao.
2. Đọc đầy đủ `SKILL.md` của skill đó trước khi hành động.
3. Chỉ đọc các reference mà `SKILL.md` định tuyến cho task hiện tại.
4. Dùng tập skill nhỏ nhất đủ bao phủ yêu cầu; không liệt kê hoặc tải mọi skill chỉ để “cho chắc”.
5. Làm theo workflow, asset/template và bước kiểm tra của skill.
6. Nếu skill làm thay đổi hướng, buộc dừng hoặc xung đột yêu cầu, nêu rõ skill và lý do.
7. Trong báo cáo cuối, nêu skill đã ảnh hưởng thực tế đến công việc; không nhận là đã dùng nếu chỉ đọc qua.

Gợi ý định tuyến skill cho repository này, nếu các skill đó có trong phiên làm việc:

- `clarify-ambiguous-requirements`: khi thiếu quyết định có thể đổi behavior, scope hoặc thiết kế.
- `memory-match-image-assets`: tạo/thay/kiểm tra raster card art theo theme Memory Match.
- `imagegen`: tạo hoặc chỉnh bitmap/texture/sprite; không dùng cho CSS/SVG/code-native effect.
- `computer-use`: kiểm tra giao diện thật trong browser/app khi cần tương tác trực quan.
- `visualize`: giải thích hoặc so sánh trực quan; không thay thế implementation/test trong repository.
- `openai-docs`: câu hỏi hoặc thay đổi liên quan Codex/OpenAI, model, prompting và skill.

Nếu không có skill phù hợp, tiếp tục bằng workflow repository này; không tự bịa tên hoặc hành vi của skill. Người dùng có thể buộc dùng skill bằng cách nêu `$tên-skill` trong yêu cầu.

## 13. Kiểm thử theo mức rủi ro

### Tần suất đóng gói và báo cáo (chủ dự án chốt18/10/2026)

- Chỉ tạo APK khi hoàn tất toàn bộ task/kế hoạch để chủ dự án thử, trừ khi người dùng yêu cầu rõ một APK trung gian. Không tạo APK sau mỗi lỗi nhỏ hoặc mỗi commit.
- Trong quá trình làm, chạy kiểm tra đúng phạm vi vừa sửa; check/build web ở cổng nghiệm thu phù hợp. Tiến độ và báo cáo cuối ngắn gọn; bằng chứng chi tiết lưu chung trong một báo cáo nghiệm thu của task, không lặp lại log/báo cáo dài mỗi bước.

Mức tối thiểu cho thay đổi code:

- static checks phù hợp, sau đó `npm run check` ở gate cuối;
- `npm run build` để xác nhận build sản phẩm;
- unit/contract test cho logic thuần và invariant mới;
- Playwright suite mục tiêu cho shell/layout/lifecycle/effect liên quan;
- viewport mobile hẹp, mobile phổ biến và desktop cho thay đổi UI;
- reduced-motion, thao tác nhanh, restart giữa animation và chuyển mode cho thay đổi effect/lifecycle;
- nhiều chu kỳ mount/unmount/restart và kiểm tra số listener/timer/node ổn định cho nguy cơ leak;
- đo frame time/long task/memory trên scenario đã định nghĩa nếu task có yêu cầu hiệu suất.

Không chạy một suite không liên quan chỉ để tạo cảm giác đầy đủ. Ngược lại, thay đổi shared runtime, persistence, lifecycle hoặc CSS nền phải chạy phạm vi regression rộng tương xứng.

## 14. Báo cáo và review sau triển khai

Báo cáo hoàn thành phải ngắn nhưng kiểm chứng được:

- mục tiêu đã đạt và nguyên nhân gốc đã xử lý;
- file/module thay đổi và lý do;
- phương án đã chọn, phương án loại và trade-off quan trọng;
- lệnh kiểm tra đã chạy cùng pass/fail/skipped;
- số đo trước/sau nếu có yêu cầu hiệu suất;
- rủi ro, giả định và phần chưa xác minh;
- xác nhận không thay đổi API/schema/save format nếu đó là ràng buộc.

Review độc lập phải đối chiếu implementation với task plan và acceptance criteria, tìm regression/lifecycle leak/render loop/mất đồng bộ, kiểm tra diff ngoài phạm vi và chạy lại test trọng yếu. Nếu không có bằng chứng cho một tiêu chí, tiêu chí đó chưa được đánh dấu hoàn thành.

## 15. Checklist bắt buộc trước khi kết thúc

- [ ] Toàn bộ task/gate được giao đã đạt acceptance criteria; không còn bước trong phạm vi mà agent đang để lại cho lượt “tiếp tục” sau.
- [ ] Đã đủ ngữ cảnh cho mọi quyết định ảnh hưởng kết quả.
- [ ] Đã giữ task trong đúng phạm vi và không ghi đè thay đổi của người dùng.
- [ ] Giải pháp xử lý nguyên nhân gốc, không phải bản vá tạm.
- [ ] Ownership, lifecycle, cleanup và đường hủy đã rõ.
- [ ] Không có render loop, listener/timer/RAF nhân đôi hoặc pool/cache không giới hạn.
- [ ] Không có allocation/reflow/write không cần thiết trong đường nóng.
- [ ] API, save và catalog vẫn tương thích hoặc migration đã được phê duyệt và test.
- [ ] Test phù hợp đã chạy; kết quả được báo chính xác.
- [ ] Diff cuối không chứa debug, code chết, asset rác hoặc thay đổi ngoài scope.
- [ ] Acceptance criteria được xác nhận bằng bằng chứng, không bằng suy đoán.
