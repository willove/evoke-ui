# Agent 三件套：计划 / 确认门 / 产物

`EbChatPlan` · `EbChatConfirmation` · `EbChatArtifact`

三者共同的前提是：这不是一次问答，而是一次**受控执行**。宿主需要把执行计划摊开给用户看、在关键动作前拿到批准、把产出的文件交出去。三者都挂在 assistant 消息上，与 `toolCalls` / `citations` 同构——引擎只存不解析，视图只读不推断。

`toolCalls` 表达的是「这一步做了什么」；计划卡表达的是「整体还要做什么」。两者独立渲染，不做自动关联。

## 计划

`message.plan = { title?, steps: [{ id, label, status, detail?, duration? }] }`，`status` 取 `pending / running / done / error / skipped`。

头部给标题、`3/5 完成` 进度与失败标记；执行中自动展开，结束后回到用户可控的折叠态（与思考块同一套「过程可见、完事让位」的约定）。

<DemoBlock>
  <eb-chatbot v-model="planMsgs" height="340px" :show-tip="false" @plan-step-click="onStepClick" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">{{ planHint }}</div>
</DemoBlock>

驱动计划的引擎方法与工具调用同构：

```js
const msg = engine.createAssistantMessage()
engine.setPlan(msg.id, { title: '对齐季度口径', steps: [
  { id: 's1', label: '拉取两张表' },
  { id: 's2', label: '比对差异' },
  { id: 's3', label: '输出报告' },
] })

engine.startPlanStep(msg.id, 's1')
engine.completePlanStep(msg.id, 's1', '拉到了 2 张表')   // 自动记耗时
engine.failPlanStep(msg.id, 's2', new Error('接口 500'))
engine.skipPlanStep(msg.id, 's2')
```

## 确认门

`message.confirmation = { id, title, description?, actions: [{ key, label, type?, status? }], status, responseKey? }`，`status` 取 `pending / approved / rejected / expired`。**响应后进入只读态**并显示选了哪一项，避免用户以为还能改。

`actions[].type` 取 `EbButton` 那套（`default / primary / success / warning / info / danger / text`）。

动作的**语义由它自己声明**：`actions[].status` 写 `approved` 或 `rejected`。没写时按 `type` 兜底——`danger` 视为拒绝、其余视为批准；这个兜底只保证「点了拒绝不会显示成已批准」这个方向不出错，业务含义仍归你。超时是独立形态（`expired`），不与已拒绝混淆。

<DemoBlock>
  <eb-chatbot v-model="confirmMsgs" height="320px" :show-tip="false" @confirm-respond="onRespond" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">{{ confirmHint }}</div>
</DemoBlock>

```js
engine.setConfirmation(msg.id, {
  id: 'c1',
  title: '即将删除 3 个文件',
  description: '此操作不可撤销',
  status: 'pending',
  actions: [
    { key: 'approve', label: '批准', type: 'primary', status: 'approved' },
    { key: 'reject', label: '拒绝', type: 'danger', status: 'rejected' },
  ],
})

// 事件回调里记下结果，真正要执行什么由你的代码决定
engine.respondConfirmation(msg.id, actionKey)
```

**确认门只负责拿到选择，不负责执行**。批准之后调什么接口、跑什么命令，由宿主决定——家族不发请求的原则在这里同样成立。

## 产物

`message.artifacts = [{ id, title, type, language?, content?, url?, size? }]`。

卡片给类型图标、标题、`语言 · 体积`；动作有查看（`open`）、复制内容（有 `content` 时）、下载（有 `url` 时）。类型认不出来时按扩展名回落，再不行用通用文件图标。

<DemoBlock>
  <eb-chatbot v-model="artifactMsgs" height="300px" :show-tip="false" @artifact-open="onArtifactOpen" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">{{ artifactHint }}</div>
</DemoBlock>

**组件不做内嵌预览**：预览是布局问题（分屏 / 抽屉 / 新页），它只抛 `open`。开右侧分屏的配方：

```vue
<eb-splitter>
  <template #left><eb-chatbot v-model="messages" @artifact-open="openArtifact" /></template>
  <template #right><pre class="preview">{{ activeArtifact?.content }}</pre></template>
</eb-splitter>
```

## API

<ApiTable title="ChatPlan Props" :rows="[
  { name: 'plan', desc: '{ title?, steps: [{ id, label, status, detail?, duration? }] }', type: 'object', default: '{ steps: [] }' },
  { name: 'expanded', desc: '受控折叠态；不传时执行中自动展开、结束后回到用户可控', type: 'boolean', default: '—' },
]" />

<ApiTable title="ChatPlan Events" :rows="[
  { name: 'toggle', desc: '(plan, open)', type: '(plan, open) => void', default: '—' },
  { name: 'step-click', desc: '(step, index)', type: '(step, index) => void', default: '—' },
]" />

<ApiTable title="ChatConfirmation Props" :rows="[
  { name: 'confirmation', desc: '{ id, title, description?, actions, status, responseKey?, respondedAt? }', type: 'object', default: '{}' },
]" />

<ApiTable title="ChatConfirmation Events" :rows="[
  { name: 'respond', desc: '点了某个动作；执行由宿主负责', type: '(confirmation, actionKey) => void', default: '—' },
]" />

<ApiTable title="ChatArtifact Props" :rows="[
  { name: 'artifacts', desc: '[{ id, title, type, language?, content?, url?, size? }]', type: 'array', default: '[]' },
  { name: 'copyable', desc: '整体开关复制动作（条目仍要求有 content）', type: 'boolean', default: 'true' },
]" />

<ApiTable title="ChatArtifact Events" :rows="[
  { name: 'open', desc: '查看产物；预览形态由宿主决定', type: '(artifact) => void', default: '—' },
  { name: 'copy', desc: '内容已写入剪贴板', type: '(artifact) => void', default: '—' },
]" />

三者的逐条接管插槽分别是 `#step`（`{ step, index, isCurrent }`）、`#artifact`（`{ artifact, index, itemProps }`），沿用 `ChatList#message` 的 `itemProps` 回落约定。

## 刻意不做

- **不自动执行**：确认门拿到选择就结束，批准后做什么与组件无关。
- **不与工具调用自动关联**：不猜「这一步对应哪个 toolCall」。
- **不自持时钟**：`expired` 由宿主标记，组件里没有定时器——否则视觉基线与测试都会被时钟驱动。

<script setup>
import { ref } from 'vue'

const planHint = ref('点某一步试试；这个演示里计划是静态数据')
const planMsgs = ref([
  {
    id: 'p-1',
    role: 'user',
    content: '把上季度报表口径对齐一下',
    status: 'done',
  },
  {
    id: 'p-2',
    role: 'assistant',
    status: 'done',
    content: '按三步走，前两步已完成，第三步在跑。',
    plan: {
      title: '对齐季度口径',
      steps: [
        { id: 's1', label: '拉取财务与业务两张表', status: 'done', duration: 820 },
        { id: 's2', label: '比对口径差异', status: 'done', duration: 1240, detail: '发现 3 处差异' },
        { id: 's3', label: '输出对齐报告', status: 'running' },
        { id: 's4', label: '回写数据字典', status: 'pending' },
      ],
    },
  },
])
function onStepClick(step, index) {
  planHint.value = `step-click：第 ${index + 1} 步「${step.label}」`
}

const confirmHint = ref('点批准或拒绝；点完按钮进入只读态')
const confirmMsgs = ref([
  {
    id: 'c-1',
    role: 'assistant',
    status: 'done',
    content: '这一步会改动数据，先请你确认。',
    confirmation: {
      id: 'cf-1',
      title: '即将删除 3 个历史文件',
      description: '此操作不可撤销，删除后只能从备份恢复。',
      status: 'pending',
      actions: [
        { key: 'approve', label: '批准执行', type: 'primary', status: 'approved' },
        { key: 'reject', label: '拒绝', type: 'danger', status: 'rejected' },
      ],
    },
  },
])
function onRespond(confirmation, actionKey) {
  const list = confirmMsgs.value
  const idx = list.findIndex((m) => m.confirmation?.id === confirmation.id)
  if (idx < 0) return
  const action = confirmation.actions.find((a) => a.key === actionKey)
  confirmHint.value = `confirm-respond：${actionKey}（${action?.label}）——真实场景在这里执行或中止`
  const next = [...list]
  next[idx] = {
    ...list[idx],
    confirmation: {
      ...confirmation,
      status: action?.status || (action?.type === 'danger' ? 'rejected' : 'approved'),
      responseKey: actionKey,
      respondedAt: Date.now(),
    },
  }
  confirmMsgs.value = next
}

const artifactHint = ref('点「查看」——预览形态由你的页面决定')
const artifactMsgs = ref([
  {
    id: 'f-1',
    role: 'assistant',
    status: 'done',
    content: '报告已生成。',
    artifacts: [
      { id: 'af-1', title: '口径对齐报告.md', type: 'markdown', content: '# 口径对齐报告\n\n共发现 3 处差异…' },
      { id: 'af-2', title: 'diff.csv', type: 'table', url: 'https://example.com/diff.csv', size: 20480 },
      { id: 'af-3', title: 'sync.ts', type: 'code', language: 'typescript', content: 'export const sync = () => {}' },
    ],
  },
])
function onArtifactOpen(artifact) {
  artifactHint.value = `artifact-open：${artifact.title}`
}
</script>
