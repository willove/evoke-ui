# AI 生成

让图表从数据与一句话需求里长出来：粘贴表格数据，引擎自动识别列类型（时间 / 数值 / 类目）、选择图表类型、映射字段并渲染；描述里带「趋势 / 占比 / 排行 / 堆叠 / 关系」等意图词时按意图选型，留空则按数据形状推断。要接自己的大模型？`buildChartPrompt()` 产出标准提示词，模型返回的 JSON 过一遍 `lintChartSpec()` 自检修正，`setSpec()` 回放即得图。

## 数据直生

下面是一个可编辑的完整闭环：改表格或改描述，点「生成图表」——列推断、选型理由与自检结论全部可见。

<script setup>
import { ref } from 'vue'
import { generateChartSpec, lintChartSpec } from '@wil-works/evoke-charts'

const SAMPLE = `月份,线上商城,线下门店,社群团购
1月,320,280,120
2月,356,302,98
3月,401,346,131
4月,388,331,145
5月,520,352,167
6月,560,428,183`

const csvText = ref(SAMPLE)
const desc = ref('')
const chartRef = ref()
const report = ref([])
const specJson = ref('')
const errorText = ref('')

function runGenerate() {
  errorText.value = ''
  const { spec, report: gen } = generateChartSpec(csvText.value, {
    hint: desc.value,
    title: desc.value ? undefined : '渠道月度销售额',
    narrative: true,
  })
  if (!spec) {
    errorText.value = gen[0]?.message || '生成失败：请检查数据格式'
    report.value = gen
    return
  }
  const { issues, spec: fixed } = lintChartSpec(spec)
  chartRef.value?.setSpec(fixed)
  report.value = [...gen, ...issues]
  specJson.value = JSON.stringify(fixed, null, 2)
}

const first = generateChartSpec(SAMPLE, { title: '渠道月度销售额', narrative: true })
const { spec: firstSpec, issues: firstIssues } = lintChartSpec(first.spec)
report.value = [...first.report, ...firstIssues]
specJson.value = JSON.stringify(firstSpec, null, 2)
</script>

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <textarea
      v-model="csvText"
      rows="8"
      spellcheck="false"
      style="width: 100%; box-sizing: border-box; padding: 10px 12px; font: 12px/1.7 ui-monospace, monospace; border: 1px solid var(--cd-border, #e5e7eb); border-radius: 8px; background: var(--cd-bg, #fff); color: inherit; resize: vertical;"
    >{{ csvText }}</textarea>
    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
      <input
        v-model="desc"
        placeholder="一句话描述，如：各渠道销售额对比 / 看走势 / 渠道占比"
        style="flex: 1; min-width: 220px; height: 36px; padding: 0 12px; border: 1px solid var(--cd-border, #e5e7eb); border-radius: 8px; background: var(--cd-bg, #fff); color: inherit;"
      />
      <ev-button type="primary" @click="runGenerate">生成图表</ev-button>
    </div>
    <p v-if="errorText" style="margin: 0; font-size: 13px; color: #dc2626;">{{ errorText }}</p>
  </div>
  <ev-chart ref="chartRef" :options="firstSpec" :height="300" style="margin-top: 14px;" />
  <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 4px;">
    <p v-for="(r, i) in report" :key="i" style="margin: 0; font-size: 12px; color: #94a3b8;">
      {{ r.level === 'error' ? '✕' : r.level === 'warn' ? '⚠' : '·' }} {{ r.message }}
    </p>
  </div>
  <details style="margin-top: 10px;">
    <summary style="cursor: pointer; font-size: 12px; color: #94a3b8;">查看生成的 Spec</summary>
    <pre style="margin-top: 8px; padding: 12px; font-size: 12px; line-height: 1.7; overflow: auto; border-radius: 8px; background: var(--vp-code-block-bg, #f6f8fa);">{{ specJson }}</pre>
  </details>
</DemoBlock>

`setSpec()` 是整体替换：每点一次「生成图表」就是换一张图，图例、缩放、焦点等交互态一并重置。

## 接入大模型

库不做内置模型调用——`buildChartPrompt()` 把 Schema、数据预览与硬性规则打包成提示词，喂给你自己的模型（在线 API 或私有部署均可），返回的 JSON 自检后回放：

```js
import { buildChartPrompt, lintChartSpec } from '@wil-works/evoke-charts'

// 1. 组提示词（含 options JSON Schema、数据预览与硬性规则）
const prompt = buildChartPrompt({ data: tableText, requirement: '近半年各渠道销售额占比' })

// 2. 喂给你的模型，取回 JSON（示意）
const spec = JSON.parse(await myLLM.complete(prompt))

// 3. 自检修正后 setSpec 回放
const { spec: safe, issues } = lintChartSpec(spec)
if (!issues.some((i) => i.level === 'error')) chartRef.value.setSpec(safe)
```

模型不可用或返回不合格时，`generateChartSpec()` 的确定性推断就是兜底路径——同一段数据，两条路产出同一份 Spec 契约。

## API

<ApiTable title="AI 生成" :rows="[
  { name: 'generateChartSpec', desc: '数据 + 意图 → Spec。返回 { spec, report }：spec 为 null 时 report 说明缘由；report 给出列推断、选型理由与告警。hint 支持意图关键词，narrative: true 自动注入峰值 callout 与末点环比 delta（受三处注解预算约束）', type: '(data, hint?) => { spec, report }', default: '—' },
  { name: 'lintChartSpec', desc: '渲染自检：schema 校验 → 焦点预算（注解 ≤3）→ 扇区数量 → 类目拥挤自动转横向 → 无头渲染文本越界。能修则修，返回 { issues, spec }（修后的副本，原对象不动）', type: '(spec, opts?) => { issues, spec }', default: '—' },
  { name: 'buildChartPrompt', desc: '提示词契约：Schema + 数据预览 + few-shot 示例（SPEC_EXAMPLES，examples: false 关闭）+ 需求 + 硬性规则。喂给任意大模型，返回 JSON 经 lintChartSpec 后 setSpec 回放', type: '({ data, requirement, extraRules?, examples? }) => string', default: '—' },
  { name: 'parseDataTable', desc: 'CSV / TSV 文本、对象数组、二维数组 → { headers, rows }；首行表头自动识别', type: '(input) => table | null', default: '—' },
]" />

## 相关

- [Spec 契约](/chart/api#spec-契约)（getSpec / setSpec / validateOptions）
- [折线图](/chart/line)（叙述注解与分幕编排示例）
