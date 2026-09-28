// Các giá trị giao diện dùng chung, tách biệt khỏi mốc thời gian gameplay.
export const UI_TIMING = Object.freeze({
  modalCloseMs: 180,
});

export const UI_COPY = Object.freeze({
  timeUpPrompt: "<p>Chọn một cách để bắt đầu hành trình của bạn.</p>",
});

export function formatClockTime(seconds) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const remainingSeconds = String(value % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function createThemeSummary(title) {
  const summary = document.createElement("div");
  const label = document.createElement("small");
  label.textContent = "Chủ đề đang dùng";
  const name = document.createElement("strong");
  name.textContent = title;
  summary.append(label, name);
  return summary;
}
