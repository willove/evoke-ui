// ─── AI 生成引擎出口 ───
export { parseDataTable, inferColumns, parseNumeric, looksLikeTime } from "./table";
export { generateChartSpec, detectIntent, SPEC_RULES } from "./spec";
export { buildChartPrompt } from "./prompt";
export { lintChartSpec } from "./lint";
