// ─── 交互规范单一事实源（DESIGN.md「交互规范」条款的实现常量）───
// 交互时长、透明度档位、缩放步进、tooltip 过渡只在这里定义；
// 改规范先改 DESIGN.md 对应条款，再改这里——测试对数值做快照把关，防实现漂移。
// 本文件保持零依赖（不 import 库内其他模块）。

export const INTERACTION = {
  // 焦点强调：图例悬浮与 emphasis 共用的同一淡化档（单一通道，DESIGN §9）
  focusDimAlpha: 0.22,
  // 图例点选隐去后的残影：图标 / 文字
  legendHiddenAlpha: { icon: 0.4, text: 0.6 },
  // 层级图（旭日 / 树图）聚焦子树时其余段的淡化档
  hierarchyDimAlpha: 0.25,
  // 滚轮缩放：步进系数与窗口下限（百分比）
  zoom: { wheelFactor: 1.15, minSpan: 2 },
  // tooltip：与光标的间距（px）、位移与淡入过渡（经 CSS 变量注入）
  tooltip: {
    cursorGap: 12,
    posTransition:
      "left 0.25s cubic-bezier(0.22, 1, 0.36, 1), top 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
    fadeTransition: "opacity 0.18s ease",
  },
  // 首渲 / 数据变更补间默认值（实时流场景应显式关闭动画）
  animation: { duration: 1200, easing: "easeOut" },
};

/**
 * 滚轮缩放纯函数：以光标为锚点缩放窗口
 * @param {{ start: number, end: number }} range 当前窗口（0–100）
 * @param {number} anchor 光标处百分比（0–100）
 * @param {number} deltaY 滚轮增量，>0 扩窗（拉远），<0 收窗（推近）
 * @returns {{ start: number, end: number }}
 */
export function applyWheelZoom(range, anchor, deltaY) {
  const { wheelFactor, minSpan } = INTERACTION.zoom;
  const factor = deltaY > 0 ? wheelFactor : 1 / wheelFactor;
  const span = range.end - range.start;
  const newSpan = Math.max(minSpan, Math.min(100, span * factor));
  const anchorRatio = span > 0 ? (anchor - range.start) / span : 0.5;
  let start = anchor - newSpan * anchorRatio;
  if (start < 0) start = 0;
  if (start + newSpan > 100) start = 100 - newSpan;
  return { start, end: start + newSpan };
}

/**
 * 光标语义（DESIGN 交互规范「指针与光标」）
 * @param {"plot"|"legend"|"toolbox"|"slider"|"other"} zone 命中区域
 * @param {boolean} dragging 滑块拖拽中
 */
export function resolveCursor(zone, dragging = false) {
  switch (zone) {
    case "plot":
      return "crosshair";
    case "legend":
    case "toolbox":
      return "pointer";
    case "slider":
      return dragging ? "grabbing" : "grab";
    default:
      return "default";
  }
}

/**
 * tooltip 行过滤纯函数：空值行不渲染（DESIGN 交互规范「tooltip 内容细则」）
 * @param {Array<{ value: unknown }>} params
 * @returns {Array} 过滤后的行
 */
export function pickTooltipRows(params) {
  if (!Array.isArray(params)) return params;
  return params.filter((p) => {
    const v = p.value;
    return !(v === null || v === undefined || (typeof v === "number" && Number.isNaN(v)));
  });
}
