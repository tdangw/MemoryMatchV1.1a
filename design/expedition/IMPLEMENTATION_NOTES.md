# Gate 0 — ghi nhận khởi động08/11

Đã tạo NEW_GAMES_OUTLINE.md riêng theo yêu cầu, không triển khai hai trò. Yêu cầu hiện tại giao thực hiện toàn kế hoạch ngoại hình, nhưng ba quyết định kinh tế trong kế hoạch cũ chưa được duyệt; đã hỏi giá mảnh, cấu hình ghép/đổi mảnh và policy pool101món. Không tự chọn giá hoặc đổi pool khi chưa có trả lời.

Khảo sát read-only: rương Khung/Huy hiệu hiện nhánh40%Xu100,40%hỗtrợ,20%ngoạihình; Avatar nhánh40%Xu150,40%hỗtrợ,20%ngoạihình. Nếu ghép ra3rương đều nhau thì một rương có46.67Xu trực tiếp kỳ vọng,40%hỗtrợ,20%ngoạihình. Đây là tính theo nhánh config, chưa phải mô phỏng candidate hiện tại: code fullpool hiện đổi thẳngXu trước categoryroll, và cần thay theo policy mới đã duyệt.

Ở giả định mới mọi mónMax, mỗi kếtquả ngoại hình→1mảnh, tỷlệ mảnh trả về là0.2/3 trên mỗi mảnh tiêu ghép, nhỏ hơn1. Chỉ là điều kiện vòng lặp nguyênliệu, không chứng nhận toàn bộ kinh tế. Giá bán3mảnh:10Xu/mảnh→30Xu;20→60Xu;50→150Xu;100→300Xu. Phải tính cả hỗtrợ, cơhội tănglevel và lượng nguồn nhận; không gán ngoại hình/hỗtrợ thành Xu tùy ý.

Không sửa source/rules/save, không chạy build. Các file dirty gameplay/liveops/Android khác là thay đổi có sẵn/agent khác và chưa được ghi đè.

## Cập nhật quyết định và model thuần

Chủ dự án đã chốt100Xu/mảnh cho cả ba loại, phí20Xu/ghép3mảnh và10Xu/ghép3chữ; nguồn ngoại hình chọn cả mới và đã có trong101món. Dùng1bản sauMax→1mảnh, ghép ra ba loại rương đều1/3. Đã cập nhật kế hoạch, thêm acceptance ví19/20Xu và9/10Xu, atomic/replay và pending policy miễn phí cũ.

Đã tạo `js/progression/cosmeticCatalog.js` (catalog101ID) và `cosmeticProgression.js` (normalize, migration quyền sở hữu→Level1, batch receive, overflowMax, bán100Xu/mảnh, ghép20Xu). Đây mới là model thuần, chưa nối production, không khẳng định dữ liệu người chơi đã có level hoặc phí chữ đã có hiệu lực.

Model lưu bản nháp namespace/version1 gồm levels map101ID, fragments3counter, sequence và last operation. Receipt quyền sở hữu cũ không dùng đếm bản trùng. Mutation trả projection phí âm/chest delta để canonical owner commit cùng ví; không tự cấp rương hay persist. Còn phải tích hợp boundary/rules/client, kiểm tra cross-device và crash/retry trước khi dùng thật.

Kiểm thử `node --test tests/unit/cosmetic-progression.test.js`:7/7 đạt ở lượt tạo model; kiểm tra toàn101món, batch so với từng bản, migration idempotent, biên level, Max+overflow, phí20Xu, bán100Xu và input lỗi. Các kiểm thử này chưa chứng minh luồng game/cloud/UI.

Câu hỏi mốc đổi hình7/21 hay7/15 đã gửi và chưa có câu trả lời. Chưa thay mốc trong model/manifest/acceptance cũ; không sinh hàng loạt hoặc tích hợp renderer theo mốc chưa chốt. Chưa nhập sáu ảnh mẫu thành asset sản phẩm.


## BÀN GIAO CHAT LOGIC/UI/OFFLINE — theo yêu cầu mới nhất08/11

Đọc kế hoạch hiện hành DUY NHẤT `COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md`, nhất là mục8,13,14. `NEW_GAMES_OUTLINE.md` chỉ là draft hai trò free Match3Connect/MemorySequence, không triển khai. Chủ dự án tách chat này chỉ tạo ảnh; chat mới xử lý phần logic/UI/offline. Không tự tạo chat hoặc kế hoạch thứ hai; không deploy/APK.

### Quyết định đã chốt

-101món39avatar/39khung/23huyhiệu,Level1lần đầu,+1/bản trùng tới21. Hình1Level1–6,hình2Level7–20,hình3Level21/Level Max. SauMax1bản→1mảnh đúng loại. Bán100Xu/mảnh;3mảnh bất kỳ+20Xu→1rươngngẫu nhiênđềuAvatar/Khung/Huyhiệu. Ghép3chữ phí10Xu,giữ chọn thiếu-trước và receipt/pendingcũ miễnphí. Pool cả mónmới/đãcó,đủ101kể cảstarter;nhánhXu/hỗtrợ khôngđổi.
- TabKho rương đổiNHÃN Kho lưu trữ,giữIDchests. Một lưới icon chung/phântrang4cột×6hàng mobile hoặc6×6 khi đủrộng,cần đo. Chỉicontrênô,tên/sốlượngtrongpopup/ARIA. Mảnh bấmBán/Ghép;rươngXem tỷlệ/Mở/Bán;slidermở/bán.Mởnhiều từngrươngcommitriêng,hiệuứnglầnlượt,rồi1popuptổng;đóng/mấtmạng dừng mởtiếp,rươngchưa mởgiữkho.
- BánrươngAvatar/Khung/Huyhiệu200Xu mỗi loại.Giámua dựkiến10000Xu chưa tựthêmshop. RươngC=round(50%EVquà)=58Xu;EV.4×50+.6×mean(158.6667,158.5,158.5)=115.1333Xu;giáhỗtrợchốt ởshopCatalog/linkItems/tripleConfig. Policyv1phảiđóngbăngreceipt,tươnglaiđổigiá cầnversion.
- Offline mới:local DB trước,gameplay/next/resume khôngchờFirebase;rawfacts/checkpoint/dropmarkersdurable,assetserverpendingkhôngtiêu/claim sớm,1queue/journal hiệncó UID/profile/opID/entropy;retrybounded,403/versiondừnggiữdữliệu;rebase domainkhôngLWWsave hoặcmax/sumconsumables;Androidbundle/webassetavailability. Cần hỏi ngắn policyrawfactunknown-day vàtiêuhỗtrợ/Xu gameplayoffline trướccodephụthuộc(mục13),vẫn làmphầnđộc lập.

### Source đã sửa, chưa nghiệm thu

- Mới `js/progression/cosmeticCatalog.js`:101catalogpure; `cosmeticProgression.js`:normalizev1 `{version,levels,fragments,sequence,last}`,seedquyềnsởhữu→Level1,batchcopies,Maxoverflow,bán100,ghép20,equalchestselection,replaylastoperation. Modelreceivecopiesphụthuộcadapterchỉgọi trênnewcommit,không tự cógrantjournal.
- `chestConfig.js`:CHEST_VERSION2,LEGACY_CHEST_ITEMS/POOLS98, poolmới101,chestPools(version),giábánC58/cosmetic200+giámuadựkiến10000. Giữfestivalv2 của agentkhác. `chests.js`:v2chọncảmới/đãcó;v1pending/readgiữfull/duplicateXu;normalizeđọc2poolversions. Thêm `sellChest` mới:trừspent theoquantity,sequence+=quantityvìexistingsequence=sumspent,kind sale/unitPrice/priceVersion1,atomiccoinsprojection+replay; CHƯA thêmtestriêng/mountUI.
- `wheelRewards.js`:WHEEL_VERSION3,support2và3,v3cosmetic/mysteryrandomall101khôngconvertXu,v2missing-firstvẫnđọc,poolnoncosmeticgiữoldbehavior. Guardversionfuturereject.
- `letters.js`/`config.js`:LETTER_FUSION_FEE10,PAID_LETTER_FUSION_POLICYpaid-missing-first-v2,receiptcoins=-10chỉpolicy mới;legacy0cònđọc,preparestableentropy,mutateoptionalcoinsBalancevalidationtrướctiêu. Chưa cậpnhậtUIgiá/nút thiếuXu.
- `sparkModel.js`:optionalcosmeticProgressnormalize,cờ `cosmeticEnabled` mặc địnhFALSE,servicephảibật saupreflightseed. ReceiveCopieschỉkhiopenpool2/wheel3applied;receiptquyềnsởhữu cũ theoitemchỉemitkhi chưaowned,khôngtăngjournalquyềnmỗibản. Thêmfuse/sellCosmeticFragments vàsellChest;negativefeereceipts;sequenceguardresolution. Chưa migration/schema/API cuối chooffline.
- `service.js`:giữcácsửacũagentkhác.Thêm preflightcosmeticOnlyđểseedownershipriêng,sequencebranchfragment/chestsale,versioncandidatesold/new,feepolicynewpending,bềnfusionRoll,coinsBalancecanonical,khôngoverwriteownershipreceiptđãcó,víkhôngâm. Vẫnrequestonline-onlyvàgiữI/Otrongqueue;offlinechưa sửa. Cầnreviewflowinitializing/source/cosmeticpreflight vàoldpending thật;đừngcoiunitmodelthaythếserviceintegration.
- Rules SOURCE: `design/rewards-liveops/cosmetic-rules.template.txt` mới +spark/chest/wheeltemplates +`scripts/generate-liveops-model.mjs`.Generated `firestore.rules` đã regen tại máy,chưa deploy. Namespaceguard/copy/trade/seed/sale/letterfeeđãphác;giới hạnexpressionvẫnFAIL.Tránhbỏvalidationđểpass.Cầnstrictlegacycatalogmembershiptheoversion:JSđãtách98/101,generatedrulepoolregex hiệnchưatáchstartertheov1/v2 đầyđủ. Rootbackup làpayloadencoded/client-trusted,ruleskhôngđọcvítrongpayload;khôngclaimserveranti-cheatvíđãđạt.
- Chưa đổi `achievementModel.PROFILE_COSMETIC_ITEMS` sangcanonicalcatalog,chưa nốiprofilePortrait/publiccosmeticversion/leaderboard,UIBộsưutập/Kho/Hồsơ,chưa córươngmởnhiều,popupfragment,chưagắnassetforms. Header/publicrulescũngcầnformslevelprojectionkhôngdùnglevelcủachủmáychoUIDkhác.

### Bằng chứng và lỗi cần xử lý

1. `node --test tests/unit/cosmetic-progression.test.js tests/unit/cosmetic-rewards.test.js tests/unit/festival-chests.test.js tests/unit/liveops-letters.test.js tests/unit/wheel-rewards.test.js tests/unit/liveops-spark.test.js` đạt50/50trước thêm sellChest. Mới2filecosmetic tests ởtests/unit (thưmụccóthểđangignore);giữtrênmáy. `wheel-rewards` giữv2testsđượccallversion2rõ vàlegacy98,invalidfutureversion4;testv3riêngcosmetic-rewards,khôngxóainvariantold.
2. `scripts/check-cosmetic-emulator.mjs` mới dùngDB/emulator thậtvàcloudsnapshot/CAS,khôngchỉUIfixture. Chạy `npx firebase emulators:exec --only firestore --project demo-memory-match "node scripts/check-cosmetic-emulator.mjs"`. Môi trườngcầnpermission kết nối/bindloopback;defaultrun từngtimeout/EACCES,escalatedchạyđược.
3. KếtquảCUỐIhiệnfailPERMISSION_DENIED max1000expressions ởnhậnngoạihình sau migration101;log `runtime/cosmetic-emulator.log`. Từngfixsyntaxfloatdivision vàcompilerexpressiontreequádài;seed tách10ID/helper,initialseedfastpathlevel1;regexcatalog vàcopyvalidateonlydelta nhưngvẫnchưaPASS. Cầnprofileevaluation/coverage,mởrộngca canonicalservice/403/UID/recoveryrồi regression. Có thểbướcdenytests sauMax bịnhầnscope;thêmstepmarkersđểxácđịnhđúnglệnhfail,đừngchỉđọcdònglỗiởallowupdate.
4. Gate7check/build/UI/performancechưa chạy,mọistatuschưanghiệmthu.KhôngAPK/deploy/push/commitgộp.
5. Cótiếntrìnhemulatorcuối session87858,cầnpollnếucònhiệu lực;emulators:exectựshutdownkhiscriptkếtthúc.Không giữserverbackgroundmới.

### Ownership tránh xung đột

Chatmới logic/UI/offlinecóthểsửacácowner trên,persistence/account/cloud/serviceworker/tests/CSSliênquan,nhưngđọcgitchangestrướcvàgiữdirtykhác(sounds/home/map/linklayout/badgerewards/audiofix). Chatảnhchỉ `design/expedition/art-production/`,master/prompts/QA,manifestlôảnh,exportnamespaceformmới;chatlogicđọcmanifestvàgắncatalogbằnggenerator,saukhichatảnhbàngiaolôđạt.

Mastermới6ảnh ở `design/expedition/art-production/masters`,journal/hash và`first-three-qa.png`. CúSapphireform2/3,khungnguyệtquếvàngform2/3,huyhiệutrítuệform2/3. Chưaalignment/cross-matchQA/chưaproductionexports;đừnggắnformmớiởruntimenhưđãxong.Còn6ảnhpilotA0trướcđóởthree-form-preview,cũngcầnQA.Nhữngmastermớikhôngphảisảnphẩmbitmapđủ202;khôngfallbackgốcđểđánhdấuđủảnh.


### Xác minh trước khi bàn giao

Đã chạy lại cùng6file unit sau phần sellChest:50/50 đạt; suite này chưa có test chuyên biệt bán rương nên không dùng để đánh dấu bán rương đã nghiệm thu. `git diff --check` cho CONTEXT/js/progression/js/liveops/generator đạt (chỉ cảnh báo CRLF). Emulator cuối đã kết thúc và tự tắt, không còn server cần giữ. Chưa check/build/UI vì task đang dở, không có thay đổi UI mới trong phần offline audit.

Trạng thái tại thời điểm bàn giao (đã được thay bằng hai quyết định chốt bên dưới): raw facts không có ngày tính vào ngày máy chủ xác nhận hay chỉ mục tích lũy; hỗ trợ/tiêuXu đều chờ mạng hay hỗ trợ được giữ riêng cho thiết bị có thể dùng offline. Khi có câu trả lời, ghi vào cùng kế hoạch/CONTEXT trước code phụ thuộc. Không hỏi lại các phí/giá/mốc đã chốt.

Ảnh mới đã lưu cả `journal.json` hash/bbox và `prompts.json` đầy đủ6prompt built-in; nguồn ởmasters. QAcontactsheet cho thấy cần căn lại tỷ lệ avatar và lỗ khung trước export; trạng tháigenerated-pending-alignment-qa được giữ, chưa báo pass.


### Quyết định offline bổ sung — sau bàn giao

Chủ dự án đã chọn **cho dùng hỗ trợ đã được giữ riêng cho thiết bị**. Đây là phần hỗ trợ có xác nhận phân bổ từ máy chủ, không phải toàn bộ số tồn sao chép trong cache. Giữ và tiêu dùng chung owner inventory/journal, bảo toàn tổng tồn giữa thiết bị; mỗi lần dùng durable trước tác dụng, retry không trừ hai lần, phần giữ không tự trả về kho chung khi chưa đối chiếu. Tiêu Xu và quà chưa xác nhận vẫn chờ mạng. Chat logic phải phân tích contract phân bổ/thu hồi/phục hồi thiết bị trong GateO1, không tạo một kho độc lập.

Trạng thái trước câu trả lời chốt bên dưới: người dùng yêu cầu giải thích kỳ nhiệm vụ. Đề xuất tính ván offline không xác định được ngày vào ngày máy chủ xác nhận, không cấp bù quà ngày cũ hoặc tự tăng điểm danh; phương án còn lại chỉ giữ tích lũy không theo ngày. Không hiểu yêu cầu giải thích là đồng ý đề xuất. Kế hoạch và CONTEXT đã đồng bộ trạng thái này; chưa sửa code.


### Chốt kỳ nhiệm vụ offline — 08/11

Người dùng trả lời **“Như đề xuất”**: ván offline không xác định được ngày tính vào nhiệm vụ ngày máy chủ xác nhận. Giữ hạn mức của kỳ đó, không cấp bù quà ngày cũ/điểm danh hoặc tự bỏ thời gian chờ. Gán kỳ được xác nhận cùng ID ván/receipt phải lưu bền để mất phản hồi/restart/retry không tính lại hoặc đổi ngày. Hai quyết định sản phẩm offline đã rõ: cách tính kỳ này và dùng hỗ trợ được máy chủ giữ riêng cho thiết bị. Chat logic không cần hỏi lại hai lựa chọn; vẫn phải hoàn thiện contract/migration/kiểm thử trong O1–O6. Lượt xác nhận này chỉ cập nhật tài liệu, không sửa logic hoặc UI.


### Bàn giao cuối chat — chuyển cả hai phần sang hai chat mới

Yêu cầu mới nhất thay phân công “chat hiện tại tạo ảnh”: nay Agent A ở chat mới tạo/QA ảnh theo `HANDOFF_ART_AGENT.md`; Agent B ở chat mới xử lý logic/UI/offline theo `HANDOFF_LOGIC_AGENT.md`. Cả hai dùng một kế hoạch active, không triển khai hai trò mới. Chat này chỉ chuẩn bị bàn giao, không sửa thêm source.

Đã kiểm lại101ID/303file gốc tồn tại. Đã sao chép6masterPNG gốc của nhómA0 từ thư mục generated_images vào `art-production/masters/`, bổ sungjournal với hash/bbox/nguồn/preview; cộng6master bộCúSapphire thành12ứngviên cho6món. Còn190thiết kế chưa có ứngviên; cả12đãcó chưa được coi là productionQA. Sáu prompt đãdùng của bộCúSapphire lưu nguyênvăn trong `art-production/prompts.json`. PromptA0gốc không được lưu nguyênvăn; ghi rõ trongjournal, cókhung prompt mới ởPROMPT_GUIDE đểtạo/sửa tiếp, khôngnhậnlàpromptcũ.

Hai handoff thống nhất namespace export mới `public/assets/achievements/evolution/v1/{item-id}-form{2|3}-{128|256|512}.webp` và manifestready dựkiến `design/expedition/art-production/manifest.json` (chưa tạo). Agentảnh làproducer; agentlogic chỉ đọc vàsinhcatalogruntime sau lôready. KhôngimportjournalứngviênnhưmanifestđãQA. Không có file sản phẩm mới ởnamespace này tại lúc bàn giao.

Lượt bàn giao chỉ cập nhật tài liệu và sao chép master có sẵn, không đổi gameplay/UI/save/rules. Không chạy lại test/build hoặc deploy cho việc ghi prompt. Bằng chứng50unit và emulatorfail trước đó vẫn giữ nguyên, không nâng status thành hoàn tất.

## Tiếp nhận logic/UI/offline — 08/11/2026

Đã đọc AGENTS/CONTEXT/kế hoạch và hai handoff; giữ toàn bộ dirty có sẵn, không sửa art-production hoặc namespace ảnh. Không tạo kế hoạch khác.

Chẩn đoán emulator: tái hiện lỗi1000biểu thức ngay ở giao dịch Level20→Max. `rewardChestOpen` kiểm lại toàn bộ12counter dù earned/sourceEarned bất biến. Chọn validation delta có invariant thay vì tách giao dịch: giữ nguyên toàn bộ field khác, chỉ cho đúng spent[type] tăng1, kiểm int/safe bound/không vượt earned và sequence+1. Cosmetic copy vẫn được kiểm cùng giao dịch. Đã sinh lại firestore.rules từ template, không sửa output tay/không deploy.

Generator nay tách membership pool cũ98 và mới101 cho chest v1/v2, wheel v2/v3, gồm mystery. Bổ sung guard record trước đọc last.kind trong normalizeChests. Không thay ID hoặc format receipt; đây là sửa trên schema extension đang dở, không tuyên bố giữ nguyên schema toàn task.

Script emulator bổ sung mốc từng thao tác, dump coverage khi lỗi; mutate wire state sau encode để ca giả mạo thực sự tới Rules thay vì bị normalizer client chặn. Allow/deny mới: sửa counter loại khác, tăng earned, overspend, starter ở pool legacy, giá bán giả. Ca bán3rươngC xác nhận174Xu, sum-spent sequence và recovery snapshot. Unit mới kiểm cả4giá, quantity invalid, overflow, replay và mở sau bán.

Bằng chứng cuối lượt tiếp nhận:
- node --test tests/unit/cosmetic-progression.test.js tests/unit/cosmetic-rewards.test.js tests/unit/festival-chests.test.js tests/unit/liveops-letters.test.js tests/unit/wheel-rewards.test.js tests/unit/liveops-spark.test.js:51/51 PASS.
- node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --only firestore --project demo-memory-match "node scripts/check-cosmetic-emulator.mjs":PASS, exit0 sau toàn scenario migration101/level/overflow/fees/CAS/denials/sale/recovery; emulator tự tắt.
- generate-liveops-model.mjs --check, node --check script và git diff --check phần source liên quan:PASS (CRLF warning ở output rules).
- Chưa check/build/UI/offline matrix/performance; chưa đóng Gate3 hoặc bất kỳ gate nghiệm thu tổng nào. Emulator này chưa phủ wheel cosmetic path/two-device/crash service thật. UI và offline chưa triển khai ở lượt tiếp nhận này.

Cần quyết định bổ sung cho O1: tự giữ tối đa1hỗtrợ/mỗi loại/thiết bị khi online, hay người chơi chọn số lượng trong Kho. Đây không phải hỏi lại quyền dùng hỗ trợ đã giữ hoặc ngày tính nhiệm vụ. Đã gửi câu hỏi; chưa có lựa chọn, chưa áp dụng mặc định. Hai policy offline đã chốt trước vẫn giữ nguyên. Các phần còn lại theo cùng kế hoạch vẫn chưa hoàn tất; không đánh dấu ảnh/tích hợp xong.

## Tiếp tục logic/UI/offline — 09/11/2026 (thay trạng thái cũ phía trên)

### Phạm vi và chính sách có hiệu lực

Chủ dự án đã thay chính sách giữ riêng hỗ trợ/chờ máy chủ: kho hỗ trợ cached dùng offline; mở quà, mở rương, quay miễn phí/vé, bán/ghép có thể hoàn tất trên máy rồi đồng bộ. Chỉ quảng cáo cần mạng; không thêm màn phân bổ hỗ trợ. Chấp nhận trường hợp hiếm hai máy tiêu cùng hỗ trợ cached. Giữ ID, kết quả ngẫu nhiên, receipt, CAS và quyền chơi khi lỗi mạng/403. Raw fact chưa biết ngày vẫn gán một lần vào ngày máy chủ xác nhận, không cấp bù ngày cũ/điểm danh. Các mục cũ về escrow thiết bị không còn là nguồn triển khai.

Tiếp tục source đang dở, không reset/reformat các thay đổi home/map/audio/link/badge của agent khác. Không triển khai Match 3 Connect/Memory Sequence; không mở rộng cửa hàng từ giá 10.000 Xu dự kiến. Không deploy, APK hoặc push. Không tạo kế hoạch thứ hai.

### Kiến trúc đã chọn và hợp đồng lưu

- So sánh giữ mạng trong hàng đợi persistence với tách I/O ra khỏi writer hiện hữu: chọn snapshot ngắn → mạng bên ngoài → rebase delta vào bản mới nhất trong cùng writer. Không thêm ví/writer đồng bộ cạnh tranh. Giữ tiến độ, lựa chọn trang bị và tiêu hỗ trợ xảy ra trong lúc chờ mạng; reset/import/đổi owner làm phản hồi cũ mất hiệu lực.
- `appearance.spark.offline` version1 là outbox của cùng owner, tối đa512 thao tác. Mỗi entry chứa command/operation ID, candidate/policy/rolls, thời điểm, số dư và supportCount lúc thực hiện, cùng outcome cố định. Projection và entry ghi atomic vào IndexedDB trước khi báo nhận. ACK chỉ bỏ entry, không cộng quà lại. Local outcome được đối chiếu với transition canonical; khác kết quả giữ cả hai nguồn để đối chiếu.
- Raw fact version2 cho phép day=null, kèm profileId. `bindPendingRewardFacts` gán kỳ và alias profile→UID bền vững trước gửi. Không đổi kỳ đã gán. Appearance snapshot cũ không có quyền thêm/xóa pending facts; settlement/binding/ACK là các owner duy nhất. Restore đã xác minh đi qua import boundary.
- Raw queue tối đa4096 entry bất biến khi gửi. Khi đầy, cùng ledger có tối đa hai batch overflow version3: undated và dated của ngày đã biết mới nhất. Batch chứa tổng wins/matches/noHintWins/event points, cap đúng giới hạn counter1.000.000. Không sửa batch đang gửi; chỉ chuyển overflow vào pending khi có chỗ rồi mới bind/gửi. Ngày đã biết cũ hơn ngày đã biết mới nhất không được cấp bù nhiệm vụ; tiến độ và thống kê ván vẫn nằm trong save gameplay. Không để queue đầy làm hỏng toàn bộ save ván.
- Trong sync metadata `sparkPending:{environment}:{uid}:{profileId}`, `_publication` version1 lưu fingerprint root, kết quả/receipt và danh sách fact ID được ACK trước CAS. Khi mất phản hồi, chỉ chấp nhận root/link khớp chính xác fingerprint và rewardRevision. Projection trên máy một lần hoặc chỉ xác nhận nếu state đã ghi; không xóa fact mới đến trong lúc chờ. Candidate/version lạ giữ nguyên, dừng gửi. Backup thông thường nhường cho outbox/publication đang chờ.
- Không dùng latest snapshot thắng khi hai máy tiêu cùng tài sản. CAS và canonical transition chỉ chấp nhận một giao dịch; máy còn lại giữ local intent và bản cloud để đối chiếu, vẫn chơi. Nút tiếp tục bản máy không giả vờ giải quyết xung đột thưởng; chọn cloud giữ backup local theo import hiện hữu. Chưa có phép cộng/max tùy ý ví hoặc kho tiêu hao.
- Save envelope/public IDs vẫn giữ tương thích; có schema extension nêu trên, cosmeticProgress và public cosmetic v2. Không tuyên bố toàn task không đổi schema. Giữ đọc receipt/chest pool v1, wheel v2/eight-sector cũ và fusion miễn phí đã chuẩn bị trước chính sách10Xu.

### Rules và lỗi1000 biểu thức

Đã sửa nguyên nhân kiểm lại toàn state/counter/catalog nhiều lần: validation delta, cached changed keys, membership đúng pool cũ/mới, một lần phân loại cosmetic và kiểm integer/bounds suy ra từ counter cũ hợp lệ. Không bỏ allow/deny để pass.

Nhánh late-ad với29past+10current receipts cần hai bước trong pendingWheel hiện hữu. `reserveAd` chỉ kiểm lịch sử/ordinal/bằng chứng thời gian và giữ cùng operation/candidate, không cấp tài sản. Spin kế tiếp kiểm đầy đủ prize pool/shape/copy/overflow, receipt phải khớp reservation; các spin khác bị chặn trong lúc giữ. Có cancel reservation không phát quà và phục hồi restart. Không dùng reservation chưa kiểm prize để claim trực tiếp. Public request vẫn là spin, service tự điều phối và lưu operation gốc. Client cũ vẫn đọc các receipt cũ; bản client chưa hiểu phase reserved-ad không được dùng cùng thiết bị/bản save mới trong giai đoạn nâng cấp.

### UI và ảnh

- Kho lưu trữ giữ tab ID chests. Icon-only grid4/6 cột theo chiều rộng thực đo, page size24/36, popup tên/số lượng, tỷ lệ/Mở/Bán, slider; mảnh Bán/Ghép3mảnh+20Xu và rương chưa mở. Mở nhiều commit từng rương, animation420ms transform/opacity có owner; đóng/offline dừng lượt mới, reduced-motion kết thúc animation hiện tại, tổng quà sau chuỗi. Sau bán/ghép popup cập nhật số lượng và nút theo kho mới.
- Profile/catalog chung101 món, level labels và ba hình thái trong cùng item. Hero/header/public portrait tối đa ba lớp; public v2 kèm level riêng từng slot, không lấy level chủ máy cho UID khác. Ảnh form không cache được thử ảnh gốc một lần rồi fallback tĩnh hữu hạn.
- Generator chỉ đọc manifest ready/QA passed và xác minh master/export hash, bytes, WebP size, canvas/anchor và namespace; không sửa master/prompt/journal/manifest. Hiện10/202 forms,30/606 exports. Agent ảnh đã xác nhận hợp đồng giữ nguyên, bàn giao một phần và phiên tạo ảnh đang tạm dừng; chưa có lô ready mới. Không đánh dấu toàn bộ ảnh/tích hợp/Gate7 hoàn tất.
- Worker production precache đầy đủ JS/CSS của đúng build, không preload909ảnh. Asset queue/cache có giới hạn134 request,512 file/64MiB, cache failure không chặn response hợp lệ; giữ cache ứng dụng khác. HTML root và chunk set được pin theo active build, update chờ client đóng. Offline fallback không lấy HTML từ cache của worker build khác. `main.js` vẫn khởi tạo định danh thiết bị khi backend bị disable để không mất raw fact.

### Bằng chứng đã hoàn tất tại checkpoint này

- 73/73 unit: cosmetic progression/rewards, festival, letters, wheel legacy/new, Spark, persistence/raw overflow/stale ACK, inventory concurrency, art boundary và local rewards. Log `runtime/cosmetic-units-final-phase.log` (chạy trước phần sửa bootstrap/backend-disable; cần check cuối sau mọi source ổn).
- Emulator cosmetic đầy đủ PASS:101 migration, Level20→Max/overflow, fee19/20 và9/10, sale/CAS/recovery, wheel v3 cả avatar/frame/badge và Max, late-ad lịch sử29, non-cosmetic không được sửa level. Log `runtime/cosmetic-wheel-budget-v3.log`.
- Emulator wheel v2 PASS mọi slot/bounds/support/rollover/ad quota/29-history,17 forgeries bị từ chối và old eight-sector/CAS/recovery: `runtime/cosmetic-wheel-reservation.log`. Public cosmetic v1/v2,101ID, level7/21, owner/whitelist/rank/cache PASS: `runtime/cosmetic-public-v2.log`.
- Firebase+IndexedDB thật:6 intent offline gồm hai hourly gifts, mở/quay/ghép; mất response sau commit không phát lại. Hai ca PASS `runtime/cosmetic-devices-replay.log` (lượt đó ca hai máy riêng fail do test chụp identity lúc reconnect; không tính toàn file log PASS).
- Lost ad response, lost raw-fact ACK kèm ván mới,403 thật giữ quà/chơi/lưu đều3/3 PASS: `runtime/cosmetic-server-faults-v3.log`. Lượt kiểm sau có lỗi emulator không trả backend trong10s ở startup auth; cần chạy lại sạch, không nới validation/test để pass.
- Hai browser context cùng UID/IndexedDB bán rương cuối: canonical chỉ bán một, máy kia giữ journal/conflict và chơi được PASS trong `runtime/cosmetic-devices-festival-v3.log`; ca festival cùng lượt còn fail vì fixture dùng999 thay vì capacity hiện hành9999, đã sửa fixture dùng GAMEPLAY_LIMITS và ca festival sau đã PASS. Cần chạy matrix cuối sau guard UI đối chiếu mới.
- UI storage/forms/profile12/12 PASS `runtime/cosmetic-forms-ui.log`; collection/events24/24 PASS `runtime/cosmetic-ui-regression-v2.log`. Storage interruption + shared gameplay lifecycle/cleanup19/19 PASS `runtime/cosmetic-lifecycle-final.log`, gồm100 chuyển Memory/Link/Triple,20-mount batches, stable HUD refs và không còn owned resources. Kết quả Playwright chạy đồng thời phải dùng output dir riêng; hai lượt cũ dùng cùng test-results gây ENOENT trace đã được chạy lại sạch, không dùng làm lỗi sản phẩm.
- Chơi thắng đủ hai wave offline, qua màn2, về menu/resume giữ attempt và đúng một raw fact undated: PASS `runtime/cosmetic-offline-gameplay-v2.log` sau sửa bootstrap local identity.
- Production worker cold boot offline và mở board với ảnh theme chưa cache PASS `runtime/cosmetic-production-offline-vary.log` trước thay đổi pin HTML; đang build/kiểm lại production cuối. `check-pwa.mjs` đã PASS pin HTML/asset dedup/cache eviction/unrelated-cache/late registration.
- `npm run check` PASS `runtime/cosmetic-check-phase2.log` trước sửa bootstrap/guard đối chiếu/pin HTML; cần lần cuối theo source mới. Build trước đã PASS, chưa phải build cuối. Không deploy/APK.

### Giới hạn đo đạc

Fixture desktop30 chu kỳ trước/sau GC: listener125→113, nodes1781→1381, không có long task; mountP95=39,6ms, frameP95=45,5ms trong chu kỳ dựng/đóng trang. Đây không phải chứng nhận60FPS điện thoại. Các số đo lifecycle/render warm-start khác nằm ở runtime của suite dùng chung; chưa có thiết bị Android vật lý để xác nhận FPS/heap trên điện thoại. Ảnh chỉ có lô một phần, không dùng fallback ảnh gốc để tính đủ202 thiết kế.

Các test mới nằm trong thư mục tests đang bị gitignore của repository; giữ file local và nêu rõ khi gom phase/commit, không tự force-add hoặc commit ảnh/log QA. Còn phải chạy gate kiểm tra cuối, review diff riêng, cập nhật checkpoint bằng kết quả cuối; không dừng task ở checkpoint này.

## Kết quả cuối phần triển khai logic/UI/offline — 09/11/2026

### Các lỗi bổ sung tìm được trong review và đã xử lý

1. Ghép chữ missing-first khi đủ17 chữ và đổi bộ Triple dài nhất cũng sát1000 biểu thức. Dùng invariant keys của counts cũ + whitelist delta mới để bỏ kiểm tra domain trùng; cache required.keys; đẩy route chỉ-letters tới owner trực tiếp, truyền changed keys đã tính. Giữ kiểm tra từng nguyên liệu/output, số nguyên, không âm, phí, policy, receipt và replay. Thêm deny unknown key, paid all-owned -10 một lần, free receipt cũ không bị thu phí. Matrix cuối không còn1000-expression failure ở các ca hợp lệ.
2. Sửa fixture rollover cũ noHint=1 thành target hiện hành3 để vẫn kiểm đúng toàn bộ80Xu quyền đã đủ; không sửa expected80 thành60 để pass. Festival regression cũ dùng chest version1 rõ ràng; version2/copy được kiểm riêng. Fixture kho hỗ trợ dùng GAMEPLAY_LIMITS.itemCount hiện hành9999 thay vì999; giữ kiểm overflow10Xu, không nhân inventory/reward khi replay.
3. Popup bán nhiều lần giữ listener của slider đã detach đến khi đóng. Thêm owner con thay thế cùng controls. Sau20 lần bán trong cùng popup: nodes6891→6891, listeners158→158; heap GC14.988.708→15.291.268 bytes (fixture giữ command history). Không dùng số này làm tuyên bố60FPS điện thoại. Log số đo `runtime/qa/cosmetic-upgrade/storage-controls-resources.json`.
4. Khởi tạo local account owner ngay cả khi VITE_FIREBASE_DISABLED để ván offline vẫn ghi raw fact. Outbox ghi environment cùng UID/profile; cold boot xác định environment từ config/host trước khi mạng khởi tạo. Không gửi/ghép thêm vào intent của environment khác. Outbox v1 thiếu field environment vẫn đọc được, được bind khi tiếp tục/drain trong profile đã xác minh; restore khác nguồn vẫn chịu guard đối chiếu hiện hữu.
5. Worker pin HTML cùng chunk set của active build, giữ active shell khi có worker chờ, loại shell của waiter đã bị thay thế qua marker build nhỏ thuộc worker. Không tích lũy cache mỗi lần phát hành khi tab cũ chưa đóng. Marker chỉ chứa tên cache, không chứa dữ liệu người chơi. Asset cache vẫn512 file/64MiB,134 request gồm active+pending. Icon rương chưa cache có SVG fallback hữu hạn; không đổi ảnh rương gốc.
6. Không để chọn bản máy giả vờ giải quyết xung đột reward revision. Khi chưa thể replay an toàn, nút Tiếp tục trên thiết bị chỉ đóng đối chiếu, giữ cả journal và nguồn cloud, vẫn chơi; không ép cloud overwrite và không max/sum kho. Bản cloud được chọn rõ ràng vẫn dùng backup/import hiện hữu.

### Bằng chứng chốt

| Phạm vi | Kết quả | Bằng chứng local |
|---|---|---|
| Unit/model/persistence/owner/environment/legacy versions |74/74 PASS|runtime/cosmetic-unit-final.log|
| Tám nhóm Rules emulator: cosmetic, wheel, festival, fusion, hourly, mission, Spark legacy, public cosmetics |8/8 scripts exit0; cả allow và deny|runtime/cosmetic-rules-matrix-final-v3.log|
| Firebase Auth+Firestore+IndexedDB service thật, lost response, raw fact ACK xen ván mới,403, future candidate, hai thiết bị, festival |8/8 PASS sau environment guard|runtime/cosmetic-online-matrix-release.log|
| Collection/events/forms/profile, nhiều skin và viewport |40/40 PASS|runtime/cosmetic-ui-matrix-final.log|
| Storage sliders/bulk/close/offline/reduced-motion/repeated sales/uncached art |11/11 PASS|runtime/cosmetic-storage-last.log|
| Shared lifecycle/cleanup,20-mount batches,100 Memory/Link/Triple switches |19/19 PASS|runtime/cosmetic-lifecycle-final.log|
| Win hai wave/next level/resume offline, một undated fact |1/1 PASS trên source environment guard cuối|runtime/cosmetic-offline-gameplay-release.log|
| Production worker thật, cold boot offline và uncached theme fallback |1/1 PASS sau cache ownership marker|runtime/cosmetic-production-offline-release.log|
| Worker contract: active/waiting ownership, pin HTML, bounded assets, dedup, unrelated cache, registration |PASS|node scripts/check-pwa.mjs|
| Generator sources/public rules/ready art |PASS,10/202 forms ready|generate-liveops-model.mjs --check; generate-public-cosmetic-rules.mjs --check; generate-cosmetic-forms.mjs --check|

Các dòng test có chồng phạm vi nên không cộng thành một con số tổng duy nhất. Bằng chứng cũ fail đã được giữ để chẩn đoán; các log trong bảng là lượt thay thế đã đạt. Check/build release và diff cuối ghi ở mục bổ sung sau khi tiến trình kết thúc. Không dùng lần Firebase emulator startup không trả trong10s hoặc lỗi trace do output dir dùng chung làm bằng chứng pass; đã có các lượt sạch thay thế.

### Rules đã triển khai theo quyền mới của chủ dự án

Đã đối chiếu rules đang dùng trước deploy; prefix quyền tài khoản, private save và bảng xếp hạng không đổi. Backup `runtime/firestore-before-cosmetic-deploy.rules`; ruleset trước `de918ddc-2fd2-4d54-b5ff-83a52ac93aea`, SHA256 `7b9030e36e89cececdb4ba3424cce0a7b9dd5e2a5191a54082f904cb222a3f56`.

Lệnh chỉ deploy Firestore rules: `node node_modules/firebase-tools/lib/bin/firebase.js deploy --only firestore:rules --project memorymatchv1-1a --non-interactive`. Lần đầu Google Rules test API trả503 trước khi phát hành; lần thử lại compile/upload/release thành công, exit0. Không bỏ compile hay giảm validation để vượt lỗi dịch vụ.

Đã đọc lại release mặc định cloud.firestore từ API và đối chiếu hash **trùng chính xác file local đã kiểm thử**: ruleset `28a5e576-4e28-4213-b2cb-b972183e4861`,119.906 bytes, SHA256 `c568d95bb3a781bc948568091e6f09b796e0b8b7cd0f1c26cf7f89335ffeb282`. Bằng chứng `runtime/cosmetic-firestore-rules-deploy-retry.log`, `runtime/cosmetic-firestore-rules-verified.log`, `runtime/firestore-deployed-cosmetic-verified.json`. Chỉ rules được triển khai, không Hosting/indexes/APK/client.

### Trạng thái gate và phần bị chặn ngoài phần triển khai này

Gate0–4 và O1–O5 đã có implementation và bằng chứng trên máy tính/emulator. Gate5 chưa đủ ảnh; Gate6 đã có runtime mapping/public levels/fallback nhưng chưa đủ202 form/cross-match và chưa chứng nhận FPS/heap trên Android vật lý. O6 và Gate7 nghiệm thu chung vẫn để mở vì các phần này, không gọi toàn bộ task hoàn tất.

Đã phối hợp trực tiếp với chat **Tạo ảnh ngoại hình Memory Match** theo yêu cầu chủ dự án. Agent ảnh xác nhận manifest10/202 form,30/606 WebP, bàn giao một phần; cross-match mới bao phủ sáu món đầu, phiên tạo ảnh vẫn tạm dừng, không có lô ready mới. Hợp đồng namespace giữ nguyên. Không sửa master/prompt/journal/manifest hoặc sinh ảnh thay họ. Khi ảnh được bàn giao tiếp mới có thể xác minh nốt phối ảnh/tích hợp toàn bộ; hiện còn thiếu192 form/576 export và chưa có kết quả đo Android vật lý để nghiệm thu các phần đó.

Kế hoạch hiện hành duy nhất của task vẫn là COSMETIC_UPGRADE_IMPLEMENTATION_PLAN.md. Giữ các dirty thay đổi của agent khác; không commit gộp, không tạo APK/Hosting release hoặc triển khai hai game mới.

### Check/build và review đã kết thúc

- `npm run check`:PASS, exit0, source cuối gồm environment guard, bootstrap local owner, worker ownership marker và icon fallback. Log `runtime/cosmetic-check-release.log`:270 JS modules, CSS ownership, game/persistence/migration/cloud/lifecycle/technical contracts,24 ads unit và local erasure/reset checks đều đạt.
- `npm run build`:PASS, exit0,12,38s ở lượt cuối; log `runtime/cosmetic-build-release.log`. Đây là build web dùng cấu hình workspace bình thường, không phải APK và không deploy Hosting. Production worker QA riêng dùng bản build đã tắt backend để không tạo dữ liệu người chơi trên production; sau QA đã trả dist về build bình thường.
- Kiểm manifest build:34 shell files gồm24 JS/6 CSS và4 file khởi động; tất cả tồn tại, không precache art/master/prompt/journal. `check-pwa.mjs` PASS cả việc giữ active shell khi có waiter và thu hồi cache waiter đã bị thay thế. Production worker thật PASS sau thay đổi marker, log trong bảng.
- Review diff riêng sau implementation đã kiểm owner/writer, stale-result/epoch, rebase trong lúc chơi, fee và RNG policy, budget Rules, UI text/focus, listener/timer/observer/animation cleanup, generated source và ownership ảnh. Các lỗi cụ thể đã sửa ở mục review phía trên; không dùng báo cáo của lần triển khai trước thay cho đọc diff/kiểm lại.
- `git diff --check` phần task:PASS (chỉ cảnh báo chuyển LF/CRLF của Git). Generator rules/public/art `--check`:PASS. Hash rules local vẫn bằng release đã đọc lại. Không thêm debug/log thử vào code sản phẩm; runtime giữ evidence/backup, tests mới vẫn theo chính sách gitignore có sẵn.

Phần triển khai và kiểm chứng có thể tự thực hiện trên workspace/web/emulator đã kết thúc. Chưa đóng toàn task: tài nguyên ảnh còn thiếu và phiên tạo ảnh đang tạm dừng; Gate5, phần còn lại của Gate6/O6 và Gate7 vẫn mở. Không có APK, Hosting/index deploy hoặc thay đổi hai game nháp.


## Khắc phục bắt buộc-online — nghiệm thu 10/11/2026

Chủ dự án xác nhận online là phần bổ sung và giao sửa/deploy. Đây là phần khắc phục tiếp của kế hoạch hiện hành, không khởi động lại task ngoại hình hay BXH. Phạm vi nghiệm thu trước chưa bao phủ status có mạng nhưng Firebase lỗi, legacy pending và chạm giới hạn512 thao tác; không dùng kết quả cũ để khẳng định các ca đó đã đạt.

### Cách sửa và tương thích

- `requestLiveops`/`runLocalReward` hoàn tất status/điểm danh/nhiệm vụ/mở-bán-ghép/quay miễn phí-vé trên writer IndexedDB hiện hữu. Không chờ canonical replay hay hàng đợi giao dịch server. Status không thay đổi dữ liệu không ghi lại. Quà sự kiện đang đủ điều kiện và facts đã gán ngày được project/ACK cùng commit, không nhận lại khi reload.
- `appearance.spark.syncPolicy = snapshot-v1` là field bổ sung, giữ save envelope/version, key, catalog ID và API công khai. Journal v1 cũ vẫn đọc và giữ lịch sử tối đa512 entry; thao tác tiếp theo vẫn commit trạng thái/quà đầy đủ, lịch sử cũ được thu hồi hữu hạn. Không tạo ví hoặc writer thứ hai.
- Sao lưu tài khoản dùng snapshot đã lưu, cùng root CAS/owner/economy guard. Giữ rewardRevision online trước đó; không ghi liveops để phát lại phần thưởng. Legacy pending metadata không chặn backup hay quà local và không bị xóa giả là đã xử lý. Conflict vẫn giữ nguồn và không ghi đè phiên chơi. Đã thử với đúng Rules đang phát hành, nên không cần deploy Rules mới.
- Quảng cáo yêu cầu mạng/earned callback. Earned proof được giữ và áp dụng trên máy một lần, mất ACK không cấp lại. Proof lạ không che kho/chặn bán-mở quà; proof chưa xử lý không bị lượt quảng cáo sau ghi đè. Calendar server chỉ là tác vụ nền tùy chọn để gán kỳ raw facts/đổi kỳ; chính sách không cấp bù ngày cũ và không tự mở ngày mới bằng đồng hồ máy giữ nguyên.
- Bỏ các thử nghiệm giảm độ phức tạp Rules của chat này; không nới allow/deny hoặc deploy để né compile. Luồng phần thưởng mới không phụ thuộc RPC Commit liveops từng thao tác.

### Bằng chứng bản phát hành riêng

Snapshot `runtime/local-first-release` tách trước khi tích hợp BXH v4; các file owner đã đối chiếu SHA256 với source sửa, danh sách `runtime/qa/local-first-release-source.json`. Không build/deploy từ checkout gốc đang có chat BXH sửa song song. Rules trong snapshot được đọc từ release production `28a5e576-4e28-4213-b2cb-b972183e4861` để xác minh tương thích, không phát hành Rules này lại.

- 22/22 unit: local rewards/persistence/feedback, gồm516 giao dịch liên tục, lịch sử512, status không ghi lặp, fact ACK đúng một lần, callback quảng cáo lặp không cấp lại.
- `local-first-recovery.spec.js`:7/7 ca thật trên service+IndexedDB, gồm403/503, legacy pending, queue đầy, ba game offline và proof quảng cáo. `pair-rewards.spec.js`:5/5 giữ mốc thưởng/reload/chơi lại/rollback; các ca đã chạy trên snapshot.
- `events-festival.spec.js`:17 ca đạt ở lượt matrix đầu; ca thứ18 được cập nhật đúng policy local-first và chạy lại đạt. Phủ320/360/412/844/1024,5skin và chu kỳ owner/listener. Không giảm kiểm tra lỗi lưu máy: nếu request local thất bại, quyền nhận vẫn giữ và UI không báo đã nhận.
- `cosmetic-gameplay-offline.spec.js`:1/1 thắng đủ2wave, qua màn/resume và fact undated. `cosmetic-production-offline.spec.js`:1/1 worker production thật/cold boot offline/ảnh fallback; chặn HTTPS ngoài để không tạo dữ liệu Firebase thật.
- `check-local-first-backup-emulator.mjs`:PASS snapshot backup/restore, watermark online113 giữ nguyên khi local revision900, stale CAS/khác owner bị từ chối, mốc Memory giữ7. `local-first-account.spec.js`:1/1 Auth+Firestore+IndexedDB thật, syncNow thành công dù legacy pending và tiếp tục bán rương offline.
- `npm run check`:PASS; lỗi lần đầu chỉ do snapshot thiếu file Android strings.xml được test ID quảng cáo đọc, đã bổ sung file nguồn và chạy lại toàn check đạt. `npm run build`:PASS385modules,15.52s. Log trong `runtime/local-first-release/runtime/qa/local-first-check-final.log` và `local-first-build-final.log`.
- Diff riêng owner đã rà và `git diff --check` đạt. Không thay Rules/indexes/APK. Chưa kiểm quảng cáo trên Android vật lý; kiểm bridge earned/cleanup bằng24unit quảng cáo trong check. Không tuyên bố FPS/thiết bị thật.

### Phát hành đã xác minh

Ngày10/11/2026, chạy từ snapshot: `npx firebase deploy --only hosting:production --project memorymatchv1-1a --non-interactive` exit0;3292file,770file mới được tải, release complete. URL https://memorymatchv1-1a.web.app. Không gọi deploy Rules/indexes và không tạoAPK.

Đọc HTTPS lại index.html, sw.js, assets/achievementAnnouncements-BZwhvdva.js và assets/main-QEcga-Kr.js: HTTP200, SHA256 trùng toàn bộ artifact. Index hash `a3cdc6d06bb8e329defd4364d306d71d31918962c7d38923758baf5a0810f9ef`; chi tiết `runtime/qa/local-first-hosting-verified.json`. Người chơi còn mở tab/build cũ cần đóng/mở lại để worker chuyển sang build mới; worker không trộn các chunk giữa phiên chơi.

L1–L4 của nhánh khắc phục đã hoàn tất. Các gate ảnh/Android và BXH v4 của chat khác không được coi là hoàn tất hay đưa vào release này.

## 11/11/2026 — Nghiệm thu Cửa hàng/Bộ sưu tập4cột (kế hoạch mục15, S0–S5)

Phạm vi này hoàn tất; không đóng thay Gate5–7/bộ202hình thái hoặc task khác. Không deploy Hosting/Rules, APK, push hay commit. Không sửa master/prompt/journal/manifest của chat ảnh expedition; thay đổi có sẵn của các chat khác được giữ nguyên.

### Kết quả và kiến trúc

- Cửa hàng/Bộ sưu tập dùng4cột trên320/384/390/412/844×390/1024px, cả5skin và3trò. Card cố định vùng hình/tên/action, nút44px; tồn kho hỗ trợ ở góc, đơn vị gói và số giây độc lập. Không thêm tab Vật phẩm trong Bộ sưu tập; Kho lưu trữ và Trang trí hồ sơ giữ phạm vi riêng.
-94key/188WebP (1.964.664byte toàn bộ hai cỡ):8họ hỗ trợ,23đường nối,23xóa,9lật,11lưng,20theme. File lớn nhất128px=9152byte,256px=25022byte, đều dưới budget12/32KiB.6hỗ trợ reuse,2master hỗ trợ mới,78minh họa được chọn,7lưng reuse,1launcher reuse. Theme mặc định dùng app_icon_art.png của Android; ứng viên theme/default không export.10theme thiếu bộ thẻ giữ icon/trạng thái cũ theo quyết định chủ dự án.
-Phương án chọn: ảnh nội dung dùng chung qua catalogArt/model/manifest, DOM vẫn giữ số/giá/trạng thái thật. Loại phương án đổi icon toàn cục vì sẽ đổi cả điều hướng/thống kê; loại screenshot thuần làm preview cuối theo yêu cầu mỹ thuật mới. Capture renderer thật vẫn giữ làm tham chiếu. Không viết lại renderer hiệu ứng, giá, catalogID, public behavior hay schema save.
-HUD Memory/Link/Triple, quick assist, loot, hourly gifts và reward feedback cùng nguồn hỗ trợ. Vector fallback có opt-in để skin không đổi lại thành ảnh lỗi; mỗi ảnh chỉ fallback một lần, callback chỉ sửa chính node của nó. Loader chỉ chọn128px hoặc256px/DPR>3, không tải cả hai; không thêm preload toàn catalog, scheduler, ví hay đồng bộ mới.
-Toast tải skin ở giữa, sống tới khi tải xong; lựa chọn mới/đóng settings hủy toast cũ. Lucky Memory bỏ popup, giữ loot rơi và luồng nhận/lưu hiện hữu.
-Owner chính: js/catalogArt.js, js/catalogPresentationModel.js, styles/catalog-art.css; tích hợp shop/mainmenu/HUD/reward. Nguồn và tái tạo: design/shop-catalog/STATUS.md, inventory/capture-manifest/art-manifest và hai generator. Prototype QA cũ đã chuyển vào runtime/qa/shop-catalog/planning-source, không dùng làm bằng chứng bản tích hợp.

### Bằng chứng cuối

- node scripts/generate-shop-catalog-art.mjs --check: PASS94mapping, coverage và SHA256188export; unit catalog + ui-skin:9PASS.
- Playwright shop-catalog-layout:9/9PASS, runtime/qa/shop-catalog-layout-final.log. Mỗi viewport duyệt mọi tab/3trò/5skin/shop+collection;4cột, không overflow/clipping, chiều cao nút min=max44, không animation vô hạn. Kiểm0/1/99/9999, ảnh lỗi qua30skin switches và DPR4 chỉ dùng256px. 320px ban đầu lộ tên Mở rộng khay chật ở Storybook; nhãn rút thành Thêm ô, tooltip/ARIA giữ tên đầy đủ.
- shop-inventory:6/6PASS, runtime/qa/shop-catalog-purchases-final.log: mua từng gói3trò từ menu/trong ván, tiền/tồn kho đúng và bền sau reload.
- catalog preferences4PASS; lucky motion/reduced2PASS; skin loading toast6PASS (center, race/failure,30close cycles). Bằng chứng chung runtime/qa/shop-catalog-ui.log có lần đầu24/25 do lỗi320đã nêu; lần rerun layout cuối9/9 đã xử lý đúng nguyên nhân, không bỏ assertion.
- pair rewards5PASS; performance1PASS trong runtime/qa/shop-catalog-regression-final.log. Suite Triple tools cũ phát hiện3expectation không còn khớp source: Cài đặt đã ở header, đồng hồ cố định01:34, và đọc session trước bootstrap sau reload. Cập nhật assertion thành footer3nút + header Cài đặt; xác minh01:30/90giây cùng giao dịch; chờ session commit và selector sau reload. Rerun triple-connect.tools:10/10PASS, runtime/qa/shop-catalog-tools-final.log, gồm rollback, dùng hỗ trợ, tiếp tục ván và20restart/mode/orientation cycles.
- npm run check: PASS cuối, runtime/qa/shop-catalog-check-final.log. Theo xác nhận chủ dự án, kiểm frozenPairUnlockMs đổi800→600ms khớp thay đổi của chat khác. Hai lượt chạy đồng thời trước đó gặp CPU p95 Triple20.97/22.75ms; lượt cuối không chạy browser song song đạt, không đổi ngưỡng20ms hoặc thuật toán.
- Build sản phẩm: PASS, runtime/qa/shop-catalog-build.log, artifact runtime/qa/shop-catalog-release. Lệnh VITE_FIREBASE_DISABLED=1 node node_modules/vite/bin/vite.js build --base=/ --outDir runtime/qa/shop-catalog-release. Lượt npm chuyển tham số sai ban đầu đã chẩn đoán/chạy lại bằng Vite trực tiếp; không ghi đè dist.
- Worker production thật:1/1PASS trên artifact cuối, runtime/qa/shop-catalog-offline.log. Ảnh đã cache sống qua offline/reload; tab chưa cache fallback; vào màn chơi bình thường; online/reload ảnh phục hồi. Context riêng, không xóa save/cache người dùng. Cấu hình QA tại runtime/qa/shop-catalog-preview.config.js. Localhost bị môi trường chặn lúc đầu; đã chạy kiểm tra với quyền kết nối cục bộ phù hợp.
- Rà diff riêng sau implementation, git diff --check: PASS; đã đọc ảnh thật default/Storybook và contact sheet. Ảnh thật và metrics6viewport tại runtime/qa/shop-catalog/shipped/; không coi prototype là sản phẩm.

### Hiệu suất và giới hạn

Rerun HEAD de4068b so với hiện tại,30open/close mỗi skin: node201→170(default),196→169(Storybook); listener19/interval1/frame0/animation0 và owner node3 trước/sau không tăng. Median/p95 mở tab: default28.6/43.5→29.5/40.3ms; Storybook20.7/26.2→37.7/61.9ms trong mẫu browser cục bộ. Chi phí Storybook tăng với preview ảnh; vẫn dưới budget thao tác250ms của scenario, không có loop nền; không suy ra60FPS từ số đo này. Report thật runtime/qa/shop-catalog/performance.json. Không có thiết bịS22U vật lý; chưa chứng nhận frame/memory trên máy thật hoặc đóng gói Android trong lượt này.

## 11/11/2026 — Giftbox90% rương và nhãn cấp hồ sơ

Yêu cầu trực tiếp mới thay tỷ lệ giftbox20% trước đó trong thời gian thử:90% nhận1rương, C/Avatar/Khung/Huy hiệu đều22,5%.10%còn lại giữ tỷ lệ tương đối cũ:10vé2,5%;5Xu2,5%;10Xu2,5%;hỗ trợ2,5%. Cooldown thử10giây giữ nguyên. Chỉ đổi chọn candidate mới trong hourlyGift.js; không reroll candidate/receipt đã lưu, không đổi wallet/schema/validation/luồng đồng bộ. Rương tiếp tục vào state.chests.earned, không tự mở.

Rà luật nâng cấp: lần đầuLevel1, mỗi bản trùng+1, form1Level1–6, form2Level7–20, form3Level21/LevelMax; sauMax thành1mảnh đúng loại. cosmeticProgression và cosmeticArt đã dùng đúng luật, không sửa thuật toán. Chọn truyền cosmeticForm từ cùng hàm đang chọn ảnh sang presentation để gắn data-form cho nhãn; loại cách tự kiểm ngưỡng lần nữa trong CSS/UI vì dễ lệch luật. Nhãn form2 bạc-xanh, form3 vàng, giữ số cấp/LevelMax, không thêm tên phẩm chất mới hay animation/timer. Profile/API/save/catalogID vẫn tương thích; không sửa nguồn ảnh của agent khác.

Kiểm tra: node --test tests/unit/hourly-gift.test.js tests/unit/cosmetic-progression.test.js tests/unit/cosmetic-art.test.js tests/unit/cosmetic-rewards.test.js:22PASS. Quét10000điểm chọn cho đúng2250rương mỗi loại, kiểm ranh giới các quà còn lại; xác minh replay không cộng rương hai lần và receipt cũ vẫn đọc được. Log runtime/qa/giftbox-profile-unit.log.
Playwright cosmetic-forms + hourly-gift:12/12PASS, runtime/qa/giftbox-profile-ui.log, gồm profile320/412/1024, đúng form ảnh và tier nhãn1/2/3, ảnh thiếu fallback, giftbox/cooldown/retry/cleanup/chest presentation. Lưu ý UI giftbox dùng fixture dịch vụ; việc credit rương thật vào state và replay được xác minh ở unit Spark, không tuyên bố đã test cloud live. Đã xem ảnh profile thực tại runtime/qa/profile-compact-inventory.png.
Static JS/CSS ownership và git diff --check PASS. Giữ thay đổi dirty có sẵn của các chat khác; không chạy full check/build lại cho chỉnh nhỏ này, không deploy/Rules/APK/commit.

## 11/11/2026 — Hoàn tất Kho từng rương, mua ô và chỉnh profile (mục16)

Phạm vi theo yêu cầu trực tiếp và các quyết định bổ sung:5trang chính×24ô;8ô đầu miễn phí,112ô còn lại mua bất kỳ ô riêng1000Xu. Mỗi bản rương chiếm1ô; mảnh giữ theo loại. Chủ dự án chốt vẫn nhận đủ khi vượt ô; phần dư hiện trong Kho tạm, phân trang24món, chỉ xem. Khi có ô chính trống (mở/bán rương hoặc mua ô), rương dư tự chuyển vào ô chính theo projection counter hiện hữu. Thanh trang gọn/sticky ở đáy vùng kho. TabIDchests giữ nguyên.

### Logic và ownership

Chọn projection từ counter earned/spent cũ sang từng ô; loại phương án tạo ID/kho rương song song vì không cần thêm bản sao nguồn tài sản hoặc migration hàng nghìn bản. storageLayout chỉ materialize tối đa24ô của trang đang xem và24món dư, dù có hàng nghìn rương. Kho tạm không có API thao tác: command mới open/sell/fuse có storageAccessVersion bị kiểm tra số lượng trong ô chính tại model trước khi transition; command lưu cũ không có version tiếp tục tương thích. Dữ liệu mới duy nhất là trường tùy chọn spark.state.storageUnlocks={slots,sequence,last},112index hợp lệ8–119, save cũ đọc thành8ô free; không đổi formatVersion/IDcatalog/counter cũ. Vì counter không giữ ID/thời điểm từng rương, chuyển phần dư là projection xác định theo thứ tự loại rương hiện tại; không phát sinh ghi/receipt riêng.
Mua dùng unlockStorageSlot trong transitionSpark/localRewards, writer/journal/receipt/CAS hiện hữu, cùng transaction lưu tiền và ô. Policy1 giữ giá1000Xu khi retry; đã mua thì replay không trừ thêm, sai sequence/không đủ Xu/input hỏng không thay state. Không tạo ví hoặc đồng bộ thứ hai. Không thay Rules; luồng local-first snapshot-v1 vẫn dùng payload hiện hữu. Chưa kiểm thử cloud live cho trường mới, không tuyên bố đã deploy.

Theo chỉ dẫn tiếp theo, rương Mở/Bán trực tiếp đúng1mỗi lần, không slider hay batch/summary. Backend receipt cũ vẫn đọc được; slider bán mảnh/ghép giữ nguyên. Mở bên phải vàng, Bán bên trái xanh ngọc, Ghép tím. Ảnh rương đóng/mở tái sử dụng factory hiện có qua createWheelGiftArt; fragmentArt tách owner chung cho kho và reward feedback, không tạo bitmap mới.
Hiệu ứng sau commit: scale/opacity hữu hạn560ms, closed→open crossfade bắt đầu280ms/dài260ms; quà rơi/thu bằng rewardFeedback sẵn có, tối đa32hạtXu/12vật phẩm theo giới hạn dùng chung. Hình quà theo kết quả đã nhận: tiền/hỗ trợ/ngoại hình đúngLevel/mảnh sauMax. Owner popup hủy animation, owner trang kho giữ/dọn loot; đổi tài khoản dispose grid để không để hiệu ứng hồ sơ cũ lại. Reduced-motion nhận thông báo tĩnh. Lỗi lưu không có âm/ảnh mở; lỗi trình bày sau commit báo đã nhận, không nói rương còn nguyên hoặc cấp lại.

Popup mua ô ghi Mở rộng thêm ô lưu trữ; dòng giá riêng1.000Xu. Hủy–Mua96×44px, gap10px, căn giữa, cùng nút nổi/secondary của cửa hàng. Toast−1.000Xu chỉ xuất hiện nếu receipt có khoản trừ thật; opt-in floating trong showAppToast giữ lifecycle/timer/WeakMap cũ, width:max-content, translateY/opacity1400ms rồi cleanup. Không thêm timer/RAF song song; toast loading và duration0 không thay. Reduced-motion không bay.
Tab Shop/Collection đổi padding-top14→4px (đo cả5skin/3game). Profile bỏ tick, giữ viền/aria-pressed, chuyển khóa20px vàLevel sang cùng góc trên phải4px; padding đầu26px bảo toàn vùng ảnh/tên. Không đổi logic chọn/trang bị hay Level7/21, ảnh/art journal của chat khác.

### Bằng chứng cuối và giới hạn

-27/27unit: storage-capacity, chest-presentation, cosmetic-progression/art/rewards, hourly-gift. runtime/qa/storage-profile-unit.log. Có boundary cũ/8free/3page,10000rương vẫn bounded, receipt/replay/giá/validation, các nhánh quà vàMax→mảnh.
-36/36UI: cosmetic-storage + cosmetic-forms + skin-loading-toast + catalog-tabs-compact. runtime/qa/storage-profile-final.log. Kho320/384/412/844ngang/1024,5skin nút/tab/popup; profile320/412/1024; khóa/Level không che tên, không tick; Hủy–Mua cân bằng, toast<160px/bay lên/cleanup; mua/hủy/thiếu tiền, rollback IDB, dùng qua restart, hiệu ứng sau commit/double-click/đóng/owner/offline/reduced-motion/lỗi hình/âm thanh.
-1/1production worker offline: runtime/qa/storage-profile-offline.log, artifact runtime/qa/storage-v2-release và cấu hình runtime/qa/storage-v2-preview.config.js. Profile riêng được seed3000Xu+2rươngC; mua2ô, tải lại offline vẫn giữ; mở1rươngC, reload còn1; bán1C cộng58Xu, reload còn0;14ô khóa trong trang1 còn đúng. Không xóa cache/save người dùng, không tài khoản cloud thật.
-Build web cuối PASS: runtime/qa/storage-profile-build.log. VITE_FIREBASE_DISABLED=1 node node_modules/vite/bin/vite.js build --base=/ --outDir runtime/qa/storage-v2-release. Không ghi đè dist, không Hosting/APK.
-Full npm run check của phase logic PASS: runtime/qa/storage-single-check.log (trước các chỉnh cuối thuần UI popup/toast/profile). Static JS/CSS và diff cuối được chạy lại; runtime/qa/storage-profile-static.log và git diff --check. Không nhận full-suite UI đã pass.
-20lần bán từng rương/đóng popup: forced-GC DOM7384→7384, JS listeners172→172 trong một browser sample; runtime/qa/cosmetic-upgrade/storage-controls-resources.json. Xem ảnh thật profile tại runtime/qa/profile-compact-inventory.png, rơiXu tại runtime/qa/storage-single-loot.png. Không suy ra60FPS hoặc chứng nhậnS22U thật.
-Lượt exploratory reward-audio của Kho báu bản đồ (khác Kho lưu trữ):1/3case được chọn pass,2fail tại click[data-chest=1] và expectation treasure-error (fixture999hỗ trợ chưa đạt cap9999 của HEAD). Giữ nguyên task/module Kho báu của chat khác, không làm yếu test. Log runtime/qa/storage-single-regression.log. Kiểm âm thanh trực tiếp của Kho lưu trữ đã tách và đạt, gồm failed commit không phát cue.

Đã rà diff riêng sau implementation, không hoàn nguyên thay đổi dirty khác, không sửa master/prompt/journal/manifest expedition. Tình trạng bộ202hình thái không được đóng thay. Không deploy/Rules/APK/push/commit. Phần mục16 và các chỉnh UI nêu trên đã hoàn tất.

### Bổ sung 16/11/2026 — Kho tạm chỉ xem, 5 trang chính

Quyết định mới thay trạng thái3trang/64ô và “Dư có thao tác” trong ghi chú11/11:5trang×24ô=120;8ô đầu miễn phí,112ô còn lại mua từng ô1000Xu. Giữ counter earned/spent làm nguồn tài sản. Phần vượt 120 ô mở hoặc vượt số ô đã mua được chiếu vào Kho tạm phân trang24 món, không thao tác. Khi mở/bán rương trong kho chính hoặc mua ô, projection tự đẩy món kế tiếp vào ô trống; không ghi asset copy, ID rương mới hoặc receipt promotion. Nếu mọi ô đã mở mà vẫn dư, Kho tạm vẫn giữ và tự chuyển khi có lần mở/bán tạo chỗ.

Model thêm `storageAvailableQuantity`/`assertStorageAccess`: thao tác mới có `storageAccessVersion=1` chỉ tiêu tài sản trong ô chính; lệnh mở/bán/ghép cũ không có version vẫn giữ tương thích replay. `storagePresentation` không render action mở/bán/ghép ở món tạm và đưa tới mở rộng kho. Local rewards gắn version trước khi commit trong persistence/outbox hiện hành. Không đổi save format version, counter rương, catalog ID, journal owner hoặc Firebase Rules.

Nghiệm thu lại sau thay đổi: `node --test tests/unit/storage-capacity.test.js tests/unit/local-rewards.test.js tests/unit/liveops-spark.test.js` —32/32 PASS (gồm rương offline bền candidate/receipt, fusion chỉ khi mảnh đã nằm ô chính, chặn dùng kho tạm và tự chiếu sau khi rương chính được mở). `npx playwright test tests/ui/cosmetic-storage.spec.js --project=desktop --reporter=list` —27/27 PASS, gồm320/384/412/844 ngang/1024,5skin, mua slot và toast, một rương/lần, animation interrupt/reduced-motion, kho tạm chỉ xem, chuyển sau mua ô và sau mở rương. Lệnh chạy trên cổng4175 sau warmup; một lần chạy đầu ở cổng4173 timeout khi dev server cold-transform, không sửa timeout/assertions để pass.

`GAME_SHELL_TEST_SERVER=preview` cùng `tests/ui/storage-capacity-offline.spec.js` và `tests/ui/cosmetic-production-offline.spec.js` —2/2 PASS: mua ô được giữ qua offline restart, trừ Xu đúng một lần; production shell cold boot offline, chạy ván với fallback theme uncached. `npm run check` PASS; `npm run build` PASS (Vite còn cảnh báo chunk `main`542.48KB vượt500KB, không phát sinh từ riêng thay đổi Kho tạm). `node --check` bốn module runtime và `git diff --check` PASS. Không deploy Hosting/Rules, không tạo APK/commit. Không dùng bằng chứng này để đóng Gate tích hợp nghệ thuật/Gate tổng thể; xem trạng thái trên đầu kế hoạch hiện hành và báo cáo nhận nghiệm thu.

### Bổ sung 16/11/2026 — Phục hồi xác nhận snapshot và nghiệm thu offline

Trong ma trận emulator O6, account snapshot có thể đã commit trên cloud nhưng client mất phản hồi; local journal/outbox chưa được xóa. Khi một raw reward fact mới xuất hiện rồi retry, CAS cũ có thể conflict dai dẳng. Đã sửa bằng intent bền trong sync metadata trước CAS, nhận diện commit đã xảy ra qua revision/fingerprint/player/economy revision, ACK đúng các operation ID đã nằm trong snapshot, và giữ/rebase operation mới đến trong lúc upload. Snapshot cloud không mang marker offline; journal mới vẫn ở local outbox tới khi được xác nhận. Sau reload, bind account phát hiện intent chờ và chủ động reconcile. Raw fact chưa có ngày được bind vào ngày máy chủ xác nhận khi đồng bộ lại online; không cấp bù ngày máy cũ. Không tạo ví/queue song song, không đổi save format hoặc Rules.

Rà riêng diff các owner persistence/account/cloud/liveops và test mới: intent được kiểm tra UID/profile/environment/version/fingerprint; ACK đi qua writer hiện hữu, kiểm revision và ownership; lọc chính xác operation đã publish, giữ operation đến sau snapshot và không xóa journal nếu còn pending. Nhánh mất phản hồi phân biệt root đã nhận, chưa nhận, và root đã tiến bởi giao dịch khác. Retry cùng fingerprint/revision kinh tế coi snapshot đã có là idempotent. Không thấy thay đổi Rules hoặc format save trong diff đã review. Đây là review cùng lượt, chưa phải reviewer độc lập theo tiêu chí O6.

Bằng chứng cập nhật: `npm run check` PASS sau sửa; `npm run build` PASS, Vite cảnh báo chunk main 545.90KB (>500KB). Emulator Firestore/Auth: local-first account 1/1; offline/online bình thường 1/1; mất phản hồi sau commit và reload 1/1; server faults/quyền/từ chối/giờ tương lai 4/4; hai thiết bị cùng UID 1/1. Các test xác nhận receipt không cấp/trừ lại, ACK dọn đúng outbox, raw fact settlement, giao dịch ngoại hình/quà vẫn chơi được khi lỗi mạng. UI âm thanh 29 PASS/2 SKIP; hai ca SKIP do guard có sẵn trong suite, không tính là pass. Manifest xác nhận 202/202 form sẵn sàng; browser decode 202 chân dung, tối đa3 lớp, không DOM tồn dư; kiểm kích thước profile320/412/1024. Không kiểm trên thiết bị Android thật hoặc đo FPS/heap vật lý.

Gate O6 vẫn để mở do còn thiếu reviewer độc lập và kiểm chứng Android/performance vật lý; Gate 6/Gate 7 cũng chưa được đóng chỉ dựa trên build/emulator. Bản ghi 11/11 về timeout và audio là lịch sử trước sửa; kết quả ngày16/11 ở trên thay trạng thái hiện tại cho các ca đã chạy lại. Không deploy Rules/Hosting, không tạo APK, không commit.
