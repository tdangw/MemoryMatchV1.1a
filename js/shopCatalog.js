export const SHOP_ITEMS = Object.freeze([
  {
    id: "time-10",
    icon: "timer",
    title: "10 giây",
    price: 20,
    type: "time",
    value: 10,
  },
  {
    id: "time-30",
    icon: "timer",
    title: "30 giây",
    price: 55,
    type: "time",
    value: 30,
  },
  {
    id: "time-45",
    icon: "timer",
    title: "45 giây",
    price: 80,
    type: "time",
    value: 45,
  },
  {
    id: "time-60",
    icon: "timer",
    title: "60 giây",
    price: 100,
    type: "time",
    value: 60,
  },
  {
    id: "hint-1",
    icon: "search",
    title: "1 lượt gợi ý",
    price: 30,
    type: "hint",
    value: 1,
  },
  {
    id: "hint-2",
    icon: "search",
    title: "2 lượt gợi ý",
    price: 55,
    type: "hint",
    value: 2,
  },
  {
    id: "hint-3",
    icon: "search",
    title: "3 lượt gợi ý",
    price: 75,
    type: "hint",
    value: 3,
  },
  {
    id: "reveal-4",
    icon: "puzzle",
    title: "Xem trước 4 thẻ",
    price: 50,
    type: "reveal-random",
    value: 4,
  },
  {
    id: "reveal-8",
    icon: "puzzle",
    title: "Xem trước 8 thẻ",
    price: 90,
    type: "reveal-random",
    value: 8,
  },
  {
    id: "reveal-all",
    icon: "puzzle",
    title: "Xem trước tất cả thẻ",
    type: "reveal-all",
  },
]);

export function getShopItemPrice(item, { unmatchedTileCount = 0 } = {}) {
  return item.type === "reveal-all" ? unmatchedTileCount * 10 : item.price;
}
