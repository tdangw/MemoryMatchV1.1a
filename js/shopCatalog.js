export const SHOP_ITEMS = Object.freeze([
  {
    id: "time-10",
    icon: "timer",
    title: "10 giây",
    price: 18,
    type: "time",
    value: 10,
  },
  {
    id: "time-30",
    icon: "timer",
    title: "30 giây",
    price: 50,
    type: "time",
    value: 30,
  },
  {
    id: "time-45",
    icon: "timer",
    title: "45 giây",
    price: 70,
    type: "time",
    value: 45,
  },
  {
    id: "time-60",
    icon: "timer",
    title: "60 giây",
    price: 90,
    type: "time",
    value: 60,
  },
  {
    id: "hint-1",
    icon: "search",
    title: "1 lượt gợi ý",
    price: 8,
    type: "hint",
    value: 1,
  },
  {
    id: "hint-2",
    icon: "search",
    title: "2 lượt gợi ý",
    price: 15,
    type: "hint",
    value: 2,
  },
  {
    id: "hint-3",
    icon: "search",
    title: "3 lượt gợi ý",
    price: 21,
    type: "hint",
    value: 3,
  },
  {
    id: "hint-5",
    icon: "search",
    title: "5 lượt gợi ý",
    price: 30,
    type: "hint",
    value: 5,
  },
  {
    id: "reveal-4",
    icon: "puzzle",
    title: "Xem trước 4 thẻ",
    price: 8,
    type: "reveal-random",
    value: 4,
  },
  {
    id: "reveal-8",
    icon: "puzzle",
    title: "Xem trước 8 thẻ",
    price: 15,
    type: "reveal-random",
    value: 8,
  },
  {
    id: "reveal-12",
    icon: "puzzle",
    title: "Xem trước 12 thẻ",
    price: 22,
    type: "reveal-random",
    value: 12,
  },
  {
    id: "reveal-all",
    icon: "puzzle",
    title: "Xem trước tất cả thẻ",
    price: 30,
    type: "reveal-all",
  },
]);

// Gói thời gian dùng trong popup hết giờ của mọi game có countdown.
// Tách riêng khỏi SHOP_ITEMS vì chúng chỉ xuất hiện sau khi hết giờ.
export const TIME_UP_PURCHASES = Object.freeze([
  Object.freeze({ seconds: 1, price: 2 }),
  Object.freeze({ seconds: 5, price: 10 }),
]);

export function getShopItemPrice(item) {
  return item.price;
}
