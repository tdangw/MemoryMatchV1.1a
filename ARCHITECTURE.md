# ARCHITECTURE — Kiến trúc V1.1a

Tài liệu này chỉ mô tả ranh giới module, quyền sở hữu dữ liệu và các hợp đồng kỹ thuật bền vững. Quy tắc gameplay chi tiết không lặp lại ở đây.

## 1. Tổng thể

```text
index.html (loading)
   ↓
js/bootstrap.js → js/main.js ── cấu hình callback giữa menu, controller và UI
   ├── Memory Match modules
   ├── Link Connect modules
   ├── Shared UI / shop / sound / persistence
   └── public/assets

Vite ──→ dist ──→ Web/PWA hoặc Capacitor Android
```

Game Shell đã ổn định. `js/gameShell/` sở hữu config, sáu vùng semantic, HUD patch, phép đo layout, lifecycle và registry hiệu ứng. Shell của từng game nối vào contract chung; controller và renderer riêng vẫn sở hữu luật, tile và đường nối. Không còn adapter legacy. Contract đang hoạt động được kiểm bằng `scripts/check-game-shell-contract.mjs` và UI audit; tài liệu phase lịch sử đã được xóa để tránh dùng nhầm làm kế hoạch hiện hành.

`scripts/generate-game-shell-tokens.mjs` sinh `styles/game-shell/tokens.css` từ cấu hình dùng chung; sửa nguồn JavaScript rồi chạy `npm run shell:sync`, không sửa file sinh bằng tay. `ADD_GAME.md` là checklist để tích hợp trò tiếp theo; tài liệu này không cho phép tự động triển khai Triple Connect.

- Ứng dụng dùng HTML/CSS và JavaScript ES modules, không có framework UI.
- `js/bootstrap.js` sở hữu lần khởi động tài liệu duy nhất và import main bất đồng bộ. `js/main.js` export initializeApplication để hydrate/nối callback, không tự gọi lần hai; module chức năng không tự bootstrap ứng dụng.
- Các controller phụ thuộc module dùng chung, nhưng không import lẫn nhau. Callback `configure*` nối các luồng cần điều hướng chéo.
- Firebase Auth, Firestore và Analytics hỗ trợ tài khoản, backup theo sự kiện, bảng xếp hạng và thống kê; Hosting là đích phát hành riêng. Gameplay/local save tiếp tục hoạt động theo persistence khi offline.

## 2. Phân lớp và quyền sở hữu

### Lớp dùng chung

| Module | Trách nhiệm |
| --- | --- |
| `main.js` | Hydrate dữ liệu, khởi tạo dịch vụ và nối callback giữa các khu vực. |
| `gameCatalog.js` | Danh mục game/mode và mapping namespace tiến trình. |
| `gameState.js` | Trạng thái runtime dùng chung và chuẩn hóa dữ liệu đã lưu; không thao tác DOM hoặc `localStorage`. |
| `sessionProgress.js` | Đọc, ghi và xóa phiên theo game/mode. |
| `sessionTiming.js` | Giải quyết thời gian cho màn mới, chơi lại, khôi phục và chuyển màn. |
| `persistence.js`, `chapterStore.js` | Facade dữ liệu có phiên bản và backend IndexedDB theo profile/chặng; migration/fallback theo contract mục3. |
| `gameplayTuning.js` | Giới hạn và nhịp gameplay dùng chung. |
| `motion.js` | Tiện ích thời lượng CSS, tùy chọn giảm chuyển động và phép tính FLIP dùng chung. |
| `coinRewards.js` | Quy tắc Xu theo cặp và hoạt ảnh bộ đếm/thu thập dùng chung. |
| `lootEffects.js` | Hiệu ứng vật phẩm rơi và bay tới HUD dùng chung, không chứa luật thưởng. |
| `gameShell/*` | Contract shell, config, HUD patch, layout, lifecycle và registry hiệu ứng dùng chung. Không chứa luật game. |
| `ui.js`, `modal.js`, `uiCatalog.js` | HUD, popup gameplay, modal, toast, copy và thời lượng UI chung. |
| `gameSelector.js`, `mainmenu.js`, `gameMenu.js` | Chọn trò, menu chính và menu trong màn. |
| `shop.js`, `shopCatalog.js` | Giao diện mua và catalog/giá sản phẩm. |
| `appearance.js`, `themeCatalog.js` | Quyền sở hữu/trang bị ngoại hình và dữ liệu chủ đề. |
| `sound.js`, `backgroundEffects.js` | Âm thanh và hiệu ứng nền theo cài đặt/vòng đời trang. |
| `appNavigation.js`, `appPageLifecycle.js` | Một page owner, tối đa một screen chức năng con, giữ map/scroll khi đổi tab; gameplay không có dock. |
| `leaderboardPanel.js`, `leaderboardStore.js`, `leaderboardService.js` | Dropdown game/family, query/cache/max-level-only và outbox v3 theo UID; model thuộc progressRankingModel, board ID/adapter thuộc rankingResult/rankingRules. |
| `profileStatsService.js`, `profileStatsModel.js`, `profileStatsStore.js` | Thời gian chơi private theo UID, nguồn clock playMetrics, metadata replica monotonic và transaction cộng tổng; Auth sở hữu ngày tạo tài khoản. |
| `victoryCelebration.js`, `victoryFlowerScene.js` | Cảnh hoa SVG hiện hữu, animation hữu hạn và scope/audio cleanup; không sở hữu luật hoàn thành chặng. |

Game Shell giữ đủ sáu region công khai: `title`, `progress`, `hud`, `milestones`, `frame`, `board`. `progress` là placeholder tương thích rỗng, luôn ẩn; metric thật thuộc `refs.hud`, còn Xu/mốc/sao màn thuộc `refs.milestones`. `gameHudMenus.js` sở hữu menu công cụ, ARIA, Escape/click ngoài và cleanup theo scope mount. `gameExitDialog.js` sở hữu popup Tạm dừng; controller cung cấp Thoát/Chơi lại/Cài đặt và pause/resume. Startup khóa HUD đến khi readiness hoàn tất, tránh round initialization ghi đè pause. `styles/game-shell/hud-unified.css` sở hữu geometry và presentation thanh HUD (một hàng; portrait≤480px dùng chữ/nút gọn hơn theo phản hồi19/10); CSS game chỉ giữ trạng thái có ngữ nghĩa và phần board/milestone đặc thù.

### Memory Match
| Module | Trách nhiệm |
| --- | --- |
| `config.js` | Cấu hình mode, điểm, sao, thời gian, preview và phần thưởng may mắn. |
| `gameController.js` | Vòng đời level, timer, preview, kết thúc và điều hướng. |
| `logic.js` | Adapter `handleTileClick`, điều phối lượt/transaction và presentation; quyết định dùng model thẻ, không đọc class/dataset để xác định ghép. |
| `memoryMatch/memoryBoard.js` | Model theo ID của đúng một round: image identity, matched và selection; quyết định thuần và tile snapshot giữ nguyên wire format. Không giữ DOM/timer hoặc kho thứ hai. Grid mount từ thẻ đã sinh/restore; cleanup giải phóng model. |
| `grid.js` | Tạo/render board và thao tác thẻ. |
| `memoryItems.js` | Catalog, màu cấp và số lượng kho Xem trước/Thời gian. |
| `memorySession.js` | Snapshot phiên Memory Match dùng chung cho controller, kho và phần thưởng. |
| `memoryPreview.js` | Hiệu ứng xem trước 4/8/12/tất cả dùng chung cho kho và phần thưởng. |
| `memorySpecial.js` | Năng lượng, vòng 10 mốc và phần thưởng từ cặp đặc biệt. |

### Link Connect

| Module | Trách nhiệm |
| --- | --- |
| `linkConfig.js` | Toàn bộ cấu hình mode, dịch chuyển, combo, thẻ cao cấp, băng, năng lượng, mốc thưởng và thời lượng hiệu ứng. |
| `linkState.js` | Trạng thái runtime riêng của Link Connect. |
| `linkController.js` | Vòng đời level, xử lý chọn cặp, timer, combo, thưởng, vật phẩm và chống kẹt. |
| `linkTurn.js` | Quyết định eligibility/chọn/bỏ chọn/sai/đúng từ vị trí và board; controller giữ ownership mutation, commit, timing và recovery. |
| `linkBoard.js` | Tạo board, xóa cặp, xáo, băng và các phép dịch chuyển dữ liệu. |
| `pathfinder.js` | Tìm đường trực giao tối đa hai lần rẽ; truy vấn boolean/cặp đầu dừng sớm và full listing giữ cùng thứ tự. FIFO dùng head index, route dựng từ predecessor sau khi tìm thấy; không cache bàn. |
| `linkRenderer.js` | Patch DOM theo `instanceId`, vẽ đường nối và chạy hiệu ứng thẻ/phần thưởng/dịch chuyển. |
| `linkItems.js` | Catalog và số lượng vật phẩm riêng của Link Connect. |
| `linkEffects.js` | Catalog hiệu ứng đường nối và xóa thẻ. |
| `linkPerformance.js` | Đo số ô được patch và thời gian render trong chế độ debug. |

## 3. Trạng thái và lưu trữ

- Profile tracking riêng trong IndexedDB metadata, không nhập vào snapshot gameplay hoặc record ranking public. Clock checkpoint30s/pause/finish tạo delta; metadata counter atomically increment, guest adoption+marker cùng transaction và không đổi owner đã nhận. Cloud `gamespaces/{space}/profileStats/{uid}` dùng counter monotonic theo installation/UID (tối đa128), tổng bằng delta so với counter đã nhận; replay/stale không tăng lặp. Acknowledge phần counter server thực sự chứa, không gắn kết quả vào UID mới khi async cũ về. Quyền đọc owner hoặc trusted claim `admin`, list admin có limit≤100, client không xóa dữ liệu. Timestamp Tham gia đọc Auth creationTime; admin dashboard tương lai đọc Auth Admin metadata, không tin client timestamp trong stats. Nguồn tổng cũ thiếu được tính từ ngày bật tracking, không suy từ kỷ lục. Hard-kill có thể mất ≤30s chưa checkpoint cộng latency write; pause/pagehide flush không phải bảo đảm commit khi process bị kill.

- `gameState` giữ Xu, cài đặt, ngoại hình và namespace tiến trình `memoryMatch`/`linkConnect`/`tripleConnect`; lịch sử chỉ hydrate các chặng cần dùng.
- Persistence có một owner trong `persistence.js`; `chapterStore.js` sở hữu IndexedDB `memoryMatchAdventure` với transaction profile + chapter. `formatVersion=2`, revision tăng sau durability; các caller phải await boolean kết quả. Migration từ nguồn v1 giữ bản phục hồi, không tự reset hoặc ghi đè bản hỏng/version lạ. localStorage là fallback khai báo rõ cho trình duyệt chưa dùng backend mới; marker primary ngăn đọc/ghi bản v1 cũ khi IndexedDB không khả dụng.
- Giao dịch nhiều miền có một snapshot/transaction; thất bại hoàn tác và chặn các snapshot xếp hàng phụ thuộc, dùng recovery toàn cục để tải lại nguồn đã commit. Cleanup/lifecycle vẫn đồng bộ; snapshot ghi bất đồng bộ không trì hoãn invalidate/cleanup hoặc điều hướng.
- `sessionsByMode` lưu phiên độc lập theo từng mode, gồm level, thời gian còn lại, giới hạn và thời gian đầu màn. Mỗi trò lưu riêng tiến trình năng lượng/chuỗi không-rơi; Link Connect lưu thêm quy tắc dịch chuyển.
- Sự kiện `storage` phát hiện revision mới từ tab khác. Tab cũ không được ghi đè; dữ liệu chỉ tự hydrate khi không có bàn đang chơi.
- Vật phẩm mỗi trò nằm trong namespace `progress.<game>.items`; không dùng chung tồn kho giữa các trò.
- Dữ liệu đọc từ storage phải được chuẩn hóa trước khi gán vào runtime. Giá trị âm, sai kiểu hoặc vượt giới hạn không được đi thẳng vào gameplay.
- `roundId` là mã phiên runtime: callback bất đồng bộ phải kiểm tra đúng round và đúng board trước khi sửa trạng thái hoặc DOM.
- `adventureProgress.js` sở hữu mở khóa tuần tự/completion/chặng/rương; `adventureLaunch.js` tải kỷ lục canonical trước replay và giữ cache giới hạn. `adventureRewards.js` sở hữu catalog grant có type và claim một lần, commit cùng wallet.
- `playMetrics.js` đo thời gian thực theo ready/pause/modal/visibility/outcome, không có loop đo hoặc ghi theo frame. `rankingRules.js` sở hữu comparator và adapter lịch sử v1/v2; tiến độ hiện hành v3 dùng màn đã thắng, special new/replay từ1 và resume giữ run. Settlement thắng commit cùng checkpoint trước publish; finalize không gửi màn dở. `runBestsV2` và adapter checkpoint cũ giữ để phục hồi lịch sử; special cũ không được chứng nhận thành v3.

## 4. Luồng render và hiệu ứng

- Memory Match dùng board riêng trong `grid.js`; Link Connect dùng renderer riêng vì cần đường nối, dịch chuyển và tái sử dụng tile.
- Link Connect định danh mỗi tile bằng `instanceId`. Patch chỉ cập nhật ô thay đổi; dịch chuyển dùng FLIP/Web Animations thay vì dựng lại toàn bàn.
- Timing của một lượt FLIP được đọc một lần rồi dùng cho toàn bộ thẻ; board chặn thao tác đến khi vị trí hiển thị ổn định.
- Canvas chỉ dùng cho hiệu ứng cần vẽ theo khung hình như Sấm sét hoặc mảnh vỡ. Mật độ canvas được giới hạn theo `devicePixelRatio`.
- Hiệu ứng DOM tạm chỉ thay đổi `transform`/`opacity`, tự xóa khi kết thúc và tôn trọng `prefers-reduced-motion`.
- Hiệu ứng tạm và animation còn chạy phải được dọn khi bắt đầu round mới hoặc rời màn.
- Triple giữ reducer/events/worker/ghost preview hiện hữu. Presentation đã commit không rollback vì lỗi visual; cleanup idempotent chạy cả failure/cancel, milestone promise settle khi owner bị hủy. Callback đã supersede không hủy đường nối mới hoặc render lại scope đã dispose.
- Trong lúc xáo, board chặn tương tác đến khi hoạt ảnh ổn định. Hiệu ứng thu thập không khóa gameplay.

## 5. Vòng đời bất đồng bộ

- Controller dừng timer cũ trước khi tạo level hoặc rời màn.
- Timeout, animation callback và reward chain không được tác động một round/board mới.
- Scheduler tương thích của Game Shell đăng ký timer/RAF vào scope hiện hành; module ngoài màn chơi dùng scheduler trình duyệt. Listener toàn ứng dụng vẫn là singleton. Modal bị thay cùng ID hoặc hủy theo scope phải dọn listener, node và lịch đóng; không gọi callback tiếp tục của game cũ.
- Khi tab bị ẩn, timer gameplay tạm dừng và âm thanh dừng. Khi quay lại, chỉ khôi phục trạng thái vốn đang chạy.
- Controller checkpoint thời gian theo nhịp cấu hình và khi trang bị ẩn/rời; `sessionTiming.js` là nguồn luật duy nhất để phân biệt màn mới, chơi lại và khôi phục.
- Dữ liệu gameplay được cập nhật trước UI; hiệu ứng chỉ biểu diễn kết quả, không phải nguồn sự thật.
- Modal sở hữu một submission/busy boundary cho footer và custom content actions; picker vật phẩm Memory tái dùng boundary này. Result stale không cập nhật round mới. Hint Memory khóa transaction đang chờ nhưng không dừng đồng hồ.
- Freeze Link đưa thời lượng sắp cấp vào snapshot trong đúng commit trừ kho, rồi bắt đầu hiệu ứng theo boundary cũ. Undo Triple dùng transaction kho/session đã có với snapshot reducer tiếp theo; checkpoint sau đó vẫn giữ vì clock/metrics có thể khác. Không đổi key/schema hoặc thêm lịch sử vật phẩm. Link kiểm eligibility Sấm sét trước consume; không có cặp hợp lệ thì giữ kho theo quyết định19/10, không tiêu thụ RNG. Phân phối/số mục tiêu và timeline của lượt hợp lệ giữ nguyên.

## 6. Tài nguyên và build

- Asset runtime nằm trong `public/assets/`; Vite copy sang `dist/assets/`.
- `themeCatalog.js` giữ metadata. `scripts/generate-theme-manifest.mjs` quét WebP và sinh manifest; mã gameplay không giữ danh sách tên ảnh thủ công.
- JavaScript tạo URL asset bằng `import.meta.env.BASE_URL`; CSS để Vite viết lại URL theo build target.
- `vite.config.js` chọn wrapper web/Android qua alias `victory-presentation`; cả hai dùng scene SVG nguyên bản do `victoryCelebration.js` sở hữu. Ba nhóm animation hữu hạn, audio/listener/timer cleanup theo game/page scope; `touchDust.js` giới hạn tổng24 hạt, không loop mới.
- Service worker/PWA nằm trong `js/pwa.js` và `public/sw.js`; Capacitor dùng cùng đầu ra web qua profile Android.
- Service worker chỉ cache phản hồi đầy đủ HTTP `200` và bỏ qua request `Range` để không làm lỗi audio tải từng đoạn.
- Service worker gộp yêu cầu cùng URL và giới hạn số lượt tải tài nguyên đồng thời; catalog chủ đề không tạo hoặc giải mã toàn bộ ảnh.
- Production build dùng để phát hiện lỗi đóng gói và đo kích thước gzip tại mốc lớn hoặc trước phát hành. Trong phát triển thường ngày, chạy check/test đúng phạm vi thay đổi; không lặp build hoặc toàn bộ UI suite nếu thay đổi không chạm đường build.
- `dist/`, báo cáo Playwright, `node_modules/` và manifest sinh là đầu ra có thể tái tạo và đã được Git ignore.

## 7. Nguồn cấu hình

Quảng cáo Android nằm trong `js/ads/`: cấu hình ứng dụng và banner ở `adConfig.js`; `menuAds.js` nhận màn hình đang hiển thị và trạng thái ứng dụng; `bannerController.js` quản lý duy nhất một banner, gỡ quảng cáo trước khi chuyển sang màn không được phép hiển thị. `adService.js` xử lý lựa chọn quyền riêng tư trước khi tải quảng cáo. Hai thao tác tạo/hủy qua `BannerBridgePlugin.java` được thực hiện theo thứ tự trên giao diện Android để không giữ banner cũ khi chuyển màn nhanh. Web không tải bộ kết nối quảng cáo Android; `webBannerController.js` sở hữu một DOM banner artwork, cao50px với gap8px qua render chung, dùng cùng blocker/navigation/background/focus lifecycle. Service web vẫn unsupported, không xin consent, tải quảng cáo hay cấp thưởng. Placement Android hiện hành là mọi tab, gameplay native tắt; web thêm gameplay với reserve58px ở gameShellLayout và scrollheight trừ58px. Artwork web ở bannerArtwork.js/styles/ad-banner.css, một cảnh finite6s và animationend đổi cảnh, không RAF/timer; reduced-motion đứng yên, clear/dispose tháo listener trước DOM; slot screen thuộc viewScope riêng. Screen content không suspend banner; overlay thực vẫn suspend đến destroy. Quyền riêng tư trong trò chơi và trang website cùng lấy nội dung từ `js/privacyContent.js`; `scripts/generate-privacy-page.mjs` tạo trang tĩnh trong lần build. Không đổi dữ liệu lưu, tài khoản, luật chơi hoặc phần thưởng.

| Nội dung | Nguồn |
| --- | --- |
| Memory Match | `js/config.js` |
| Link Connect | `js/linkConnect/linkConfig.js` |
| Giới hạn/thời lượng dùng chung | `js/gameplayTuning.js` |
| Giá và gói mua | `js/shopCatalog.js` |
| Game/mode/namespace | `js/gameCatalog.js` |
| Chủ đề | `js/themeCatalog.js`, manifest sinh tự động và `themes.md` |
| Phiên bản hiển thị | `js/appMeta.js` |

Không sao chép các con số cấu hình sang controller, renderer hoặc tài liệu kiến trúc. Khi tài liệu cần mô tả hành vi, ưu tiên nêu quy tắc và dẫn về nguồn cấu hình.

Gợi ý Memory dùng `progress.memoryMatch.items.hint`; `gameState.hints` là getter/setter tương thích để HUD, thưởng và thao tác cùng đọc/ghi một kho. Hydration nhập giá trị cao nhất từ các session cũ khi chưa có key kho; giá trị 0 là dữ liệu hợp lệ, không cấp lại. Session mới không ghi Gợi ý và resume không áp số cũ. Kho Link (`progress.linkConnect.items.hint`) giữ nguyên, độc lập với Memory. Cả hai shop cho mua ở menu và trong game.

`memoryMatch/memoryShellDom.js` sở hữu markup Memory, được import đầu tiên trong `main.js`; `memoryShell.js` nối vùng semantic/HUD với core chung. ID Memory vẫn là hook gameplay/CSS đang dùng. `index.html` giữ settings/audio, không còn bản markup Memory trùng.

`linkConnect/linkShell.js` sở hữu markup/vùng semantic/HUD/timing presentation của Link. Controller mount shell và cung cấp callback cho `bindLinkControls`; listener gắn scope theo lượt, node dựng một lần. Hai adapter legacy đã xóa. Renderer vẫn quản lý tile/path/shift/băng/hiệu ứng; shell không sở hữu board gameplay.

`check-game-shell-contract.mjs` khóa import/ownership và contract sáu vùng semantic. UI audit kiểm ID trùng, `aria-controls`, geometry toolbar và tương tác giữa các nút con. Toolbar Memory ngang dùng token `hud.landscapeMinWidth`; thay đổi shared shell phải chạy lại contract và audit liên quan.

## Tài khoản và dữ liệu online

chapterStore/persistence sở hữu profile và các chapter IndexedDB; migration v1→v2 giữ nguồn cũ. Import profile, chapter, identity và backup là một transaction; profileOperations giữ khóa đến khi hydrate RAM hoàn tất. profile-owner/firstUid là metadata máy, không đưa vào cloud profile.

accountService sở hữu Auth listener, lịch sync và UID/generation guard. cloudSnapshot mã hóa từng profile/chapter thành chunk có hash; cloudStore stage chunk rồi CAS root manifest, GC theo root đang dùng và stage identity. Bản commit lên máy chủ gần nhất thắng, không cộng gộp Xu/vật phẩm. cloudSaveEvents phân biệt thành tích/tài nguyên với checkpoint và cache chặng; event counter bền vững giữ retry sau reload. Cloud listener được hủy khi đổi UID và chỉ áp dụng snapshot mới tại menu. Môi trường production/beta/test/local có namespace riêng.

playMetrics/rankingRules chụp owner khi bắt đầu attempt/run. Model progressRankingModel sở hữu v3 run và levelBestsV3 nhỏ theo game/family; Hành trình lấy max màn thắng thường, special chỉ chứng nhận run từ1. bestByLevel/runBests v1/v2 vẫn là lịch sử điểm/sao. chapterStore chuyển Hành trình theo batch20 chapter, marker và summary cùng transaction; ordinary save không được làm lùi marker hoặc max-level cùng owner. Collector chỉ nhận ba family đúng slot game. leaderboardService phục hồi từ durable summary, outbox/receipt namespace ranking:v3 tách UID/profile; adoption firstUid nguyên tử, queue tối đa9, validate canonical key/owner và khôi phục queue hỏng từ summary. Pending send không mất wakeup khi có best mới hoặc đổi UID; backoff cũ bị hủy khi đổi UID. leaderboardStore conditional higher-only, sort levelReached DESC/reachedAt ASC/UID ASC, query11/render10+own, cache12 bảng×5 trang/100 cursor/120s, refresh15s. reachedAt là server acceptance time, không phải thời điểm thắng offline. Rules v3 không chứa save/email/credential; bảng v1/v2 được giữ tương thích.

Analytics chỉ chạy production, gửi active_play_time theo segment của active clock khi pause/end; không có timer ghi mỗi giây. Auth UID làm pseudonymous userId. Không sử dụng Firestore cho DAU/WAU/MAU; tổng thời gian chơi riêng trong profile dùng profileStats counters theo sự kiện, chỉ owner/admin đọc. Các thống kê/dashboard thực và OAuth hosted cần xác minh trước phát hành.

Bản đồ: adventureMap sở hữu preview màn với bốn độ khó và hai lối vào Thử thách/Vô tận cố định; adapter cung cấp goal/preview/launch. Entry thường từ map bỏ giới thiệu trùng nhưng giữ Memory reveal; các lối vào khác giữ intro. Map re-entry trở về highest playable của frontier, rebase giữ anchor và pha texture tĩnh. Controller/session API và schema save tương thích.

Điều hướng ngoài gameplay: Home có Nhiệm vụ/Sự kiện/Profile/Xếp hạng/Cài đặt, map có Cửa hàng/Bộ sưu tập/Bản đồ/Xếp hạng/Cài đặt. appNavigation giữ base page và một child scope; modal.js nhận presentation=screen/host/owner để tái dùng renderer với role region, không overlay/focus trap. Đổi screen hủy owner cũ; Account subscription và settings DOM được giải phóng/trả về đúng owner qua onDestroy. Exit của map/screen về Home. Gameplay không có dock; Cài đặt mở qua Tạm dừng, giữ ván và đồng hồ pause. Web chừa banner58px trên mọi tab và gameplay; Android mọi tab, gameplay native tắt theo adapter quảng cáo ở mục7.

## Hiệu ứng nền và xếp hạng — đã triển khai, QA thiết bị thật còn chờ

Các ownership dưới đây là trạng thái hiện hành; kế hoạch triển khai cũ đã được xóa. Kết quả browser không thay thế QA vật lý còn chờ:

- Sao băng đã triển khai: backgroundEffects sở hữu singleton pool hai node, một scheduler và IDLE/ACTIVE; appNavigation/appPageLifecycle/gameShellLifecycle báo eligibility trực tiếp. Chỉ Home/map được chạy; tab ẩn/reduced-motion/cài đặt/startup/gameplay thu hồi ngay. Init/dispose idempotent, sự kiện animation cũ không thu hồi animation đang chạy. Cài đặt mây/sương giữ nguyên.
- Bảng xếp hạng hiện hành là v3 level theo ba family mỗi trò; `docs/design/leaderboard/LEVEL_RANKING_QA.md` ghi nghiệm thu. Sáu bộ lọc/picker/time-v1/run-v2 UI là lịch sử; Rules v1/v2 vẫn hoạt động với bản web cũ. Không deploy Hosting trong task này.
- Cảnh thắng đã audit/sửa ownership: fireworkEffect có scope/RAF/timer, cancellation promise và visibility pause/resume; replacement không mở summary cũ. ui.js sở hữu pipeline/counter, actionScope của continuation thuộc parent và có generation guard. victoryPresentation.web sở hữu confetti instance/canvas theo từng summary, reset instance riêng khi đóng/ẩn/reduced-motion, không reset confetti toàn app. Instance dùng main thread vì Worker SDK là singleton/reset chung; chi phí mobile chưa xác minh. Cảnh hoa SVG/nhạc/timeline/cap giữ nguyên; audio cleanup chỉ dừng/reset âm thanh cảnh. Browser lifecycle/trace đã đạt; Galaxy S22 Ultra thật còn chờ theo xác nhận người dùng.

## Kết quả ghép cặp và khôi phục

`memoryMatch/pairRewards.js` và `linkConnect/pairRewards.js` resolve đồng bộ lucky/premium/milestone, thời gian, năng lượng, vật phẩm và biến đổi bàn; không tạo timer/network. Controller stage snapshot cùng ví/kho rồi commit một transaction trước presentation. Failure khôi phục RAM và giữ nguồn durable, có round/generation guard. `memorySpecial.js`/renderer trình bày kết quả đã commit; callback bay/thu thập không cấp lại tài nguyên. Không thêm pending-reward ledger hoặc đổi xác suất/giá trị cấu hình.

Pair snapshot giữ seed/theme, bàn thật, score/moves/misses/matched, lucky history; combo giữ cửa sổ còn lại và capturedAt, không cấp window mới khi reload. Link giữ freezeSeconds. Snapshot hỏng được giữ trong source và đánh dấu không thể resume, không sinh bàn mới cho run cũ; controller đối chiếu capacity với mode/level và theme catalog. Legacy session vẫn đọc theo contract cũ. Triple giữ snapshot riêng, ladder challenge8+ giới hạn tối đa93 tile/5layer/210s và solver budget hiện hành.


## Mỹ thuật và bố cục các tab (2026-10-15)

`styles/ui-theme.css` sở hữu token màu/vật liệu dùng chung; `styles/app-tabs.css` sở hữu bố cục/surface/control của tab và background theo `adventure-screen[data-screen]`;4ảnh WebP chỉ tải khi screen tương ứng mount, Home/map/gameplay không dùng nền này. Pipeline `scripts/prepare-app-tab-assets.py` tạo output từ PNG master trong docs; flourish runtime384px giữ alpha. Xếp hạng giữ Vườn đêm cũ. Không preload toàn bộ nền hoặc thêm animation loop.

`accountPanel.js` sở hữu Profile hero/name editor/stats/account; Google action nằm content thay footer. Draft chỉ thay khi người dùng mở/hủy/lưu hoặc UID đổi; saving/linking khóa đúng controls, dispose không nhận kết quả cũ. `styles/profile.css` là owner bố cục này. Editor thay tên ngay trong cùng hàng; bút đổi thành xác nhận, Hủy trả lại tên. Hồ sơ chỉ hiện ngày tham gia/tạo hồ sơ và tổng thời gian chơi; trackedSince vẫn giữ trong stats nhưng không render dòng Tính từ theo yêu cầu ngày2026-10-16; trạng thái synced/disabled không hiện thông báo thành công thường trực. Nguồn Auth/ngày tạo/playtime và privacy giữ nguyên.

`settings.js` di chuyển cùng settings DOM vào screen/pause modal và trả về home khi hủy; Help/Reset trong nhóm cuối, handler tạm được gỡ khi destroy. IDs, saveSetting, audio và handoff của từng controller giữ nguyên. `styles/settings.css` sở hữu nhóm/control/toggle/native-range; fill variable cập nhật theo giá trị, reduced-motion không animate thumb.

`leaderboardPanel.js` fresh trang1 ở mount/UID/retry, bỏ refresh thường trực. Store nhận option bổ sung `forceRefresh` mặc địnhfalse, chỉ vô hiệu cache đúng board/environment/UID; semantics refresh cooldown15s cũ và paging cache giữ tương thích. Stale/reset khôi phục trang1 tối đa1lần/request, lỗi có Thử lại theo ngữ cảnh. Family là badge canh giữa header bảng, không thêm metric public. Top3 dùng icon SVG huy chương và nhãn hạng accessible; hạng4+ là số không khung. Menu max-content128px, hit44px, viewport clamp và focus/keyboard owner giữ nguyên.

`styles/app-tabs.css` sở hữu thanh tiêu đề tối cao60px và vùng thoát56px gắn góc phải trên cả5tab, theo safe-area và host tối đa640px. Exit giữ DOM/handler của navigation, đứng ngoài vùng cuộn; không thay lifecycle hoặc hành vi trở về Home.

## Vị trí popup và menu tạm dừng (2026-10-15)

`dialogPlacement.js` sở hữu vị trí của mỗi popup qua lifecycle của popup: đọc region board của shell đang hiện, neo mép trên theo board và clamp trong visualViewport/safe-area. Bản đồ dùng `--shell-board-reference-top` từ token chrome chung trong `presentation.css`, đọc vị trí pseudo zero-size; popup chọn độ khó vì vậy cùng cao độ gameplay ngay lần đầu mà không mount game giả hoặc lưu tọa độ cũ. Ngoài bản đồ/gameplay dùng lề16px. Resize/scroll/ResizeObserver được gộp một RAF theo sự kiện, không vòng lặp; dispose hủy listener/observer/RAF. `modal.js` kết nối cho dialog, loại presentation screen; chiều cao còn lại giới hạn panel và body cuộn. Intro trong `ui.js` dùng cùng connection, local scope riêng và parent release; replace/destroy hủy timer/callback cũ. Offset intro/victory riêng đã bỏ. Toast và menu công cụ nhỏ giữ vị trí theo chức năng. Popup thông tin/Hướng dẫn và Giới thiệu & phiên bản dùng alignment=center có sẵn, căn giữa vùng khả dụng trừ banner/safe-area; không đổi placement của pause/intro/preview.

`gameExitDialog.js` giữ pause/handoff owner của ba game. Tiếp tục dùng default close/onClose; Chơi lại/Lượt mới và Thoát game giữ async busy guard và callback cũ. Cài đặt chỉ handoff sau close. `styles/modals.css` sở hữu geometry dialog và pause layout, dùng token Vườn đêm từ `styles/ui-theme.css`; action thường48px, tối thiểu44px trên màn thấp, close44px/glyph24px cùng focus/reduced-motion; ornament ảnh trong pause đã gỡ theo yêu cầu người dùng, tiêu đề thu gọn, không thêm ảnh hay animation loop. Exit bản đồ vẫn thuộc navigation/header, góc56×60px và safe-area, không nằm trong map scroll.

Header/exit chung áp dụng mọi `adventure-screen[data-screen]`, gồm Cửa hàng/Bộ sưu tập; không giữ whitelist khiến screen mới rơi về nút tròn. `styles/shop.css` sở hữu slot Xu ở giữa header, giới hạn chiều rộng số dài để không chạm tên/nút thoát; số và accessible label giữ đúng nguồn. `mainmenu.js` vẫn dùng gameId cho catalog/equip, chỉ bỏ tên game lặp trong title Bộ sưu tập. Home hướng1 dùng native buttons/DOM title với ba ảnh WebP trong `public/assets/images/home/`; `styles/home-menu.css` là owner selector duy nhất, thay các selector Home cũ trong menu/adventure. Scope trang sở hữu click/focus/pointerenter/error listener; ảnh lỗi được ẩn, tên và nút vẫn sử dụng được. Home hiện dùng native horizontal scroll-snap nối vòng: một trò ở giữa, hé trò hai bên; logical index theo catalog, DOM xoay tại scrollend để đưa lựa chọn về slot giữa, không clone/tăng node theo số vòng. Arrows/Left/Right dùng modulo, Home/End vẫn logical first/last. Focus pointer chỉ warm, không reorder trước pointerup; explicit keyboard select+focus và focus sau rebase giữ ổn định. Hidden track không đọc geometry0 để đổi lựa chọn. Native browser sở hữu touch/momentum/cancel, không custom drag/timer hoặc RAF loop. Scope sở hữu các listener, RAF gộp scroll khi có sự kiện và ResizeObserver có disconnect; chỉ số lấy theo tâm card trong track, transform không tham gia vị trí snap. Mũi tên/chấm/ArrowLeft/ArrowRight/Home/End có cùng select path, roving tabIndex và focus. Resize giữ trò đang chọn; reduced-motion tắt transition. Wrapper giới hạn640px và auto margins cho màn thấp cuộn tới cả title/controls. Master PNG ở docs, generator `scripts/prepare-home-menu-assets.py` đóng gói tổng323.366bytes; Memory portraitv2 576×768 có URL memory-match-v2.webp để tránh immutable/cache-first giữ bản ngang cũ; không đổi navigation/save/catalog.

Popup trước ván: `adventureMap.js` dùng cùng `adventure-level-modal`/owner cho màn thường và Thử thách/Vô tận. Special cố định màn1, không có radio độ khó; chỉ nút Chơi gọi launch với skipIntro để tránh popup trùng. `adventurePreview.js` là đọc thuần, hỗ trợ sáu mode từ config/layout/stage, không ghi item/session hoặc tiến độ. Hủy giữ view.mode Hành trình và bản lưu; modal owner hủy listener/placement/focus, submit guard giữ đường retry khi launch thất bại.

Tab Sự kiện thay Bạn bè ngày2026-10-16: dock action events, screen events-screen và SVG lịch trong icon registry. Hiện chỉ có Sắp ra mắt; chưa thêm hệ thống sự kiện/network/schema. styles/app-tabs.css giữ nền courtyard cũ (tên asset friends-courtyard.webp để ổn định pipeline), đổi scope sang events; header/exit/selected và owner cleanup giữ chung navigation.

## Hệ trình bày thống nhất — 19/10/2026

`styles/ui-theme.css` sở hữu token màu/vật liệu; URL ảnh vẫn do generator sở hữu riêng. Controls dùng geometry CSS và icon vector từ `createIcon`, giữ nguyên tên/alias/API/fallback; minh họa thưởng và huy hiệu map/grade giữ asset hiện hành. Close dùng glyph SVG24px; exit26px; fullscreen44px/22px từ config source và token sinh. Dock selected là nền dịu + indicator trong cùng box, không ảnh kéo giãn. Modal owner giữ header/body/footer và submit/focus/cleanup; placement vẫn thuộc dialogPlacement. Summary title là chữ DOM, các số liệu/thưởng không đổi; body dài cuộn và footer giữ reachable. HUD được shell đo từ48px/44px thực, không thêm resize loop. Tooltip chọn vị trí tránh HUD, giữ delays/listeners cũ. Bản đồ giữ huy hiệu đã mở khóa; huy hiệu khóa cùng hình giảm sáng/bão hòa/opacity, kèm SVG ổ khóa ở góc (chỉ hiện khi control disabled); path xanh lam xám. Không đổi luật/transaction/save, không thay artwork nền hoặc tạo engine mới. Bằng chứng: `docs/design/ui-consistency/RECEIPT.md`.

## Tài liệu hiện hành và giới hạn kiểm chứng

Kế hoạch kỹ thuật G0–G9 (gồm G2A/G2B, G3A/G3B) và UI U0–U7 đã hoàn tất. Kế hoạch đã hoàn tất/bị thay thế được xóa theo yêu cầu chủ dự án; receipt, log, deterministic fixtures, baseline, nguồn artwork và ảnh QA lịch sử được giữ. Không khôi phục kế hoạch cũ từ Git để triển khai lại. CONTEXT.md chỉ điều hướng trạng thái; thay đổi contract phải đối chiếu code/config và kiểm thử.

- `docs/qa/technical-improvement/RECEIPT.md`: hành vi đối chiếu ba trò, transaction/rollback, lifecycle, responsive và số đo Link query trước/sau. Ngoại lệ được duyệt duy nhất: Sấm sét không trừ kho khi không có cặp hợp lệ; không tiêu thụ RNG ở preflight.
- `docs/design/ui-consistency/RECEIPT.md`: hệ trình bày hiện hành, matrix responsive, review sau implementation, soak, production/subpath và số đo Home A/B. CSS/icon cải thiện presentation, không đổi public API/catalog/effect ID/save key/schema/format hoặc phiên cũ.
- `ADS_APK_TEST_PLAN.md`: hồ sơ còn Gate5 nghiệm thu thiết bị/quảng cáo thật. Phần mềm đã bàn giao; giữ vì QA vật lý chưa hoàn tất. Không tự tạo APK, publish/deploy hoặc mở rộng placement/dạng quảng cáo từ hồ sơ này.

Kế hoạch tiến trình gameplay P0–P9 và Kho báu hành trình R0–R6 đã hoàn tất trên web và được xóa. Contract hiện hành nằm ở phần Gameplay nhiều đợt và kho báu bên dưới; không mở lại các quyết định P0 lịch sử. Giới hạn kiểm chứng thiết bị thật tiếp tục được giữ trong CONTEXT.md.

Đã kiểm web; FPS/âm thanh/SDK ads trên thiết bị vật lý, OAuth hosted và dashboard thực còn chưa xác minh. Không suy FPS điện thoại từ desktop, không dùng ảnh QA cũ làm bằng chứng bố cục UI hiện hành. APK cũ không đại diện các chỉnh web19/10; chỉ tạo APK mới khi chủ dự án yêu cầu rõ.

Popup kết quả dùng styles/modals.css làm owner hình học và trạng thái sao: sao chưa đạt giảm sáng/opacity, sao giữa tăng nhẹ kích thước và dịch lên4px. Offset dùng chung với keyframe hiện hữu và trạng thái reduced-motion; không đổi logic sao, thời điểm animation hoặc phần thưởng. Bằng chứng chỉnh20/10 nằm trong receipt UI chung.

## Loading khi mở ứng dụng — 19/10/2026

Markup/CSS loading nằm trong index.html trước mã game; `bootstrap.js` tạo owner từ `startupLoading.js`, import main và gọi initializeApplication đúng một lần. Bốn mốc thật: modules/save/interface/home; không ghi phần trăm hoặc tự tăng theo đồng hồ. Dải sáng transform chỉ báo đang xử lý khi độ dài bước chưa xác định, tối đa12chu kỳ×1,2s, dừng khi ẩn/quá lâu/xong; không RAF JavaScript theo frame. Home không chờ cả ba ảnh hoặc decode nền; ảnh chính được preload cùng URL đang dùng. Tài khoản/Analytics tiếp tục chạy nền theo contract cũ.

Home inert trong fade opacity180ms, rồi giải phóng ngay; reduced-motion/tab ẩn bỏ fade. WAAPI promise có success/cancel, owner AbortController dọn listener/watchdog, cleanup idempotent và bootstrap bỏ reference controller sau khi kết thúc. Không mount lại loading khi đổi trò/màn hoặc về Home. Lỗi bản lưu bỏ loading để hiện recovery hiện hữu; lỗi nạp mã hiện Tải lại, tải chậm15s cho lựa chọn tải lại; nếu entry không chạy, link tải lại HTML/CSS có fallback hữu hạn riêng20s. Không đổi timer/preview của màn chơi.

`styles/startup-loading.css` là owner presentation. Nền gate WebP122606byte,960×1440; master/prompt ở docs/design/loading/ASSETS.md và source generator scripts/prepare-loading-assets.py. Logo/chữ/track/fill/ornament dùng HTML/SVG/CSS; không chữ trong bitmap. `pwa.js` đăng ký worker cả trước và sau window.load để entry bất đồng bộ không làm mất offline. Bằng chứng chung nằm ở docs/design/ui-consistency/RECEIPT.md; không suy FPS thiết bị thật từ profile desktop.

## Gameplay nhiều đợt và kho báu — 20/10/2026

- progression/gameplayRules sở hữu công thức; waveProgress sở hữu checkpoint playing/advance/won và ngân sách. Session boundary kiểm số nhóm khớp snapshot/cấu hình; chỉ full-wave terminal được chứng nhận/settle. Wave HUD/notice/transition thuộc round scope; callback cũ không ghi round mới.
- difficultyProgress/masteryRewards dẫn xuất unlock/EXP/mảnh từ certified best; không persist counter EXP song song. treasureCatalog/treasureProjection là projection chỉ đọc; treasureArt/treasureView sở hữu SVG và DOM; treasureModal sở hữu selection/read-generation/submission; treasureAnimation sở hữu bốn WAAPI hữu hạn/audio sau commit, hủy và reduced-motion. Map chỉ tích hợp marker, patch wallet và preview adapter, không cấp thưởng.
- Thưởng rương hành trình cố định tại `progression/masteryRewards.js`: C=30xu+1Gợi ý, B=60xu+2Gợi ý, A=100xu+3Gợi ý, S=160xu+4Gợi ý; bộ tranh đủ10mảnh nhận300xu riêng. Gói ngẫu nhiên Nhỏ/Vừa/Lớn không thuộc đường claim hiện hành.
- adventureRewards giữ queue và atomic coins/items/receipt. API outcome/null cũ được giữ; claimJourneyTreasure trả kết quả chi tiết và expectedTier bắt buộc cho UI mới, kiểm canonical tier/profile/UID trước grant. Full inventory hoặc save/CAS fail không partial grant, rollback vào đúng profile. Callback presentation không phát lại reward. R0–R6 không đổi key/schema/catalog reward.
- gameplaySeason1 và IndexedDB3 cô lập dữ liệu thử cũ; namespace local/test/beta/production-waves1 cô lập cloud/profileStats/ranking với client cũ. Ranking wirev3 không đổi. Reset Firebase có backup/hash/updateTime precondition và kiểm kê; không phải công việc lặp mỗi startup/deploy.
- Module settlement chỉ trả delta mastery cho lần thắng đầu; summary đọc tên/projection và điều hướng qua API map có owner, không click DOM giả hoặc tự claim. Bộ tranh/300Xu giữ độc lập với bốn rương.
