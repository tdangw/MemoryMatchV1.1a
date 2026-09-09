import assert from "node:assert/strict";
import { formatItemName, formatItemNameFromSrc } from "../js/itemNameFormatter.js";

// Test formatItemName
assert.equal(formatItemName("acai_berry"), "Acai berry");
assert.equal(formatItemName("giant-panda"), "Giant panda");
assert.equal(formatItemName("01-dragon_fruit"), "Dragon fruit");
assert.equal(formatItemName("1_alpaca"), "Alpaca");
assert.equal(formatItemName("sweet-potato-leaf"), "Sweet potato leaf");
assert.equal(formatItemName(""), "");
assert.equal(formatItemName(null), "");

// Test formatItemNameFromSrc
assert.equal(
  formatItemNameFromSrc("assets/images/themes/fruits/acai_berry.webp"),
  "Acai berry"
);
assert.equal(
  formatItemNameFromSrc("/assets/images/themes/animals-land/1/giant-panda.webp"),
  "Giant panda"
);
assert.equal(
  formatItemNameFromSrc("http://localhost:5173/assets/images/themes/fruits/1/01-dragon_fruit.webp?v=1#hash"),
  "Dragon fruit"
);
assert.equal(
  formatItemNameFromSrc("alpaca.webp"),
  "Alpaca"
);
assert.equal(
  formatItemNameFromSrc("assets/images/themes/fruits/Red%20raspberries.webp"),
  "Red raspberries"
);
assert.equal(
  formatItemNameFromSrc("http://localhost:5173/assets/themes/fruits/Red%20raspberries.webp?v=1"),
  "Red raspberries"
);

// Test generated cards with alt
assert.equal(
  formatItemNameFromSrc("data:image/svg+xml;utf-8,...", "Chữ cái: A"),
  "A"
);
assert.equal(
  formatItemNameFromSrc("data:image/svg+xml;utf-8,...", "2 Số: 42"),
  "42"
);
assert.equal(
  formatItemNameFromSrc("data:image/svg+xml;utf-8,...", "Ký hiệu máy tính: +"),
  "+"
);

console.log("Item name formatter tests passed.");
