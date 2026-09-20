// ─── AI 生成引擎出口 ───
export { parseDataTable, inferColumns, parseNumeric, looksLikeTime } from "./table";
export { generateChartSpec, detectIntent, SPEC_RULES } from "./spec";
export { wantsThreed, planThreed, SPEC_RULES_3D } from "./threed";
export { SPEC_EXAMPLES, formatExamples, SPEC_EXAMPLES_3D, formatExamples3d } from "./examples";
export { buildChartPrompt } from "./prompt";
export { lintChartSpec } from "./lint";
export { chartOptionsSchema, validateOptions } from "../schema";
