// ─── 提示词契约：把数据与需求打包成给任意 LLM 的生成提示 ───
// 库不内置模型调用——宿主拿着这段提示词喂给自己的模型，把返回的 JSON
// 交给 validateOptions / lintChartSpec 自检后 setSpec 回放。

import { chartOptionsSchema } from "../schema";
import { chart3dOptionsSchema } from "../3d/schema";
import { parseDataTable } from "./table";
import { SPEC_RULES } from "./spec";
import { SPEC_RULES_3D } from "./threed";
import { formatExamples, formatExamples3d } from "./examples";

const PREVIEW_ROWS = 8;

export function buildChartPrompt({ data, requirement, extraRules = [], examples = true, mode = "2d" } = {}) {
  const is3d = mode === "3d";
  const table = parseDataTable(data);
  let digest;
  if (table) {
    const head = table.headers.join(" | ");
    const body = table.rows
      .slice(0, PREVIEW_ROWS)
      .map((r) => table.headers.map((h) => (r[h] === null || r[h] === undefined ? "" : String(r[h]))).join(" | "))
      .join("\n");
    const more = table.rows.length > PREVIEW_ROWS ? `\n…共 ${table.rows.length} 行` : "";
    digest = `${head}\n${body}${more}`;
  } else if (data !== undefined && data !== null) {
    digest = typeof data === "string" ? data : JSON.stringify(data);
  } else {
    digest = "（未提供数据，请基于需求虚构合理示例数据）";
  }
  const rules = [...(is3d ? SPEC_RULES_3D : SPEC_RULES), ...extraRules];
  const sections = [
    is3d
      ? "你是三维图表配置生成器。根据下面的数据与需求，产出 EvChart3d 的 options JSON（下称 Spec），它将被 <ev-chart3d :options> 直接渲染（组件来自 @wil-works/evoke-charts/3d 子入口）。"
      : "你是图表配置生成器。根据下面的数据与需求，产出 EvChart 的 options JSON（下称 Spec），它将被 <ev-chart :options> 直接渲染。",
    `## Options Schema\n${JSON.stringify(is3d ? chart3dOptionsSchema : chartOptionsSchema)}`,
    `## 数据预览\n${digest}`,
  ];
  if (examples) {
    sections.push(`## 示例\n${is3d ? formatExamples3d() : formatExamples()}`);
  }
  sections.push(
    requirement
      ? `## 需求\n${requirement}`
      : "## 需求\n根据数据形状自行选择最合适的图表类型，并拟一个不超过 12 字的标题。",
  );
  sections.push(`## 硬性规则\n${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`);
  return sections.join("\n\n");
}
