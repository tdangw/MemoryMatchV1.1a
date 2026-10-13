# Mỹ thuật bản đồ vườn đêm — 2026-10-13

## Phạm vi

Cả ba trò dùng chung renderer/atlas, mỗi trò có seed bố cục riêng. Trang trí tĩnh gồm hoa, cây, đá, sen, cá, gợn nước và đèn; không thêm vòng animation, listener hoặc ghi dữ liệu. Đường uốn theo các điểm điều khiển biến thiên cố định theo màn. Rương thay đổi vị trí theo mốc, tách khỏi đường, ảnh đóng trước nhận và mở sau nhận. Luật, ID rương, phần thưởng và schema save không đổi.

Chọn atlas ghép cảnh thay cho một ảnh nền lớn riêng từng chặng: một texture tái dùng, giữ vị trí nút chính xác khi responsive/rebase và không tăng tài nguyên theo toàn lịch sử. Renderer chỉ dựng 100 màn cùng tối đa 5 màn chồng lấp mỗi đầu; trang trí tối đa37 node. Bộ lập bố cục thuần kiểm tra khoảng trống quanh nút/sao/nhãn/rương và hull đường; tọa độ Y tính tương đối để tránh mất chính xác ở số màn lớn. Không đổi bố cục mỗi lần mở lại hoặc đổi độ khó.

## Asset

- Runtime: `public/assets/adventure/garden-sprites.webp`, 1254×1254,492630byte, RGBA, WebP quality85; một atlas4×4, giữ alpha tạo từ built-in imagegen. Chỉ chuyển định dạng/nén, không vẽ hoặc xóa nền bằng script.
- Hàng1: hoa trắng/cỏ, đá phủ rêu, sen trắng, cá/gợn nước.
- Hàng2: cây liễu, dương xỉ/lau, gợn nước, bụi hoa.
- Hàng3: đá tròn, đèn vườn, hoa xanh, nụ sen.
- Hàng4: rương đóng, rương mở, cành hoa, lau/đá.
- Atlas được kiểm tra hình ảnh và alpha; lần đầu có vật vượt ô, lần sửa tăng khoảng trống. Bản được chọn có khoảng trống chia ô đủ cho hiển thị nhỏ, không có nền chữ nhật hoặc chữ.
- Nguồn được chọn: `C:/Users/Dang/.codex/generated_images/01a13061-de01-7c51-887f-a5ec61310d10/exec-a638e3f6-4d8b-4dfc-b9b4-c94dce1c4282.png`.

## Prompt tạo bộ hình

Use case: stylized-concept. Asset type: original transparent game map scenery sprite atlas. Create a square 1024x1024 PNG with genuine transparent background. Exactly 4 columns by 4 rows of equal 256x256 cells, invisible grid, each independent sprite fully inside its own cell with at least 24 pixels clear padding, centered. No objects cross cell borders. No text, labels, frames, numbers, backdrop, watermark or ground rectangle. Soft hand-painted fantasy botanical garden at night, teal/navy leaves, moonlit highlights, muted ivory flowers and warm gold accents. Readable charming silhouettes at small mobile sizes, consistent elevated three-quarter view. Row 1 left to right: tuft of pale jasmine flowers and grass; mossy slate stones with tiny flowers; floating lily pads with one ivory lotus; two small gold-blue koi fish with transparent water ripples. Row 2: small curved willow sapling with roots; fern and reeds cluster; three soft blue water ripple rings; low pale flowering shrub. Row 3: rounded mossy boulder; small warm brass garden lantern with ivy; blue wildflower tuft; floating lotus buds and pads. Row 4: CLOSED wooden treasure chest with ornate warm brass bands and leaf engraved latch; the SAME chest OPEN with raised lid and a few gold coins visible, matching exact scale, camera and base position as closed chest; small arching white flower branch; graceful pond reeds and pebbles. Chest pair has bold readable gold silhouette and dark walnut panels, softly moonlit, original design suited to a tranquil night garden. All sprites are isolated cutouts with transparent gaps. Match style and lighting across all sixteen cells. Important: every cell is exactly equal; no divider lines; transparent canvas; chest must be row4 col1 and row4 col2.

## Prompt chỉnh khoảng trống

Use case: precise-object-edit. Edit this original transparent 4x4 scenery atlas. Keep the exact sixteen subjects, row-major order, artistic style, colors, chest identities and transparent background. Fix only atlas packing: make a square canvas with exactly four equal columns and four equal rows. Shrink every isolated sprite uniformly within its own equal cell so it occupies at most 75% of that cell width AND height, centered. Each entire cell must have ample fully transparent padding around all four sides, with all internal grid boundaries completely transparent. No branches, water ripples, leaves, glows or chest coins may cross into any adjacent cell. Keep row4 col1 closed chest, row4 col2 same open chest. Keep all16 sprites, do not merge/remove/reorder. No text, no grids, no divider lines. Canvas edges must also have transparent padding. Actual transparent alpha, not painted checkerboard. This is a functional sprite sheet used by equal-quarter CSS background positioning, so equal cell alignment and clear gutters are mandatory.

