// ─── 渲染自检：Spec 先无头渲染一遍，几何问题在交付前暴露 ───
// 三层检查：schema 校验 → 纯规则（焦点预算/扇区数量）→ 无头渲染的文本越界。
// 能自动修的直接修（返回修后的 spec 副本），修不了的记为 issue。

import { validateOptions } from "../schema";
import { renderChart, createSvgRecorder, estimateTextWidth } from "../renderer";

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

export function lintChartSpec(spec, opts = {}) {
  const issues = [];
  const fixed = { ...spec };
  if (!fixed || typeof fixed !== "object") {
    return { issues: [{ level: "error", message: "Spec 必须是对象" }], spec: fixed };
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

  // 4. 柱状类目拥挤：单系列且类目名均宽超出每档空间 → 自动改横向条形
  if (fixed.type === "bar" && Array.isArray(fixed.series) && fixed.series.length === 1 && Array.isArray(fixed.labels)) {
    const width = opts.width ?? DEFAULT_SIZE.width;
    const labels = fixed.labels.map(String);
    const maxLabelWidth = Math.max(...labels.map((l) => estimateTextWidth(l, 12)), 0);
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
      }
    } catch {
      issues.push({ level: "info", message: "无头渲染自检不可用，已跳过几何检查", rule: "headless-skipped" });
    }
  }

  return { issues, spec: fixed };
}
