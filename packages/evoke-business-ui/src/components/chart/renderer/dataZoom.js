import { roundRect } from "./core";
function getDataZoomConfig(options) {
  const zoom = options.dataZoom;
  if (!zoom?.enabled) return null;
  return zoom;
}
function getSliderGeometry(options, plotArea) {
  const zoom = getDataZoomConfig(options);
  if (!zoom) return null;
  const height = zoom.height || 40;
  const y = (zoom.position || "bottom") === "top" ? plotArea.y - height - 14 : plotArea.y + plotArea.height + 32;
  return { x: plotArea.x, y, width: plotArea.width, height };
}
function zoomToSlice(zoom, count) {
  const startIdx = Math.max(0, Math.min(count - 1, Math.floor(zoom.start / 100 * count)));
  const endIdx = Math.max(startIdx + 1, Math.min(count, Math.ceil(zoom.end / 100 * count)));
  return { startIdx, endIdx };
}
function windowToX(zoom, geo) {
  return {
    xStart: geo.x + zoom.start / 100 * geo.width,
    xEnd: geo.x + zoom.end / 100 * geo.width
  };
}
function xToPercent(x, geo) {
  return Math.max(0, Math.min(100, (x - geo.x) / geo.width * 100));
}
function renderDataZoomSlider(ctx, zoom) {
  const { ctx: canvasCtx, theme, plotArea, options, width } = ctx;
  const geo = getSliderGeometry(options, plotArea);
  if (!geo) return;
  canvasCtx.save();
  const visibleSeries = (options.series || []).filter((s) => !ctx.hiddenSeries.has(s.name));
  const previewSeries = visibleSeries[0];
  if (previewSeries && previewSeries.data.length > 0) {
    const data = previewSeries.data;
    const max = Math.max(...data.map((v) => v === null || Number.isNaN(v) ? 0 : v), 1);
    const barAreaHeight = geo.height - 18;
    const barWidth = Math.max(1, geo.width / data.length - 1);
    data.forEach((raw, i) => {
      const v = raw === null || Number.isNaN(raw) ? 0 : raw;
      const bx = geo.x + i / data.length * geo.width;
      const bh = Math.max(1, v / max * barAreaHeight);
      canvasCtx.fillStyle = theme.gridColor;
      canvasCtx.fillRect(bx, geo.y + geo.height - 6 - bh, barWidth, bh);
    });
  }
  const { xStart, xEnd } = windowToX(zoom, geo);
  const windowFill = theme.crosshairColor.includes("rgba") ? theme.crosshairColor.replace(/[\d.]+\)$/, "0.12)") : theme.crosshairColor + "1f";
  canvasCtx.fillStyle = theme.backgroundColor + "aa";
  canvasCtx.fillRect(geo.x, geo.y, xStart - geo.x, geo.height);
  canvasCtx.fillRect(xEnd, geo.y, geo.x + geo.width - xEnd, geo.height);
  canvasCtx.strokeStyle = theme.gridColor;
  canvasCtx.lineWidth = 1;
  roundRect(canvasCtx, geo.x, geo.y, geo.width, geo.height, 4);
  canvasCtx.stroke();
  canvasCtx.fillStyle = windowFill;
  roundRect(canvasCtx, xStart, geo.y, Math.max(2, xEnd - xStart), geo.height, 4);
  canvasCtx.fill();
  canvasCtx.strokeStyle = theme.crosshairColor;
  canvasCtx.lineWidth = 1;
  roundRect(canvasCtx, xStart, geo.y, Math.max(2, xEnd - xStart), geo.height, 4);
  canvasCtx.stroke();
  const handleW = 8;
  const handleH = 18;
  const handleY = geo.y + (geo.height - handleH) / 2;
  [xStart - handleW / 2, xEnd - handleW / 2].forEach((hx) => {
    roundRect(canvasCtx, hx, handleY, handleW, handleH, 3);
    canvasCtx.fillStyle = theme.crosshairColor;
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 1;
    canvasCtx.beginPath();
    canvasCtx.moveTo(hx + handleW / 2 - 2, handleY + 5);
    canvasCtx.lineTo(hx + handleW / 2 - 2, handleY + handleH - 5);
    canvasCtx.moveTo(hx + handleW / 2 + 2, handleY + 5);
    canvasCtx.lineTo(hx + handleW / 2 + 2, handleY + handleH - 5);
    canvasCtx.stroke();
  });
  canvasCtx.restore();
  void width;
}
export {
  getDataZoomConfig,
  getSliderGeometry,
  renderDataZoomSlider,
  windowToX,
  xToPercent,
  zoomToSlice
};
