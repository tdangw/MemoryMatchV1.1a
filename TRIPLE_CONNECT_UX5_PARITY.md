# Triple Connect — UX-5 parity matrix

| Bề mặt | Memory Match | Link Connect | Triple Connect | Owner/ghi chú |
|---|---|---|---|---|
| Main menu, Settings, Info, Help, Reset | shared | shared | shared | game selector + navigation adapter Triple |
| Start/Continue picker, chọn chủ đề | shared | shared | Triple adapter | `gameSelector.js`, appearance Triple riêng |
| Popup đầu màn | shared modal | shared modal | Triple adapter | mode/level/theme/timer/mốc; Continue không phát lại |
| Shop và inventory | adapter | adapter | Triple adapter | Hint/Time/Undo/Shuffle; không Freeze/Thunder/tray expand |
| Collection/theme/effect | adapter | adapter | Triple adapter | theme, path effect, exit effect; không Memory card-back/flip |
| HUD, timer, tool/action menu | shared | shared | Triple adapter | Game Shell HUD, timer owner, menu mutual exclusion |
| Mốc thưởng | adapter | adapter | Triple adapter | config/ledger/transaction Triple riêng |
| Pause/background, sound | shared | shared | Triple adapter | controller lifecycle/sound shared |
| Win/loss/next/restart summary | shared modal | shared modal | Triple adapter | mode-aware terminal flow và reward summary |
| Xu, item transaction, persistence | shared | shared | Triple adapter | rollback/session schema Triple rõ ràng |
| Freeze, Thunder, tray expansion, random reward drop | not applicable | not applicable | not applicable | ngoài quyết định sản phẩm hiện hành |

Không có ô `missing` trong phạm vi Triple đã duyệt. Matrix này không xác nhận PWA/APK/Android hoặc cân bằng kinh tế sau web playtest.
