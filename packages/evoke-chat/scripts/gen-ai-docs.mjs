/**
 * 生成「给 AI 读的对话组件契约」
 *
 * 为什么需要：文档站已有 prose 层（vitepress-plugin-llms 产出 llms.txt / llms-full.txt），
 * 但**没有结构化契约**——AI 读得到说明，读不到「这个组件有哪些 props / 事件 / 插槽 / 实例方法」，
 * 于是经常猜字段名。本脚本从源码抽接口面，产出两份产物：
 *
 *   docs/public/ai/evoke-chat.components.json  机器可读契约（组件 + composable + 配方）
 *   docs/public/ai/evoke-chat.md               给 AI 的使用说明（规则 → 配方 → 逐组件表）
 *
 * 产物随文档站发布：https://evoke-business-ui.wil-works.com/ai/evoke-chat.md
 * 一致性由 check-ai-docs.mjs 守（产物过期即构建失败）。
 *
 * 用法：node scripts/gen-ai-docs.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readdirSync } from 'node:fs'
import {
  kebab, callBody, keysOf, propsOf, slotsOf, summaryOf, readSource,
  componentEntriesOf, namedExportsOf,
} from './lib/sfc-api.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const repoRoot = resolve(pkgRoot, '../..')
const outDir = join(repoRoot, 'docs/public/ai')
/** 正式页：VitePress 会编译 .md，放 public/ 会被当成 SFC 编译报错，所以落成文档页 */
const mdPath = join(repoRoot, 'docs/chat/ai-contract.md')
/**
 * 文档站会把本页当 Vue SFC 编译：{{ x }} 会当插值、裸 HTML 标签会被解析。
 * 生成的正文（摘要/配方文字）一律转义这两类字符，代码块内不受影响。
 */
const esc = (s) => String(s).replace(/\{\{/g, '{ {').replace(/<(\/?[a-zA-Z][^>]*)>/g, '&lt;$1&gt;')

const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'))
const indexSource = readFileSync(join(pkgRoot, 'src/index.js'), 'utf8')

/** 组件 → 文档页（AI 需要能顺着链接读细节） */
const DOC_PAGE = {
  EbChatbot: 'chatbot',
  EbAiConsole: 'ai-console',
  EbAiPromptBox: 'ai-prompt-box',
  EbChatAgent: 'chat-agent',
  EbChatThreads: 'chat-threads',
  EbChatWidget: 'chat-widget',
}
const docsUrl = (name, anchor) =>
  `https://evoke-business-ui.wil-works.com/chat/${DOC_PAGE[name] || 'chat-subcomponents'}${anchor ? `#${anchor}` : ''}`

/**
 * 摘要优先取文档页里 `### <组件名>` 下的首段——那是人写的、且受文档门约束，
 * 比从源码猜的注释可靠；取不到再退回组件内注释，最后回退组件名。
 */
function docsSummaries(names) {
  const heading = new Map()
  const mention = new Map()
  const clean = (s) => s.replace(/[*`>]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const dirs = [join(repoRoot, 'docs/chat'), join(repoRoot, 'docs/components'), join(repoRoot, 'docs/examples')]
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    for (const entry of readdirSync(dir)) {
      if (!entry.endsWith('.md')) continue
      // 生成物自身要排除：否则下一轮扫描会从它身上取摘要，产物永远"过期"
      if (entry === 'ai-contract.md') continue
      const text = readFileSync(join(dir, entry), 'utf8')
      // 1) 标题（h2-h4）下的首段：人写的定义句
      for (const m of text.matchAll(/^#{2,4} (Eb[A-Za-z0-9]+)[^\n]*\n+([^\n#<][^\n]*)/gm)) {
        if (!heading.has(m[1])) {
          const s = clean(m[2])
          if (s.length > 12) heading.set(m[1], s.slice(0, 160))
        }
      }
      // 2) 兜底：文档里第一次出现该名字的那一行（去掉列表符号与代码标记）
      for (const line of text.split('\n')) {
        const s = clean(line.replace(/^[-*|]\s*/, ''))
        if (!s || s.length < 20 || s.length > 200) continue
        for (const name of names) {
          if (!mention.has(name) && s.includes(name)) mention.set(name, s.slice(0, 160))
        }
      }
    }
  }
  const out = new Map()
  for (const name of names) {
    const hit = heading.get(name) || mention.get(name)
    if (hit) out.set(name, hit)
  }
  return out
}

/** 逐组件抽接口面 */
function componentContract({ name, file }, summaries) {
  const source = readSource(join(pkgRoot, 'src', file))
  if (!source) return null
  const props = propsOf(source)
  const events = keysOf(callBody(source, 'defineEmits'))
  const expose = keysOf(callBody(source, 'defineExpose'))
  return {
    name,
    entry: `@wil-works/evoke-chat/${kebab(name.replace(/^Eb/, ''))}`,
    source: `src/${file}`,
    summary: summaries.get(name) || summaryOf(source, name),
    docs: docsUrl(name),
    props,
    events,
    slots: slotsOf(source),
    expose,
  }
}

/** 具名导出（composable / 纯函数）：给名字、入口与文档锚点，方法表以文档为准 */
function composablesContract() {
  const names = namedExportsOf(indexSource).filter((n) => !/^Eb/.test(n))
  return names.map((name) => ({
    name,
    entry: '@wil-works/evoke-chat',
    docs: docsUrl('', name.toLowerCase().replace(/[^a-z0-9]/g, '')),
  }))
}

/**
 * 配方：AI 最需要的其实是「这类任务该调哪几个 API、有什么坑」。
 * 这里的每一条都对应仓库里已经有测试覆盖的真实路径。
 */
const RECIPES = [
  {
    task: '流式回写模型输出',
    apis: ['useChatEngine.createAssistantMessage', 'appendContent', 'appendThinkContent', 'completeMessage'],
    code: `const engine = useChatEngine()
const msg = engine.createAssistantMessage()
// 逐片回写：appendContent 自动把消息转成 streaming 态（卡片露出光标）
engine.appendContent(msg.id, chunk)
engine.appendThinkContent(msg.id, reasoningChunk)   // 思维链与正文分开
engine.completeMessage(msg.id)                      // 收尾：settle 耗时、转 done`,
    pitfalls: ['不要自己拼字符串后 setMessageContent——那样没有 streaming 光标与贴底', '正文与思维链必须分开两个 API，混写会串行渲染'],
  },
  {
    task: '停止生成（用户点停止 / 双击 Esc）',
    apis: ['cancelMessage'],
    code: `// 组件侧：EbAiPromptBox / EbChatSender 的 stop 事件
function onStop() {
  engine.cancelMessage(msg.id)
  transport.cancel()      // 后端协作式中断
}`,
    pitfalls: [
      '取消是 cancelled，不是 error：不要用 setMessageError 表达用户主动停止',
      'cancelMessage 会把思考态标记为「思考已中断」，并把在跑/等待的工具调用落 cancelled',
      '中断后迟到的增量与收尾会被拒绝（appendContent / completeToolCall 返回空）',
    ],
  },
  {
    task: '渲染工具调用（含流式输出）',
    apis: ['startToolCall', 'appendToolCallResult', 'completeToolCall', 'failToolCall'],
    code: `const callId = engine.startToolCall(msg.id, { name: 'web_search', label: '联网检索', args: { query } })
engine.appendToolCallResult(msg.id, callId, '命中 3 条…')   // 边跑边出，卡片自动展开并贴底
engine.completeToolCall(msg.id, callId)                     // 省略 result：保留已流出的输出`,
    pitfalls: ['completeToolCall 第三参省略时保留流式输出，传空串才会清空', '失败用 failToolCall（错误首行会摘要显示），不要走 completeToolCall'],
  },
  {
    task: '工具调用里挂子步骤（并行派发 / PTC）',
    apis: ['addSubToolCall', 'findToolCall'],
    code: `const parent = engine.startToolCall(msg.id, { name: 'fetch_page' })
const child = engine.addSubToolCall(msg.id, parent, { name: 'parse_html' })  // 返回子调用 id
engine.completeToolCall(msg.id, child, '解析出 3 个小节')`,
    pitfalls: ['append/complete/fail 都按 id 递归作用到子层，无需手动找父节点', '嵌套上限 16 层，超深返回 null'],
  },
  {
    task: '审批接管（危险操作前问一句）',
    apis: ['EbChatApproval', 'useChatSession.respondApproval'],
    code: `<eb-chatbot :approval="approval" @approval-respond="onApprovalRespond" />

// 宿主侧
const answer = await askApproval({ id, toolName: 'web_search', reason: '需要联网' })
// answer: 'allowed-once' | 'rejected'
session.respondApproval('allowed-once')`,
    pitfalls: ['只有两种结论：allowed-once / rejected（没有「总是允许」——那属于会话级权限模式）', '审批非空时输入台让位给审批面板，优先级高于提问'],
  },
  {
    task: '提问接管（干活前澄清口径）',
    apis: ['EbChatQuestion', 'useChatSession.respondQuestion'],
    code: `<eb-chatbot :question="question" @question-respond="onQuestionRespond" />

const answer = await askQuestion({
  id, items: [{ id: 'scope', question: '按哪个口径对比？', options: [{ key: 'mom', label: '环比', recommended: true }] }],
})
// answer: { status: 'answered' | 'cancelled', answers: [{ selected: ['mom'], custom, skipped }] }`,
    pitfalls: ['跳过算「已回答」（skipped: true），取消是整批作废（status: cancelled）', '单选互斥、多选累加、自定义输入同题互斥'],
  },
  {
    task: '显示上下文占用',
    apis: ['EbChatContextMeter', 'useChatSession.setContext'],
    code: `<eb-ai-console :context="{ used, capacity: 32000, breakdown: { system, tools, messages } }" />

// 或由事件驱动
session.setContext({ used: 12800, capacity: 32000 })`,
    pitfalls: ['used 与 capacity 缺一不渲染——拿不到窗口容量时画环只会误导', '百分比封顶 100%，75% 警告 / 90% 危险'],
  },
  {
    task: '展示本轮改了哪些文件',
    apis: ['EbChatChanges', 'useChatEngine.setChanges'],
    code: `engine.setChanges(msg.id, {
  total: 3, added: 96, deleted: 18,
  files: [{ path: 'src/a.vue', display: 'a.vue', added: 88, deleted: 12 }, { path: 'assets/logo.png', binary: true }],
})`,
    pitfalls: ['单文件时标题直接给文件名；二进制/过大不给行数只给标记', '列表默认露 4 行，超出收在「全部 N 个文件」'],
  },
  {
    task: '接真实后端（会话日志层：断线可恢复）',
    apis: ['useChatSession', 'createSessionLog', 'applySessionEvent'],
    code: `const transport = {
  open: ({ cursor, onEvent, onGap }) => subscribe({ cursor, onEvent, onGap }),  // 长连/轮询均可
  page: ({ from, limit }) => fetchRecords({ from, limit }),                    // 补页
  send: (payload) => post(payload), cancel: () => abort(),                     // 发送与中断
  approve: (outcome, request) => postApproval(outcome, request),
  answerQuestion: (answer, request) => postAnswer(answer, request),
}
const session = useChatSession({ transport })
session.open({ cursor: 0, records: [] })`,
    pitfalls: [
      '事件信封 { type, seq, time, data, ignorable?, surfaceOp? }；seq 必须连续，缺口会缓冲并回调 onGap',
      '游标只被持久事件推进；瞬时事件（审批/提问/占用）不会推进也不会造成缺口',
      '不可忽略的未知事件会标记 degraded，宿主应重拉整窗',
    ],
  },
  {
    task: '直接接 OpenAI / Anthropic',
    apis: ['createChatTransport'],
    code: `const transport = createChatTransport({
  provider: 'anthropic',            // 'openai' | 'anthropic'
  apiKey, model: 'claude-sonnet-4-5', system: '你是运营助手',
  tools: [{ name: 'web_search', description: '联网检索', parameters: {…} }],
  contextWindow: 32000,
  getMessages: () => session.messages.value,
})`,
    pitfalls: ['浏览器直连会暴露 key：生产走自己的后端代理（url 指到代理）', '这两家没有 follow/补页协议，历史要宿主自己存', '工具参数是分片 JSON，适配层已按 index 拼完再 parse'],
  },
  {
    task: '自定义工具卡的参数/结果渲染',
    apis: ['EbChatToolCall 的 #args / #result 插槽'],
    code: `<eb-chat-tool-call :tool-call="call">
  <template #result="{ toolCall }"><eb-json-viewer :data="toolCall.result" /></template>
</eb-chat-tool-call>`,
    pitfalls: ['默认是带环检测的 JSON <pre>；只要换成插槽就不会丢默认的折叠/状态语义'],
  },
  {
    task: '多语言',
    apis: ['chatLabels', 'useChatLabels', '@wil-works/evoke-chat/locale'],
    code: `import zhCN from '@wil-works/evoke-chat/locale/zh-CN'
app.use(EvokeChat, { locale: zhCN })`,
    pitfalls: ['文案随包走，中英键位必须同构（有测试守）', '宿主自定义文案用 chatLabels 覆盖，不要 fork 组件'],
  },
]

const SLOT_LABEL = { __default: '默认' }
const fmtProps = (props) =>
  props.length
    ? props.map((p) => `| \`${p.name}\` | ${p.type || '—'} | ${p.default || (p.required ? '必填' : '—')} |`).join('\n')
    : '| （无 props） | — | — |'

function buildMarkdown(payload) {
  const { version, components, composables } = payload
  const lines = []
  lines.push(`# @wil-works/evoke-chat AI 使用说明（v${version}）`)
  lines.push('')
  lines.push('> 本页由 `packages/evoke-chat/scripts/gen-ai-docs.mjs` 自动生成，勿手改（改了会被构建门拦下）。')
  lines.push('')
  lines.push('> 给 AI 读：先看「硬规则」，再按「任务配方」找 API，最后用逐组件表核对字段名。')
  lines.push('> 完整散文文档见 [对话窗口](/chat/chatbot)；同内容的结构化契约见 [evoke-chat.components.json](/ai/evoke-chat.components.json)。')
  lines.push('')
  lines.push('## 硬规则')
  lines.push('')
  lines.push('1. 组件只做呈现，**任何请求都由宿主注入**（transport / fetch / SDK），包内不发网络请求。')
  lines.push('2. 流式回写一律用 `appendContent` / `appendThinkContent`（自动转 streaming），不要自己拼字符串。')
  lines.push('3. 用户主动停止是 `cancelled`（`cancelMessage`），不是 `error`；中断后迟到的事件会被拒绝。')
  lines.push('4. 工具调用按 id 操作（`startToolCall` 返回 id），子调用同样按 id，写操作自动递归。')
  lines.push('5. 文案随包走（`/locale`），中英键位同构；宿主只覆盖，不改组件。')
  lines.push('6. 字段名以本文档的组件表为准；不确定就先查 JSON 契约，不要猜 prop 名。')
  lines.push('')
  lines.push('## 任务配方')
  lines.push('')
  for (const r of RECIPES) {
    lines.push(`### ${esc(r.task)}`)
    lines.push('')
    lines.push(`API：${r.apis.map((a) => `\`${a}\``).join('、')}`)
    lines.push('')
    lines.push('```js')
    lines.push(r.code)
    lines.push('```')
    lines.push('')
    lines.push('注意：')
    for (const p of r.pitfalls) lines.push(`- ${esc(p)}`)
    lines.push('')
  }
  lines.push('## 组件契约')
  lines.push('')
  lines.push('| 组件 | 子路径入口 | 文档 |')
  lines.push('| --- | --- | --- |')
  for (const c of components) lines.push(`| \`${c.name}\` | \`${c.entry}\` | ${c.docs} |`)
  lines.push('')
  for (const c of components) {
    lines.push(`### ${c.name}`)
    lines.push('')
    lines.push(esc(c.summary))
    lines.push('')
    lines.push(`- 入口：\`${c.entry}\`　源码：\`${c.source}\`　文档：${c.docs}`)
    if (c.slots.length) lines.push(`- 插槽：${c.slots.map((s) => `\`${SLOT_LABEL[s] || s}\``).join('、')}`)
    if (c.expose.length) lines.push(`- 实例方法（ref 调用）：${c.expose.map((e) => `\`${e}\``).join('、')}`)
    lines.push('')
    lines.push('| prop | 类型 | 默认 |')
    lines.push('| --- | --- | --- |')
    lines.push(fmtProps(c.props))
    if (c.events.length) {
      lines.push('')
      lines.push(`事件：${c.events.map((e) => `\`${e}\``).join('、')}`)
    }
    lines.push('')
  }
  lines.push('## 组合式 API')
  lines.push('')
  lines.push('| 名称 | 入口 | 文档 |')
  lines.push('| --- | --- | --- |')
  for (const f of composables) lines.push(`| \`${f.name}\` | \`${f.entry}\` | ${f.docs} |`)
  lines.push('')
  return lines.join('\n')
}

// ── 生成 ──
const componentNames = componentEntriesOf(indexSource, 'Eb').map((e) => e.name)
const summaries = docsSummaries(componentNames)
const components = componentEntriesOf(indexSource, 'Eb').map((e) => componentContract(e, summaries)).filter(Boolean)
if (!components.length) {
  console.error('[gen-ai-docs] 未解析到任何组件——解析口径失效，先修脚本')
  process.exit(1)
}
const payload = {
  name: pkg.name,
  version: pkg.version,
  generatedBy: 'packages/evoke-chat/scripts/gen-ai-docs.mjs',
  docs: 'https://evoke-business-ui.wil-works.com/chat/chatbot',
  components,
  composables: composablesContract(),
  recipes: RECIPES,
}
const json = `${JSON.stringify(payload, null, 2)}\n`
const markdown = `${buildMarkdown(payload)}\n`

// ── 写盘或自检 ──
const checkMode = process.argv.includes('--check')
// 无文档站上下文（例如只装了本包的环境）时，自检跳过而不是误报
if (checkMode && !existsSync(join(repoRoot, 'docs'))) {
  console.log('[gen-ai-docs] 无 docs/ 目录：跳过 AI 契约自检')
  process.exit(0)
}
const targets = [
  [join(outDir, 'evoke-chat.components.json'), json],
  [mdPath, markdown],
]
if (checkMode) {
  const stale = targets.filter(([file, content]) => !existsSync(file) || readFileSync(file, 'utf8') !== content)
  if (stale.length) {
    console.error(`[gen-ai-docs] AI 契约产物过期：${stale.map(([f]) => f.replace(`${repoRoot}/`, '')).join('、')}`)
    console.error('  修法：node packages/evoke-chat/scripts/gen-ai-docs.mjs 后一并提交')
    process.exit(1)
  }
  console.log(`[gen-ai-docs] 自检通过：${components.length} 个组件 / ${RECIPES.length} 条配方，产物与源码一致`)
} else {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  for (const [file, content] of targets) writeFileSync(file, content)
  console.log(`[gen-ai-docs] ${components.length} 个组件 / ${payload.composables.length} 个具名导出 / ${RECIPES.length} 条配方`)
  console.log(`[gen-ai-docs] → docs/public/ai/evoke-chat.components.json（${(json.length / 1024).toFixed(1)}KB）`)
  console.log(`[gen-ai-docs] → docs/chat/ai-contract.md（${(markdown.length / 1024).toFixed(1)}KB）`)
}