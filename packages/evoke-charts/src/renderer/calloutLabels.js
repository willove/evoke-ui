// 环形类图表（饼图/环形图/旭日图）共用的外置引线标签：
// 扇区外缘 → 径向引线 → 横向折线 → 文本。左右分列、纵向防重叠，放不下即隐藏。
const CALLOUT_RADIAL_LEN = 14;
const CALLOUT_STUB_LEN = 12;
const CALLOUT_TEXT_GAP = 5;
const CALLOUT_MIN_GAP = 16;
const CALLOUT_MAX_SHIFT = 10;

/**
 * items: [{ angle, r, text }]（angle 扇区中角，r 引线锚点半径）
 * cfg: { canvasCtx, centerX, centerY, plotArea, theme } + 可选覆写
 */
function drawCalloutLabels(items, cfg) {
  const {
    canvasCtx,
    centerX,
    centerY,
    plotArea,
    theme,
    radialLen = CALLOUT_RADIAL_LEN,
    stubLen = CALLOUT_STUB_LEN,
    textGap = CALLOUT_TEXT_GAP,
    minGap = CALLOUT_MIN_GAP,
    maxShift = CALLOUT_MAX_SHIFT,
    font = "12px Inter, sans-serif",
    textColor = theme.textColor,
    lineColor = theme.textColorSecondary,
  } = cfg;
  if (!canvasCtx || items.length === 0) return;
  const topLimit = plotArea.y + 4;
  const bottomLimit = plotArea.y + plotArea.height - 4;
  const layoutSide = (side, sign) => {
    // 折线终点落在锚点的径向外侧，纵向下移量按最小间距逐条让位
    const sorted = side
      .map((it) => ({ ...it, y: centerY + Math.sin(it.angle) * (it.r + radialLen), visible: true }))
      .sort((a, b) => a.y - b.y);
    let lastY = -Infinity;
    sorted.forEach((it) => {
      let y = it.y;
      if (y < lastY + minGap) {
        const shifted = lastY + minGap;
        if (shifted - it.y <= maxShift && shifted <= bottomLimit) {
          y = shifted;
        } else {
          it.visible = false;
          return;
        }
      }
      if (y > bottomLimit || y < topLimit) {
        it.visible = false;
        return;
      }
      it.y = y;
      lastY = y;
    });
    sorted.forEach((it) => {
      if (!it.visible) return;
      const dirX = Math.cos(it.angle);
      const dirY = Math.sin(it.angle);
      const p1x = centerX + dirX * (it.r + radialLen);
      const p1y = centerY + dirY * (it.r + radialLen);
      const p2x = p1x + sign * stubLen;
      canvasCtx.save();
      canvasCtx.strokeStyle = lineColor;
      canvasCtx.lineWidth = 1;
      canvasCtx.beginPath();
      canvasCtx.moveTo(centerX + dirX * it.r, centerY + dirY * it.r);
      canvasCtx.lineTo(p1x, p1y);
      canvasCtx.lineTo(p2x, it.y);
      canvasCtx.stroke();
      canvasCtx.restore();
      canvasCtx.save();
      canvasCtx.fillStyle = textColor;
      canvasCtx.font = font;
      canvasCtx.textAlign = sign === 1 ? "left" : "right";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(it.text, p2x + sign * textGap, it.y);
      canvasCtx.restore();
    });
  };
  layoutSide(
    items.filter((it) => Math.cos(it.angle) >= 0),
    1,
  );
  layoutSide(
    items.filter((it) => Math.cos(it.angle) < 0),
    -1,
  );
}

export {
  CALLOUT_MAX_SHIFT,
  CALLOUT_MIN_GAP,
  CALLOUT_RADIAL_LEN,
  CALLOUT_STUB_LEN,
  CALLOUT_TEXT_GAP,
  drawCalloutLabels,
};
