// ─── AI 生成引擎出口 ───
export { parseDataTable, inferColumns, parseNumeric, looksLikeTime } from "./table";
export { generateChartSpec, detectIntent, SPEC_RULES } from "./spec";
export { SPEC_EXAMPLES, formatExamples } from "./examples";
export { buildChartPrompt } from "./prompt";
export { lintChartSpec } from "./lint";
