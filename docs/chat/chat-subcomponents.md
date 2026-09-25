# 对话子组件

`EbChatbot` 之外的家族成员。**绝大多数场景不需要直接用它们**——`EbChatbot` 已经把这些组装好了。它们用于两种情形：只想要其中一块（比如独立渲染一段 Markdown），或要自己编排（`ChatList` + 自定义发送区）。

> 本页组件在独立包 `@wil-works/evoke-chat` 里，安装与注册见 [Chatbot 对话窗口](/chat/chatbot)顶部说明。

下表标题即导出名——`EbChatMessage`、`EbChatSender` 这样带 `Eb` 前缀整名导出。

## 结构类

### EbChatContent

面板外壳：固定尺寸、可选边框、头部/底部槽位。`EbChatbot` 用它包住消息区与输入区。

<DemoBlock>
  <div style="height: 220px">
    <eb-chat-content bordered>
      <template #header>
        <div style="padding: 10px 14px; font-size: 13px; font-weight: 500">面板标题（header 插槽）</div>
      </template>
      <div style="flex: 1; display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--eb-text-color-placeholder)">
        中间是你的内容区（消息流 / 任意视图）
      </div>
      <template #footer>
        <div style="font-size: 12px; color: var(--eb-text-color-secondary)">底部区（footer 插槽）：输入台或操作条</div>
      </template>
    </eb-chat-content>
  </div>
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `height` / `width` | string \| number | `100%` | 数字按 px 处理 |
| `bordered` | boolean | `false` | 加边框，并给头尾加分隔线 |

| Slots | 说明 |
| --- | --- |
| `header` | 面板顶部 |
| `footer` | 面板底部 |
| 默认 | 主体内容（不自动滚动，滚动由 `ChatList` 负责） |

### EbChatList

消息滚动容器。负责自动贴底、`role="log"` 流式播报、回到底部钮、空态；不负责发送。

<DemoBlock>
  <eb-chat-content bordered style="height: 300px">
    <eb-chat-list :messages="DEMO_LIST_MSGS" />
  </eb-chat-content>
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `messages` | array | `[]` | 消息数组 |
| `showThinking` / `renderMode` / `autoScroll` | — | `true` / `markdown` / `true` | 透传给每条消息 |
| `avatarUser` / `avatarAssistant` / `userName` / `assistantName` | — | — / 我 / AI助手 | 透传 |
| `actions` | array | `[]` | 动作条自定义动作 |
| `editable` / `editMaxLength` | boolean / number | `false` / `0` | 用户消息可编辑重发 |
| `feedback` / `feedbackReasons` | boolean / array | `false` / `[]` | 评审与原因词汇表 |
| `toolRetryable` | boolean | `true` | 失败的工具卡给不给重试钮 |

| Events | 载荷 |
| --- | --- |
| `copy` / `regenerate` / `edit` / `feedback` / `suggestion-click` / `citation-click` / `tool-retry` | 见 [Chatbot 对话窗口](/chat/chatbot) 同名事件 |
| `action` | `(key, message)` |
| `scroll` | 原生滚动事件 |

| Slots | 说明 |
| --- | --- |
| `message` | 整条接管；作用域 `{ message, index, isLast, itemProps }`，用 `v-bind="p.itemProps"` 回落默认渲染 |
| `message-content` | 只换正文；作用域 `{ message, content, renderMode, streaming }` |
| `header` / `empty` | 消息区顶部 / 空态 |

默认槽产出为空时 Vue 会回落默认渲染——不能靠"某几行留空"隐藏消息。

### EbChatMessage

单条消息。按 role 分流：`user` / `assistant` 是对话气泡，`system` / `notice` 是居中弱化的系统提示（无头像、昵称、动作条）。

<DemoBlock>
  <div style="display: flex; flex-direction: column">
    <eb-chat-message :message="DEMO_MSG_USER" />
    <eb-chat-message :message="DEMO_MSG_ASSISTANT" />
    <eb-chat-message :message="DEMO_MSG_SYSTEM" />
    <eb-chat-message :message="DEMO_MSG_NOTICE" />
  </div>
</DemoBlock>

Props 与 `ChatList` 的透传面一致，外加 `message` 本身；其中 `show-avatar` / `show-name` 隐去消息头部的头像与昵称（传对象可分侧：`{ user: false }` / `{ assistant: false }`），`show-time` 控制时间戳（默认在消息下方、与动作条同排，悬浮或键盘聚焦时显示）。

| Events | 载荷 |
| --- | --- |
| `copy` / `regenerate` / `edit` / `feedback` / `suggestion-click` / `citation-click` / `tool-retry` | 见 [Chatbot](/chat/chatbot) |

| Slots | 说明 |
| --- | --- |
| `content` | 只换气泡内正文；作用域 `{ message, content, renderMode, streaming }` |

消息项的字段：`{ id, role, content, status, thinking?, thinkContent?, thinkDuration?, thinkInterrupted?, attachments?, suggestions?, feedback?, feedbackReasons?, feedbackNote?, edited?, citations?, toolCalls?, duration?, error? }`，`status` 取 `pending / streaming / done / error / cancelled`；`thinking` 为真表示正在思考（流式期间思考块强制展开），`thinkDuration` 是思考耗时（毫秒，引擎自动结算），`thinkInterrupted` 为真表示思考阶段就被中断（思考块标题改说「思考已中断」）。

### EbChatMarkdown

Markdown 渲染器：GFM 表格与任务列表、代码块工具条（语言标签 + 复制）、自定义协议引用芯片、`source:` 行内引用上标、流式拖尾。原文 HTML 一律转义为纯文本；图片 `src` 只放行 `http` / `https` / `data`。

<DemoBlock>
  <eb-chat-markdown :content="DEMO_MARKDOWN" />
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `content` | string | `''` | Markdown 原文 |
| `streaming` | boolean | `false` | 流式态：末尾补拖尾，重解析按帧合并 |

| Events | 载荷 |
| --- | --- |
| `citation-click` | `(id)` 行内引用上标被点击或回车 |

管线配置（协议白名单、主题色、追加高亮语言）见 [Chatbot 的正文渲染配置](/chat/chatbot#正文渲染配置)。

## 过程类

### EbChatThinking

思考过程折叠块。流式期间强制展开，结束后回到用户可控的折叠态。`{ content, thinking, duration, interrupted }`（`duration` 为思考耗时，显示成「（用时 X）」；消息上下文里取 `message.thinkDuration`；`interrupted` 为真时标题说「思考已中断」，用于思考阶段就被停止的那一轮），无事件。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <eb-chat-thinking :content="DEMO_THINK" :thinking="true" />
    <eb-chat-thinking :content="DEMO_THINK" :duration="2400" />
    <eb-chat-thinking :content="DEMO_THINK" :interrupted="true" :duration="800" />
  </div>
</DemoBlock>

### EbChatLoading

三点起伏的打字指示。可选 `text` 文案。

<DemoBlock>
  <eb-chat-loading />
</DemoBlock>

### EbChatToolCall

工具调用卡：状态标记（等待/执行/失败/完成/已停止）、耗时、参数与结果的折叠展开，失败态给重试钮。**支持子调用**：`toolCall.subCalls` 是同一形状的数组（并行派发 / PTC 子步），展开后按层级递归渲染、左侧细轨标出从属关系，折叠时头部给子调用计数；嵌套上限 16 层（引擎与组件两侧都设了，异常自引用数据也不会炸）。`toolCall.streaming` 为真时结果区末尾补光标并自动展开盯跑（收尾后回到用户可控的折叠态）；失败态在折叠行直接给**错误首行**，不展开也知道为什么失败；`status: 'cancelled'`（运行中被停止）用停止标记与「已停止」，不给重试钮、也不再转圈。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `toolCall` | object | `{}` | `{ id, name, label?, args?, result?, status, duration?, error? }` |
| `expanded` | boolean | 自动 | 未指定时有参数或结果才可展开 |
| `retryable` | boolean | `true` | 失败态是否给重试钮 |

| Events | 载荷 |
| --- | --- |
| `toggle` | `(toolCall, open)` |
| `retry` | `(toolCall)` |

| Slots | 作用域 |
| --- | --- |
| `args` / `result` | `{ toolCall }`，可换成 `EbJsonViewer` 等 |

参数与结果默认走带环检测的 JSON `<pre>`（宿主传入的对象常带循环引用）。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 560px">
    <eb-chat-tool-call :tool-call="DEMO_TOOL_RUNNING" />
    <eb-chat-tool-call :tool-call="DEMO_TOOL_DONE" />
    <eb-chat-tool-call :tool-call="DEMO_TOOL_ERROR" />
  </div>
</DemoBlock>

### EbChatApproval

审批面板：agent 要执行越权动作（跑命令、联网、改文件）时**接管输入区**——待审批期间发送台让位，用户只需做一个决定。`{ id, toolName, reason?, detail?, status? }`：给了 `reason` 就用它当标题，否则显示「工具 X 请求越权执行」；`detail` 常放被拦命令原文（等宽、限高可滚）。键位 **Enter = 允许一次 / Esc = 拒绝**（组字中、带修饰键、焦点在输入控件里时都不抢）。结论只有 `allowed-once | rejected` 两种——「总是允许」属于会话级权限模式，不塞进单次审批。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 620px">
    <eb-chat-approval :request="{ id: 'a1', toolName: 'run_tests', reason: '需要执行测试命令', detail: 'pnpm test -- --run' }" />
    <eb-chat-approval :request="{ id: 'a2', toolName: 'web_search', status: 'rejected' }" />
  </div>
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `request` | object | `{}` | `{ id, toolName, reason?, detail?, status? }`；`status` 取 `pending / approved / rejected` |
| `answered` | boolean | — | 受控的已响应态；不传则组件自己记（点完立即禁用，等宿主持久态覆盖） |

| Events | 载荷 |
| --- | --- |
| `respond` | `(outcome, request)`，`outcome` 取 `allowed-once` / `rejected` |

`EbChatbot` 与 `EbAiConsole` 都有 `approval` prop：传了就接管输入区，响应经 `approval-respond` 抛给宿主（`(outcome, request)` 两参）。`useChatSession` 的 `approval` + `respondApproval(outcome)` 已经把这条链路接好（事件的 `approval/request` → 待审批，`approval/decided` → 收起）。

### EbChatQuestion

提问面板：agent 需要澄清时**接管输入区**（审批优先——越权动作必须先答）。`{ id, items: [{ id, question, header?, multiSelect?, allowCustom?, options: [{ key, label, recommended?, description? }] }], status? }`：逐题作答，单选互斥、多选累加；每题可写自定义答案（默认给输入框，`allowCustom: false` 关掉）；**跳过**算已作答（`skipped: true`），**取消**则整批作废。键位 **Enter 逐题前进、最后一题提交 / Esc 取消**（组字中、带修饰键时不抢）。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 620px">
    <eb-chat-question :request="{
      id: 'q1',
      items: [
        { id: 'i1', question: '按哪个口径对比？', options: [
          { key: 'mom', label: '环比', recommended: true },
          { key: 'yoy', label: '同比', description: '与去年同期比' },
        ] },
      ],
    }" />
    <eb-chat-question :request="{ id: 'q2', status: 'answered', items: [{ id: 'i1', question: '覆盖哪些渠道？', options: [{ key: 'feed', label: '信息流' }] }] }" />
  </div>
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `request` | object | `{}` | 见上；`status` 取 `pending / answered / cancelled` |
| `answered` | boolean | — | 受控的已响应态；不传则组件自己记 |

| Events | 载荷 |
| --- | --- |
| `respond` | `(answer, request)`；`answer = { status: 'answered' \| 'cancelled', answers: [{ id, question, selected, custom, skipped }] }` |

`EbChatbot` / `EbAiConsole` 的 `question` prop 传了就接管输入区，响应经 `question-respond(answer, request)` 抛出；`useChatSession` 的 `question` + `respondQuestion(answer)` 已把链路接好（`question/request` → 待回答，`question/decided` → 收起）。

### EbChatSources

### EbChatChanges

本轮改动汇总卡：标题给「已编辑 N 个文件」（单文件时直接给文件名），右侧 `+A -R`；展开后逐行列文件，每行带自己的增删数，二进制 / 过大不给行数只给标记。超出 `collapsedRows`（默认 4）折叠，给「全部 N 个文件」。路径等宽、**不折行**（保住目录层级），过长省略并留 `title`；点行抛 `select`（宿主接侧边栏预览）。

<DemoBlock>
  <eb-chat-changes :files="DEMO_CHANGES" style="max-width: 560px" />
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `files` | array | `[]` | `[{ path, display?, added?, deleted?, binary?, oversized? }]` |
| `summary` | object | `null` | `{ total?, added?, deleted? }`；缺了按文件列表自己加 |
| `collapsedRows` | number | `4` | 折叠时先露几行 |
| `defaultOpen` | boolean | `false` | 初始是否展开列表 |

| Events | 载荷 |
| --- | --- |
| `select` | `(file)` |

消息带 `changes`（`{ files, total?, added?, deleted? }`）时 `EbChatMessage` 自动渲染；引擎侧 `setChanges(messageId, changes)` 写入，`useChatSession` 认 `workspace/changes` 事件（带 `messageId` 精确挂，不带则挂最后一条助手消息）。

来源引用卡列表：序号 / favicon / 标题 / 域名 / 摘要，可折叠。点击上标会自动展开并高亮对应卡片——该联动由 `ChatMessage` 内部接好，单独用时可调 `highlight(id)`（经 `defineExpose`）。

<DemoBlock>
  <eb-chat-sources :items="DEMO_SOURCES" style="max-width: 560px" />
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | array | `[]` | `{ id?, index?, title, url?, source?, snippet?, favicon? }` |
| `collapsible` | boolean | `true` | 关掉就是常驻列表 |
| `defaultOpen` | boolean | `true` | 初始展开 |

| Events | 载荷 |
| --- | --- |
| `item-click` | `(item, index)` |

## 代码 agent 三卡

`EbChatDiff` · `EbChatTerminal` · `EbChatFileTree`

三者都**零额外依赖**：diff 是纯解析 + CSS，终端自己解最小 ANSI（8/16 色 + 加粗），文件树是嵌套列表。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <eb-chat-diff :diff="DEMO_DIFF" :max-height="200" />
    <eb-chat-terminal
      command="npm run test -- --reporter=dot"
      :output="DEMO_TERMINAL"
      :exit-code="0"
      :max-height="160"
    />
    <eb-chat-file-tree :files="DEMO_FILES" style="max-width: 420px" />
  </div>
</DemoBlock>

### EbChatDiff

吃标准统一 diff 文本（`git diff` 与各家 agent 输出的那种），按文件分组，头部给路径与 `+N −M`，行按增/删/上下文着色，带 old/new 双行号栅格。

`{ diff, showLineNumbers, collapsible, defaultOpen, maxHeight }`，抛 `toggle(index, open)` / `copy(rawDiff)`。**复制出去的是原始 diff 文本**，不是渲染结果（行号在 `aria-hidden` 的独立栅格里，不会被选进复制内容）。

认不出的行按上下文处理——宁可少染一点色，也不猜错语义。

### EbChatTerminal

命令输出卡：头部给命令与退出码，正文等宽渲染且**不折行**（保住终端列结构，横向滚动交给容器），`status: 'running'` 时末尾有光标。**长输出只渲染尾部**（默认 40 行），给省略数与展开入口——命令输出动辄上千行，全渲染会拖垮消息列。

ANSI 只认 8/16 色前景与加粗，其余码忽略（不认识的样式宁可不染）。安全性上先把文本转义、再只把解析器自己构造的 `span` 拼进去，原文里的任何字符都不会被当标记透传。

`{ command, output, status, exitCode, collapsible, defaultOpen, maxHeight, tailLines }`，抛 `toggle(open)` / `copy(纯文本)`。

### EbChatFileTree

扁平路径列表 → 嵌套树。目录在前、名称升序；文件带类型图标、状态徽标（新增/修改/删除/重命名）与增删行数。目录默认展开，折叠状态 `aria-expanded` 完整。

`{ files: [{ path, status?, additions?, deletions? }], defaultExpandAll }`，抛 `select(file, path)` / `toggle(path, open)`。

### 怎么接到消息上

**diff 与终端不加消息字段**——`EbChatToolCall` 的 `#result` 插槽就是为它们留的扩展点：

```vue
<eb-chatbot v-model="messages">
  <template #message="p">
    <eb-chat-message v-bind="p.itemProps">
      <template #content>
        <component :is="renderBody(p.message)" />
      </template>
    </eb-chat-message>
  </template>
</eb-chatbot>
```

更直接的写法是逐条接管工具卡的结果区：

```vue
<eb-chat-message :message="msg">
  <template #tool-result="{ toolCall }">
    <eb-chat-terminal
      v-if="toolCall.name === 'run_tests'"
      :command="toolCall.label"
      :output="toolCall.result"
      :exit-code="toolCall.exitCode"
    />
    <eb-chat-diff v-else-if="toolCall.resultType === 'diff'" :diff="toolCall.result" />
  </template>
</eb-chat-message>
```

**文件树**是改动集汇总、不属于单个工具，所以给了消息级字段 `message.fileTree`，渲染在产物之后，抛 `file-select(file, path, message)`。

## EbChatShare 会话分享弹层

收集「可见范围 + 有效期」，链接的生成与权限校验由你的服务端负责——组件**不发请求**；`link` 为空是配置态、非空是已创建态。

```vue
<eb-chat-share
  v-model="shareOpen"
  v-model:scope="scope"
  v-model:expiry="expiry"
  :title="activeThread?.title"
  :link="shareLink"
  :creating="creating"
  @create="createLink"
  @revoke="revokeLink"
/>
```

`create` 触发时按当前 `scope` / `expiry` 去你的服务端换链接，把结果回灌给 `link`，弹层即切到已创建态。`scopes` / `expiries` 可整组替换，默认给「任何人可查看 / 仅本组织 / 仅受邀成员」与「7 天 / 30 天 / 永久」。

<DemoBlock>
  <eb-button @click="shareOpen = true">打开分享弹层</eb-button>
  <eb-chat-share
    v-model="shareOpen"
    v-model:scope="shareScope"
    v-model:expiry="shareExpiry"
    :title="'季度报表口径对齐'"
    :link="shareLink"
    :creating="shareCreating"
    @create="createShare"
    @revoke="revokeShare"
  />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">{{ shareHint }}</div>
</DemoBlock>

## 语音：朗读与口述

两个 composable 提供能力，两个按钮组件提供入口。**都按 Web Speech API 的能力检测决定给不给入口**——Firefox 目前没有 `SpeechRecognition`，Safari 部分版本只认 `webkit` 前缀；不支持时 `supported` 为 `false`、按钮整个不渲染，调用 `speak` / `start` 也是安全空操作。

### 朗读（`useSpeech` · `EbChatSpeak`）

```js
const { supported, speaking, speak, stop } = useSpeech({ lang: 'zh-CN', rate: 1 })
speak('念这段')   // 空文本返回 false；再点会先 cancel 上一条
```

<DemoBlock>
  <div style="display: flex; align-items: center; gap: 10px">
    <eb-chat-speak :text="DEMO_SPEAK_TEXT" />
    <span style="font-size: 12px; color: var(--eb-text-color-secondary)">浏览器不支持 Web Speech 时按钮整个不渲染（Firefox 目前不支持）</span>
  </div>
</DemoBlock>

`EbChatSpeak` 是动作条上的那颗按钮（图标 `volume`，朗读中转 `pause` 并脉动）。**开箱用法**是开 `speech` 开关，它会自动出现在助手消息上、用户消息上没有：

```vue
<eb-chatbot v-model="messages" speech />
```

单实例单次朗读：同一条里再次点击会先停掉上一条，避免多条消息同时念。

### 口述（`useSpeechInput` · `EbChatVoiceInput`）

```js
const { supported, listening, error, start, stop, toggle } = useSpeechInput({
  lang: 'zh-CN',
  onInterim: (text) => { /* 临时结果：覆盖填充输入框 */ },
  onFinal: (text) => { /* 定稿片段：追加，光标不跳 */ },
  onError: (code) => { /* not-allowed / no-speech / network ... */ },
})
```

结果分两路是刻意的：临时结果随时在变，直接覆盖填充；定稿才追加，这样光标不会往回跳。一次定稿多句时逐段交出，不拼成一坨。

`EbChatVoiceInput` 是独立按钮，丢进输入区**已有的插槽**即可，不需要改 composer：

```vue
<eb-chatbot v-model="messages" v-model:input-value="draft">
  <template #sender-toolbar>
    <eb-chat-voice-input lang="zh-CN" @interim="draft = $event" @result="draft += $event" />
  </template>
</eb-chatbot>
```

`EbAiPromptBox` 侧同理走 `#toolbar-extra`。

<DemoBlock>
  <eb-chatbot v-model="speechMsgs" speech height="420px" :show-tip="false" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    {{ speechHint }}
  </div>
</DemoBlock>

## 生成中的输入：排队与转向

此前生成期间发出的消息会被**静默丢弃**（`sendMessage` 在 loading 时直接 return）。现在默认改为**排队**，并在每轮结束后自动带出下一条。

```js
const engine = useChatEngine({ transport })

engine.sendMessage('第一个问题')
engine.sendMessage('第二个问题')   // 返回 'queued'，不丢
engine.pending.value              // [{ id, content, attachments, context }]
engine.dequeue(id) / engine.clearQueue() / engine.flushQueue()
```

`flushQueue()` 生成中不动作、空闲时手动带出一条——自动带出已经接在每轮结束，这个入口留给宿主做「立即发送」。

## 转向（steer）

有的产品希望生成中发出的消息**注入到当前这一轮**（「顺便也看下另一个指标」），而不是等下一轮。这需要宿主能往进行中的请求里塞内容，所以交给宿主：

```js
const engine = useChatEngine({
  transport,
  steerable: true,
  onSteer: (text) => myStream.appendToCurrentRun(text),   // 由你决定怎么注入
})
engine.sendMessage('补充一句')     // 返回 'steered'
```

`steerable` 为真但没给 `onSteer` 时**退回排队**——宁可晚一轮，也不丢。

## 输入区的配合

`EbChatbot` 加 `queueable` 后，生成中 Enter 与发送钮都会照常发出（宿主交给引擎即自动入队）；不开则维持原样「生成中拦下」。与 `stoppable` 互不干扰：停止钮仍是停止钮，点了不会变成发送。

`EbChatQueue` 是待发送队列那条窄带，宿主放在输入区上方即可（`#sender-prepend` 或自己排布）：

<DemoBlock>
  <eb-chat-queue :items="DEMO_QUEUE" style="max-width: 560px" />
</DemoBlock>

```vue
<eb-chatbot v-model="messages" queueable @send="onSend">
  <template #sender-prepend>
    <eb-chat-queue
      :items="engine.pending.value"
      @remove="engine.dequeue"
      @clear="engine.clearQueue"
    />
  </template>
</eb-chatbot>
```

## 斜杠命令与 @ 提及

`useTriggerMenu`（判定）+ `EbChatCommandMenu`（渲染）+ 输入区让出键盘，三件拼起来。键盘不放在弹层里是刻意的——**焦点始终在输入框**，弹层不该抢走输入。

`useTriggerMenu` 只做「从文本与光标位置算出该不该弹、弹什么、选中后文本变成什么」这件非平凡的事：

<DemoBlock title="菜单本体（常显；真实场景由 useTriggerMenu 控制显隐与高亮）">
  <eb-chat-command-menu
    :items="DEMO_COMMANDS"
    :visible="true"
    :highlight="1"
    title="输入 / 选择命令"
    style="max-width: 420px"
  />
</DemoBlock>

```js
const menu = useTriggerMenu({
  triggers: [
    { char: '/', items: COMMANDS },                                   // 命令
    { char: '@', items: PEOPLE, insert: (p) => `<${p.label}>` },       // 提及
  ],
})
menu.text.value = draft        // 与输入框同步
menu.caret.value = caret       // 光标位置（ChatSender 会抛 caret-change）
menu.visible.value             // 该不该弹
menu.items.value               // 过滤后的候选
menu.move(1) / menu.reset()    // 键盘移动
menu.pick(i)                   // → { text, caret }，交给输入框
```

**触发边界**（都有用例钉）：触发符必须在词首——路径里的 `/`、邮箱里的 `@` 都不会误触发；查询词里出现空白或换行即视为这个词已写完；光标退到触发符之前也不再弹。

输入区侧只需一条极窄的协作：`menuOpen` 为真时把 Enter / ↑ / ↓ / Esc 交出来（Enter 是选中而不是发送），Shift+Enter 与 IME 组字不受影响。

```vue
<eb-chatbot
  v-model="messages"
  v-model:input-value="draft"
  :menu-open="menu.visible.value"
  @caret-change="menu.caret.value = $event"
  @menu-key="onMenuKey"
>
  <template #sender-menu>
    <eb-chat-command-menu
      :items="menu.items.value"
      :highlight="menu.highlight.value"
      :visible="menu.visible.value"
      :title="menu.active.value?.char === '/' ? '命令' : '引用成员'"
      @hover="menu.highlight.value = $event"
      @select="applyMenuItem"
    />
  </template>
</eb-chatbot>
```

```js
function onMenuKey(key) {
  if (key === 'up') menu.move(-1)
  else if (key === 'down') menu.move(1)
  else if (key === 'escape') menu.visible.value = false   // 由你的状态收口
  else if (key === 'enter') applyMenuItem(menu.highlight.value)
}
function applyMenuItem(index) {
  const out = menu.pick(index)
  if (!out) return
  draft.value = out.text
  nextTick(() => senderRef.value?.setCaret(out.caret))   // 光标放回插入点之后
}
```

`#sender-menu` 渲染在输入区**上方**（`sender-prepend` 是左右并排的，放不了这个）。

## 上下文占用

### EbChatContextMeter

输入区上方的占用环：`{ used, capacity, breakdown? }`，环 + 百分比，点开给「已用 / 窗口」与三段构成（系统提示词 / 工具定义 / 对话消息）。**两侧缺一就不显示**——拿不到窗口容量时画个环只会误导；百分比封顶 100%，到 75% 转警告色、90% 转危险色，动画在 `prefers-reduced-motion` 下关掉。`capacity` 与三段都是宿主的业务口径（模型窗口、提示词预算），组件只做占比与呈现。

<DemoBlock>
  <div style="display: flex; gap: 16px; align-items: center">
    <eb-chat-context-meter :used="9600" :capacity="32000" />
    <eb-chat-context-meter :used="25600" :capacity="32000" :breakdown="{ system: 6200, tools: 4100, messages: 15300 }" />
    <eb-chat-context-meter :used="30400" :capacity="32000" />
  </div>
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `used` | number | `0` | 已用 token（压力值 / 预估值） |
| `capacity` | number | `0` | 上下文窗口容量；为 0 或 `used` 为 0 时不渲染 |
| `breakdown` | object | `null` | `{ system?, tools?, messages? }`，三者都是 token 数；缺的段不画 |

`EbChatbot` / `EbAiConsole` 的 `context` prop 直接 `v-bind` 这三个字段；`useChatSession` 用 `context` + `setContext({ used, capacity, breakdown })` 维护，也可由 `context/usage` 事件驱动（瞬时或持久形态都认，且不污染会话日志）。

## token 与成本计量

`EbChatUsage` 只展示宿主给的用量——**成本要价目表，那是宿主的业务数据**，组件与引擎都不猜。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-start">
    <eb-chat-usage :usage="DEMO_USAGE" />
    <eb-chat-usage :items="DEMO_USAGE_ITEMS" />
  </div>
</DemoBlock>

```js
engine.setUsage(msg.id, {
  promptTokens: 120,
  completionTokens: 380,
  totalTokens: 500,
  cost: 0.0032,        // 可选；不给就不显示成本位
  currency: '$',       // 可选；混币种取第一个出现的，不做汇率换算
})
```

消息带 `usage` 时元信息行自动出现一颗用量徽标（`1.2k tokens · $0.0032`），输入/输出的明细以读屏文本与悬浮提示给出、视觉上不占位。不带就完全不渲染。

单条用 `usage`，按会话汇总用 `items`（多条累加，token 与成本都汇总）：

```vue
<eb-chat-usage :items="messages.map((m) => m.usage).filter(Boolean)" size="default" :bare="false" />
```

千与百万以上折算成 `12.4k` / `2.3M`，成本小额保留四位（`$0.0032`）常规两位（`¥1.24`）。

## 观测性深链

消息带 `traceId` 时，动作条上出现一颗跳转外链——契约是 **URL 模板**而不是 URL 生成器：各家追踪平台路径差异极大（LangSmith / Langfuse / Phoenix / 自建 Jaeger），模板是最小可复用面。

```js
engine.setTrace(msg.id, { traceId: 'run_abc123' })   // 或直接给 traceUrl
```

```vue
<eb-chatbot v-model="messages" trace-url="https://smith.example.com/o/acme/runs/{traceId}" />
```

- `message.traceUrl` 直接给全量地址时优先于模板（你自己拼好了就别再套模板）
- `{traceId}` 会被 `encodeURIComponent` 编码，`a/b?c=1` 这类 id 不会破 URL
- 解析不出地址（无 id、无模板、模板里没占位符）就不渲染，**不留死链**
- 外链是 `<a target="_blank" rel="noopener noreferrer">` 而不是按钮——导航语义本来就该是锚点

要完全自定义这块，用已有的 `#message` scoped 插槽整条接管即可，没有另开 `#trace` 插槽——那与 `#message` 能力重叠。

## 测试结果与 stack trace

`EbChatTestResults` · `EbChatStackTrace`。两张都是纯数据渲染，无额外依赖。

### EbChatStackTrace

吃 stack 字符串或已解析的 frames，认三种常见形态：

| 形态 | 例 |
| --- | --- |
| Chrome / V8 | `at Object.fn (http://x/y.js:1:2)`、`at http://x/y.js:1:2` |
| Node | `at fn (/path/file.js:1:2)` |
| Firefox | `fn@http://x/y.js:1:2` |

按 `node_modules` / `/vendor/` / `<anonymous>` / `node:internal` 把依赖帧**折叠成一行**——它们对定位业务问题没用。每帧点击抛 `frame-click(frame)` 让宿主跳源码。

```vue
<eb-chat-stack-trace :stack="err.stack" :max-app-frames="5" @frame-click="openInEditor" />
```

**不做 source map 映射**：那要拉 map 文件，宿主映射好再传 frames 进来（`stack` 也接受 frames 数组）。

### EbChatTestResults

```js
message.testResults = {
  summary: { passed: 12, failed: 2, skipped: 1, duration: 3400 },
  cases: [{ name: 'parseDiff 单文件', suite: 'diff', status: 'failed', duration: 12, message: '期望 2 实际 1', stack: '…' }],
}
```

汇总条给通过 / 失败 / 跳过与总耗时；**失败项默认展开**（报错信息是这条结果的全部意义），并可一键「只看失败」。`status` 的归一规则：`passed / pass / ok` → 通过；`skipped / skip / todo` → 跳过；**没给状态** → 按跳过（不猜，既不宣称通过也不宣称失败）；**报了但认不出** → 按失败（漏报失败比虚报通过安全）。

`summary` 优先用宿主给的——跳过数这类信息组件自己数不出来。cases 里的 `stack` **组合** `EbChatStackTrace` 渲染，不内联解析：只看测试结果的宿主不该背上 stack 解析。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <eb-chat-test-results :results="DEMO_TESTS" expand-stacks />
    <eb-chat-stack-trace :stack="DEMO_STACK" :max-app-frames="3" />
  </div>
</DemoBlock>

## 长会话虚拟滚动

`EbChatList`（以及 `EbChatbot`）加 `virtual` 后，超过 `virtualThreshold`（默认 60）条即启用虚拟滚动——只有可视窗口内的消息进 DOM。历史几千轮的会话不会因为"全渲染"而卡住。

```vue
<eb-chatbot v-model="messages" virtual :virtual-threshold="60" :estimated-item-size="120" />
```

- **只虚拟化，不拆容器**：整段对话仍是**一个滚动条**。方案里曾设计"末端活跃窗口不虚拟化"，实现时去掉了——那要求两个滚动容器，会破坏"一个滚动条看完整对话"的基本体验；而逐帧重测的代价本来就被"只渲染可视窗口"限住了（每帧测十几到二十个节点）
- `role="log"` / `aria-live` / 回到底部钮 / `#message` 与 `#message-content` 插槽在虚拟模式下**全部保留**，语义落在虚拟列表的滚动容器上
- `estimatedItemSize` 是估算行高：滚动中会按实测收敛，给个接近的值能少跳几次
- 条数不到阈值时不启用（短会话白搭一层没有收益）

<DemoBlock>
  <eb-chatbot v-model="longMsgs" virtual :virtual-threshold="60" height="420px" :show-tip="false" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    {{ longHint }}
  </div>
</DemoBlock>

## 沙箱运行与网页预览

这两张是本仓唯一会承载外部内容的组件。`EbChatSandbox` 跑一段宿主给的 HTML/JS，`EbChatWebPreview` 嵌一个网址。

### EbChatSandbox

组件**不执行代码**，只把一个隔离 iframe 管起来：宿主给 HTML → 组件拼 bootstrap → `srcdoc` + sandbox 属性 → iframe；console 与错误经 `postMessage` 上来，**组件只转发不解析**。

**sandbox 旗标策略**（全部安全性的落点）：

| 旗标 | 默认 | 说明 |
| --- | --- | --- |
| `allow-scripts` | 开 | 不开跑不起来 |
| `allow-same-origin` | **永久禁** | 与 `allow-scripts` 同开等于没有沙箱：iframe 能拿同源存储并操作父文档。宿主传了也会被剔除并告警 |
| `allow-modals` / `allow-forms` / `allow-popups` / `allow-downloads` / `allow-pointer-lock` 等 | 禁 | 经 `extra-sandbox` 按需开，白名单外的一律忽略 |
| `allow-top-navigation` | 禁 | 不在白名单内 |

不给 `allow-same-origin` ⇒ 不透明源 ⇒ **代价是沙箱内 `localStorage` 不可用**。

```vue
<eb-chat-sandbox :html="generatedHtml" title="用户脚本" auto-height boot-console @error="onSandboxError" />
```

`auto-height` 由内容上报高度自动撑开（内容抖会带着卡片跳，默认关）；`reload` 会重建 iframe，避免复用旧 frame 留着上一段的状态。**`html` 优先于 `src`**——`srcdoc` 在规范上就压过 `src`，所以为空的 `srcdoc` 不会再被绑上去盖掉外部沙箱地址。

<DemoBlock>
  <eb-chat-sandbox :html="DEMO_SANDBOX_HTML" title="模型生成的页面" :height="160" />
</DemoBlock>

### EbChatWebPreview

iframe + 截图双模式。**有一个绕不过去的硬限制**：目标站返回 `X-Frame-Options: DENY` 或 `frame-ancestors` 时浏览器显示空白错误页，而跨域下脚本**无法可靠区分**「禁嵌的空白页」与「真的空白内容」——`load` 两种情况都触发。

所以判断只能由宿主在服务端 `HEAD` 拿到后传进来：`embeddable` 为 `true` 直接用 iframe、`false` 且有截图就直接用截图、不传则先试 iframe。两种素材都在时给手动切换——白框时用户能自救。

**「在新窗口打开」不是可选项，是必须项**：iframe 直嵌在目标站禁嵌时必然是白框，逃生口是唯一的确定性出路。

<DemoBlock>
  <eb-chat-web-preview
    src="https://example.com"
    screenshot="https://placehold.co/800x420/e8f0ff/175dff?text=Web+Preview"
    :embeddable="false"
    :height="220"
    title="example.com"
  />
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `src` | string | `''` | 预览地址（iframe 用） |
| `screenshot` | string | `''` | 静态截图地址；目标站禁嵌时回退到它 |
| `embeddable` | boolean \| null | `null` | 宿主在服务端 HEAD 判定：`true` 直用 iframe、`false` 有截图就用截图、不传先试 iframe |
| `title` | string | `''` | 卡片标题（通常写域名） |
| `screenshotAlt` | string | `''` | 截图的替代文本；不传时退回 `title` |
| `height` | string \| number | `320` | 预览区高度 |
| `extraSandbox` | array | `[]` | 追加的 sandbox 白名单项（白名单外的忽略） |
| `allow` | string | `''` | iframe `allow` 特性串（如 `clipboard-write`） |

## 输入类

### EbChatSender

输入区：自增高、Enter 发送、IME 组字安全、附件（点选 / 拖拽 / 粘贴）、字数限制、发送↔停止变形。`EbChatbot` 内部用它。

<DemoBlock>
  <eb-chat-sender v-model="demoDraft" placeholder="输入消息，Enter 发送" style="max-width: 560px" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary)">当前草稿：{{ demoDraft || '（空）' }}</div>
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | string | `''` | v-model |
| `placeholder` / `disabled` / `loading` | — | — / false / false | — |
| `allowAttachments` / `maxAttachments` | boolean / number | `true` / `5` | — |
| `maxLength` / `showWordCount` | number / boolean | `2000` / `false` | 真正约束 textarea，传 `0` 不限 |
| `minRows` / `maxRows` | number | `1` / `6` | 自增高范围 |
| `sendOnEnter` | boolean | `true` | 关掉后 Enter 只换行 |
| `stoppable` | boolean | `false` | loading 时发送钮变停止钮；此时**连按两次 Esc**（500ms 内、不带修饰键）也抛 `stop` |
| `accept` / `maxFileSize` | string / number | — / `0` | 附件类型与体积；拖拽粘贴同样校验 |
| `allowDrop` | boolean | `true` | 允许拖拽与粘贴投递 |

| Events | 载荷 |
| --- | --- |
| `send` | `(text, attachments)` |
| `stop` | — |
| `attachment-add` | `(file, item)`，`item` 是列表内的响应式对象，回写 `status` / `progress` 即驱动状态显示 |
| `attachment-reject` | `(file, reason)`，`reason` 取 `type / size / limit / empty` |

| Slots | 说明 |
| --- | --- |
| `toolbar` | 工具栏（附件按钮右侧） |

### EbChatMessageEdit

用户消息的原地编辑器。Esc 取消、Enter 保存、IME 安全、maxlength 生效。`{ modelValue, placeholder, maxLength, sendOnEnter }`，抛 `save(text)` / `cancel`。

<DemoBlock>
  <eb-chat-message-edit
    :model-value="DEMO_EDIT_TEXT"
    style="max-width: 560px"
    @save="demoLog = `save：${$event}`"
    @cancel="demoLog = 'cancel'"
  />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary)">{{ demoLog || 'Esc 取消 / Enter 保存（按钮同义）' }}</div>
</DemoBlock>

### EbChatSuggestion

追问 chips。`items` 接受 string 或 `{ text, prompt? }`；`layout` 取 `row`（消息尾部）或 `column`（欢迎区）；`icon` 传图标名则每枚前置。抛 `pick({ text, prompt })`。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <eb-chat-suggestion :items="DEMO_SUGGESTIONS" layout="row" />
    <eb-chat-suggestion :items="DEMO_SUGGESTIONS" layout="column" icon="chat" />
  </div>
</DemoBlock>

### EbChatFeedback

点赞点踩。点赞立即提交；点踩展开结构化原因面板与备注。取消评价也会交出 `{ value: null }`——否则宿主存下来的评价清不掉。

<DemoBlock>
  <eb-chat-feedback :reasons="DEMO_FEEDBACK_REASONS" @submit="demoLog = `feedback：${JSON.stringify($event)}`" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary)">{{ demoLog || '点赞立即提交；点踩展开原因面板' }}</div>
</DemoBlock>

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `'up' \| 'down' \| null` | `null` | v-model:value |
| `reasons` | array | 内置六项 | 点踩原因词汇表 |
| `showNote` | boolean | `true` | 是否显示备注框 |
| `disabled` | boolean | `false` | — |

| Events | 载荷 |
| --- | --- |
| `submit` | `({ value, reasons, note })`，取消时 `value` 为 `null` |

### EbChatActionbar

消息动作条：复制（内置，含已复制回执）、重新生成（仅 assistant）、编辑（仅 user）、自定义动作。默认悬停显示，`:focus-within` 与触屏常显。自定义动作**给了 `icon` 就是图标按钮，没给则回落成文字按钮**；每颗按钮悬浮都出**库内 Tooltip**（Teleport 到 body，消息列表滚动时不会被裁切），自定义动作可给 `desc` 作为更长的说明（`{ key, label, icon?, desc? }`，不给就用 `label`），`aria-label` 同步取它。「查看调用链」需要**模板含 `{traceId}` 且消息给了 `traceId`**（或消息直接给全量 `message.traceUrl`），解析不出就不渲染——免得给一个点了没用的按钮。

<!-- 常显（is-visible）是为了看清形态：真实场景里它跟着消息悬浮出现 -->
<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <eb-chat-actionbar
      class="is-visible"
      :message="DEMO_MSG_ASSISTANT"
      :actions="DEMO_ACTIONS"
      trace-url="https://o11y.example.com/runs/{traceId}"
    />
    <eb-chat-actionbar class="is-visible" :message="DEMO_MSG_USER" show-edit :show-regenerate="false" />
  </div>
</DemoBlock>

`{ message, actions, showCopy, showRegenerate, showEdit }`，抛 `copy` / `regenerate` / `edit` / `action`。

### EbChatAttachments

附件卡片列表：图片预览或**按后缀匹配的专用图标**（pdf / word / excel / ppt / zip / image / music / video / code / text，认不出退 MIME 大类、再退通用文档图标）、文件名、体积、移除钮；**图标默认按类型染色**（pdf 红 / word 蓝 / excel 绿 / ppt 橙 / zip 灰蓝…，全部映射到 `--eb-*` 语义令牌，随主题与暗色自动走），传 `colored="false"` 可关掉染色、统一跟随正文色；宿主回写 `status` 时显示进度条（`uploading` + `progress`）、失败原因（`error`）或已上传（`done`）。`{ attachments, removable }`，抛 `remove(file)`。

<DemoBlock>
  <eb-chat-attachments :attachments="DEMO_ATTACHMENTS" removable style="max-width: 560px" />
</DemoBlock>

不想要彩色图标时关掉即可（同一份数据，图标统一跟随正文色）：

<DemoBlock>
  <eb-chat-attachments :attachments="DEMO_ATTACHMENTS" :colored="false" style="max-width: 560px" />
</DemoBlock>

## 文案与多语言

子组件的文案同样来自本包语言包（`src/locale/{zh-CN,en}.js`，`en` 全量；其余语言或缺失的键回退 `zh-CN`），经 `useChatLabels()` 取用，因此单独挂载子组件时也认 `EbConfigProvider` 的 `locale`——只要它在 Provider 子树里（语言名由底座给，译文由本包查）。宿主可传入的文案（如 `EbChatSender` 的 `placeholder`、`EbChatMessage` 的 `user-name`）优先于译文。

<script setup>
import { ref } from 'vue'

// ─── 结构 / 过程 / 输入类案例的数据（全部静态，不引计时器） ───
const demoDraft = ref('')
const demoLog = ref('')

const DEMO_LIST_MSGS = [
  { id: 'l1', role: 'user', content: '这个库支持消息虚拟滚动吗？', status: 'done', createdAt: Date.now() - 120000 },
  {
    id: 'l2',
    role: 'assistant',
    content: '支持。`ChatList` 的 `virtual` 打开后超过阈值（默认 60 条）只渲染可视窗口，长会话不再拖慢页面。',
    status: 'done',
    createdAt: Date.now() - 90000,
  },
]
const DEMO_MSG_USER = { id: 'm-u', role: 'user', content: '四种消息形态分别是？', status: 'done', createdAt: Date.now() - 60000 }
const DEMO_MSG_ASSISTANT = {
  id: 'm-a',
  role: 'assistant',
  content: 'user / assistant 是双方气泡，system 与 notice 是居中弱化的系统提示。',
  status: 'done',
  duration: 1800,
  createdAt: Date.now() - 30000,
  // 观测性深链：给了 traceId，动作条才按 traceUrl 模板渲染「查看调用链」
  traceId: '8f2c1d',
}
const DEMO_MSG_SYSTEM = { id: 'm-s', role: 'system', content: '会话已开启联网搜索', status: 'done' }
const DEMO_MSG_NOTICE = { id: 'm-n', role: 'notice', content: '本回答由模型生成，重要信息请二次核对', status: 'done' }

const DEMO_MARKDOWN = [
  '**正文管线**支持 GFM：表格、任务列表、`行内码` 与代码块。',
  '',
  '| 能力 | 默认 |',
  '| --- | --- |',
  '| 代码高亮 | highlight.js（36 种语言） |',
  '| 数学 / 图表 | 宿主注入渲染器才启用 |',
  '',
  '```js',
  'const md = renderChatMarkdown(source)',
  '```',
  '',
  '> 原文 HTML 一律转义为纯文本，链接与图片走协议白名单。',
].join('\n')

const DEMO_THINK = '先确认「化能合成」的能量来源是硫化氢而非光照；再按热泉口面积估算年通量；最后与光合作用对比量级。'

const DEMO_TOOL_RUNNING = { id: 't-1', name: 'web_search', label: '搜索网页', status: 'running' }
const DEMO_TOOL_DONE = {
  id: 't-2',
  name: 'web_search',
  label: '搜索网页',
  status: 'done',
  duration: 1280,
  args: { query: '热泉口 化能合成 最新进展' },
  result: { hits: 3, top: '深海热泉口微生物固碳研究（2026）' },
}
const DEMO_TOOL_ERROR = { id: 't-3', name: 'read_file', label: '读取文件', status: 'error', error: 'ENOENT: 文件不存在' }

const DEMO_SOURCES = [
  { id: 's1', index: 1, title: '深海热泉口微生物固碳研究', url: 'https://example.com/paper/1', source: 'Nature', snippet: '热泉口化能合成速率约为光合作用的 0.1% 量级。' },
  { id: 's2', index: 2, title: '化能合成能量通量估算方法', url: 'https://example.com/paper/2', source: 'Science' },
  { id: 's3', index: 3, title: '内部知识库 · 生物能量学', source: '知识库', snippet: '按 10 ㎡ 口径估算，年通量约 1.2×10⁶ kJ。' },
]

const DEMO_CHANGES = [
  { path: 'examples/ebui-example-ai/src/pages/AiWorkbench.vue', display: 'AiWorkbench.vue', added: 88, deleted: 12 },
  { path: 'packages/evoke-chat/src/components/chatbot/useChatEngine.js', display: 'useChatEngine.js', added: 42, deleted: 3 },
  { path: 'packages/evoke-chat/test/chat-changes.test.js', display: 'chat-changes.test.js', added: 120 },
  { path: 'assets/logo.png', binary: true },
  { path: 'dist/bundle.js', oversized: true },
  { path: 'README.md', added: 6, deleted: 2 },
]

const DEMO_EDIT_TEXT = '帮我把这句改得更口语一点'
const DEMO_SUGGESTIONS = ['再说说批 B 的来源引用', '虚拟滚动的阈值能改吗', '给我一个最小接入示例']
const DEMO_FEEDBACK_REASONS = ['没有理解问题', '回答不准确', '信息过时', '格式混乱']
const DEMO_ACTIONS = [
  { key: 'pin', label: '钉住', icon: 'pushpin', desc: '钉住这条回答，后续对话都会带上它作上下文' },
  { key: 'share', label: '分享', icon: 'share', desc: '生成分享链接' },
]

// 图标按后缀匹配（pdf / word / excel / zip / image / code…）：留空 type 是为了走图标分支而不是图片预览
const DEMO_ATTACHMENTS = [
  { id: 'a1', name: '季度报表.pdf', size: 348160, type: 'application/pdf', status: 'uploading', progress: 62 },
  { id: 'a2', name: '会议纪要.docx', size: 51200, type: 'application/msword', status: 'done', progress: 100 },
  { id: 'a3', name: '数据导入.csv', size: 1048576, type: 'text/csv', status: 'error', error: '类型不在白名单' },
  { id: 'a4', name: '方案.pptx', size: 2097152, type: '' },
  { id: 'a5', name: '素材包.zip', size: 8388608, type: '' },
  { id: 'a6', name: '界面稿.png', size: 512000, type: '' },
  { id: 'a7', name: 'main.ts', size: 4096, type: '' },
  { id: 'a8', name: '演示录像.mp4', size: 15728640, type: '' },
]
const DEMO_SPEAK_TEXT = '这一段由浏览器合成的语音念出来，用来演示朗读入口。'
const DEMO_QUEUE = [
  { id: 'q1', content: '再帮我算一下同比' },
  { id: 'q2', content: '把结论整理成三点' },
  { id: 'q3', attachments: [{ id: 'qa', name: '补充数据.xlsx' }] },
]
const DEMO_COMMANDS = [
  { key: 'clear', label: '/clear', desc: '清空当前会话' },
  { key: 'summarize', label: '/summarize', desc: '把上文压缩成摘要' },
  { key: 'export', label: '/export', desc: '导出为 Markdown' },
]
const DEMO_USAGE = { promptTokens: 1820, completionTokens: 460, cost: 0.0123, currency: '¥' }
const DEMO_USAGE_ITEMS = [
  { promptTokens: 900, completionTokens: 300, cost: 0.0061, currency: '¥' },
  { promptTokens: 920, completionTokens: 160, cost: 0.0062, currency: '¥' },
]

// ─── 测试结果与 stack 演示数据 ───
const DEMO_TESTS = {
  summary: { passed: 12, failed: 2, skipped: 1, duration: 3420 },
  cases: [
    { name: 'parseDiff 单文件单 hunk', suite: 'diff', status: 'passed', duration: 2 },
    { name: '触发边界：路径里的 / 不触发', suite: 'trigger', status: 'passed', duration: 1 },
    {
      name: 'ansi 换色时替换而不是叠加',
      suite: 'ansi',
      status: 'failed',
      duration: 4,
      message: '期望 is-fg-green，实际 is-fg-red is-fg-green',
      stack: 'Error: 断言失败\n    at assertColor (http://app.example/ansi.spec.js:42:11)\n    at Object.next (node_modules/vitest/index.js:88:5)\n    at http://app.example/run.js:7:3',
    },
    { name: '空插槽回落默认渲染', suite: 'slots', status: 'skipped' },
  ],
}
const DEMO_STACK = 'Error: boom\n    at doThing (http://app.example/main.js:10:5)\n    at Object.next (node_modules/lib/index.js:3:1)\n    at http://app.example/other.js:20:7\n    at process (node:internal/process/task_queues:95:5)'

// ─── 沙箱演示：一段真会跑的代码，用来展示 console 桥 ───
const DEMO_SANDBOX_HTML = [
  '<!DOCTYPE html><html><body style="margin:0;font:13px system-ui;display:flex;align-items:center;justify-content:center;height:100%">',
  '<div id="box" style="padding:16px 20px;border-radius:10px;background:#e8f0ff;color:#175dff">沙箱内的页面</div>',
  '<script>',
  'console.log("沙箱已就绪");',
  'setTimeout(function () { console.log("两秒后的一次日志"); }, 2000);',
  '</' + 'script>',
  '</body></html>',
].join('')

// ─── 长会话虚拟滚动演示 ───
const LONG_COUNT = 300
function buildLongMessages() {
  const kinds = ['short', 'long', 'code', 'tools']
  return Array.from({ length: LONG_COUNT }, (_, i) => {
    const kind = kinds[i % kinds.length]
    const base = { id: `L${i}`, role: i % 2 === 0 ? 'user' : 'assistant', status: 'done' }
    if (kind === 'long') {
      return { ...base, content: `第 ${i} 条：${'这是一段用来撑高行的说明文字，验证长消息下的虚拟滚动。'.repeat(6)}` }
    }
    if (kind === 'code') {
      return { ...base, content: `第 ${i} 条：\n\n\`\`\`js\nconst n = ${i}\nfunction f() { return n * 2 }\n\`\`\`` }
    }
    if (kind === 'tools') {
      return { ...base, content: `第 ${i} 条`, toolCalls: [{ id: `t${i}`, name: 'search', status: 'done', args: { q: `查询 ${i}` }, result: `命中 ${i} 条` }] }
    }
    return { ...base, content: `第 ${i} 条短消息` }
  })
}
const longMsgs = ref(buildLongMessages())
const longHint = ref(`${LONG_COUNT} 条消息：DOM 里只有可视窗口那十几条，滚动条长度按估算高度撑开`)

// ─── 语音演示 ───
const speechSupported = typeof window !== 'undefined'
  && typeof window.speechSynthesis !== 'undefined'
const speechHint = ref(
  speechSupported
    ? '悬停助手消息，动作条里多了一颗喇叭——点它会用系统语音念出这条回复'
    : '当前浏览器没有 speechSynthesis，朗读钮不会渲染（能力检测生效）'
)
const speechMsgs = ref([
  { id: 'v-1', role: 'user', content: '用一句话介绍这个组件库', status: 'done' },
  {
    id: 'v-2',
    role: 'assistant',
    status: 'done',
    content: 'Evoke Business UI 是一套面向中后台的 Vue 3 组件库，**内置了完整的 AI 对话家族**——从消息流、工具卡到多会话与浮动挂件。',
  },
])

// ─── 分享弹层演示 ───
const shareOpen = ref(false)
const shareScope = ref('anyone')
const shareExpiry = ref('7d')
const shareLink = ref('')
const shareCreating = ref(false)
const shareHint = ref('点「创建链接」看组件如何把意图抛给宿主')
function createShare() {
  // 真实场景：拿 scope/expiry 去服务端换链接
  shareCreating.value = true
  setTimeout(() => {
    shareLink.value = `https://example.com/s/${Math.random().toString(36).slice(2, 8)}`
    shareCreating.value = false
    shareHint.value = '链接已回灌，弹层切到已创建态'
  }, 600)
}
function revokeShare() {
  shareLink.value = ''
  shareHint.value = '已撤销，回到配置态'
}

// ─── 代码 agent 三卡演示数据 ───
const DEMO_DIFF = [
  'diff --git a/src/utils/parse.ts b/src/utils/parse.ts',
  'index a1b2c3d..d4e5f6a 100644',
  '--- a/src/utils/parse.ts',
  '+++ b/src/utils/parse.ts',
  '@@ -12,6 +12,7 @@ export function parse(input: string) {',
  '   const lines = input.split("\\n")',
  '-  return lines.map((l) => l.trim())',
  '+  // 保留缩进：下游靠它判断层级',
  '+  return lines.map((l) => l.replace(/\\s+$/, ""))',
  ' }',
  '',
  'diff --git a/README.md b/README.md',
  '--- a/README.md',
  '+++ b/README.md',
  '@@ -1,2 +1,3 @@',
  ' # 项目说明',
  '+新增了代码 agent 三卡的用法章节。',
  ' 见 docs。',
].join('\n')

const DEMO_TERMINAL = [
  '\u001b[32m✓\u001b[0m parseDiff 单文件单 hunk\n',
  '\u001b[32m✓\u001b[0m parseDiff 多文件各自归组\n',
  '\u001b[31m✗\u001b[0m ansi 换行内序列\n',
  '\u001b[1mTests \u001b[0m 2130 passed\n',
  'Time: 18.2s',
].join('')

const DEMO_FILES = [
  { path: 'docs/chat/chat-subcomponents.md', status: 'modified', additions: 42, deletions: 3 },
  { path: 'src/utils/parse.ts', status: 'modified', additions: 2, deletions: 1 },
  { path: 'src/components/ChatDiff.vue', status: 'added', additions: 186 },
  { path: 'src/legacy/old-diff.vue', status: 'deleted', deletions: 88 },
  { path: 'src/ansi.js', status: 'renamed' },
]
</script>
