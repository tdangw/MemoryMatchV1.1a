/** Reveal only along a tab strip, without moving the page's vertical scroll. */
export function revealTab(tablist, tab) {
  const strip = tablist.getBoundingClientRect(), item = tab.getBoundingClientRect();
  if (item.left < strip.left) tablist.scrollLeft += item.left - strip.left;
  else if (item.right > strip.right) tablist.scrollLeft += item.right - strip.right;
}
