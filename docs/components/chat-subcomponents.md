# 对话子组件

`EbChatbot` 之外的家族成员。**绝大多数场景不需要直接用它们**——`EbChatbot` 已经把这些组装好了。它们用于两种情形：只想要其中一块（比如独立渲染一段 Markdown），或要自己编排（`ChatList` + 自定义发送区）。

下表标题即导出名——`EbChatMessage`、`EbChatSender` 这样带 `Eb` 前缀整名导出。

## 结构类

### EbChatContent

面板外壳：固定尺寸、可选边框、头部/底部槽位。`EbChatbot` 用它包住消息区与输入区。

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
| `copy` / `regenerate` / `edit` / `feedback` / `suggestion-click` / `citation-click` / `tool-retry` | 见 [Chatbot 对话窗口](/components/chatbot) 同名事件 |
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

Props 与 `ChatList` 的透传面一致，外加 `message` 本身。

| Events | 载荷 |
| --- | --- |
| `copy` / `regenerate` / `edit` / `feedback` / `suggestion-click` / `citation-click` / `tool-retry` | 见 [Chatbot](/components/chatbot) |

| Slots | 说明 |
| --- | --- |
| `content` | 只换气泡内正文；作用域 `{ message, content, renderMode, streaming }` |

消息项的字段：`{ id, role, content, status, thinking?, thinkContent?, attachments?, suggestions?, feedback?, feedbackReasons?, feedbackNote?, edited?, citations?, toolCalls?, duration?, error? }`，`status` 取 `pending / streaming / done / error / cancelled`。

### EbChatMarkdown

Markdown 渲染器：GFM 表格与任务列表、代码块工具条（语言标签 + 复制）、自定义协议引用芯片、`source:` 行内引用上标、流式拖尾。原文 HTML 一律转义为纯文本；图片 `src` 只放行 `http` / `https` / `data`。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `content` | string | `''` | Markdown 原文 |
| `streaming` | boolean | `false` | 流式态：末尾补拖尾，重解析按帧合并 |

| Events | 载荷 |
| --- | --- |
| `citation-click` | `(id)` 行内引用上标被点击或回车 |

管线配置（协议白名单、主题色、追加高亮语言）见 [Chatbot 的正文渲染配置](/components/chatbot#正文渲染配置)。

## 过程类

### EbChatThinking

思考过程折叠块。流式期间强制展开，结束后回到用户可控的折叠态。`{ content, thinking, duration }`，无事件。

### EbChatLoading

三点起伏的打字指示。可选 `text` 文案。

### EbChatToolCall

工具调用卡：状态标记（等待/执行/失败/完成）、耗时、参数与结果的折叠展开，失败态给重试钮。

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

### EbChatSources

来源引用卡列表：序号 / favicon / 标题 / 域名 / 摘要，可折叠。点击上标会自动展开并高亮对应卡片——该联动由 `ChatMessage` 内部接好，单独用时可调 `highlight(id)`（经 `defineExpose`）。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | array | `[]` | `{ id?, index?, title, url?, source?, snippet?, favicon? }` |
| `collapsible` | boolean | `true` | 关掉就是常驻列表 |
| `defaultOpen` | boolean | `true` | 初始展开 |

| Events | 载荷 |
| --- | --- |
| `item-click` | `(item, index)` |

## 输入类

### EbChatSender

输入区：自增高、Enter 发送、IME 组字安全、附件（点选 / 拖拽 / 粘贴）、字数限制、发送↔停止变形。`EbChatbot` 内部用它。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | string | `''` | v-model |
| `placeholder` / `disabled` / `loading` | — | — / false / false | — |
| `allowAttachments` / `maxAttachments` | boolean / number | `true` / `5` | — |
| `maxLength` / `showWordCount` | number / boolean | `2000` / `false` | 真正约束 textarea，传 `0` 不限 |
| `minRows` / `maxRows` | number | `1` / `6` | 自增高范围 |
| `sendOnEnter` | boolean | `true` | 关掉后 Enter 只换行 |
| `stoppable` | boolean | `false` | loading 时发送钮变停止钮 |
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

### EbChatSuggestion

追问 chips。`items` 接受 string 或 `{ text, prompt? }`；`layout` 取 `row`（消息尾部）或 `column`（欢迎区）；`icon` 传图标名则每枚前置。抛 `pick({ text, prompt })`。

### EbChatFeedback

点赞点踩。点赞立即提交；点踩展开结构化原因面板与备注。取消评价也会交出 `{ value: null }`——否则宿主存下来的评价清不掉。

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

消息动作条：复制（内置，含已复制回执）、重新生成（仅 assistant）、编辑（仅 user）、自定义动作。默认悬停显示，`:focus-within` 与触屏常显。

`{ message, actions, showCopy, showRegenerate, showEdit }`，抛 `copy` / `regenerate` / `edit` / `action`。

### EbChatAttachments

附件卡片列表：图片预览或类型图标、文件名、体积、移除钮；宿主回写 `status` 时显示进度条（`uploading` + `progress`）、失败原因（`error`）或已上传（`done`）。`{ attachments, removable }`，抛 `remove(file)`。
