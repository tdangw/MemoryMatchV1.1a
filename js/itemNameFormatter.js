/**
 * Chuẩn hóa tên vật phẩm từ tên file hoặc đường dẫn ảnh.
 * Ví dụ:
 *  - "acai_berry.webp" -> "Acai berry"
 *  - "1/giant-panda.webp" -> "Giant panda"
 *  - "01-dragon_fruit.webp" -> "Dragon fruit"
 *  - Thẻ chữ cái/số: Giữ nhãn chuẩn từ alt
 */
export function formatItemNameFromSrc(src, alt = "") {
  if (typeof src !== "string" || !src) return formatGeneratedLabel(alt);

  // Thẻ SVG sinh tự động (chữ cái, số, ký hiệu)
  if (src.startsWith("data:")) return formatGeneratedLabel(alt);

  // Bóc tách tên file từ đường dẫn
  // Decode URL encoding (%20 → space, v.v.) trước khi tách tên file
  const cleanPath = decodeURIComponent(src.split("?")[0].split("#")[0]);
  const filename = cleanPath.split("/").pop() || "";
  const nameWithoutExt = filename.replace(/\.[a-z0-9]+$/i, "");
  if (!nameWithoutExt) return formatGeneratedLabel(alt);

  return formatItemName(nameWithoutExt);
}

export function formatItemName(rawName) {
  if (typeof rawName !== "string" || !rawName) return "";

  // Bỏ tiền tố số thứ tự như "01-", "1-", "01_", "1_"
  const stripped = rawName.replace(/^\d+[-_]/, "");

  // Thay thế toàn bộ gạch dưới và gạch nối thành khoảng trắng
  const words = stripped.replace(/[-_]+/g, " ").trim();
  if (!words) return "";

  // Sentence Case: Viết hoa chữ cái đầu tiên
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatGeneratedLabel(alt) {
  if (typeof alt !== "string" || !alt) return "";
  // Alt dạng: "Chữ cái: A", "2 Số: 42", "Ký hiệu máy tính: +"
  const parts = alt.split(":");
  if (parts.length > 1) {
    return parts.slice(1).join(":").trim();
  }
  return alt.trim();
}
