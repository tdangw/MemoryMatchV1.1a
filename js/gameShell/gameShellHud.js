// Presentation only: callers supply values, formatters and DOM references.
export function setHudText(element, value) {
  const text = String(value);
  if (element && element.textContent !== text) element.textContent = text;
}
export function setHudAttribute(element, name, value) {
  const text = String(value);
  if (element && element.getAttribute(name) !== text) element.setAttribute(name, text);
}
function style(element, name, value) {
  if (element && element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}
function flag(element, name, value) {
  if (element && element.classList.contains(name) !== Boolean(value)) element.classList.toggle(name, Boolean(value));
}
export function setHudTooltip(element, text) {
  setHudAttribute(element, "data-tooltip", text);
  setHudAttribute(element, "aria-label", text);
  if (element && element.tagName !== "BUTTON") {
    setHudAttribute(element, "data-hud-info", "");
    setHudAttribute(element, "tabindex", "0");
  }
}
export function renderHudTimer(element, { progress, visible = true, endless = false }) {
  const ratio = Math.max(0, Math.min(1, progress));
  style(element, "--game-timer-progress", String(ratio));
  flag(element, "has-timer-progress", visible);
  flag(element, "is-timer-warning", !endless && visible && ratio < .7 && ratio >= .3);
  flag(element, "is-timer-critical", !endless && visible && ratio < .3);
  flag(element, "is-timer-endless", endless);
}

export function createGameShellHud({ stats = {}, stars = {}, coins = {}, tools = {}, milestones = {} } = {}) {
  const starNodes = [...(stars.element?.querySelectorAll(".star-progress__milestone") || [])];
  const markers = milestones.markers || [];
  for (const tool of Object.values(tools)) if (tool.tooltip) setHudTooltip(tool.element, tool.tooltip);
  return {
    stats(values) {
      for (const [key, value] of Object.entries(values)) {
        const definition = stats[key];
        if (definition) setHudText(definition.element, definition.format ? definition.format(value) : value);
      }
    },
    stars({ earned, score, target, totalScore } = {}) {
      if (earned !== undefined) {
        const count = Math.max(0, Math.min(starNodes.length, Number(earned) || 0));
        setHudAttribute(stars.element, "aria-label", `${count} trên ${starNodes.length} sao`);
        starNodes.forEach((star, index) => flag(star, "is-earned", index < count));
      }
      if (target !== undefined) {
        style(stars.fill, "width", `${target > 0 ? Math.max(0, Math.min(100, Math.round(score / target * 100))) : 0}%`);
        setHudTooltip(stars.card, `Mục tiêu: ${target}`);
      }
      if (totalScore !== undefined) setHudTooltip(stars.scoreCard, `Tổng điểm: ${totalScore}`);
    },
    coins(value, { animating = false } = {}) {
      if (!animating) setHudText(coins.balance, value);
      setHudTooltip(coins.element, `Xu: ${value}`);
    },
    tool(key, { count, disabled } = {}) {
      const tool = tools[key];
      if (!tool) return;
      if (count !== undefined) {
        setHudText(tool.count, count);
        if (tool.format) setHudTooltip(tool.element, tool.format(count));
      }
      if (disabled !== undefined) {
        flag(tool.element, "is-disabled", disabled);
        setHudAttribute(tool.element, "aria-disabled", disabled);
      }
    },
    milestones({ progress, target, descriptions = [] }) {
      style(milestones.track, "--shell-energy-progress", String(Math.max(0, Math.min(1, (progress - 1) / Math.max(1, target - 1)))));
      setHudTooltip(milestones.label || milestones.track, milestones.format ? milestones.format(progress, target) : `Năng lượng: ${progress}/${target}`);
      let nextMarked = false;
      markers.forEach((marker, index) => {
        setHudTooltip(marker, `Mốc ${index + 1}: ${descriptions[index]}`);
        const earned = (index + 1) * (milestones.step || 1) <= progress;
        flag(marker, "is-earned", earned);
        flag(marker, "is-next", !earned && !nextMarked);
        if (!earned) nextMarked = true;
      });
    },
  };
}
