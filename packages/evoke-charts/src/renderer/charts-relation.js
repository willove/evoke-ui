import { estimateTextWidth, getContrastText, isLightColor, mixColor } from "./core";

// ─── 关系图族（桑基 / 韦恩 / 弦图 / 弧长连接图）───
// 共同纪律（DESIGN §3.5–3.7）：连接色按「源节点」槽位继承；悬浮走焦点单一通道
// （强调自身 / 相连，淡化其余），不做位移、不做阴影；渲染与命中共用一份布局口径。

const NODE_WIDTH = 14;
const NODE_GAP = 12;
const NODE_RADIUS = 3;
const SANKEY_LINK_ALPHA = 0.35;
const SANKEY_LINK_HOVER = 0.65;
const SANKEY_LINK_DIM = 0.12;
const VENN_FILL_ALPHA = 0.45;
const CHORD_RIBBON_ALPHA = 0.3;
const CHORD_RIBBON_HOVER = 0.7;
const CHORD_RIBBON_DIM = 0.1;
const ARC_LINK_ALPHA = 0.35;
const ARC_LINK_HOVER = 0.75;
const ARC_LINK_DIM = 0.12;

function isHidden(hiddenSeries, name) {
  return !!name && hiddenSeries.has(name);
}

/** 平滑步进（两端控制 y 相同的三次贝塞尔的精确 y 解）：桑基流带命中测试用 */
function smoothstep(t, a, b) {
  const s = t * t * (3 - 2 * t);
  return a + (b - a) * s;
}

/**
 * 桑基布局：节点按拓扑深度分列、列内垂直均分；节点高 = max(入流, 出流) 按全图
 * 最大值等比；流带宽度 = 流量 × 同一比例。渲染、图例与命中测试共用本口径。
 */
function computeSankeyLayout(plotArea, options, theme, hiddenSeries) {
  const data = options.sankeyData || {};
  const allNodes = (data.nodes || []).filter((n) => !isHidden(hiddenSeries, n.name));
  const nameSet = new Set(allNodes.map((n) => n.name));
  const links = (data.links || []).filter(
    (l) => nameSet.has(l.source) && nameSet.has(l.target) && Number.isFinite(l.value) && l.value > 0
  );
  if (allNodes.length === 0) return null;
  // 节点值缺省时由链接汇总：max(入流, 出流)，源/汇退到单侧
  const inSum = /* @__PURE__ */ new Map();
  const outSum = /* @__PURE__ */ new Map();
  links.forEach((l) => {
    outSum.set(l.source, (outSum.get(l.source) || 0) + l.value);
    inSum.set(l.target, (inSum.get(l.target) || 0) + l.value);
  });
  allNodes.forEach((n) => {
    if (typeof n.value === "number" && n.value > 0) return;
    n.value = Math.max(inSum.get(n.name) || 0, outSum.get(n.name) || 0);
  });
  // 拓扑深度（最长路）：迭代松弛，循环图天然收敛（深度封顶节点数）
  const depth = new Map(allNodes.map((n) => [n.name, 0]));
  for (let round = 0; round < allNodes.length; round++) {
    let changed = false;
    links.forEach((l) => {
      const d = depth.get(l.source) + 1;
      if (d > depth.get(l.target)) {
        depth.set(l.target, d);
        changed = true;
      }
    });
    if (!changed) break;
  }
  const maxDepth = Math.max(...depth.values());
  const valueMax = Math.max(1, ...allNodes.map((n) => n.value || 0), ...links.map((l) => l.value));
  const columnCount = maxDepth + 1;
  const scale = (plotArea.height * 0.82 - NODE_GAP * Math.max(0, columnCount - 1)) / valueMax;
  const xOfColumn = (col) =>
    plotArea.x + (col * (plotArea.width - NODE_WIDTH)) / Math.max(1, columnCount - 1);
  const nodes = allNodes.map((n, i) => ({
    node: n,
    name: n.name,
    color: n.color || theme.colors[i % theme.colors.length],
    col: depth.get(n.name) || 0,
    x: xOfColumn(depth.get(n.name) || 0),
    value: n.value || 0,
    height: Math.max(2, (n.value || 0) * scale),
  }));
  // 列内布局：总高 + 间隙居中
  const byCol = new Map();
  nodes.forEach((n) => {
    if (!byCol.has(n.col)) byCol.set(n.col, []);
    byCol.get(n.col).push(n);
  });
  byCol.forEach((list) => {
    const total = list.reduce((s, n) => s + n.height, 0) + NODE_GAP * (list.length - 1);
    let y = plotArea.y + Math.max(0, (plotArea.height - total) / 2);
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((n) => {
      n.y = y;
      y += n.height + NODE_GAP;
    });
  });
  const nodeByName = new Map(nodes.map((n) => [n.name, n]));
  // 流带两端偏移：源端按目标 y 排序、宿端按源 y 排序，减少交叉
  const outOffset = new Map(nodes.map((n) => [n.name, 0]));
  const inOffset = new Map(nodes.map((n) => [n.name, 0]));
  const sorted = [...links].sort(
    (a, b) => (nodeByName.get(a.source).y - nodeByName.get(b.source).y) || (nodeByName.get(a.target).y - nodeByName.get(b.target).y)
  );
  const ribbons = sorted.map((link, i) => {
    const src = nodeByName.get(link.source);
    const tgt = nodeByName.get(link.target);
    const w = Math.max(1, link.value * scale);
    const sy0 = src.y + (outOffset.get(src.name) || 0);
    const ty0 = tgt.y + (inOffset.get(tgt.name) || 0);
    outOffset.set(src.name, (outOffset.get(src.name) || 0) + w);
    inOffset.set(tgt.name, (inOffset.get(tgt.name) || 0) + w);
    return {
      link,
      index: i,
      source: src,
      target: tgt,
      color: src.color,
      width: w,
      x1: src.x + NODE_WIDTH,
      x2: tgt.x,
      sy0,
      sy1: sy0 + w,
      ty0,
      ty1: ty0 + w,
    };
  });
  // 节点总流量：优先出流，无出流（汇）用入流
  nodes.forEach((n) => {
    const out = ribbons.filter((r) => r.source === n).reduce((s, r) => s + r.link.value, 0);
    const inn = ribbons.filter((r) => r.target === n).reduce((s, r) => s + r.link.value, 0);
    n.total = out > 0 ? out : inn;
  });
  return { nodes, ribbons, columnCount, nodeWidth: NODE_WIDTH };
}

function renderSankeyChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries } = ctx;
  const layout = computeSankeyLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return;
  const { nodes, ribbons } = layout;
  // hoverIndex ≥ nodes.length 时命中的是流带（index = nodes.length + ribbonIndex）
  const hoverNode = hoverIndex >= 0 && hoverIndex < nodes.length ? nodes[hoverIndex] : null;
  const hoverRibbon = hoverIndex >= nodes.length ? ribbons[hoverIndex - nodes.length] : null;
  // 悬浮/出场统一按 hoverAnimProgress 在基准透明度与目标档之间缓动（DESIGN §13.2）
  const t = hoverAnimProgress;
  const lerp = (base, target) => base + (target - base) * t;
  const ribbonAlphaAt = (r) => {
    if (hoverRibbon) {
      const emphasized = r === hoverRibbon || r.source === hoverRibbon.source || r.target === hoverRibbon.target;
      return lerp(SANKEY_LINK_ALPHA, emphasized ? SANKEY_LINK_HOVER : SANKEY_LINK_DIM);
    }
    if (hoverNode) {
      const connected = r.source === hoverNode || r.target === hoverNode;
      return lerp(SANKEY_LINK_ALPHA, connected ? SANKEY_LINK_HOVER : SANKEY_LINK_DIM);
    }
    return SANKEY_LINK_ALPHA;
  };
  const nodeAlphaAt = (n) => {
    if (!hoverNode) return 1;
    const isHover = n === hoverNode;
    const connected = ribbons.some((r) => (r.source === hoverNode || r.target === hoverNode) && (r.source === n || r.target === n));
    return lerp(1, isHover || connected ? 1 : 0.55);
  };
  // 流带：水平三次贝塞尔带，宽度随 progress 展开
  const grow = progress;
  ribbons.forEach((r) => {
    const w = r.width * grow;
    const midX = (r.x1 + r.x2) / 2;
    canvasCtx.save();
    canvasCtx.globalAlpha = ribbonAlphaAt(r);
    canvasCtx.beginPath();
    canvasCtx.moveTo(r.x1, r.sy0);
    canvasCtx.bezierCurveTo(midX, r.sy0, midX, r.ty0, r.x2, r.ty0);
    canvasCtx.lineTo(r.x2, r.ty0 + w);
    canvasCtx.bezierCurveTo(midX, r.ty0 + w, midX, r.sy0 + w, r.x1, r.sy0 + w);
    canvasCtx.closePath();
    canvasCtx.fillStyle = r.color;
    canvasCtx.fill();
    canvasCtx.restore();
  });
  // 节点：圆角短柱 + 标签（首列右侧对齐节点右缘、末列左侧对齐、中间列居中节点上方）
  nodes.forEach((n) => {
    const h = n.height * grow;
    const isHover = n === hoverNode;
    canvasCtx.save();
    canvasCtx.globalAlpha = nodeAlphaAt(n);
    canvasCtx.beginPath();
    const r = Math.min(NODE_RADIUS, NODE_WIDTH / 2, h / 2);
    canvasCtx.moveTo(n.x, n.y);
    canvasCtx.lineTo(n.x + NODE_WIDTH - r, n.y);
    canvasCtx.quadraticCurveTo(n.x + NODE_WIDTH, n.y, n.x + NODE_WIDTH, n.y + r);
    canvasCtx.lineTo(n.x + NODE_WIDTH, n.y + h - r);
    canvasCtx.quadraticCurveTo(n.x + NODE_WIDTH, n.y + h, n.x + NODE_WIDTH - r, n.y + h);
    canvasCtx.lineTo(n.x, n.y + h);
    if (r > 0) {
      canvasCtx.quadraticCurveTo(n.x, n.y + h, n.x, n.y + h - r);
      canvasCtx.lineTo(n.x, n.y + r);
      canvasCtx.quadraticCurveTo(n.x, n.y, n.x + r, n.y);
    }
    canvasCtx.closePath();
    canvasCtx.fillStyle = isHover ? mixColor(n.color, 0.1, "#000000") : n.color;
    canvasCtx.fill();
    canvasCtx.restore();
    if (progress < 0.9) return;
    const label = n.name;
    canvasCtx.save();
    canvasCtx.font = "12px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    const isFirst = n.col === 0;
    const isLast = n.col === layout.columnCount - 1;
    const cy = n.y + h * grow / 2;
    if (isFirst && !isLast) {
      canvasCtx.textAlign = "left";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(label, n.x + NODE_WIDTH + 6, cy);
    } else if (isLast && !isFirst) {
      canvasCtx.textAlign = "right";
      canvasCtx.textBaseline = "middle";
      canvasCtx.fillText(label, n.x - 6, cy);
    } else {
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "bottom";
      canvasCtx.fillText(label, n.x + NODE_WIDTH / 2, n.y - 4);
    }
    canvasCtx.restore();
  });
}

/** 桑基命中：先节点矩形、后流带（平滑步进插值带内即命中） */
function sankeyHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries) {
  const layout = computeSankeyLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return null;
  const { nodes, ribbons } = layout;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (canvasX >= n.x - 2 && canvasX <= n.x + NODE_WIDTH + 2 && canvasY >= n.y - 2 && canvasY <= n.y + n.height + 2) {
      return {
        index: i,
        params: {
          seriesName: n.name,
          name: n.name,
          value: n.total || n.value,
          color: n.color,
          dataIndex: i,
          seriesIndex: 0
        }
      };
    }
  }
  for (let i = 0; i < ribbons.length; i++) {
    const r = ribbons[i];
    if (canvasX < Math.min(r.x1, r.x2) || canvasX > Math.max(r.x1, r.x2)) continue;
    const t = (canvasX - r.x1) / ((r.x2 - r.x1) || 1);
    const yTop = smoothstep(t, r.sy0, r.ty0);
    if (canvasY >= yTop - 2 && canvasY <= yTop + r.width + 2) {
      return {
        index: nodes.length + i,
        params: {
          seriesName: `${r.source.name} → ${r.target.name}`,
          name: `${r.source.name} → ${r.target.name}`,
          value: r.link.value,
          color: r.color,
          dataIndex: i,
          seriesIndex: 0
        }
      };
    }
  }
  return null;
}

/**
 * 韦恩布局：集合半径按 √值等面积映射；圆距按交集面积数值反解（二分），
 * 三集合用两两距离的三角形约束近似。渲染与命中共用本口径。
 */
function computeVennLayout(plotArea, options, theme) {
  const rows = options.vennData || [];
  const circles = rows
    .map((d) => ({ ...d, sets: d.sets && d.sets.length ? d.sets : [d.name] }))
    .filter((d) => d.sets.length === 1);
  if (circles.length === 0 || circles.length > 3) return null;
  const interRows = rows.filter((d) => d.sets && d.sets.length === 2);
  const valueMax = Math.max(...circles.map((d) => d.value || 0));
  if (!(valueMax > 0)) return null;
  // 主体放大（用户定则）：半径预算按集合数分档——1–2 集合圆占高度近半，
  // 3 集合留三角形展开余量；宽度只做溢出保护
  const setCount = circles.length;
  const R = Math.min(
    plotArea.height * (setCount >= 3 ? 0.3 : 0.46),
    plotArea.width * (setCount >= 3 ? 0.2 : 0.24)
  );
  const k = (R * R) / valueMax; // 面积比例因子：π r² = k·v
  const radiusOf = (v) => Math.sqrt((v || 0) * k / Math.PI);
  circles.forEach((c, i) => {
    c.r = radiusOf(c.value);
    c.color = c.color || theme.colors[i % theme.colors.length];
  });
  const byName = new Map(circles.map((c) => [c.name, c]));
  const interValue = (a, b) => {
    const row = interRows.find((d) => {
      const [x, y] = d.sets;
      return (x === a && y === b) || (x === b && y === a);
    });
    return row ? row.value || 0 : 0;
  };
  function distanceFor(a, b) {
    const target = interValue(a.name, b.name) * k;
    const r1 = a.r;
    const r2 = b.r;
    const areaAt = (d) => {
      if (d >= r1 + r2) return 0;
      if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
      const p1 = r1 * r1 * Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1));
      const p2 = r2 * r2 * Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
      const tri = -0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
      return p1 + p2 + tri;
    };
    if (target <= 0) return r1 + r2;
    if (target >= Math.PI * Math.min(r1, r2) ** 2) return Math.abs(r1 - r2);
    let lo = Math.abs(r1 - r2);
    let hi = r1 + r2;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (areaAt(mid) > target) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
  const cx0 = plotArea.x + plotArea.width / 2;
  const cy0 = plotArea.y + plotArea.height / 2;
  if (circles.length === 1) {
    circles[0].x = cx0;
    circles[0].y = cy0;
  } else if (circles.length === 2) {
    const d = distanceFor(circles[0], circles[1]);
    circles[0].x = cx0 - d / 2;
    circles[0].y = cy0;
    circles[1].x = cx0 + d / 2;
    circles[1].y = cy0;
  } else {
    const [c1, c2, c3] = circles;
    const d12 = distanceFor(c1, c2);
    let d13 = distanceFor(c1, c3);
    let d23 = distanceFor(c2, c3);
    // 三角不等式钳制：两两独立反解可能无解，收缩到可构三角形
    d13 = Math.min(Math.max(d13, Math.abs(d12 - d23) || 0), d12 + d23);
    d23 = Math.min(d23, d12 + d13);
    c1.x = 0; c1.y = 0;
    c2.x = d12; c2.y = 0;
    const ex = (d12 * d12 + d13 * d13 - d23 * d23) / (2 * d12);
    const ey = Math.sqrt(Math.max(0, d13 * d13 - ex * ex));
    c3.x = ex; c3.y = -ey; // 第三圆放上方，交叠区居中
    const mx = (c1.x + c2.x + c3.x) / 3;
    const my = (c1.y + c2.y + c3.y) / 3;
    circles.forEach((c) => { c.x += cx0 - mx; c.y += cy0 - my; });
  }
  const intersections = interRows
    .filter((d) => byName.has(d.sets[0]) && byName.has(d.sets[1]))
    .map((d, i) => {
      const a = byName.get(d.sets[0]);
      const b = byName.get(d.sets[1]);
      return { ...d, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, color: a.color, index: i };
    });
  return { circles, intersections, hollow: options.vennHollow === true };
}

function renderVennChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries } = ctx;
  const layout = computeVennLayout(plotArea, options, theme);
  if (!layout) return;
  const visible = layout.circles.filter((c) => !isHidden(hiddenSeries, c.name));
  const grow = 0.6 + 0.4 * progress;
  // hoverIndex < visible.length 命中圆；否则命中交集（两圆同时保持强调）
  const isIntersectionHover = hoverIndex >= visible.length;
  const hoverPair = isIntersectionHover ? layout.intersections[hoverIndex - visible.length] : null;
  visible.forEach((c, i) => {
    const isHover = i === hoverIndex;
    const inPair = hoverPair && (c.name === hoverPair.sets[0] || c.name === hoverPair.sets[1]);
    const dim = hoverIndex >= 0 && !isHover && !inPair;
    canvasCtx.save();
    canvasCtx.beginPath();
    canvasCtx.arc(c.x, c.y, c.r * grow, 0, Math.PI * 2);
    if (layout.hollow) {
      canvasCtx.globalAlpha = dim ? 1 - 0.55 * hoverAnimProgress : 1;
      canvasCtx.strokeStyle = c.color;
      canvasCtx.lineWidth = isHover || inPair ? 3 : 2;
      canvasCtx.stroke();
    } else {
      canvasCtx.globalAlpha = (isHover || inPair ? VENN_FILL_ALPHA + 0.15 : VENN_FILL_ALPHA) * (dim ? 1 - 0.55 * hoverAnimProgress : 1);
      canvasCtx.fillStyle = c.color;
      canvasCtx.fill();
      canvasCtx.globalAlpha = 1;
      canvasCtx.strokeStyle = c.color;
      canvasCtx.lineWidth = 1.5;
      canvasCtx.stroke();
    }
    canvasCtx.restore();
  });
  // 集合标签：圆心上方 r×0.4；能用正文色（近黑）就用正文色，深底才反白
  visible.forEach((c) => {
    if (progress < 0.9) return;
    canvasCtx.save();
    canvasCtx.font = "600 12px Inter, sans-serif";
    const labelColor = isLightColor(c.color) ? theme.textColor : getContrastText(c.color);
    canvasCtx.fillStyle = layout.hollow ? theme.textColor : labelColor;
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(c.name, c.x, c.y - c.r * 0.4);
    canvasCtx.restore();
  });
  // 交集数值：透镜中心
  layout.intersections.forEach((it) => {
    if (progress < 0.9 || it.value === undefined) return;
    canvasCtx.save();
    canvasCtx.font = "11px Inter, sans-serif";
    canvasCtx.fillStyle = layout.hollow ? theme.textColorSecondary : getContrastText(visible[0]?.color || "#175DFF");
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "middle";
    canvasCtx.fillText(String(it.value), it.x, it.y + 2);
    canvasCtx.restore();
  });
}

function vennHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries) {
  const layout = computeVennLayout(plotArea, options, theme);
  if (!layout) return null;
  const visible = layout.circles.filter((c) => !isHidden(hiddenSeries, c.name));
  // 命中交集：两圆都含该点的最小圆对
  const containing = visible.filter((c) => (canvasX - c.x) ** 2 + (canvasY - c.y) ** 2 <= c.r * c.r);
  if (containing.length >= 2) {
    const pair = layout.intersections.find(
      (it) => containing.some((c) => c.name === it.sets[0]) && containing.some((c) => c.name === it.sets[1])
    );
    if (pair) {
      const idx = layout.intersections.indexOf(pair);
      return {
        index: visible.length + idx,
        params: {
          seriesName: `${pair.sets[0]} ∩ ${pair.sets[1]}`,
          name: `${pair.sets[0]} ∩ ${pair.sets[1]}`,
          value: pair.value,
          color: pair.color,
          dataIndex: idx,
          seriesIndex: 0
        }
      };
    }
  }
  if (containing.length === 1) {
    const c = containing[0];
    const idx = visible.indexOf(c);
    return {
      index: idx,
      params: {
        seriesName: c.name,
        name: c.name,
        value: c.value,
        color: c.color,
        dataIndex: idx,
        seriesIndex: 0
      }
    };
  }
  return null;
}

/** 弦图/弧长图共用的数据归一：隐藏节点后只留两端可见的关系 */
function normalizeRelation(data, hiddenSeries) {
  const nodes = ((data && data.nodes) || []).filter((n) => !isHidden(hiddenSeries, n.name));
  const nameSet = new Set(nodes.map((n) => n.name));
  const links = ((data && data.links) || []).filter(
    (l) => nameSet.has(l.source) && nameSet.has(l.target) && Number.isFinite(l.value) && l.value > 0
  );
  return { nodes, links };
}

/**
 * 弦图布局：节点弧长默认均布（chordByValue 时按值占比），连接带过圆心；
 * 带宽 = 关系值 / 最大值 × R×0.14；采样折线随布局预计算供命中测试。
 * chordMode: 'curve' 切弧形环状形态——节点为圆点、关系为过圆心弧线（描边）。
 */
function computeChordLayout(plotArea, options, theme, hiddenSeries) {
  const { nodes, links } = normalizeRelation(options.chordData, hiddenSeries);
  if (nodes.length === 0) return null;
  const cx = plotArea.x + plotArea.width / 2;
  const cy = plotArea.y + plotArea.height / 2;
  // 半径预算：外侧仅留标签带（18px 文字 + 12px 余量），主体尽量大
  const R = Math.max(40, Math.min(plotArea.width, plotArea.height) / 2 - 30);
  const mode = options.chordMode === "curve" ? "curve" : "band";
  const valueMax = Math.max(1, ...links.map((l) => l.value));
  const byValue = options.chordByValue === true;
  const nodeValue = (n) => {
    if (byValue) {
      const own = links.filter((l) => l.source === n.name || l.target === n.name).reduce((s, l) => s + l.value, 0);
      return own > 0 ? own : 1;
    }
    return 1;
  };
  const GAP = 2 * Math.PI / 180;
  const totalValue = nodes.reduce((s, n) => s + nodeValue(n), 0);
  const arcTotal = Math.PI * 2 - GAP * nodes.length;
  const polar = (angle, r) => [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  let a = -Math.PI / 2;
  const nodeArcs = nodes.map((n, i) => {
    const span = arcTotal * nodeValue(n) / totalValue;
    const arc = {
      node: n,
      name: n.name,
      color: n.color || theme.colors[i % theme.colors.length],
      startAngle: a,
      endAngle: a + span,
      midAngle: a + span / 2,
      value: nodeValue(n),
    };
    a += span + GAP;
    return arc;
  });
  const arcByName = new Map(nodeArcs.map((n) => [n.name, n]));
  const outOffset = new Map(nodeArcs.map((n) => [n.name, 0]));
  const sorted = [...links].sort(
    (x, y) => arcByName.get(x.source).midAngle - arcByName.get(y.source).midAngle || arcByName.get(x.target).midAngle - arcByName.get(y.target).midAngle
  );
  const ribbons = sorted.map((link, i) => {
    const src = arcByName.get(link.source);
    const tgt = arcByName.get(link.target);
    const angularW = (link.value / valueMax) * (R * 0.14) / R;
    // curve 形态连线锚在节点圆点上（midAngle）；band 形态锚在弧段内按序偏移
    const s0 = mode === "curve" ? src.midAngle : src.startAngle + (outOffset.get(src.name) || 0);
    const t0 = mode === "curve" ? tgt.midAngle : tgt.startAngle + (outOffset.get(tgt.name) || 0);
    outOffset.set(src.name, (outOffset.get(src.name) || 0) + angularW);
    outOffset.set(tgt.name, (outOffset.get(tgt.name) || 0) + angularW);
    const [ax, ay] = polar(s0, R);
    const [bx, by] = polar(t0, R);
    const s1 = s0 + angularW;
    const t1 = t0 + angularW;
    // 采样过圆心的三次贝塞尔（渲染同形），折线供命中测试
    const samples = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const q = 1 - t;
      const [p0x, p0y] = polar(s0 + (s1 - s0) * t, R);
      const [p1x, p1y] = polar(t0 + (t1 - t0) * t, R);
      samples.push([
        q * q * q * p0x + 3 * q * q * t * cx + 3 * q * t * t * cx + t * t * t * p1x,
        q * q * q * p0y + 3 * q * q * t * cy + 3 * q * t * t * cy + t * t * t * p1y,
      ]);
    }
    return {
      link,
      index: i,
      source: src,
      target: tgt,
      color: src.color,
      halfWidth: (link.value / valueMax) * (R * 0.14) / 2,
      // curve 形态的描边宽（1.5–6 线性映射，同弧长连接图）
      lineWidth: 1.5 + (link.value / valueMax) * 4.5,
      samples,
      ax, ay, bx, by,
      s0, s1, t0, t1,
    };
  });
  return { cx, cy, R, nodeArcs, ribbons, mode };
}

function renderChordChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries } = ctx;
  const layout = computeChordLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return;
  const { cx, cy, R, nodeArcs, ribbons, mode } = layout;
  const hoverRibbon = hoverIndex >= nodeArcs.length ? ribbons[hoverIndex - nodeArcs.length] : null;
  const hoverNode = hoverIndex >= 0 && hoverIndex < nodeArcs.length ? nodeArcs[hoverIndex] : null;
  const sweep = Math.PI * 2 * progress;
  // 悬浮/出场按 hoverAnimProgress 缓动（DESIGN §13.2 关系图族统一）
  const t = hoverAnimProgress;
  const lerp = (base, target) => base + (target - base) * t;
  const ribbonAlphaAt = (r) => {
    if (hoverRibbon) return lerp(CHORD_RIBBON_ALPHA, r === hoverRibbon ? CHORD_RIBBON_HOVER : CHORD_RIBBON_DIM);
    if (hoverNode) return lerp(CHORD_RIBBON_ALPHA, r.source === hoverNode || r.target === hoverNode ? CHORD_RIBBON_HOVER : CHORD_RIBBON_DIM);
    return CHORD_RIBBON_ALPHA;
  };
  const nodeAlphaAt = (n) => {
    if (!hoverNode) return 1;
    const connected = ribbons.some((r) => (r.source === hoverNode || r.target === hoverNode) && (r.source === n || r.target === n));
    return lerp(1, n === hoverNode || connected ? 1 : 0.35);
  };
  if (mode === "curve") {
    // 弧形环状：节点圆点 + 过圆心弧线（描边，宽按关系值）
    ribbons.forEach((r) => {
      if (r.s0 > sweep && r.t0 > sweep) return;
      canvasCtx.save();
      canvasCtx.globalAlpha = ribbonAlphaAt(r);
      canvasCtx.strokeStyle = r.color;
      canvasCtx.lineWidth = r.lineWidth * progress;
      canvasCtx.lineCap = "round";
      canvasCtx.beginPath();
      canvasCtx.moveTo(r.samples[0][0], r.samples[0][1]);
      for (let k = 1; k < r.samples.length; k++) canvasCtx.lineTo(r.samples[k][0], r.samples[k][1]);
      canvasCtx.stroke();
      canvasCtx.restore();
    });
    nodeArcs.forEach((n) => {
      if (n.startAngle > sweep) return;
      const [x, y] = [cx + Math.cos(n.midAngle) * R, cy + Math.sin(n.midAngle) * R];
      const isHover = n === hoverNode;
      canvasCtx.save();
      canvasCtx.globalAlpha = nodeAlphaAt(n);
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, isHover ? 7.5 : 6, 0, Math.PI * 2);
      canvasCtx.fillStyle = isHover ? mixColor(n.color, 0.1, "#000000") : n.color;
      canvasCtx.fill();
      canvasCtx.strokeStyle = theme.backgroundColor;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
      canvasCtx.restore();
    });
  } else {
    ribbons.forEach((r) => {
      if (r.s0 > sweep && r.t0 > sweep) return;
      canvasCtx.save();
      canvasCtx.globalAlpha = ribbonAlphaAt(r);
      canvasCtx.beginPath();
      const [p0x, p0y] = [cx + Math.cos(r.s0) * R, cy + Math.sin(r.s0) * R];
      const [p1x, p1y] = [cx + Math.cos(r.t0) * R, cy + Math.sin(r.t0) * R];
      const [p2x, p2y] = [cx + Math.cos(r.t1) * R, cy + Math.sin(r.t1) * R];
      const [p3x, p3y] = [cx + Math.cos(r.s1) * R, cy + Math.sin(r.s1) * R];
      canvasCtx.moveTo(p0x, p0y);
      canvasCtx.bezierCurveTo(cx, cy, cx, cy, p1x, p1y);
      canvasCtx.lineTo(p2x, p2y);
      canvasCtx.bezierCurveTo(cx, cy, cx, cy, p3x, p3y);
      canvasCtx.closePath();
      canvasCtx.fillStyle = r.color;
      canvasCtx.fill();
      canvasCtx.restore();
    });
    nodeArcs.forEach((n) => {
      if (n.startAngle > sweep) return;
      const end = Math.min(n.endAngle, -Math.PI / 2 + sweep);
      const isHover = n === hoverNode;
      canvasCtx.save();
      canvasCtx.globalAlpha = nodeAlphaAt(n);
      canvasCtx.beginPath();
      canvasCtx.arc(cx, cy, R, n.startAngle, end);
      canvasCtx.strokeStyle = isHover ? mixColor(n.color, 0.1, "#000000") : n.color;
      canvasCtx.lineWidth = 10;
      canvasCtx.lineCap = "round";
      canvasCtx.stroke();
      canvasCtx.restore();
    });
  }
  nodeArcs.forEach((n) => {
    if (progress < 0.9) return;
    const [lx, ly] = [cx + Math.cos(n.midAngle) * (R + 18), cy + Math.sin(n.midAngle) * (R + 18)];
    canvasCtx.save();
    canvasCtx.font = "12px Inter, sans-serif";
    canvasCtx.fillStyle = theme.textColorSecondary;
    const cos = Math.cos(n.midAngle);
    canvasCtx.textAlign = cos > 0.15 ? "left" : cos < -0.15 ? "right" : "center";
    canvasCtx.textBaseline = Math.sin(n.midAngle) > 0.15 ? "top" : Math.sin(n.midAngle) < -0.15 ? "bottom" : "middle";
    canvasCtx.fillText(n.name, lx, ly);
    canvasCtx.restore();
  });
}

function chordHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries) {
  const layout = computeChordLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return null;
  const { cx, cy, R, nodeArcs, ribbons } = layout;
  for (let i = 0; i < nodeArcs.length; i++) {
    const n = nodeArcs[i];
    const dx = canvasX - cx;
    const dy = canvasY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= R - 7 && dist <= R + 7) {
      let ang = Math.atan2(dy, dx);
      const base = n.startAngle;
      let rel = ang - base;
      while (rel < -Math.PI) rel += Math.PI * 2;
      while (rel > Math.PI) rel -= Math.PI * 2;
      if (rel >= -0.01 && rel <= n.endAngle - n.startAngle + 0.01) {
        return {
          index: i,
          params: {
            seriesName: n.name,
            name: n.name,
            value: n.value,
            color: n.color,
            dataIndex: i,
            seriesIndex: 0
          }
        };
      }
    }
  }
  for (let i = 0; i < ribbons.length; i++) {
    const r = ribbons[i];
    const limit = r.halfWidth + 4;
    for (let k = 0; k < r.samples.length; k++) {
      const [sx, sy] = r.samples[k];
      if ((canvasX - sx) ** 2 + (canvasY - sy) ** 2 <= limit * limit) {
        return {
          index: nodeArcs.length + i,
          params: {
            seriesName: `${r.source.name} ↔ ${r.target.name}`,
            name: `${r.source.name} ↔ ${r.target.name}`,
            value: r.link.value,
            color: r.color,
            dataIndex: i,
            seriesIndex: 0
          }
        };
      }
    }
  }
  return null;
}

/** 弧长连接图布局：节点均布水平轴，连接为上半椭圆弧，粗细按关系值线性映射 */
function computeArcLayout(plotArea, options, theme, hiddenSeries) {
  const { nodes, links } = normalizeRelation(options.arcData, hiddenSeries);
  if (nodes.length === 0) return null;
  // 构图（用户回访定则）：节点行 + 标签带贴绘图区底部，中部全高让给弧区，
  // 弧顶距绘图区顶 ≥ 24px（不压标题）——不再上浮居中留出大片底部死空间
  const labelBand = 30;
  const topGap = 24;
  const axisY = plotArea.y + Math.max(40, plotArea.height - labelBand);
  const step = plotArea.width / nodes.length;
  const valueMax = Math.max(1, ...links.map((l) => l.value));
  const nodePts = nodes.map((n, i) => ({
    node: n,
    name: n.name,
    color: n.color || theme.colors[i % theme.colors.length],
    x: plotArea.x + (i + 0.5) * step,
    y: axisY,
    value: links.filter((l) => l.source === n.name || l.target === n.name).reduce((s, l) => s + l.value, 0),
  }));
  const byName = new Map(nodePts.map((n) => [n.name, n]));
  const arcs = links.map((link, i) => {
    const a = byName.get(link.source);
    const b = byName.get(link.target);
    const dist = Math.abs(b.x - a.x);
    const left = a.x <= b.x ? a : b;
    const right = a.x <= b.x ? b : a;
    // 弧顶 = axisY - 0.75·cy，钳制后峰值距绘图区顶 ≥ topGap
    const cy = Math.min(dist * 0.45, (axisY - plotArea.y - topGap) / 0.75);
    const width = 1.5 + (link.value / valueMax) * 4.5;
    const samples = [];
    const x1 = left.x;
    const x2 = right.x;
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const q = 1 - t;
      samples.push([
        q * q * q * x1 + 3 * q * q * t * x1 + 3 * q * t * t * x2 + t * t * t * x2,
        q * q * q * axisY + 3 * q * q * t * (axisY - cy) + 3 * q * t * t * (axisY - cy) + t * t * t * axisY,
      ]);
    }
    return {
      link,
      index: i,
      source: a,
      target: b,
      color: a.color,
      width,
      cy,
      samples,
      x1, x2,
    };
  });
  return { nodes: nodePts, arcs, axisY };
}

function renderArcChart(ctx) {
  const { ctx: canvasCtx, theme, plotArea, options, progress, hoverIndex, hoverAnimProgress = 1, hiddenSeries } = ctx;
  const layout = computeArcLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return;
  const { nodes, arcs, axisY } = layout;
  const hoverArc = hoverIndex >= nodes.length ? arcs[hoverIndex - nodes.length] : null;
  const hoverNode = hoverIndex >= 0 && hoverIndex < nodes.length ? nodes[hoverIndex] : null;
  // 悬浮/出场按 hoverAnimProgress 缓动（DESIGN §13.2 关系图族统一）
  const t = hoverAnimProgress;
  const lerp = (base, target) => base + (target - base) * t;
  const alphaAt = (a) => {
    if (hoverArc) return lerp(ARC_LINK_ALPHA, a === hoverArc ? ARC_LINK_HOVER : ARC_LINK_DIM);
    if (hoverNode) return lerp(ARC_LINK_ALPHA, a.source === hoverNode || a.target === hoverNode ? ARC_LINK_HOVER : ARC_LINK_DIM);
    return ARC_LINK_ALPHA;
  };
  arcs.forEach((a) => {
    canvasCtx.save();
    canvasCtx.globalAlpha = alphaAt(a);
    canvasCtx.strokeStyle = a.color;
    canvasCtx.lineWidth = a.width * progress;
    canvasCtx.lineCap = "round";
    canvasCtx.beginPath();
    canvasCtx.moveTo(a.x1, axisY);
    canvasCtx.bezierCurveTo(a.x1, axisY - a.cy, a.x2, axisY - a.cy, a.x2, axisY);
    canvasCtx.stroke();
    canvasCtx.restore();
  });
  // 节点圆点 + 竖刻度 + 名称
  nodes.forEach((n) => {
    const isHover = n === hoverNode;
    const connected = hoverNode && arcs.some((a) => (a.source === hoverNode || a.target === hoverNode) && (a.source === n || a.target === n));
    const nodeTarget = isHover || connected ? 1 : 0.35;
    canvasCtx.save();
    canvasCtx.globalAlpha = hoverNode ? lerp(1, nodeTarget) : 1;
    canvasCtx.beginPath();
    canvasCtx.arc(n.x, axisY, isHover ? 7.5 : 6, 0, Math.PI * 2);
    canvasCtx.fillStyle = n.color;
    canvasCtx.fill();
    canvasCtx.strokeStyle = theme.backgroundColor;
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = theme.gridColor;
    canvasCtx.lineWidth = 1;
    canvasCtx.moveTo(n.x, axisY + 10);
    canvasCtx.lineTo(n.x, axisY + 16);
    canvasCtx.stroke();
    if (progress >= 0.9) {
      let label = n.name;
      canvasCtx.font = "12px Inter, sans-serif";
      const maxW = (plotArea.width / nodes.length) - 6;
      if (canvasCtx.measureText(label).width > maxW) {
        let lo = 0, hi = label.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          if (canvasCtx.measureText(label.slice(0, mid) + "…").width > maxW) hi = mid - 1;
          else lo = mid;
        }
        label = label.slice(0, lo) + "…";
      }
      canvasCtx.fillStyle = theme.textColorSecondary;
      canvasCtx.textAlign = "center";
      canvasCtx.textBaseline = "top";
      canvasCtx.fillText(label, n.x, axisY + 20);
    }
    canvasCtx.restore();
  });
}

function arcHitTest(canvasX, canvasY, plotArea, options, theme, hiddenSeries) {
  const layout = computeArcLayout(plotArea, options, theme, hiddenSeries);
  if (!layout) return null;
  const { nodes, arcs } = layout;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if ((canvasX - n.x) ** 2 + (canvasY - n.y) ** 2 <= 100) {
      return {
        index: i,
        params: {
          seriesName: n.name,
          name: n.name,
          value: n.value,
          color: n.color,
          dataIndex: i,
          seriesIndex: 0
        }
      };
    }
  }
  for (let i = 0; i < arcs.length; i++) {
    const a = arcs[i];
    const limit = a.width / 2 + 4;
    for (let k = 0; k < a.samples.length; k++) {
      const [sx, sy] = a.samples[k];
      if ((canvasX - sx) ** 2 + (canvasY - sy) ** 2 <= limit * limit) {
        return {
          index: nodes.length + i,
          params: {
            seriesName: `${a.source.name} ↔ ${a.target.name}`,
            name: `${a.source.name} ↔ ${a.target.name}`,
            value: a.link.value,
            color: a.color,
            dataIndex: i,
            seriesIndex: 0
          }
        };
      }
    }
  }
  return null;
}

export {
  ARC_LINK_ALPHA,
  CHORD_RIBBON_ALPHA,
  NODE_WIDTH,
  SANKEY_LINK_ALPHA,
  VENN_FILL_ALPHA,
  arcHitTest,
  computeArcLayout,
  computeChordLayout,
  computeSankeyLayout,
  computeVennLayout,
  chordHitTest,
  renderArcChart,
  renderChordChart,
  renderSankeyChart,
  renderVennChart,
  sankeyHitTest,
  vennHitTest,
  estimateTextWidth
};
