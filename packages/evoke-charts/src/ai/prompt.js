// ─── 提示词契约：把数据与需求打包成给任意 LLM 的生成提示 ───
// 库不内置模型调用——宿主拿着这段提示词喂给自己的模型，把返回的 JSON
// 交给 validateOptions / lintChartSpec 自检后 setSpec 回放。

import { chartOptionsSchema } from "../schema";
import { parseDataTable } from "./table";
import { SPEC_RULES } from "./spec";

const PREVIEW_ROWS = 8;

export function buildChartPrompt({ data, requirement, extraRules = [] } = {}) {
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
  const rules = [...SPEC_RULES, ...extraRules];
  return [
    "你是图表配置生成器。根据下面的数据与需求，产出 EvChart 的 options JSON（下称 Spec），它将被 <ev-chart :options> 直接渲染。",
    `## Options Schema\n${JSON.stringify(chartOptionsSchema)}`,
    `## 数据预览\n${digest}`,
    requirement
      ? `## 需求\n${requirement}`
      : "## 需求\n根据数据形状自行选择最合适的图表类型，并拟一个不超过 12 字的标题。",
    `## 硬性规则\n${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`,
  ].join("\n\n");
}
