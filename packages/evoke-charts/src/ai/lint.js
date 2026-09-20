// ─── 渲染自检：Spec 先无头渲染一遍，几何问题在交付前暴露 ───
// 三层检查：schema 校验 → 纯规则（焦点预算/扇区数量）→ 无头渲染的文本越界。
// 能自动修的直接修（返回修后的 spec 副本），修不了的记为 issue。

import { validateOptions } from "../schema";
import { validateOptions3d } from "../3d/schema";
import { renderChart, createSvgRecorder, estimateTextWidth, getTheme } from "../renderer";
import { maxOf } from "../extent";

const DEFAULT_SIZE = { width: 800, height: 450 };

function checkTextOverflow(svg, width, height) {
  const issues = [];
  let count = 0;
  for (const m of svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"/g)) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    if (x < -1 || x > width + 1 || y < 0 || y > height + 1) count++;
  }
  if (count > 0) {
    issues.push({ level: "warn", message: `${count} 处文本超出画布边界（可能被裁剪）`, rule: "text-overflow" });
  }
  return issues;
}

// 同一基线带内的两两碰撞（含轴标签拥挤、注解互相遮挡）；重叠超短边 30% 记一次
function checkTextOverlap(svg) {
  const issues = [];
  const texts = [];
  for (const m of svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)"([^>]*)>([^<]*)<\/text>/g)) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const fs = parseFloat(m[3]);
    const attrs = m[4];
    const content = m[5].trim();
    if (!content) continue;
    const w = estimateTextWidth(content, fs);
    let left = x;
    if (/text-anchor="middle"/.test(attrs)) left = x - w / 2;
    else if (/text-anchor="end"/.test(attrs)) left = x - w;
    texts.push({ left, right: left + w, y, fs });
  }
  let count = 0;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      if (Math.abs(a.y - b.y) >= Math.max(a.fs, b.fs) * 0.8) continue;
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (overlapX > Math.min(a.right - a.left, b.right - b.left) * 0.3) count++;
    }
  }
  if (count > 0) {
    issues.push({ level: "warn", message: `${count} 处文本相互重叠（标签或注解可能互相遮挡）`, rule: "text-overlap" });
  }
  return issues;
}

// WCAG 相对亮度与对比度（图形阈值 3:1）；非 hex 色值跳过
function luminance(color) {
  let s = String(color).trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) s = s.slice(1);
  else if (/^#[0-9a-fA-F]{3}$/.test(s)) s = s.slice(1).split("").map((c) => c + c).join("");
  else return null;
  const n = parseInt(s, 16);
  const chan = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}
function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
// 默认色板是库级验证过的，只有 spec 自带 theme.colors 才查
function checkPaletteContrast(spec) {
  const issues = [];
  if (!spec.theme || !Array.isArray(spec.theme.colors)) return issues;
  [false, true].forEach((dark) => {
    const theme = getTheme(dark, spec.theme, spec.palette);
    spec.theme.colors.forEach((c) => {
      const ratio = contrastRatio(c, theme.backgroundColor);
      if (ratio !== null && ratio < 3) {
        issues.push({
          level: "warn",
          message: `自定义色板${dark ? "暗色" : "浅色"}模式对比度不足 3:1：${c}（${ratio.toFixed(1)}）`,
          rule: "low-contrast",
        });
      }
    });
  });
  return issues;
}

export function lintChartSpec(spec, opts = {}) {
  const issues = [];
  const fixed = { ...spec };
  if (!fixed || typeof fixed !== "object") {
    return { issues: [{ level: "error", message: "Spec 必须是对象" }], spec: fixed };
  }

  // 三维篇章 spec：type 以 3d 结尾 → 委托三维 schema 校验（二维规则与无头渲染不适用）
  if (typeof fixed.type === "string" && /3d$/.test(fixed.type)) {
    const { warnings } = validateOptions3d(fixed);
    warnings.forEach((w) => issues.push({ level: "error", message: `${w.path} ${w.message}`, path: w.path }));
    if (!issues.length) {
      issues.push({ level: "info", message: "三维 spec 已过 schema 校验（几何层自检仅覆盖二维图型）", rule: "threed-schema-only" });
    }
    return { issues, spec: fixed };
  }

  // 1. schema 校验
  const { warnings } = validateOptions(fixed);
  warnings.forEach((w) => issues.push({ level: "error", message: `${w.path} ${w.message}`, path: w.path }));
  if (issues.some((i) => i.level === "error" && i.path === "options.type")) {
    return { issues, spec: fixed };
  }

  // 2. 焦点预算：注解 ≤3、emphasis 焦点唯一
  if (Array.isArray(fixed.annotations) && fixed.annotations.length > 3) {
    fixed.annotations = fixed.annotations.slice(0, 3);
    issues.push({ level: "info", message: "注解超过 3 处，已按焦点预算裁剪", rule: "annotation-budget" });
  }

  // 3. 饼类扇区数量：>8 物理可读性差，建议改条形
  if ((fixed.type === "pie" || fixed.type === "doughnut") && Array.isArray(fixed.pieData) && fixed.pieData.length > 8) {
    issues.push({ level: "warn", message: `饼图 ${fixed.pieData.length} 个扇区过多（>8），建议改用横向条形图`, rule: "pie-slices" });
  }

  // 3.5 自定义色板对比度：明暗两套背景各自过 WCAG 图形阈值
  issues.push(...checkPaletteContrast(fixed));

  // 4. 柱状类目拥挤：单系列且类目名均宽超出每档空间 → 自动改横向条形
  if (fixed.type === "bar" && Array.isArray(fixed.series) && fixed.series.length === 1 && Array.isArray(fixed.labels)) {
    const width = opts.width ?? DEFAULT_SIZE.width;
    const labels = fixed.labels.map(String);
    const maxLabelWidth = maxOf(labels.map((l) => estimateTextWidth(l, 12)), 0);
    const slots = Math.max(1, (width - 80) / Math.max(1, labels.length));
    if (labels.length >= 7 && maxLabelWidth > slots * 0.9) {
      fixed.type = "horizontal-bar";
      issues.push({ level: "info", message: "类目名过宽拥挤，已自动改为横向条形图", rule: "bar-to-horizontal" });
    }
  }

  // 5. 无头渲染：文本越界检查（无 DOM 环境时跳过）
  if (typeof document !== "undefined" && fixed.type) {
    try {
      const width = opts.width ?? DEFAULT_SIZE.width;
      const height = opts.height ?? DEFAULT_SIZE.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const real = canvas.getContext("2d");
      if (real) {
        const recorder = createSvgRecorder(real);
        renderChart(canvas, {
          options: fixed,
          ctx: recorder.ctx,
          dpr: 1,
          progress: 1,
          hoverIndex: -1,
          mouseX: -1,
          mouseY: -1,
          showCrosshair: false,
        });
        issues.push(...checkTextOverflow(recorder.toSvg(width, height, "#ffffff"), width, height));
        issues.push(...checkTextOverlap(recorder.toSvg(width, height, "#ffffff")));
      }
    } catch {
      issues.push({ level: "info", message: "无头渲染自检不可用，已跳过几何检查", rule: "headless-skipped" });
    }
  }

  return { issues, spec: fixed };
}
