# Tranh thưởng Hành trình

Tạo bằng skill imagegen, công cụ tích hợp; không dùng CLI/API riêng. Source gốc giữ trong thư mục generated_images của Codex; sản phẩm trong `public/assets/images/collections/`, WebP 1500×600, quality88. Không chữ, không khung; mười mảnh dùng cùng một ảnh qua background-position, không tạo mười bitmap.

Catalog ba tranh dùng tuần hoàn theo bộ và lệch điểm bắt đầu theo trò; không giả định có ảnh riêng cho vô hạn bộ. Receipt nhận thưởng vẫn riêng theo trò/bộ, không theo asset. Có thể mở rộng catalog mà không đổi receipt hoặc tiến độ.

## Prompt 1 — moonlit-conservatory.webp

Use case: illustration-story. Create one finished landscape collectible painting for a premium mobile puzzle adventure named Memory Match Adventure. This is an in-game reward painting that will be revealed in ten puzzle fragments, so provide a single continuous illustration, not a sheet and not a mockup. Scene: an enchanted moonlit botanical conservatory, an old stone footbridge over a small teal pond, orchids and cream magnolias near the water, distant warm lanterns and a glass garden pavilion, rich but calm emerald, midnight blue and antique gold palette. Hand painted storybook game illustration with crafted forms and believable material detail, attractive commercial polish, clear recognizable forms across the entire painting, atmospheric depth without glaring light. Landscape composition approximately 5:2 so a 5-column by 2-row puzzle crop is readable. No characters, no cards, no UI, no text, no border, no watermark. Output only the continuous artwork.

## Prompt 2 — botanical-library.webp

Use case: illustration-story. Single continuous finished collectible painting for a premium mobile puzzle garden adventure, not a UI mockup or sheet. Landscape 5:2 composition readable as a 5 by 2 jigsaw puzzle. An enchanted botanical library under a giant old tree, circular wood door, winding stone stairs linking terraces, hanging wisteria, fern and flowering vines, small glowing lanterns, distant emerald mountain gardens at blue hour. Rich calm midnight teal and emerald with antique golden accents. Hand painted storybook commercial game art, coherent crafted shapes, atmospheric depth, fine botanical detail and warm welcoming adventure mood. Distinct subjects across the whole composition, no huge blank area. No characters, playing cards, lettering, interface, border, watermark or blazing lights. Only the artwork.

## Prompt 3 — three-island-garden.webp

Use case: illustration-story. Single continuous landscape collectible painting for a premium mobile puzzle garden adventure, no UI. Aspect ratio 5:2, composition suitable for ten jigsaw fragments in five columns and two rows. A tranquil enchanted water garden of three elegant terraced stone islands connected by short ornate bridges, cherry blossoms and pale climbing roses, a beautiful central gazebo with a golden roof, cascading streams and lotus ponds, distant dreamy blue mountains. Evening indigo sky, serene emerald/teal foliage and restrained warm antique gold lanterns. Hand painted storybook commercial game illustration, beautifully crafted botanical shapes, distinct readable motifs across entire painting, refined materials, natural atmospheric depth, soft light without glare. No people, no playing cards, no text, no interface, no frame, no watermark. Only the finished artwork.
