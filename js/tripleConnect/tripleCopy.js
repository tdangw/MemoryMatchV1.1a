import { APP_VERSION } from "../appMeta.js";

export const TRIPLE_CONNECT_HELP_CONTENT = `<ul class="app-feature-list">
  <li>Chỉ chọn thẻ đang lộ; thẻ bị lớp trên che sẽ mở dần khi blocker được dọn.</li>
  <li>Ghép ba hình giống nhau để xóa chúng khỏi khay.</li>
  <li>Khay có 7 ô; ván chơi thua nếu khay đầy trước khi dọn sạch bàn.</li>
  <li>Hoàn thành mục tiêu trước khi hết giờ. Vô tận dùng đồng hồ đếm xuôi.</li>
  <li>Gợi ý, Thời gian, Hoàn tác và Xáo trộn chỉ hỗ trợ khi bạn đang cần.</li>
</ul>`;

export const TRIPLE_CONNECT_INFO_CONTENT = `<p><strong>Triple Connect</strong> là trò chơi ghép bộ ba trên bàn nhiều lớp.</p>
  <p class="app-modal__note">Tác giả: Đăng · Phiên bản ${APP_VERSION}</p>`;

const MODE_DESCRIPTIONS = Object.freeze({
  easy: "18 thẻ · 2 lớp · 75 giây",
  normal: "36 thẻ · 3 lớp · 105 giây",
  hard: "54 thẻ · 4 lớp · 150 giây",
  superHard: "75 thẻ · 5 lớp · 210 giây",
  endless: "75 thẻ · 5 lớp · không giới hạn thời gian",
  challenge: "Màn thử thách với số thẻ, lớp và thời gian riêng",
});

export function getTripleModeDescription(mode) {
  return MODE_DESCRIPTIONS[mode] || "Bàn nhiều lớp";
}
