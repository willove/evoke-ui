# Changelog

本库遵循 [Semantic Versioning](https://semver.org/)。

## [Unreleased]

### @wil-works/evoke-business-ui — 激活涟漪改为向内收拢（input / select / textarea 等输入家族）

- **聚焦涟漪反向**：激活时色环**先从边框向外荡开至 4px（约四成时长），再贴着边框向内收拢回 0 并淡出**（1.2s）。两段均用 ease-out 型曲线（字面量，见下条注意）——荡开/收拢起手即动、落点轻柔，没有 ease-in-out 起手的死帧感；色环比此前浅一档（主色 30% → 20% 透明）。此前是向四周荡开约 6px 且一边扩散一边消散（0.7s ease-out，动作全压在前三分之一，看着「一闪而过」）；
- **实现注意**：`@keyframes` 内的 `animation-timing-function` 写 `var(--eb-*)` 会被引擎静默丢弃（实测回退成动画级曲线），故 keyframe 里用与 `--eb-ease-out` 同值的字面量贝塞尔；改动该令牌时记得同步 keyframe；
- **涟漪覆盖面补齐**：`EbTextarea`、`EbInputNumber` 原本有 `--eb-*` 涟漪样式但组件未维护聚焦类，涟漪从不触发——补 `is-focus` 绑定；`EbMention` 整套接入（新增 `ripple` prop、聚焦态类、CSS 选择器与三档开关）。`EbAutoComplete` / `EbSearchFilter` / `EbTransfer` 内部就是 `EbInput`，无需另列；
- **按钮按压缩放缓**：`:active` 缩放 0.96 → 0.98——一排并排按钮同时按下时，4% 的宽窄跳动非常明显；与 evoke-ui 的 0.98 对齐。
- **渲染实现换轨**：涟漪层由「`::before` + `box-shadow` 扩散」改为「`::before` + 实体色环（`inset` + 边框宽度）」——颜色静态解析、全程不参与插值，只插值长度与透明度，任何引擎都是连续缓动（此前 `color-mix()` 写进 `box-shadow` 关键帧，在不支持对 `color-mix` 做插值的引擎里会退化成跳变，表现为「闪一下」而非缓动）；色环为正层级，也不再被祖先容器的底色遮住；
- **错误态**：`is-error` 色环跟随 danger 色不变；`--eb-field-ring-color` 覆盖口不变；`html[data-eb-ripple='off']` 全局关闭与 `prefers-reduced-motion` 停用不变；
- **修复**：组件级 `:ripple="false"` 与 Form 级 `<eb-form :ripple="false">` 此前特异性压不过聚焦触发规则，聚焦时涟漪照播——关闭规则已修为严格高一级，三档开关（组件 / Form / 全局 `setRipple`）均即时生效。

### @wil-works/evoke-ui — 激活涟漪同步改为向内收拢（input / select / textarea / search-box）

- 同一反向改动落在 evoke-ui 侧四个组件：涟漪层改为出现在框体外缘后向内收拢进边框并消散（0.7s），颜色静态、只插值 `inset` / `border-radius` / 透明度。

## [chat 0.1.0 / business-ui 0.9.0 / ui 0.11.0] — 2026-09-22

### @wil-works/evoke-chat — 新包：对话家族整族迁出（0.1.0）

- **新包 `@wil-works/evoke-chat`**：`chatbot/` 家族（对话窗口、消息体、Markdown 管线、
  Agent 三件套、代码 agent 三卡、语音、排队、触发菜单、计量、测试结果、沙箱与网页预览）
  连同 `EbAiConsole` / `EbAiPromptBox` 整体从 `@wil-works/evoke-business-ui` 迁出，
  版本独立演进；
- 底座是 **peer 依赖**（`vue` + `@wil-works/evoke-business-ui`）：基础组件、`--eb-*`
  设计令牌、`EbConfigProvider` 的语言/主题上下文都来自底座，宿主需安装两侧并各自
  `app.use` + 引 `styles`；
- **随包依赖只有 `marked` + `highlight.js`**：不用对话能力的宿主不再把它们带进依赖树；
- **多语言**：文案随包走（`@wil-works/evoke-chat/locale`），**英文全量**；语言名由底座
  决定（`EbConfigProvider` 的 `locale`），没译文的语言或缺失的键回退 `zh-CN`；
- 组件对底座的引用走子路径（`@wil-works/evoke-business-ui/icon` 等），按需解析。

### @wil-works/evoke-chat — 高度与布局协调

- **EbChatSender**：工具行（附件 + `#toolbar` 插槽）与发送行并作一行（三行 → 两行），输入区 130px → 96px——小高度窗口里正文不再被输入区挤没；插槽位置仍在附件按钮右侧，只是挪到底部行；
- **EbAiConsole**：父容器给了确定高度就**撑满**——会话区 `flex:1` 吃掉剩余空间、输入区贴底（`chat-height` 仍为上限）；欢迎态整块垂直居中；**输入区与容器左右边框留 16px 间距**（此前与边框贴死，会话区也给同样的水平内边距）；
- 文档示例统一抬高（对话窗口 460~520px、工作台 560px、挂件 440px），一屏可见完整往复。
- 文档：`chat-subcomponents` 补 17 个案例（DemoBlock 7 → 24，覆盖结构类 / 过程类 / 输入类与计量、队列、命令菜单）；`chat-agent` 三例高度 300~340px → 520px。
- **思考模式**：`show-avatar` / `show-name` 支持传对象**分侧控制**（`{ user: false }` / `{ assistant: false }`）；引擎新增 `thinkDuration`（`appendThinkContent` / `stopThinking` / `completeMessage` 自动结算思考耗时，思考块标题右侧显示「（用时 X）」）；
- **消息控制行**：追问 chips / 评价 / 时间与动作条改为**并排一行**（此前是三行堆叠），chips 占剩余宽度并可换行、评价与动作条靠右；点踩展开原因面板时评价块整行铺开（面板宽度不再被挤）；
- **EbChatMessage**：新增 `show-avatar` / `show-name` / `show-time`；**时间戳从头部挪到消息下方**，与动作条同排、悬浮（或键盘聚焦 / 触屏）时一起出现；
- **EbChatList 回底按钮**：从 `position: absolute`（会随内容一起滚走，看着像没悬浮）改为 **0 高 sticky 锚点**——滚动时钉在可视区底部居中，点它滚回底部后自动隐藏；
- **EbChatActionbar**：每颗按钮的悬浮提示改用**库内 Tooltip**（Teleport 到 body，滚动容器里不会被裁切；此前是原生 `title`，慢且不可控）；自定义动作新增 `desc`（更长的说明，工具提示与 `aria-label` 都用它，不给退回 `label`）。
- **EbChatAttachments**：附件图标**默认按类型染色**（pdf 红 / word 蓝 / excel 绿 / ppt 橙 / zip 灰蓝 / code 蓝 / image 绿 / video 红），全部走 `--eb-*` 语义令牌随主题与暗色自动适配；新增 `colored` 开关（`colored="false"` 统一跟随正文色）。
- **EbChatAttachments**：附件图标改为**按后缀匹配专用图标**（pdf / word / excel / ppt / zip / image / music / video / code / text，认不出退 MIME 大类再退通用文档图标；`fileIcons.js` 可单测）；文档示例覆盖多种类型。
- **EbChatActionbar**：自定义动作的图标回落行为写进文档——给了 `icon` 是图标按钮，没给就是文字按钮（此前示例没给 icon，看起来像"图标没渲染"）。
- **EbChatThinking**：结束后**默认收起**（此前的初值是展开，与文档里「结束后回到折叠态」自相矛盾；流式期间仍强制展开，用户手动点开过就不自动收）；
- **EbChatMarkdown**：SSR 安全——无 `requestAnimationFrame` 的环境（Node / SSR）退化为同步渲染。此前在 SSR 里渲染流式消息（如 `EbChatThinking` 的思考块）会直接抛 `ReferenceError`；
- **EbVirtualList（动态行高）**：窗口滑动后**重测新进窗口的条目**——此前只在挂载与占位块尺寸变化时测一次，新窗口的条目按估算高度（默认 40px / 聊天侧 120px）排布，实测更高的条目（代码块、工具卡、长文本）会与下一条**互相叠压**（实测最多叠 114px）；顺带按「窗口首条偏移」补偿 `scrollTop`，避免上面行变高把可视内容整体推走。`EbChatList` 的 `virtual` 长会话直接受益；
- 会话滚动容器加 `scrollbar-gutter: stable`：滚动条出现时不再重排正文（此前一出滚动条内容横向挤一下）；
- **EbAiConsole**：会话区改成 flex 列容器——内层 `ChatList` 吃满高度后成为**唯一滚动元素**，修掉「新消息不自动滚到底」（此前外层 `.eb-ai-console__chat` 在滚、内层列表滚不动，而跟随逻辑驱动的是内层）；
- 文档示例修掉「发出消息后出现两条用户记录」：`EbChatbot` 本就会追加用户消息并回写 `v-model`，示例里又手动 push 了一次（6 处 + 挂件示例）。

### @wil-works/evoke-chat — 确认门按钮改用 EbButton

- `actions[].icon` 新增支持（库内图标名，如 `check-circle` / `close-circle`），走 `EbButton` 的 `icon`；**响应后那颗挑中的自动换成对勾**；
- `EbChatConfirmation` 的动作按钮从自绘 `<button>` 换成**库内 `EbButton`**（`size="small"`，`type` 直接透传 `actions[].type`）——外观、焦点环、禁用态与全库按钮一致，卡片侧只保留「已选中」标记（响应后挑中的那颗留主色描边 + 对勾）；选择器 `eb-chat-confirmation__btn`（含 `is-chosen`）保持不变，消费方与测试无需改动。
- 家族其余按钮（图标钮 / chips / 整行可点卡片）**维持原设计**：那些是 24–28px 密集控件与整行热区，套 `EbButton` 的尺寸档位与间距规则反而要逐个覆写；口径差异写在文档里。

### 文档站 — 顶栏 npm 入口换图标

- business / charts 两站顶栏跳 npm 的按钮此前用的是**下载箭头**（`download`），与「跳到包页」语义不符；改为 **npm 标**（Remix `Logos/npmjs-line`），`aria-label` / `title` 也由「下载」改为「在 npm 上查看」；
- 两套图标集各补一个 `npmjs`（business 437 → 438、evoke-ui 核心集 76 → 77），仍走生成器 MAPPING，不手写路径；ui 站图标总览页计数同步到 77。

### @wil-works/evoke-business-ui — 拆包配套

- 新增 `./locale` 子路径导出（`zhCN` / `en` / `ja` / `zhTW` / `ko` / `es` / `pt`），
  此前宿主拿不到语言包对象；
- 新增公共接缝导出：`useLocale` / `usePlatform` / `isImeComposing` / `inBrowser`；
- 卸载 `marked` / `highlight.js` 依赖；`.eb-chat-shimmer`（流式拖尾）随家族迁走；
  注册组件数 182 → 147。

### @wil-works/evoke-business-ui — 对齐 antd 能力第二批

- **EbSelect / EbTreeSelect**：`label-in-value` 让值携带 `{ value, label }`（多选为数组，
  回显兼容两种形态）；Select 新增 `max-count` 多选上限与 `#popup-render` 下拉底部
  自定义区块（点击不关闭下拉）；TreeSelect 触发器支持键盘打开；
- **EbTable**：`scroll-x` 宽表横向滚动（表头表体同步、fixed 列兼容）；选中受控
  `v-model:selection` 与 `selection-type="radio"` 单选模式；
- **EbDescriptions**：`colon` 标签冒号、`column` 支持响应式对象（`{ xs, sm, md, lg }`）、
  `label-style` / `content-style` 容器级与单元级；
- **EbTransfer**：`one-way` 单向模式（隐藏回移入口）；
- **EbAutoComplete**：`default-active-first-option` 自动高亮首条、候选支持
  `{ value, label }` 对象与纯字符串、有输入无结果时显示空态、卸载清理防抖定时器。

### @wil-works/evoke-business-ui — 键盘可达性专项

- **EbDropdown / EbTimeSelect / EbCascader / EbTreeSelect**：触发器关闭态
  Enter / Space / ↓ 打开浮层，Esc 关闭并归还焦点；
- **EbDropdown**：菜单内 ↑↓ 移动、Enter/Space 选中、Esc 还焦；**EbCascader**：面板内
  ↑↓ 高亮、→ 进子列、← 回退、Enter 选中；**EbTree**：↑↓ 移动当前节点、→/← 展开收起、
  Enter 选中、Space 勾选；**EbImageViewer**：操作按钮改真实 button 可聚焦，←/→ 切换、
  +/- 缩放、0 重置、打开移焦关闭还焦、接入滚动锁；
- **EbMenu**：折叠态切换后子菜单弹层方向实时更新（原 setup 期取值一次不再变化）。

### @wil-works/evoke-business-ui — i18n 收口与主题化

- date-picker 移动端标题、tour、pagination aria、msgbox 默认文案、calendar aria、
  autocomplete 空态接入多语言包（7 语言补齐，中文文案不变）；
- **EbJsonViewer**：`--jv-*` 私有令牌与硬编码色值全部替换为 `--eb-*` 语义令牌，
  随主题与暗色自适应。

### @wil-works/evoke-ui — a11y 与暗桩批

- **EvTabs** 方向键/Home/End 导航（roving tabindex）；**EvModal** Tab 焦点圈闭，
  并修复 `modelValue: true` 初始挂载时焦点管理/滚动锁静默失效；
- navbar 展开态 aria-expanded；ConfigProvider 卸载还原已写入的主题令牌；
  useThemeConfig 三个 setter 补 SSR 守卫；ContactForm 改 useId 消除多实例 id 冲突；
  AiPromptBox `maxLength` 真正约束输入（默认改为不限长）；LoadMore 动态解除
  disabled 后自动建观察者；FeatureGrid 动态换数据不再丢入场动效；Input 暴露的
  `focused` 真实反映焦点态。

### 破坏性变更（Breaking）

- **evoke-business-ui → evoke-chat**：`EbChat*`（33 个）与 `EbAiConsole` / `EbAiPromptBox`
  不再由 `@wil-works/evoke-business-ui` 注册与导出，改由 `@wil-works/evoke-chat` 提供；
  `useChatEngine` / `useChatSessions` / `useTriggerMenu` / `useSpeech` / `useSpeechInput` /
  `configureChatMarkdown` / `renderChatMarkdown` / `chatLabels` 的导入路径同步改为新包；
  样式需额外引入 `@wil-works/evoke-chat/styles`；
- **语言包**：`eb.chat` 命名空间从底座语言包移除，对话文案改由
  `@wil-works/evoke-chat/locale` 提供；
- **evoke-business-ui**：`EbTable` 的 `expand-change` 事件统一为
  `(expandedKeys[], row, expanded)` 三参（原平铺/树两种形态分裂）；
- **evoke-ui**：内部标识符 `ewSvgPaths` / `ewShowcasePaths` / `ewIconGrid` 及 tabbar
  注入 key `ewTabbar` 改为 `ev-` 前缀（`evSvgPaths` 等，直接引用这些导出的消费方需同步）。

### @wil-works/evoke-business-ui — 对齐 antd 能力批

- **EbTable**：新增 `loading` 加载遮罩与 `rowClassName` 行条件类名；`column.sortable="custom"`
  支持服务端排序（只发 `sort-change` 不做本地重排）；`showSummary` / `summaryMethod`
  此前声明了但不渲染，现在真正渲染表尾合计行（默认对全数字列求和）；
- **EbForm**：新增提交事件闭环——回车或 `native-type="submit"` 触发校验，通过 emit
  `finish`、失败 emit `finish-failed`；新增 `values-change` 事件（最小变化集 + 全量值）；
  `scroll-to-error` 此前是预留 prop，现在校验失败会滚到第一个错误字段；
- **EbSelect**：`field-names` 支持自定义数据字段映射；多选模式下 `clearable` 清空按钮
  此前不显示，现已生效；`focus` / `blur` 事件此前从未触发或与「关下拉」混淆，现按
  真实焦点语义触发；
- **EbCascader**：新增 `lazy` + `load-data` 动态懒加载子级（带列级加载占位）；
- **EbTreeSelect**：新增 `checked-strategy`（child / parent / all）控制勾选回传值形态，
  默认行为不变；
- **EbTree**：`accordion` 手风琴此前只对一级节点生效，现在全层级同父互斥；
- **EbTransfer**：新增 `#item` 作用域插槽自定义行内容与整体 `disabled`；文案接入
  多语言包；
- **EbInputNumber**：新增 `formatter` / `parser` 格式化展示与反解（千分位金额等），
  新增 `addon-before` / `addon-after` 前后缀块（prop 与插槽两种传法）；
- **EbTimePicker**：范围选择此前不能手输时间，现与单值模式一致可键入；新增
  `disabled-hours` / `disabled-minutes` / `disabled-seconds` 限制可选时段，当前值
  落在禁用集内自动让位到最近可用值。

### 安全加固

- **evoke-business-ui**：聊天消息 Markdown 管线（EbChatbot）修复两处可注入点——链接
  href/title 与引用 chip 的属性位现在全量转义，消息原文中的原生 HTML 转义为纯文本
  不再穿透执行；`data:` 协议移出链接白名单默认集（降级为不可点 chip，宿主可显式加回）；
  EbLink `target="_blank"` 自动补 `rel="noopener noreferrer"`；
- **evoke-ui**：EvNavbar / EvFooter `target="_blank"` 自动补
  `rel="noopener noreferrer"`；主题配置合并对 `__proto__` 键免疫（原型链污染防护）；
### @wil-works/evoke-business-ui — 修复一批 review 问题

- **EbContextMenu**：子菜单展开后把指针从父项移入子菜单，子菜单不再悬停约
  160ms 就自动消失，可正常在子菜单内选择；
- **EbCascader**：`expand-trigger="hover"` 模式下点击叶子节点（以及
  checkStrictly 的任意层级节点）现在能正常选中，此前点击毫无反应；
- **EbTooltip**：实例方法 `show()` 此前是空操作，现在真正打开浮层；
- **useTable**：`setPagination({ page, pageSize })` 同时传页码与页容量时页码
  不再被重置回第 1 页；单独改 `pageSize` 仍回到第 1 页；
- **EbSelect**：关闭状态下按 Enter / Space / ↓ 现在能键盘打开下拉，此前只能
  鼠标点击；
- **EbTable**：列筛选面板此前只能再点一次筛选图标才收得起来，现在点击面板
  外部或按 Esc 均关闭，面板内勾选不受影响；
- **EbPopover**：`width` 属性此前声明了但不生效，现在真正约束浮层内容宽度
  （数字与纯数字字符串补 px，`"50%"` 这类原样生效）。

### @wil-works/evoke-ui — 修复一批 review 问题

- **EvMarkdown 安全修复**：图片 `alt`、链接 `href` 属性位中的双引号现在会被转义，
  `![a" onerror="alert(1)](…)` 之类的写法不再能逃逸出属性注入 HTML；
- **EvAvatar**：图片加载失败不再停留裂图，回退姓名首字符；更换 `src` 自动重试；
- **EvSelect**：`placement="top"` 此前不生效、菜单永远向下，现在真正向上展开
  （动效方向同步）；新增键盘操作——关闭时 ↓ / Enter 打开，展开后 ↑↓ 循环移动高亮、
  Home / End 跳首尾、Enter / Space 选中、Esc 关闭，并带 `aria-activedescendant`；
- **EvTabbarItem**：页签此前无法用键盘触达，现在可 Tab 聚焦并以 Enter / Space 切换
  （disabled 项移出焦点序）；
- **EvImagePreview**：灯箱打开后焦点移入预览层、关闭后归还触发元素，键盘与读屏用户
  不再"失焦"；
- **EvOtpInput**：在已填方框内补打一位时直接覆写当前位并前进，不再把新字符串位挤到
  后面的方框；粘贴整段 / 验证码自动填充行为不变；
- **EvActionSheet**：重复打开时层级逐次递增，不再被上一次的浮层残影遮住；
- **EvStatistic**：`animated` 滚动结束后动态更新 `value` 即时生效，不再被上一轮动画
  终帧冻结。

### @wil-works/evoke-charts — 修复一批 review 问题

- **缺 data 系列的悬浮命中不再崩**：某系列缺 `data` 时渲染有兜底，但悬浮命中
  （line / bar / horizontal-bar / sparkline 的 tooltip 取值）与 `getDataExtent()`
  仍直接读 `s.data[i]` 抛 TypeError；统一为 `(s.data || [])` 口径，缺数据系列的
  行自动从 tooltip 与极值统计中剔除；
- **直方图大样本不再栈溢出**：bin 图 `computeBins` 与 padding 计算对全量样本做
  `push(...arr)` 展开，约 10 万+ 样本即抛 RangeError 进错误态；改循环 push，
  padding 分支只计数不物化数组，20 万样本可正常渲染；
- **堆叠面积图 null 断段基线修正**：带缺失值的堆叠面积，断段后段的起始基线
  此前恒取索引 0 的堆叠值，与回程逐点基线口径不一致，面积多边形闭合边错位；
  改为按段首原始索引取基线，与回程一致；
- **setSpec() 换 Spec 后命中缓存彻底失效**：`setSpec` 只清了 2 处缓存，
  padding / 图例命中区 / 甘特 / 桑基布局缓存按 options 引用键控仍服务旧数据
  （非响应式 options 场景悬浮命中错位）；抽出 `invalidateHitCaches()` 供
  update / setSpec / deep watch 共用，7 处缓存一次清齐；
- **键盘巡历 aria-live 每步重播报**：方向键步进后读屏此前只在首次进入悬浮时
  收到读数；现在键盘驱动的每次索引变化都更新 aria-live 播报，指针悬浮仍只在
  进入时播报一次（避免读屏噪音）；
- 8 项行为级回归测试（缺 data 命中链路 ×3、bin 大样本、断段基线 ×2、
  setSpec 缓存失效、aria-live 步进跟随）。

## [charts 0.7.0] — 2026-09-20

### @wil-works/evoke-charts — P2 收口

- 键盘巡历感知 dataZoom 切片（步进/Home/End 按窗口数据而非全量）；
- exportSVG 不再导出 dataZoom 滑块；箱线/热力含 NaN 时不命中或花屏修复；
  分面散点渲染与悬浮取色一致。

### @wil-works/evoke-charts — 0.7.0 三维篇章（原 charts-3d 并入）

- **三维能力并入本包**，以独立子入口提供：`import { EvChart3d } from '@wil-works/evoke-charts/3d'`
  （对齐 `./ai` 的篇章模式），只用二维的消费方不背三维包体；不再有独立 charts-3d 包；
- 渲染为自研透视投影管线（向量/矩阵数学 → 轨道相机 → 场景图元 → 画家算法深度排序 →
  Canvas 2D），不引入 WebGL 封装库；
- 首批五种图型：`bar3d` 柱林、`line3d` 空间折线（落地投影 + 面带）、`scatter3d`
  散点（三元组/类目双模式，色带编码第四维）、`surface3d` 曲面高度场（连续色带 +
  逐格线框）、`pie3d` 三维饼与环形（悬浮扇区整体上浮）；
- 轨道相机：拖拽环绕 / 滚轮与捏合缩放 / Shift 平移 / 双击复位 / 方向键环绕 /
  自动旋转；相机状态经 `camera-change` 事件外抛，`getCamera` / `setCamera` /
  `resetCamera` 实例方法可用；拾取复用渲染投影（所见即所选），面/线/点统一取视深最近命中；
- 三维坐标框：墙面与轴取边跟随相机（背墙永远在远侧），刻度标签屏幕空间防碰撞，
  轴名逐级退避；坐标框可用 `box` / `grid` 配置；
- **与二维共用一套配置**：系列色槽位、内置色系注册表、`--ev-*` 令牌读取、
  `ev-theme-change` 换肤、`html.dark` 暗色全部同源；`applySeriesPalette` 现接受
  色系 id（如 `'aurora'`）/ 色值数组 / 明暗两套三种形态，并导出 `SLOT_COUNT`，
  一次换装二维三维一起变；构建期色系抽为两入口共享 chunk；
- 工程面：空/载/错/成四态、DPR 适配、容器响应式、`exportSVG` 矢量导出（三维图可导出
  真矢量 SVG）、`toDataURL` 位图导出、`validateOptions3d` 配置校验（告警不阻断）、
  aria 标注与 aria-live 播报；`render3d` / `projectScene` / `pickScene` /
  `createSvgRecorder` / `useChart3d` 底层管线与 Composable 可直接使用；
- 文档站新增 **三维图表篇章**（`/3d/`：总览选型 / 安装 / 相机与交互 / 主题接入 /
  设计规范 / 五图型各页 / API 参考，每页 ≥2 个可交互示例），导航与站内搜索收录，
  视觉回归基线含三维页与暗色轮次；
- 示例：`examples/charts-3d-playground`（源码级 alias，`pnpm demo:charts3d`）。

### @wil-works/evoke-charts — 三维篇章查漏补缺

- **evoke-mcp 目录与三维 AI 面**：`data/catalog.json` 生成器此前漏读 `THREED_NAV`，
  三维 11 个文档页不进 `list/search_components` 可发现面——已补循环并重生成（同时
  刷新了 9 月以来 business 侧新增组件的陈旧目录）；新增 `get_chart3d_spec_schema` /
  `lint_chart3d_spec` 两个 MCP 工具（三维 options Schema 与校验，对称二维面）；
- **文档修正**：`/3d/install` 页安装命令误写为 `npm install @wil-works/evoke-charts/3d`
  （3d 是子入口不是独立包，应装主包）、样式引入误用不存在的 `@wil-works/evoke-charts/3d/styles`
  子路径（三维组件样式聚合在包级 `styles`）、「与二维并排」一节同步改写；
- 清理根 package.json description 与 README 中「独立 charts-3d 包 / `docs-charts-3d:dev`
  文档站」的合并残留，README 本地开发段落补 `docs-charts:dev` 与 `demo:charts3d`。

### @wil-works/evoke-charts — AI 生成接入三维篇章

- **`generateChartSpec` 三维选型**：保守门——需求带「三维 / 立体 / 3D」，或数据天然三维
  （≥3 个数值列且无类目/时间维度，二维散点必丢一维）才进三维；三个数值列构成完整
  数值网格（前两列取值组合覆盖全部行，任一边 ≤64）时透视成 `surface3d` 高度场
  （x/y 轴名来自列名），稀疏三元组产出 `scatter3d`；带类目/时间维度时按意图映射
  `bar3d` 柱林 / `line3d` 空间折线 / `pie3d` 三维饼，「柱 / 条形」「折线」图表词
  优先于意图默认；维度不足告警后回退二维，原有二维选型行为不变；
- **`buildChartPrompt` 加 `mode: '3d'`**：Schema、few-shot（三维示例库 `SPEC_EXAMPLES_3D`
  三条：三元组散点 / 高度场曲面 / 柱林）与硬性规则（`SPEC_RULES_3D`，与三维数据契约
  一致）整套切换到 EvChart3d 契约；导出 `wantsThreed` / `planThreed`；
- **`lintChartSpec` 三维委托**：type 为 `*3d` 时自动切 `validateOptions3d`（错误定位
  path + message，合法给出 info），二维规则与无头渲染不再误伤三维 spec；
- **evoke-mcp**：`generate_chart_spec` 描述注明三维触发条件，`build_chart_prompt`
  新增 `mode` 参数（2d/3d）；构建期三维 schema 进共享 chunk（3d.mjs 129KB，ai 链
  不含 vue，包体隔离不变）；
- 文档站 AI 生成页新增「三维生成」段（可交互闭环示例：网格数据直生曲面）。

### @wil-works/evoke-charts — 三维坐标框遮挡与背景面固定侧收口

- **坐标框棱线按真实遮挡分层**：四条底边与 X/Y 轴基线分「近侧压顶 / 远侧垫底」——只有
  相机确实落在该棱面外侧（整盒都在它身后）时才压顶；中轴视角（yaw 恰为 0°/±90°/180°）
  与俯视入盒时取到的「近边」其实是条侧棱，一并垫底。背墙底边与远侧 Z 轴不再「透」在
  前排柱体上，不再把柱子切成两段；
- **背景面固定侧**：背墙钉在 +Y、侧墙钉在 −X（不再「永远选远侧」随相机换边），旋转中
  不再整面跳边；相机绕到墙背面时整组（墙面 + 墙内网格 + 墙顶棱）按跨距短淡出（约 20°
  内完成），既不复现跳变、也不让墙挡在数据前；两片墙各自独立判定；
- **相机与交互修正**：`params.camera` 优先于 `options.camera`（交互态相机必须出画）；
  autoFit 反解出的距离回写相机，接管视角时缩放不再跳变；复位回到开场构图（未显式配置
  `camera.distance` 时保持 autoFit）；新增 4px 拖拽阈值——点击手抖仍算点选，不再被当成
  轨道旋转吞掉 click；滚轮监听跟随 canvas 元素，空态转有数据后滚轮依旧生效；
- **测试**：新增 13 条三维用例——压顶不变式改为沿线段采样并覆盖 yaw 0°/±90°/180°、
  背景面钉在 +Y 侧、墙组随墙同退、淡出单调、两墙独立判定，以及点击阈值、接管相机
  不改变缩放、复位构图；
- 文档站「设计规范」同步改写坐标框取边与背景面约定（墙固定 / 轴线跟随）。

### @wil-works/evoke-charts — 三维纵深增强（立体感三件套 + 投影可调）

- **`depth` 三件套（默认开启，设 0 即关闭单项）**：`haze` 景深雾化（默认 0.3）按数据层
  视深把面与线的色相向背景色混合——远景退、近景跳，是柱林/散点/曲面最见效的纵深线索，
  文字不参与以保证刻度可读；`edge` 实体面描边（默认 0.06）让形体边界利落、相邻柱体不糊
  在一起；`gradient` 面内渐变（默认 0.08，顶亮底暗的假 AO）让实体面更「实心」；
- 三件套只作用于**实体面**（柱体、饼体平直面）；细分曲面面（饼图弧面）只走光照明暗——
  逐面渐变/描边在细分缝处对不齐会显色带，渲染时改用同色细描边盖住既存的抗锯齿细缝；
- **落地投影可调**：`bar.shadowStrength`（默认 0.1）、`bar.shadowOffset`（[dx, dy] 世界偏移）、
  `pie.shadowStrength`（默认 0.09）；
- **雾化基准色**：主题新增 `backdropColor`（不透明 `--ev-bg-color` 优先，否则回落
  `--ev-bg-color-overlay` / 内置明暗底）；新增 `mixHue` 保留透明度，半透明薄纱（墙面）
  不会被混成实心色；
- **导出**：SVG 录制器支持线性渐变（`<linearGradient>` 定义 + 引用），面内渐变导出为
  真矢量渐变而非退化成纯色；
- 文档站 API 与「设计规范」（新增「纵深」段）同步；三维页视觉基线重录。

### @wil-works/evoke-charts — 动画收口（分段错峰 / 更新补间 / 拖拽惯性 / 减弱动态效果）

- **分段错峰进场 `animation.stagger`**：三维默认 0.25（0 即全部同步）——柱林沿类目依次长起、
  曲面按行抬升、饼图扇区依次扫入、折线/散点按点序推进；二维默认 0（保持既有行为），
  设 > 0 时进场改走「数据从零按类目错峰长入」；
- **数据更新补间**：三维此前每次 options 变化都重放进场动画，现改为与二维一致的补间过渡
  （结构不变、仅数值变化时逐帧插值 series / pieData / scatterData / surfaceData，并按类目
  错峰；结构变化才重放进场）；二维补间顺带补齐 `pieData`（饼族数据此前不参与补间）；
- **拖拽惯性**：`camera.damping`（默认 0.14）此前只声明未实现——现在松手后按阻尼衰减滑行，
  滑行距离按 dt 归一、与帧率无关，`damping: 0` 即松手停住；复位/滚轮/键盘/再次按下都会
  立即中断滑行；
- **`prefers-reduced-motion`**：二维与三维都接入系统「减弱动态效果」——命中时进场 / 补间 /
  惯性退化为直接出终态图（新增共享 `src/motion.js`：`prefersReducedMotion` + `staggerProgress`）；
- 新增 19 条用例（错峰单调与终点收齐、快照/插值四形态、补间不重放进场、结构变化回退、
  惯性开停、减动效跳过）；
- 文档站二维/三维 API 与「设计规范」（新增「动画」段）同步。

### @wil-works/evoke-charts — 安全加固

- **evoke-charts**：`setSpec` / `update` 对不可信 JSON 产物的 `__proto__` 键免疫；
  SVG 导出的渐变颜色补 XML 转义。

## [business-ui 0.8.0] — 2026-09-17

### @wil-works/evoke-business-ui — 新增 EbContextMenu 右键菜单

- **区域右键即菜单**：默认插槽包裹触发区域，区域内右键在光标处弹出（自动
  阻止浏览器默认菜单）；视口边缘自动反向弹出并钳位，菜单过长走内部滚动，
  不遮出屏不裁切；
- **items 配置驱动**：`label` / `icon` / `command` / `disabled` / `divided` /
  `danger` / `children`（一级子菜单：悬停延时展开、点击父项亦可展开；子菜单
  Teleport 至 body 独立挂载，不被父菜单裁切，视口右侧放不下自动翻到左侧），
  点击菜单项抛出 `command` 并自动收起；
- **命令式调用**：`ref.open(event | { x, y }, itemsOverride?)` 在任意
  contextmenu 处复用同一菜单实例并按目标切换菜单内容，`close()` / `visible`
  程序化控制，`visible-change` 监听显隐；
- 关闭时机收口：点击菜单项 / 点击外部 / ESC / 页面滚动与窗口缩放均收起，
  浮层内部滚动不受影响；z-index 走全局队列；
- 14 项行为级测试（弹出语义/菜单项形态/子菜单独立挂载/命令式/关闭时机/禁用）。

## [ui 0.10.1] — 2026-09-16

### @wil-works/evoke-ui — EvSection 新增 width 定宽档

- **区块级定宽居中**：`width` 四档 `narrow`（920）/ `default`（1152）/ `wide`（1360）/
  `full`（通栏，默认），视口超过档位宽度后区块居中、不再撑到屏幕边缘，窄于档位
  自适应收缩并自带两侧留白；整页组装时无需再外包 EvContainer；
- 与 EvContainer 共用同一套档位表达式与 `--ev-container-width` 令牌，
  ConfigProvider 整站调整容器宽时同步生效；默认 `full` 保持既有页面不受影响；
- 2 项行为级测试（默认不带档位类、定宽与 align/snap 共存）。

## [ui 0.10.0 / business-ui 0.7.0] — 2026-09-16

### @wil-works/evoke-business-ui — 新增 EbOtpInput 验证码输入框

- **方框式 OTP 输入**：N 个方框（`length`，1~10）逐位输入，输入自动前进、
  退格自动回退并清除前一位，方向键 / Home / End 在方框间移动；
- **整段粘贴自动分配**：在任意方框上粘贴完整验证码，从该位起逐位分配并聚焦
  末位；`type=number` 时移动端唤起数字键盘，首框启用 `one-time-code`
  autocomplete，iOS 短信验证码自动填充（经 input 事件进来的多字符）同样
  自动分配；
- **形态完备**：`masked` 掩码显示（已填位圆点）、`status=error` 错误态、
  尺寸三档、`autofocus`；接入 Form 表单契约（size / disabled 继承，
  change 时机触发校验）；expose `focus / blur / clear`；
- 14 项行为级测试（输入/粘贴/退格/方向键/过滤/掩码/禁用/回显/清空），
  7 语言包补 otp 文案（键位奇偶守卫通过）。

### @wil-works/evoke-ui — 新增 EvOtpInput 验证码输入框

- 与 business-ui `EbOtpInput` 同 API 面（EvChart/EbChart 双名先例）：
  方框式逐位输入自动前进、粘贴整段自动分配、masked 掩码、number/text 双
  类型、one-time-code 自动填充；官网设计语言落位（--ev-* 令牌明暗一体，
  悬停边框轻加深、聚焦主色描边）；`error` prop 独立控制错误态；
- 9 项行为级测试覆盖输入/粘贴/退格/掩码/禁用/回显。

### examples — 新增 ebui-admin-scaffold 中后台脚手架母版

- **五模式应用壳，实时切换**：`sidebar` 经典侧边栏 / `double-sidebar` 双栏侧边栏 /
  `top-nav` 顶部导航 / `mixed` 混合布局（顶栏一级 + 侧栏二级）/ `mixed-double`
  混合双栏（顶栏一级 + 图标栏 + 二级面板）；菜单树与路由同源单文件配置；
- **框架能力全家桶**：明暗主题（useDarkMode View Transitions 渐变）、中英双语
  （脚手架字典 + ConfigProvider 注入库内文案同步切换）、多标签页（路由自动
  登记、可关闭、关闭激活页跳邻居）、全局搜索（Ctrl/⌘+K EbCommandPalette 检索
  页面与快捷操作）、主题定制抽屉（EB_THEME_PRESETS 预设 + 自定义色实时生成
  整条色阶 + 密度切换，全部 localStorage 持久化）、Toast 通知系统（EbNotify
  统一 `notify()` 出口 + 顶栏铃铛历史中心）；
- **母版资产化**：README 提供「复制-改字段」五步指引（替换 pages / 字典 /
  request 即可投产）；演示页覆盖仪表盘（EbStatCard + EbChart）、成员/订单
  列表（EbTablePage 数据代理实战）、表单页、关于页；设置全量持久化；
- 浏览器实测五模式切换 / 明暗 / 双语 / 命令面板 / 列表页数据代理零错误；
  全仓 95 文件 1489 项测试保持全绿；`pnpm example:ebui-scaffold` 启动
  （端口 8630，组件库源码级 alias 联调）。

### @wil-works/evoke-business-ui — 新增 EbTablePage 表格页 + EbDataTable 高度自适应

- **新增 EbTablePage（表格页）**：CRUD 列表页整页封装，四区结构——页头
  （title/description + header/extra 插槽）→ 查询区（`fields` 内建 EbSearchFilter，
  或 `search` 插槽自定义表单，作用域 `{ params, search, reset, loading }`）→
  工具栏（作用域 `{ selection, selectionCount, refresh, clearSelection }`）→
  表格 + 分页（复用 EbDataTable）；
- **数据代理**：`request` 交给内部 useTable（分页 + 请求状态 + 竞态保护）——
  翻页/换容量自动重查（换容量回第 1 页）、查询合并筛选回第 1 页、重置恢复
  `defaultParams`；`remote-sort` 把列排序写入 `sortPropKey/sortOrderKey` 参数
  （asc/desc）以当前页重查，`remote-filter` 把列筛选收敛为 `filterParamKey`
  参数回第 1 页，关闭即走表格内建客户端排序过滤；SearchFilter 重置后自带的
  合并查询经抑制标记收敛为单次请求；列插槽原样透传；
- **EbDataTable 新增 `fit`**：根节点撑满 flex 父容器剩余空间，ResizeObserver
  实测表格区高度写入 EbTable 的 `height`——「高度撑满剩余空间、多出内部滚动、
  不整页滚」一条 prop 落地，与 `virtual` 组合承载万级满屏表格；环境无
  ResizeObserver（jsdom/SSR）自动降级不锁高；EbTablePage 默认 `fit` 开；
- 14 项行为级测试（数据代理联动/查询区抑制/插槽上下文/fit 降级），全仓
  95 文件 1489 项测试全绿；组件文档 table-page.md 入列（侧栏 ↔ 页面零断链），
  文档站 SSR 全站构建通过。

### @wil-works/evoke-ui / @wil-works/evoke-business-ui — TS 存量迁移第三刀：命令式 API 四件套转 TS（阶段 3 第 3 档）

- **message / notify / msgbox / loading 目录桶 index.js → index.ts**——
  `EbMessage` / `EbNotify` / `EbMsgbox` 这类「函数 + 静态方法」形态以
  `interface MsgboxFn` + `as` 断言收敛，调用与静态两侧均获补全；
- **公开选项/句柄类型导出**：`MessageOptions` / `MessageHandle` /
  `NotifyOptions` / `NotifyPosition` / `NotifyHandle`、`MsgboxOptions` /
  `MsgboxResult` / `MsgboxMode`（alert/confirm/prompt 重载与 app 直传形态
  `hasAppContext`（`_context` 真值判定）类型保真）、`LoadingOptions` /
  `LoadingHandle` / `LoadingDirectiveValue`；
- **运行时逐字等价**：`columns[position]` 非 null 断言保留原失效语义、
  v-loading 的 `vm.exposed.setVisible` 不加可选链、SSR 提前返回形状不变；
  `component-entries.mjs` 目录桶入口改为探测 `index.ts`（兼容 index.js），
  守卫测试、vite 多入口与类型存根三者继续对齐；
- 两包 vue-tsc --noEmit 通过，全仓 94 文件 1475 项测试全绿。

### @wil-works/evoke-ui / @wil-works/evoke-business-ui — TS 存量迁移第二刀：directives 全量转 TS（阶段 3 第 2 档）

- **4 个指令 .js → .ts**：evoke-ui `v-reveal`，business `v-copy` /
  `v-infinite-scroll` / `v-permission`；宿主元素自定义属性（`__evCopyHandler`
  等）以交叉类型收敛，指令统一 `Directive<宿主元素, 值类型>` 泛型标注；
- **公共类型导出**：`RevealOptions` / `CopyValue` + `CopyDirectiveValue` /
  `InfiniteScrollValue` / `PermissionValue` + `PermissionDirectiveValue`，
  TS 消费方在模板与指令注册处获得补全；运行时行为逐字保留
  （`v-copy` 原始值经 `String()` 归一与原 DOMString 转换结果一致，
  `v-permission` 的 `el.disabled` 写入走显式断言）；
- 两包 vue-tsc --noEmit 通过，全仓 94 文件 1475 项测试全绿。

### @wil-works/evoke-ui / @wil-works/evoke-business-ui — TS 存量迁移第一刀：utils + composables 全量转 TS（阶段 3 开工）

- **两包共 35 个模块 .js → .ts**：evoke-ui（utils 2 + composables 9）与
  business-ui（utils 7 + composables 17，含 `color.ts` 试点外的全部工具层），
  对应 TS 迁移计划阶段 3 优先级第 1 档（纯函数与 hooks，零 UI 风险）；directives
  留待第 2 档；
- **公共 API 类型化**：`useTable` 泛型化（`TableData` / `TableFetcher` /
  `UseTableOptions<T>`，list/items/rows 三形态收敛）、`useFloating` /
  `useFocusTrap` / `useTeleport` 等 options 接口化、`usePermission` 判定入参
  `PermissionRequirement` 联合类型、主题工具导出 `EbThemeConfig` /
  `EbThemePreset` / `DensityMode`、`useConfigProvider` 定义 `LocaleMessages` /
  `ConfigProviderContext`（locale 文案树含字符串数组叶子）、`useSizeProp` /
  `useFormItem` 表单契约接口化；运行时行为逐字保留（含 `useLocale` 字符串/
  数组叶子取键得 undefined 的既有语义、`setSeries` 不过滤空槽位等）；
- **产物与消费端无感**：Vite 产物仍是纯 JS（esbuild 只剥类型），两包
  vue-tsc --noEmit 全量通过，d.ts 产出链路（说明符改写 + 子路径存根）不变；
  全仓 94 文件 1475 项测试全绿；内部引用全部无扩展名，源码/测试/文档站/
  示例工程零残留 `.js` 引用。

### 工程 — 视觉回归三站扩展：business / charts 站基线 + 两站暗色轮次

- **business 站 8 页 + charts 站 6 页 darwin 基线**——页面遴选沿用 ui 站原则
  （排除强随机/时钟驱动内容：countdown、chatbot、ai-* 等不收）；business 收首页 /
  组件总览 / button / form / data-table / menu / 设计规范 / 内嵌图表页，
  charts 收首页 / line / bar / pie / mixed / dashboard 案例；
- **暗色轮次**——business 站 4 页（`bd-dark`）+ charts 站 2 页（`cd-dark`）：
  暗色经初始化脚本在页面脚本运行前写入 localStorage，DocLayout 挂载时统一应用
  `html.dark`，图表首帧即按暗色渲染；
- **三 project 分端口架构**——ui 4173 / business 4174 / charts 4175，baseURL 按
  project 下发，spec 内统一相对路径；图表页 settle 加长至 1800ms 覆盖 canvas
  入场动画（rAF 驱动，`animations:'disabled'` 管不到）；`pnpm visual` /
  `visual:update` 语义升级为重建三站全量跑，`--project=business` 可单站执行；
  余项：CI 走 Playwright Docker 镜像统一字体。

### @wil-works/evoke-business-ui — 视觉修正

- **修复 filterable 选择器家族的输入光标错位**——占位/已选文案与搜索输入框各占
  `flex:1` 平分触发器行宽，聚焦后光标悬在行中间、与占位文本之间隔着一大段空白
  （Select / Cascader / TreeSelect 同病）。统一改为标准形态：聚焦搜索时占位 span
  让位（`v-show`），输入框占满整行，占位文案由原生 `placeholder` 承载——光标起点与
  占位文本起点严格一致，输入即原地替换；Cascader 的 readonly 输入补上
  `:not([readonly])` 防非 filterable 模式误展开；multiple 标签容器改自然宽度，
  标签后紧跟光标。
- **修复 Cascader / TreeSelect / TimePicker / TimeSelect 弹层不跟随页面滚动**——四个组件
  打开时只做一次性定位（裸 `update()`），从未启动 useFloating 的 autoUpdate 监听，页眉
  一滚弹层就脱离触发器原地不动；现统一改走 `show()`（定位 + 启动 autoUpdate），关闭时
  `hide()` 停止监听防泄漏；与 Select / DatePicker / Tooltip 等既有跟随行为对齐（已用
  浏览器实测：滚动前后弹层与触发器相对偏移恒定）。
- **弹层触发器滚出视口时自动关闭**——useFloating 新增 `onReferenceEscape`（top<0 或
  bottom>视口高即触发），表单浮层家族全量接线：触发器滚进吸顶顶栏后方时弹层自动收起，
  不再悬空叠在站点顶栏上（有意不走抬高顶栏 z-index 路线：弹层与模态共用 z 计数链，
  抬顶栏会连弹窗遮罩也盖不住顶栏）。

### @wil-works/evoke-ui — 视觉修正- **激活涟漪重做：实体色影向外扩展，不再染输入面**——聚焦瞬间一层与输入体同形状的
  实体色影（box-shadow spread 驱动）自边缘向外扩展约 6px 后消散：保留「实体扩展」的
  涟漪质感，但只落在输入体边界之外，不再整块输入面被主色染蓝、不遮内容；圆角自动跟随
  输入圆角令牌，错误态跟随 danger、`html[data-eb-ripple='off']` 与 reduced-motion 关闭
  均保留；覆盖面不变（input / select / textarea / cascader / date-picker / input-number /
  time-* 全家族）。

### @wil-works/evoke-ui — 视觉修正

- **EvAiPromptBox 跨浏览器激活态归一**：输入区屏蔽 Chrome / Safari / Firefox 的默认
  聚焦环与 iOS 触控高亮（`outline: none` + `-webkit-tap-highlight-color`），焦点指示
  统一由输入台的渐变描边承担；工具按钮保留键盘 `:focus-visible` 环。

### @wil-works/evoke-business-ui — AI 输入台与工作台（大模型调用形态组件化）

- **新增 EbAiPromptBox（AI 输入台）**：模型选择 pill（输入台上方居中，menu 语义 +
  外点/Esc 关闭）+ 场景 chips（选中映射输入台内可移除 tag，再点取消）+ 能力开关
  （aria-pressed ghost 钮，深度思考/联网等词汇表由使用方定义）+ 额度胶囊 + 附件 +
  字数统计 + 发送/停止双态钮；`send` 一次交出完整上下文
  `{ text, scene, capabilities, model, attachments }`——组件不内置任何请求，transport
  由使用方注入；16 项行为级测试。
- **新增 EbAiConsole（AI 工作台）**：欢迎标题（highlight 渐变高亮词）+ 示例问题
  （send 直发 / fill 填充两态）+ AiPromptBox + Chatbot 家族会话区全接线；首次发送后
  欢迎区收起、会话展开；`engine` 受控传入或内部自建；`transport(content, attachments,
  context)` 注入模型调用，context 携带输入台完整上下文；9 项行为级测试。
- **useChatEngine 小扩**：`sendMessage` 增第三参 `context` 原样透传 `onSend`，存量调用
  零感知。
- 命名注意：编排组件的调用入口刻意命名为 `transport` 而非 `onSend`——后者与 Vue
  `emit('send')` 的监听器约定同名，会被当监听器二次调用。

### @wil-works/evoke-ui — 新增 EvAiPromptBox（AI 输入台，官网设计加强版）

- 与 business-ui `AiPromptBox` 同 API 面（EvChart/EbChart 双名先例），官网设计语言落位：
  输入台 focus 时 `--ev-gradient-hero` 渐变描边点亮（双背景 border-box 技法，暗色同步），
  chips/额度胶囊走 --ev-* 令牌明暗一体；停止钮为内绘 CSS 方块（核心图标集无 stop）；
  默认图标仅用 evoke-ui 核心集合（plus/close/check/wallet/arrow-up/chevron-down），
  场景与能力 icon 由使用方传入且需在图标集内。
- `send` 交出上下文后由使用方编排（官网自由拼装定位，不内置会话流）；11 项行为级测试。

### 文档

- business 站新增「AI」分类与 AiPromptBox / AiConsole 两页（AiConsole 页含 mock 流式
  transport 的可交互演示）；ui 站站点区块新增 AiPromptBox 页；三页全过 SSR 构建。
- **新增示例「AI 运营助手工作台」**（examples/ebui-example-ai，端口 8629）：AiConsole 嵌入
  AppLayout 后台骨架的完整工作台——场景路由回复模板、深度思考流（appendThinkContent →
  stopThinking）、联网检索引用、附件上下文提示、停止生成（清计时器 + setMessageError，
  生产换 AbortController）；文档页 + 全屏中心 + 示例总览/路线图三处登记。
- **新增 ui 站案例「AI 产品首屏」**（cases/ai-landing）：EvAiPromptBox 做营销首屏主交互的
  即问即答形态——展示体标题渐变高亮、大输入台、示例直发、就地流式作答面板（面板头展示
  「场景 · 能力 · 模型」上下文元信息）、能力带与免费额度；案例页 + 全屏窗口 + 侧栏登记。

### @wil-works/evoke-business-ui — 基础能力补全：虚拟滚动集成与表格行内编辑（ROADMAP 收官双项）

- **Select 数据模式 + 虚拟滚动**：新增 `options` 数据驱动模式（无需手写 EbOption，下拉由
  组件渲染，label 缺省回退 String(value)）；叠加 `virtual` 走 EbVirtualList——万级选项只渲染
  可视窗口（窗口外选项不注册、aria-activedescendant 自然静默，键盘滚动自动把高亮项带回
  窗口）；过滤 / 键盘 / 多选 / allow-create / 预选中定位全链路兼容；插槽注册模式行为不变
  （含首帧空注册表与空态共存的时序语义）；新增 10 项数据模式 / 虚拟回归。
- **Table 虚拟滚动**：`virtual` + `rowHeight`（默认 48）占位行方案——单一 table 结构、
  colgroup 列宽、sticky 固定列、多选、行级键盘导航全部保留；上下占位行撑开总高，窗口行
  携带绝对索引（stripe / 键盘索引不漂移），键盘跨窗口自动滚动对齐目标行；视口无布局环境
  （SSR / 测试）时退化为全量渲染；需配合 height / maxHeight；新增 5 项虚拟回归。
- **Table 行内编辑**：EbTableColumn 新增 `editable`——单元格点击进入编辑，Enter / 失焦提交、
  Esc 取消、值未变化不发事件；提交直接更新行数据并 emit `cell-change`（row / prop / value /
  oldValue / $index）；formatter 只影响展示，编辑回写原始值；default 插槽列不受 editable
  影响（复杂编辑器自行承载）。
- **DataTable 承接**：Column 配置新增 `editable` 透传（配置 slot / stack 的列保持自定义
  渲染），`cell-change` 事件重发；虚拟滚动经既有 `tableAttrs` 透传即可用。
- 新增测试文件 select-virtual.test.js / table-virtual.test.js（21 项），全仓 90 文件
  1425 项全绿。

### @wil-works/evoke-business-ui — ROADMAP 收尾批：a11y / 倒计时 / 国际化与工程化配套

- **DatePicker 完整键盘导航（a11y 深化收口）**：日历网格升级 grid 语义（gridcell /
  aria-selected / aria-current="date" / aria-label 完整日期 / aria-disabled）+ roving
  tabindex 巡历——方向键移动一天 / ±7 天跨周、Home / End 周首尾、PageUp / PageDown 翻月、
  Shift+PageUp / Down 翻年、Enter / Space 选中、禁用日自动顺延跳过；跨月巡历面板自动翻页
  且焦点保持（区间面板左右联动与按钮翻页同规则）；触发器 combobox 语义（aria-expanded /
  aria-controls / haspopup="dialog"），面板 role="dialog"，Enter / ↓ 打开并把焦点送进网格、
  Esc 关闭且焦点回归输入框；新增 12 项键盘 / aria 回归（全文件 37 项）。
- **新增 EbCountdown 倒计时**：目标时刻倒计时，`format` 令牌 HH（总小时可超 24）/ mm / ss，
  title / prefix / suffix / valueStyle 与 Statistic 同族；走秒 `change`（剩余毫秒）、归零
  `finish` 单次触发，value 变更重走计时，无效输入零值兜底；10 项行为级测试 + 文档页。
- **国际化扩至 7 语言包**：新增韩语 `ko` / 西班牙语 `es` / 葡萄牙语 `pt`（自 zh-CN 全键集
  翻译）；新增 locale-packs.test.js 键位奇偶守卫——任一语言包缺键 / 多键即刻红。
- **EbSectionCard 文档页补齐**：基础 / 关闭内边距 / header 插槽三演示 + Props / Slots 表；
  组件文档口径核对收官——侧栏 ↔ 页面零断链，154 个注册名全覆盖（50 个子组件挂父组件页，
  移动组件在 mobile/、图表在 chart/ 板块）。
- **WCAG 对比度符合性说明**（guide/accessibility.md）：基于导出令牌按 WCAG 2.1 公式实测
  明暗两套 14 组前景背景对比——正文 / 标题 AAA，语义状态文字 AA 及以上；已知缺口如实披露
  （暗色语义底×白字、placeholder、明色语义色仅大字号档）并给出使用建议。
- **SSR 兼容性声明**（guide/ssr.md）：常设验证 = CI 中 VitePress SSR 构建全站演示页；
  声明浏览器 API 时机约定、storage 静默降级、Teleport 弹层即客户端、测量类组件与命令式
  API 边界。
- **设计规范页**（guide/design.md）：色彩（语义 + 中性 + 8 扩展色）/ 4px 间距网格 / 字号
  字重行高 / 圆角阴影五档 / 动效时长缓动，全部对应 `--eb-*` 令牌取值。

### 工程 — 全仓收尾配套

- **CI 接入 typecheck**：双包新增 `pnpm typecheck`（vue-tsc --noEmit，编辑器同口径），
  根脚本递归执行；CI 新增 Typecheck 步骤（构建期 d.ts 生成是第二道类型关）。
- **覆盖率统计落地**（ROADMAP 第 7 条统计面）：`@vitest/coverage-v8` + `pnpm test:coverage`
  （text / html / lcov，排除样式与 locale），保守阈值入配置防整体回退（基线：语句 65.8 /
  分支 58.1 / 函数 71.9 / 行 67.9，88 文件 1404 项全绿）；CI 新增 Coverage 步骤并存档产物。
- **设计令牌导出**（ROADMAP 第 6 条）：`pnpm tokens:export`（scripts/export-tokens.mjs）
  从两库令牌源文件解析明 / 暗两组（按包命名空间过滤，跨库映射层不计入），生成 W3C Design
  Tokens 草案格式 JSON 至 `design-tokens/`（明色全量 336 项 + 暗色覆盖 155 项），可直接被
  Figma Variables 插件消费。
- 文档演示页 `docs/--port/` 意外空壳目录清理。

## [ui 0.9.0 / business-ui 0.6.0] — 2026-09-15

### @wil-works/evoke-ui — 类型声明与按需子路径导出（v1 质量线首刀）

- **完整类型声明**：vue-tsc 全量产物（`dist/types/`，镜像 src 结构）——61 个组件
  的 props 从 `defineProps` 运行时定义推断（含 JSDoc 悬浮提示），composables 返回
  值、directives、`install` 均有类型；主入口 `import { EvButton } from
  '@wil-works/evoke-ui'` 与编辑器补全开箱即用；
- **按需子路径导出**：61 个组件逐一独立入口（`dist/<name>.mjs`），
  `import EvButton from '@wil-works/evoke-ui/button'` 只解析该组件与其依赖，不触达
  其余组件；子路径与主入口共享同一组件实例（无双实例陷阱），共享模块收敛
  `chunks/` 不对外；
- **消费端零负担**：`.vue` 类型说明符统一改写为 `.vue.d.ts`，普通 `tsc`
  （bundler 解析）无需 vue-tsc 或 `allowArbitraryExtensions` 即可解析全部类型；
  `exports` 主入口补 `types` 条件、新增 `./*` 通配双通道、`sideEffects` 声明
  css 保证 JS 全量 tree-shaking；
- 构建链翻新：vite 多入口（入口清单从 `src/index.js` 解析，`component-entries.mjs`
  单一事实源）→ `vue-tsc --emitDeclarationOnly` → `post-types.mjs`（说明符改写 +
  子路径类型存根）；`typescript` / `vue-tsc` 入 devDependencies；守卫测试锁定
  「组件清单 ↔ 子路径映射 ↔ exports 面」三者一致。
- **视觉回归基建落地**（ROADMAP 第 4 条）：根级 `@playwright/test` + `visual/`
  截图对比，吃文档站构建产物（`pnpm visual` / `visual:only` / `visual:update`）；
  首批 ui 站 6 个稳定页（首页 / 按钮卡片告警图标 / 企业官网案例），动画禁用 +
  字体就绪 + 懒加载图片落定三重确定性保障，复跑零差异、换基线必红已双向验证；
  基线随仓库走（darwin），CI 接入时切 Playwright Docker 统一字体。

### @wil-works/evoke-business-ui — 类型声明与按需子路径导出（v1 质量线首刀跟进）

- **完整类型声明**：vue-tsc 全量产物（`dist/types/`）——153 个组件入口 + 命令式
  API（EbMessage / EbNotify / EbMsgbox / EbLoading）+ composables / directives /
  主题工具 / 格式化工具；`EbChart` 经 evoke-charts 外部重导出（其类型待 charts 包
  跟进，消费端 `skipLibCheck` 下无感）；
- **按需子路径导出**：153 个组件 + 4 个命令式 API 桶独立入口
  （`@wil-works/evoke-business-ui/button`、`/message`），与主入口共享同一组件
  实例；共享模块收敛 `chunks/`；全量图标 `remix-full-paths` 保持动态加载，
  按需导入不误拖 1.7MB 全量路径数据；`full-icons` 子路径补 `types` 条目；
- **消费端零负担**：与 evoke-ui 同面——`.vue` 说明符改写 `.vue.d.ts`、exports
  `types` 条件 + `./*` 通配、`sideEffects` 声明 css；
- **顺手修两处命令式 API 类型脚枪**：`EbMessage.success/info/…` 与
  `EbNotify.success/…` 快捷方法的 `options` 参数补默认值（运行时本就容忍缺省，
  类型化后从「必传两参」回归可选）；构建链追加 `vue-tsc + post-types`，
  `typescript` / `vue-tsc` 入 devDependencies（锁 TS 5.9——vue-tsc 3.3 不兼容
  TypeScript 7）；守卫测试同 evoke-ui（EbChart / EbListy 别名豁免）。
- **chatbot 升级为行为级测试（30 项）**：useChatEngine 状态机全流程（发送守卫 /
  流式管线状态迁移 / 重新生成截断重发 / 错误标记）、utils 纯函数（simpleMarkdown
  标题列表引用代码块与 XSS 转义、copyToClipboard 双路径）、chatMarkdown 协议引用
  chip 与配置面、ChatMessage / Chatbot 动作条事件逐级转发、Sender 守卫；测试揪出
  并修复两处真问题——`completeMessage` 的 `startTimeMap` 以原始对象为键而
  `find` 拿到响应式代理导致**回复耗时从未被记录**（`toRaw` 修复），`ChatAttachments`
  对缺失 `type` 的附件直接渲染崩溃（类型守卫兜底）。

### @wil-works/evoke-business-ui — 发布链路排雷、a11y 收口与文档全覆盖

- **运行时依赖全量 external 化**：dayjs / highlight.js / marked /
  @floating-ui/dom / async-validator 不再打进产物（此前主入口 2.4MB，仅
  highlight.js 就内联 1500+ 处），主入口降至 72KB（gzip 17KB）；正则外置
  覆盖 `dayjs/plugin/*` 子路径导入，消费端按 dependencies 正常解析，
  消除双份运行时；
- **发布链路排雷**：`publish:pkg` 脚本由 npm publish（不改写 `workspace:^`
  协议，误发即装不上）改为 pnpm publish；版本随类型工程升 0.6.0，顺带
  修正线上依赖漂移（0.5.0 发布时 charts 尚为 0.4.x，caret 区间锁死旧版）；
- **修复 menu 键盘可达性**：menuitem 的 tabindex 两个分支均为 -1，整个
  菜单键盘不可达；非禁用项回归 tabindex=0（与 sub-menu 同口径），附回归
  测试；
- **command-palette 滚动锁收口**：直操 `body.style.overflow` 绕过引用计数，
  叠在 dialog 上关闭时会提前解锁；改走 useLockScroll，新增叠加计数回归；
- **守卫脚本补盲**：check-token-rule 增抓单段 ev-*/ew-* 裸类名（负向环视
  排除 --ev-/--ew- 令牌尾巴）、--ev-* 豁免收紧为 `--ev-*: var(--eb-*)`
  真实映射行、devDependencies 入依赖白名单（typescript / vue-tsc 显式
  登记）；compat-check 新增 src/components ↔ src/index.js 导入交叉校验，
  新组件漏导出构建即失败；
- **文档站**：警示横幅 37px 定高改 min-height + 实测高度回写
  --bd-devwarn-h，窄屏两行文案不再压顶栏；姊妹库组件数漏网口径
  （49）统一为 60。
- **a11y 批次**：tabs 方向键/Home/End 页签切换（自动激活、禁用跳过，
  此前仅 Enter 可用）；select 触发器补 combobox 语义（role +
  aria-expanded/haspopup/disabled）、选项列表补 listbox/option +
  aria-selected/disabled；dropdown 触发器（fallback 与 split-button
  两形态）补 aria-haspopup/aria-expanded；tour 的 scrollIntoView 加可选
  守卫（jsdom / SSR 无布局环境不再抛错）；
- **测试缺口回填**：新增 a11y.test.js（tabs 键盘 / select·dropdown aria /
  useFocusTrap 圈闭六例：初始焦点、Tab/Shift+Tab 循环、容器外拉回、
  焦点归还、Esc 回调）与 coverage.test.js（tour / mention / auth /
  comment 零覆盖组件补测）；chatbot ChatMessage 的 copy/regenerate 由
  「存在即过」改为真实点击断言（剪贴板桩化，与 jsdom 环境解耦）；
  command.test.js 补 transformVNodeArgs 重置防御，notify / msgbox
  幽灵实例与 overlay 同防。
- **select combobox 模式补完**：选项带稳定 DOM id 并注册进上下文，
  触发器补 `aria-activedescendant`（键盘高亮/已选定位实时同步）与
  `aria-controls`；非过滤模式打开后焦点保持在触发器上（补 tabindex），
  activedescendant 变化才可被读屏播报；顺带修一处选项注册竞态——
  「隐藏寄存区 → popper」迁移会重建实例，注册表改为按 value 替换式
  收敛到当前 DOM 代（旧实现首占去重会残留已销毁实例）；
- **table 行级键盘导航**：行采用 roving tabindex（首行可聚焦、focusin
  同步焦点位、数据缩减回钳首行），↑↓/Home/End 移动行焦点，Enter/Space
  等价点击（与指针点击同一 row-click 载荷，data-table 经由
  eb-table 的 row-click 自动透传）；移除空壳 chart/ 目录。
- **文档补页第一批（8 页）**：StatCard / StatRow（数据展示）、EmptyState
  （反馈）、PageHeader / CommandPalette（导航）、Msgbox / Notify /
  Loading（反馈，含 $confirm/$prompt 承接、输入校验、distinguishCancelAndClose、
  service 与 v-loading 双用法）；至此无文档组件从 28 降到 20。

## [charts 0.6.0] — 2026-09-15

### @wil-works/evoke-charts — AI 生成面五层收口：SPEC_RULES 能力规则词全量补齐 + 案例页入 MCP 目录

- **SPEC_RULES 清单式补齐**：散点增强（quadrant / scatterTrendline / jitter /
  pointLabels / facet）、雷达（radarRingFill / radarStacked）、K 线（candleMa /
  candleMaColors / candleUpColor / volumeData）、桑基 nodeAlign、箱线 / 直方 /
  热力（boxHorizontal / binConfig / heatmapSortBy）、折线增强（stackAreas /
  step / connectNulls / showValues / markLines / markAreas）、瀑布 / 漏斗 /
  环形的快捷口径——此前这些字段只在 schema 里可查、没有使用时机规则词，
  模型按「不用 schema 之外的字段」的约束不会主动使用；few-shot 新增散点
  四象限 + 趋势线示例（自一致测试把关）；
- **MCP 目录收录案例页**：generate-catalog 接入 EXAMPLES_NAV，10 个完整场景
  案例页（看板 / 监控 / 报表 / 教学等）可被 list / search 检索，AI 能直接引用
  真实组合用法。

### @wil-works/evoke-charts — 命中链路收口：图例/甘特/桑基缓存 + Enter 触发 click + SVG 旋转文本保真

- **hover 命中链路最后两处重算清零**：图例 bounds（每次 move 全量 measureText
  重排）与甘特 / 桑基命中布局（逐任务 Date.parse / 拓扑松弛迭代）改按输入键控
  缓存；甘特 / 桑基命中函数接受预计算布局（可选参数，向后兼容）；
- **键盘 Enter / Space 触发 click**（§13.7 期 3 部分）：在键盘巡历落点触发数据点
  `click`，与指针点击同一事件载荷；期 3 其余（散点 / 饼族巡历、触屏手势）留待
  后续；
- **exportSVG 旋转文本保真**：旋转 / 切变上下文下的 text 元素改带 `transform`
  矩阵（x/y 回填本地坐标）——此前雷达维度标签等旋转文本导出 SVG 后会横排；
- 日历热力 DST 安全性复核：日期已统一锚定本地正午（`calendarNoon`），23/25
  小时日不会跨日偏移，确认为既有设计、无需改动。

### @wil-works/evoke-charts — 大数据量渲染：折线 min-max 抽稀（§16）+ 悬浮重绘合帧

- **折线 / 面积数据抽稀**：像素点数超绘图区像素列 2 倍时，路径按像素列做
  min-max 抽稀——每列保首/末/最小/最大四个代表点，峰谷像素级不丢，绘制调用
  从 O(点数) 降到 O(宽度)（6000 点实测 lineTo 从 6000+ 压到 ≤2900）；平滑、
  阶梯、面积基线与 showValues 标签（含两两避让，同步降到 O(宽度)）都在代表点
  上执行；断段跨列保留；命中 / tooltip / 指针与键盘悬浮仍走全量数据；DESIGN
  新增 §16 定则；
- **悬浮重绘合帧**：悬浮引发的全量重绘合帧到动画帧调度，同一帧至多一次全绘——
  指针高速扫过大图时不再逐事件同步重绘（此前每跨一个类目就全绘一次）；
  DESIGN §13.2 补记该调度约定。

### @wil-works/evoke-charts — 去重复与边界回访：hover 链路缓存 / 键盘巡历（§13.7 期 1–2）

- **键盘巡历落地**（DESIGN §13.7 期 1–2）：图表容器可聚焦（空态 / 错误态除外，
  聚焦显示贴内缘焦点环），直角系类目图支持 **←/→**（横向条形图 **↑/↓**）在类目间
  步进悬浮、**Home / End** 跳首末——合成坐标走指针悬浮同一管线，准线、tooltip、
  aria-live 播报与 `hover` 事件全通道一致；焦点离开即清态；散点 / 饼族 /
  关系图族留待期 3；
- **hover 链路缓存**：`getPadding`（每次 mousemove 被调 2–3 次，每次经轴量程
  全量扫数据）与散点命中点位（含抖动全点重算 + 全点距离扫描）改按引用键控缓存，
  悬浮期间零重算；就地 mutation 由 deep watch 与 `update()` 显式清空兜底；
- **静默边界改空态占位**：饼族全 0 / 负值、韦恩超 3 集合（无闭合解）此前留白
  画布，现在进空态占位；散点量程过滤 NaN（此前轴刻度全 NaN、整图静默空白）；
- **实现收敛（行为不变）**：涨跌色默认值收敛为 `UP_COLOR / DOWN_COLOR` 单一
  出处（此前 9 处硬编码）；标签截断二分算法 6 份副本合一（`truncateLabel`）；
  瀑布图累计口径 3 处实现合一（`waterfallSteps`，渲染 / 轴量程 / tooltip 命中
  共用）；环形内半径公式 2 份合一；图例估宽改复用统一文本估宽；tooltip 与光标
  间距、「成交量」隐藏键改用常量。

### @wil-works/evoke-charts — 安全与健壮性回访：tooltip 转义 / 大数据量 / 生命周期与 AI 面补齐

- **tooltip 默认模板转义**：类目名 / 系列名 / 数值等用户数据进 HTML 前统一
  转义（含颜色 style 注入面），labels 携带富文本标签不再能注入脚本；
  `tooltip.formatter` 仍为约定的 HTML 出口，行为不变；`exportSVG` 属性同步
  转义；
- **大数据量不再栈溢出**：全库 `Math.min / Math.max(...数组)` 展开改循环归约
  （`extent` 工具，NaN 传播语义一致）——约 10 万点以上散点 / 直方图此前直接
  RangeError，散点命中测试更是每次 mousemove 都在展开；
- **更新链路防卡死**：系列缺 `data` 字段不再让 watch 回调抛错卡死后续更新，
  渲染按空系列处理（此前渲染直接抛进错误态，watch 链路永久失效）；
- **实例 destroy() 清理补齐**：与组件卸载同面——window 监听移除、联动组
  注销、焦点 / 补间动画回收（此前 destroy 后全局监听与联动组泄漏）；
- **emphasis 挂载即生效、运行中可切换**：`options.emphasis` 首帧即生效；
  运行中增删自动补播 180ms 淡化缓动（此前运行中开启淡化不可见）；
- **桑基图只读用户数据**：节点 value 自动汇总进局部布局，不再回写
  `sankeyData`（此前污染调用方数据并多触发一次动画重绘）；DESIGN §3.5
  记载的 `sankey.nodeAlign` 同步落地——`justify`（默认）末端节点贴右缘、
  `left` 按拓扑深度；
- **仪表盘边界**：`gauge: 75` 数字简写生效（schema 一直允许、此前渲染空白）；
  `max: 0` 不再被吞、负区间正常、`min === max` 不再除零出 NaN；未知 easing
  名回落默认曲线，不再逐帧抛错；
- **AI / MCP 面补齐**：`generate_chart_spec` 工具的 `requirement` 参数生效
  （此前被完全无视，不参与选型）；schema 补齐 radarRingFill / candleMaColors /
  candleUpColor / quadrant / facet / jitter / valueFormat / heatmap 系列 /
  sankey 等一批已实现字段（AI 生成此前被「不用 schema 外字段」的规则引导
  避开这些能力）；SPEC_RULES 补 arcCircular / granularity / valueFormat 用法；
  few-shot 新增日历聚合与环形弧长示例；MCP catalog 收录指南页与 0.5.0 新
  图型页（venn / sankey / chord / arc / gantt 此前 list / search 发现不了）；
- 文档：interaction 页死链修复、设计页缓动（指数→五次）/ 刻度密度（26px→
  ≥24px）/ 监控带 left 口径与 DESIGN 对齐；api 表补 `palette` 行、legend
  左右位、gauge 数字简写、sankey.nodeAlign；README 补 0.5.0 图型、palette
  与 `scene-change` 事件；「20+ 图表类型」口径更新为 29 种；
- 新增健壮性回归（转义 / 大数组 / 缺 data / destroy / gauge / easing /
  nodeAlign）与 13 项图型覆盖冒烟（radar / heatmap / bin / bullet / waterfall /
  mixed / stacked-bar / area / doughnut / rose / sparkline / 横向条形 /
  arcCircular 此前零直接测试），全仓 80 文件 1263 项测试全绿。

### @wil-works/evoke-charts — 七项回访：区间切片 / 日历铺满与粒度 / 弧形环状归位 / 动效全面化

- **K 线 dataZoom 区间选择修复**：缩放切片此前只认 `labels` 数组，纯 candleData
  的图不切片（滑块动了图不变）；补 candleData 分支并让 `volumeData` 同步切片
  （此前长度不匹配还会静默关掉量带，表现为「数据缺失」）；
- **日历热力格子横向铺满**：格子改矩形、宽高独立自适应，不再两侧留白；
  新增 `calendar.granularity: 'day' | 'week' | 'month'` 三档视角（周/月为求和
  聚合），配合外置按钮可做「每日 / 每周 / 累计」切换；
- **雷达环底色改同心圆环带**：由外向内叠画交替浓淡（AntV 雷达示例同款），
  维度文本沿外圆分散四周与环带同圆心；
- **韦恩图主体放大**：半径预算按集合数分档（1–2 集合占绘图区高 46%、
  3 集合 30%），直径约占高度 92%；集合标签正文色优先；
- **旭日图标签配色**：正文色优先（浅色主题近黑），底色深到不可读才反白——
  逐层提亮的中间调不再出现糊白字（能用黑色就用黑色）；
- **弧形环状连接图归位弧长连接图**：新增 `type: 'arc'` + `arcCircular: true`
  （节点圆点 + 过圆心弧线，连线两端锚在节点圆点上不再留缺口）；文档章节从
  弦图页迁移到弧长连接图页，DESIGN §3.7 同步归位；
- **悬浮强调全面缓动化**：柱族（柱/堆叠/条形/瀑布/混合）、箱线、K 线、漏斗、
  热力、日历、甘特的命中强调随 220ms 缓动淡入淡出（同色加深插值、不位移），
  仅十字准线与 tooltip 保持即时；DESIGN §13.2 定为全图型纪律；
- 分时图案例重写：主示例改为日内 5 分钟 K 线 + 量副图（折线版保留）；
  底部图例遇 dataZoom 滑块自动上移不再重叠；
- 文档更新：heatmap 页粒度切换演示、candle 页分时图重写、radar/arc/chord 归位、
  api 同步；全仓 78 文件 1240 项测试全绿。

## [charts 0.5.0] — 2026-09-14

### @wil-works/evoke-charts — 关系图族体验回访：弧向/动效/比例修正 + 弧形环状 + 日历热力

- **仪表盘弧向修正**：`startAngle` / `endAngle` 改按数学角约定解释（0° 在右、
  逆时针为正，同 ECharts；此前按 canvas 角直绘导致默认 220→-40 弧从下方走），
  默认形态恢复「进度弧走上方、开口朝下」的经典读法，半盘 180→0 呈 ∩ 形；
- **悬浮动效整体补齐**：桑基 / 弦图 / 弧长连接图的「强调相连、淡化其余」透明度
  档位随 220ms 缓动进出（出场保留命中索引播完回落再清，不再硬切）；图例悬浮 /
  `emphasis` 的 22% 焦点淡化全局随 180ms 缓动（`focusAnimProgress` 单一通道）；
  韦恩 / 雷达沿用既有缓动，DESIGN §13.2 划定「聚焦缓动族」与其余即时反馈边界；
- **主体比例优化**：弦图半径预算 40→30（外侧仅留标签带）、韦恩半径 0.35→0.38
  短边占比——弦 / 韦恩 / 雷达这类整幅读图的主体展示区域放大；弧长连接图弧顶
  距绘图区顶 ≥ 12px（峰值钳制），不再与标题重叠，节点行整体居中；
- **弦图新增弧形环状形态**（`chordMode: 'curve'`）：节点圆点 + 过圆心弧线连接
  （线宽 1.5–6 按关系值），适合节点多、关系稀疏的闭合网络；
- **甘特图进度标签清晰化**：宽条内嵌右缘（按条底色取对比色），窄条 / 里程碑
  外挂底色胶囊，不再与依赖线、今日线叠字；
- **分组箱线命中修正**：按类目轴取最近箱、命中带按并排槽位计——同组第二箱
  左半区即命中，不再被先声明的箱吞掉；
- **分面散点崩溃修复**：`renderScatterFacetChart` 漏返回数组导致
  `renderChart` 读取 points 报 `Cannot read properties of undefined`；
- **K 线 + 折线组合增强**：`candleMa: [5, 10]` 叠加 MA 均线（收盘价简单移动
  平均，图例 MA5/MA10 点选显隐，`candleMaColors` 覆写线色）；`volumeData`
  扩展支持 line / area（分时图：价格线上区、量柱下区按较前一刻涨跌着色，
  params 带 `volume`）；配合既有 `dataZoom` 组成行情工作台；
- **新增日历热力图 `type: 'calendar-heatmap'`**（GitHub 活动热力同款）：
  `calendarData [{ date, value }]` 按天一格（列=周、行=星期，`weekStart` 默认
  周一），月份标签、星期标签（默认一/三/五）、今日主色描边、右下「少—多」
  色阶（明暗两套绿阶，`calendar.colors` 可整列覆写），入场按列弹出，悬浮
  tooltip 报日期与数值；
- 新增 2 个测试文件（round2 / calendar）13 项，全量 15 文件 229 项全绿；
  文档站 heatmap 页新增日历热力章节、chord 页新增弧形环状章节、candle 页新增
  均线/分时/区间三案例，api/gantt/gauge/index 同步。

### @wil-works/evoke-charts — 关系与流动图族 + 散点/箱线/K线/仪表盘/雷达批量增强

- **新增桑基图 `type: 'sankey'`**：`sankeyData { nodes, links }`，节点按拓扑深度分列、
  高度即 max(入流, 出流)（缺省自动按链接汇总），流带宽度即流量、颜色继承源节点色；
  悬浮流带强调自身与同源同宿、其余淡出；图例点选节点隐去相连流带、剩余重新等比；
- **新增韦恩图 `type: 'venn'`**：`vennData` 单集合 + 交集行（`sets` + `value`），半径按
  √值等面积映射、圆距按交集面积二分反解（三集合三角形约束近似）；`vennHollow: true`
  空心形态；悬浮交集区两圆同时强调；
- **新增弦图 `type: 'chord'` 与弧长连接图 `type: 'arc'`**：`chordData` / `arcData`
  与桑基同构，连接带宽度即关系值、颜色继承源节点色；弦图节点弧默认均布
  （`chordByValue` 按值占比），弧长图为上半椭圆弧、线宽 1.5–6px 线性映射；
  悬浮连接带强调自身淡化其余，悬浮节点点亮相连全部关系；
- **新增甘特图 `type: 'gantt'`**：`ganttData { name, start, end, progress, milestone,
  dependsOn, color }`——行带任务条、进度左实右淡、里程碑菱形、依赖正交箭头、
  `ganttToday` 今日线；左侧任务名列实测自适应（80–180 夹取），底部时间轴自动抽稀；
  悬浮整行高亮 + 起止进度 tooltip；
- **散点图批量增强**：`pointLabels` 点标注（重叠自动让位）、`quadrant` 四象限
  （十字参考线 + 四角标签，中线缺省取均值）、`group` 颜色通道分组（图例按组聚合、
  点选整组显隐）、回归线自动标注 R²（`trendlinePerGroup` 按组各画一条）、`jitter`
  确定性抖动防同值重叠（0–20px，同数据同偏移）、`facet: true` 分面小倍数网格
  （每格独立量程）、`type: 'scatter-matrix'` 散点矩阵（n×n 变量相关性，对角格
  字段名）；散点点位渲染与命中测试收敛到同一口径（`scatterPointPositions`）；
- **K 线 + 成交量**：`volumeData` 开启副图（下部 24%，`volumeHeight` 0.15–0.4 可调），
  量柱颜色跟随当日涨跌、价格轴只量价格区；图例「成交量」点选隐去量带、K 线回铺全高；
  tooltip params 附带 `volume`；
- **仪表盘指针与深度定制**：`gauge.pointer { show, color, width, length }` 箭针随进度
  动画扫动、进度环默认淡化（`progressDim: false` 保持原样）；`axisWidth` / `tickCount` /
  `showTicks` / `tickMarks` / `valueFontSize` / `cornerRadius` 外观定制面，默认值维持
  既有形态；
- **箱线图扩展**：`group` 分组箱线（同类目并排、图例按组聚合）、`boxHorizontal` 横向
  形态、`showOutliers: false` 隐藏异常点；几何抽成 `computeBoxplotGeometry`（渲染、
  悬浮命中共用）；
- **雷达图交互增强**：`radarRingFill: true` 环带交替铺极淡底色；悬浮维度标签或轴顶点
  点亮该轴（轴线升主文字色、标签加粗、各系列顶点画实心点），进出 220ms 缓动；
  图例悬浮焦点系列线宽升至 2.5px；
- **x 轴拥挤三步策略**：`interval` 未显式指定时按标签实测宽自动抽稀（步距 ≥ 标签宽
  + 12、首末必留），全量展示时单标签超步距省略号截断；旋转时按旋转后占宽估算，
  不自动旋转（排版决策归使用方）；
- schema 注册 6 个新类型与配套数据字段；DESIGN.md 定稿 §3.5–3.11 视觉标准与 §4
  拥挤策略；新增 6 个测试文件（桑基/甘特/韦恩/弦弧/散点增强/批量增强），
  全仓 77 文件 1222 项全绿；文档站新增 sankey / gantt / venn / chord 四页，
  scatter / candle / gauge / boxplot / radar / api / 总览同步。

### @wil-works/evoke-charts — 漏斗图视觉整改（同色系递浅 / 末端不收针尖）

- **段色改同色系递浅**：原先逐层取多色相（蓝/绿/黄/浅蓝/橘红），五层读起来像五个并列
  类目，末层落到暖色还被误读成告警；改为取一个基准色相（`funnelData[].color` 显式
  指定优先，否则主题首色）按层序向背景方向混合——浅色主题向白 15%/层（上限 60%），
  暗色主题向黑 12%/层（上限 45%），与旭日图「分支同色系」同一机制（旭日按深度、
  漏斗按层序）。图例与悬浮命中共用同一取色口径；
- **底部收平边**：末层下宽等于自身宽度，不再额外收 50% 成针尖——极差 20 倍以上的
  漏斗（4860 → 212）尾层退化成一根针、看着像画坏了，现在收成一条平边；
- **新增 `funnelMinRatio`**（0–0.5，默认 0 = 严格等比）：极差悬殊时压缩尾段换可读性，
  宽度映射改为 `min + (1−min) × 值/最大值`，单调性不变；
- **段内标签文字色按段底色取对比度更高的一方**：段色逐层提亮后，写死反白会让浅段
  上的字糊掉，现按 WCAG 相对亮度在白字/深字间取高者（与旭日图、矩形树图同一规矩）；
- 占比按最大值折算（不再按首层，`pyramid: true` 反转时不会算出上千百分比），
  整数不补小数位（100% 而非 100.0%）；
- 悬浮反馈改为同色加深一档（向黑 8%），去掉原先的上浮 3px——层级/流程类图统一
  「聚焦加深、不位移」，与旭日图、矩形树图一致；
- 几何抽成 `computeFunnelGeometry`（渲染、图例、悬浮命中共用），新增 14 项漏斗
  单测（宽度口径 / 末端平边 / 明暗递浅 / 显式定色 / 压缩尾段 / 金字塔 / 标签对比色），
  全量 69 文件 1145 项全绿。

## [ui 0.8.0] — 2026-09-14

### @wil-works/evoke-ui — ComparisonTable 升级为双形态对比表 + 新增 EvBento 图文组合分区

- **ComparisonTable 吸收 compare 能力，不再有独立对比组件**：`columns` 列头扩展
  `image` / `colors`（配色点）/ `badge` / `tagline` / `href` / `price`+`priceNote`，
  基础定价档位照旧只用 label/note；新增 `groups` 按特性分组陈列（组标题行跨全表）；
  单元格新增**字符串数组多行**（一格讲多层信息）；`bordered` 选择网格边框——
  **默认改为现代无边框形态**（行分隔线 + 组标题分节，去掉旧全网格与外框），
  并加宿主样式屏蔽（文档站表格排版不再渗入成老式全边框表）；
  表格随产品数撑最小宽、窄容器横向滚动，不再出现挤压折叠；
- **新增 `EvBento` 图文组合分区**：Bento 卡片栅格，`span` 跨列（超出列数自动回落
  整行）/ `rows` 跨行 / `dense` 回填空隙；卡片图文上下结构，`imagePos: 'fill'`
  整卡铺图文字叠上；`tone` 提供 soft / primary / dark 卡面，`href` 整卡可点；
  `bordered` 加边框，内嵌图给高度上限防膨胀；**布局断点跟随父容器宽度（容器查询）**
  而非视口，嵌在窄栏里也正确回落，媒体查询仅作不支持时的兜底；
- 文档：comparison-table.md 重写为双形态说明，新增 bento.md（演示为虚构品牌与
  通用规格），侧栏与组件总览同步，组件数口径 59→60（compare 并入不再单计）；
  ComparisonTable 用例扩至 5 项、EvBento 4 项，全量 71 文件 1154 项全绿。

## [ui 0.7.1] — 2026-09-13

### @wil-works/evoke-ui — Alert 溢出保护：胶囊单行省略

- **胶囊（pill）形态单行语义**：超长文案省略号截断，不再换行撑破胶囊——title 与
  message 各自 nowrap + ellipsis，overflow:hidden 使 flex 收缩对内容生效；
- 常规形态加溢出保护：根元素 max-width 100%、消息位 overflow-wrap anywhere——超长词
  与 URL 就地断行，不再把宿主容器撑出横向滚动；
- 文档站滚动叙事指南清理「苹果式」表述，改「高端产品页」。

## [ui 0.7.0] — 2026-09-13

### @wil-works/evoke-ui — 滚动叙事：EvScrollScene 场景组件 + useScrollProgress 进度原语

- **新增 `EvScrollScene` 滚动场景**：外层按 `duration` 拉出滚动长度、内层 sticky 钉在
  视口——滚动条就是时间轴，下滚前进、上滚回溯（高端产品页的笔记本开合、分幕功能
  介绍这类叙事的地基）；进度经作用域插槽 `{ progress, reduced }` 与 CSS 变量
  `--ev-scene-progress`（0..1）双通道暴露，纯 CSS 用 `calc()` 消费（如
  `rotateX(calc(-92deg + var(--ev-scene-progress) * 92deg))`），canvas 刷帧 /
  `video.currentTime` 等 JS 消费走插槽值；
- `prefers-reduced-motion` 下进度钉在终态 1，页面静态呈现最终样子，宿主零判断；
  `disabled` 用于窄屏/打印降级——不拉高度不吸附、进度恒 0（变量仍输出，消费端
  calc 不至于失效）；`top` 给悬浮导航让位，吸附点推迟且进度几何自动跟随；
- **新增 `useScrollProgress(target, { offset })` 进度原语**（包根导出）：把元素穿越
  视口的程度折算成 0..1，rAF 节流的 passive 监听、SSR 安全；视差层、多元素错拍等
  自定义场景直接组装，几何语义与组件一致；
- **EvSection 新增 `snap` prop**：滚近时轻吸到视口顶（原生 scroll-snap proximity，
  温和可打断，不做滚轮劫持）；任一区块声明即经 `html:has()` 启用页面吸附，不支持
  `:has` 的环境优雅降级为普通滚动；内部滚动容器的分步展示新增 `ev-snap-y` /
  `ev-snap-start` 工具类；
- 文档：指南新章「滚动叙事」（随滚动开合的笔记本、分步功能区、自定义场景），
  动效页与 v-reveal 划清触发型/进度驱动型分工；组件新增 scroll-scene.md，
  组件数口径 58→59；场景测试 5 项（进度映射/双向回溯/吸附偏移/禁用/reduced-motion），
  全量 68 文件 1132 项全绿。

### @wil-works/evoke-ui — Slider 非格点初值的填充错位修复

- **修复「填充冒出圆钮」**：初始值不在 `min + k·step` 格点上时（磨砂实验室的
  雾面浓度：min=30、step=5、初值 72），原生圆钮被浏览器就近吸附显示（70），
  导轨填充却按原始值绘制（64.6%）——刷新后蓝色多出一截，拖动过才对齐；
  现在显示值（圆钮绑定与填充比例）统一吸附到最近格点，与原生行为一致，
  浮点步长（0.1 等）消除精度噪点；拖动派发的本来就是格点值，数据面无变化；
- 磨砂专题页实验室雾面浓度初值 72 → 70，示例代码与可见圆钮一致；
- slider 文档 API 段补吸附行为说明；新增吸附用例（整步/浮点步长），
  全量 67 文件 1127 项全绿。

## [ui 0.6.0 / business-ui 0.5.0] — 2026-09-13

### @wil-works/evoke-ui — 新增 Slider 滑块组件

- 新增 `EvSlider`：原生 range 之上的受控封装，键盘方向键可调（原生无障碍免费），
  导轨「已走过」部分着主色（`--ev-slider-fill` 渐变断点，Firefox 走原生
  `-moz-range-progress`）；焦点指示落在滑块圆钮上（全局 `:focus-visible`
  整框环按组件屏蔽）；
- v-model / `default-value` 非受控双模式（复用 `useUncontrolled`），拖动持续派发
  `update:modelValue` 与 `change`；`min` / `max` / `step` / `disabled` /
  `size`（small/default/large）齐备，`aria-label` 等原生属性透传到内部 input；
- 磨砂专题页「实时调节」实验室换装 EvSlider（原为裸 `<input type="range">`），
  三参数调节视觉与全站表单控件统一；文档新增 components/slider.md（基础用法 /
  尺寸与禁用 / API），侧栏与组件总览收录，组件数口径 57→58；新增单测 6 项，
  全量 67 文件 1125 项全绿。

### @wil-works/evoke-ui / @wil-works/evoke-business-ui — 磨砂参数化：saturate / tint 组件级参数

- 新增 `useGlassVars` 共用 composable，磨砂参数收敛为三个组件 prop（与既有 `blur`
  对齐，全部内联覆盖对应令牌、缺省跟随令牌、`0` 显式生效）：
  **`saturate`**（饱和度倍数 → `--x-glass-saturate`）、**`tint`**（底色浓度 % →
  `--x-glass-bg`，数字拼完整 color-mix、字符串透传可直接给颜色值）；
- 覆盖全部玻璃组件（evoke 14 / business 4），此前手写的 blur-only `glassVars`
  computed 全部替换为共用实现；Navbar 的滚动磨砂 `blur`（Boolean）语义不变，
  另获 saturate/tint 参数；
- 用法从此免写令牌：`<EvCard glass :blur="28" :saturate="1.8" :tint="60">` ；
  铁律脚本抓出 business 底色令牌名误写（--eb-bg-container 不存在，实为
  --eb-bg-color）——隔离检查再立一功；
- 文档 13 个组件页 API 表补 `saturate` / `tint` 行；磨砂专题页实验室改为
  `<EvCard glass :blur :saturate :tint>` 参数化演示，示例代码随滑块同步；
  两库各补 useGlassVars 单测（10 项），全量 1119 全绿，双包构建通过。

### @wil-works/evoke-ui — ConfigProvider 磨砂作用域做实（global:false 真局部化）

- **`glass` 此前无视 `global` 一律写 `html[data-ev-glass]`**，多个局部演示会互相拔开关；
  现在 `global: false` 时玻璃开关写在包裹元素上，作用域限定子树，互不污染页面其余部分；
- 玻璃配方的属性选择器去 `html` 前缀（`[data-ev-glass='on'] .x`），html 与包裹元素两种
  宿主通配， specificity 仍高于组件基底样式；business-ui 四组件同形对齐；
- 边界：局部作用域不覆盖 Teleport 到 body 的弹层（脱离包裹树），弹层请用组件级
  `glass` prop；`global` 默认路径行为不变，卸载仍还原 html 属性；
- 文档同步 config-provider API 行与磨砂专题页描述；测试补局部作用域三例。

### @wil-works/evoke-ui / @wil-works/evoke-business-ui — 弹层滚动锁定防抖动升级

- **锁定期间优先上 `scrollbar-gutter: stable`**（html 内联，支持性探测）：滚动条消失但
  视口布局宽度不变，文档流内容与 `position: fixed` 元素（固定顶栏、警示横幅等）
  都不再位移——原 padding 补偿只能稳住文档流，fixed 元素在经典滚动条环境
  （Windows、系统"始终显示滚动条"）下仍会横跳；
- 不支持 gutter 的浏览器回退原 padding-right 补偿方案；evoke-ui 侧对齐 business
  补出 `--ev-scrollbar-width` 变量供消费方补偿 fixed 元素；
- 语义化感知：macOS 覆盖式滚动条下 gutter 不占位，行为与之前一致；
- 两库滚动锁测试各补 gutter 路径 / 回退路径用例（`CSS.supports` 桩定），共 11 项。

### @wil-works/evoke-business-ui — EbNotify 堆叠偏移的元素定位加固

- **同列堆叠重排改为按类名定位通知本体**：`updateColumn` 原先取
  `container.firstElementChild` 直写 `top`——CI（node 22）环境下 @vue/test-utils
  的全局 `transformVNodeArgs` 会把 Transition 替换成 `<transition-stub>` 包装元素
  （仓库 vitest 配置 `isolate: false`，该状态跨测试文件持久化），命令式偏移落到
  包装层上、真实通知元素收不到，`EbNotify 同角堆叠` 用例稳定 NaN 失败；现改在
  容器内按 `.eb-notification` 类名定位，对包装层/桩/模板结构变化免疫，业务行为
  无任何变化；
- evoke-ui glass 测试的 teleport 查询 helper 同步加前置清扫（先移除历史残留节点
  再断言），隔离共享 jsdom 下其它文件残留对断言的干扰——与上述同属
  `isolate: false` 跨文件残留一类问题；
- **测试隔离翻正**：根 vitest 配置 `isolate: false` 改回默认的逐文件隔离——该配置
  曾让 VTU 全局改写器、图标注册表、localStorage 等模块/DOM 状态跨文件泄漏，是
  上述问题的温床；代价是全量测试耗时约翻倍（本地 ~4s → ~8s），换来对顺序敏感
  偶发挂的根治。压测：只洗文件顺序 seed 1/7/13/42 全绿。

## [ui 0.5.0 / charts 0.4.0] — 2026-09-13

### @wil-works/evoke-charts — 统一交互规范（DESIGN.md §13）落地

- **规范成文**：DESIGN.md 新增「交互规范」章节——三条总纲（悬浮即时无动画 /
  反馈走既有通道 / 克制）、光标语义分级、hover 行为矩阵（逐图型）、点选与焦点、
  缩放与框选、tooltip 内容细则、交互态生命周期、键盘与触屏路线图、事件契约表；
  并修正 §10 动效曲线描述（easeOut 为五次缓出，非指数缓出）；
- **常量单一事实源**：新增 `src/interactions.js`——焦点淡化 0.22、图例残影
  0.4/0.6、层级聚焦淡化 0.25、滚轮缩放系数 1.15 与窗口下限 2%、tooltip 间距与
  过渡曲线、补间默认 1200ms/easeOut 全部收口，渲染器与组件统一引用，测试对
  数值做快照把关防漂移；滚轮缩放抽为纯函数 `applyWheelZoom`；
- **新交互行为**：**Esc 清态**（清除悬浮 / tooltip / 框选拖拽，随之派发
  `unhover`）；**光标语义分级**（绘图区 crosshair、图例与工具箱 pointer、缩放
  滑块 grab / 拖拽中 grabbing）；**tooltip 空值行不渲染**（多系列全空不弹，
  K 线 / 箱线数组值不受影响）；
- 键盘导航（容器聚焦 / 方向键索引）与触屏捏合缩放列为路线图后续期次；
- 文档站「交互与联动」页新增「统一手势约定」章节并对齐事件表。

### @wil-works/evoke-ui — 磨砂全家桶：浮层/预览/导航接入 + 玻璃配方现代化 + blur 强度 prop

- **新接入七个组件**：Modal（面板）、ImagePreview（磨砂预览背景——遮罩减淡整幅雾化，
  关闭/箭头按钮同步玻璃化）、ActionSheet（标题/列表/取消栏连片统一取景，块间缝隙
  透出磨砂而非生页面）、Tabbar、NavBar（移动端页头）、Select（下拉面板）；
  ExecCard 此前有 `glass` prop 但样式缺失，本轮补齐落地；
- **玻璃配方升级**：新增 `--ev-glass-edge`（顶缘 1px 高光，液态玻璃质感）与
  `--ev-glass-border`（发丝描边替代实底描边）两组令牌，明暗各一档；Card 家族
  （card / article-card / pricing-card / profile-card / exec-card）统一换新配方；
- **刻制不透明风格豁免**：Card 的粉彩 tone / sticker / featured 不再被全局磨砂
  冲刷（沿用 pricing featured / profile plain 的既有先例）；
- **blur 强度 prop 对齐 business-ui**：全部 14 个玻璃组件支持 `blur`（number/string，
  px），内联覆盖 `--ev-glass-blur` 实现单组件独立调强度，缺省跟随令牌；
  Navbar 的 `blur`（滚动后磨砂开关，boolean）保持原语义不变；
- **顺手修复**：Tabbar 的 `barRef` 从未绑定到模板，占位高度测量（measure /
  ResizeObserver）一直空转，固定 50px 兜底；本轮接通；
- 测试扩至 18 项（弹层/预览/导航家族三态 + blur 内联覆盖 + 0 值显式生效），
  文档同步 config-provider 磨砂章节与各组件 API 行（Modal / ImagePreview 新增
  磨砂演示）；
- **磨砂单独成章**：docs-web 指南新增「磨砂玻璃」页——全局开关 / 三态 / 强度对比 /
  弹层与预览 / 覆盖组件 / 磨砂令牌 / 降级与豁免，config-provider 磨砂章节收敛为
  指引；各处演示背景弃用渐变换照片底（glass-forest / glass-ridge 两张入
  docs-web/public/images）——照片细节多，雾面质感对比才明显。

### @wil-works/evoke-charts — 内置色系一键应用（options.palette）

- **七套现代色系**：新增 classic 经典 / aurora 极光 / sunset 落日 / morandi 莫兰迪 /
  forest 林间 / ink 墨蓝 / candy 糖果，各带浅 / 暗两组 8 槽色值与适配场景
  （科技 SaaS、消费营销、人文报告、健康环保、金融政企、活动大屏）；classic 为
  当前缺省色板的固化版；
- **固定语义**：`options.palette` 填色系 id 即整图固定——系列色不再读取
  `--ev-color-*` 令牌，宿主换主色、换肤都不影响这张图；明暗换挡由色系自带
  （暗色同色相提亮），结构色（网格 / 轴文字）仍随宿主明暗保证可读；
- **取色优先级**：`theme.colors`（手工数组）> `palette`（内置色系）> 令牌跟随
  （默认）；schema 契约、渲染自检、AI 提示词规则同步收编，导出
  `CHART_PALETTES` / `resolveChartPalette` 供宿主生成换色菜单；
- 每套色系过 DESIGN.md §2.1 同款验收：取色顺序相邻色相差 ≥ 30°（S < 20% 灰调
  槽豁免）、暗色同色相提亮，测试把关；
- 文档站新增「主题配色」页（指南菜单入口）：一键试色演示、色系总览色板条、
  优先级与固定边界说明。

### @wil-works/evoke-charts — 双轴升为一等图型：mixed 页真双轴 + AI 面补齐

- **图型页与导航**：「混合图」页更名「混合图 · 双轴」，新增「双轴怎么开」章节
  （`series[].chartType` + `series[].yAxis` + 顶层 `yAxisRight` 三字段），三张示例
  全部改为真双轴渲染——此前页面宣称双轴但示例未开右轴，率线被量纲压扁；页内
  明确边界：值轴以左、右两根为限，暂不支持更多轴，line / area 同样支持双轴；
- **AI 面**：提示词契约（SPEC_RULES）新增双轴规则，few-shot 示例库补混合图
  双轴示例——模型路径照抄即得合法双轴 Spec，与确定性引擎的量级悬殊自动双轴
  （见上）互为表里；
- **API 参考**：`series` 字段补 `chartType` / `yAxis` 说明，新增 `yAxisRight` 字段行。

### @wil-works/evoke-charts — AI 生成引擎：年份维度与双轴混合

- **年份列自动认作时间维度**：`1970` 这类裸年份（含「2024年」写法）不再被当成
  数值度量混进系列。裸年份与普通数值同形，需「年份 / 年度 / 日期 / year / date」
  等时间语义表头才判时间，「人口 / 月薪 / 编号」这类恰好落在年份区间的列不受
  牵连；带分隔符的 `2024-01` 依旧无需表头；JSON 对象数组里的数值型年份同样认；
- **量级悬殊自动切双轴**：趋势语境下多度量峰值相差 ≥100 倍时改出混合图——最大
  度量柱走左轴、其余线走右轴，小度量不再被压成贴地直线；叙述注解只按左轴落位，
  右轴系列不参与，避免注解错位。

## [0.4.1 / charts 0.3.1] — 2026-09-13

> 本波起，三包 README 头部统一加上「开发迭代中，请勿用于生产环境」警示；
> 三站文档顶部也加了同样的横幅提示。

### @wil-works/evoke-ui — 首屏入场与滚动浮现动效放软

- **EvHero `reveal` 改纯 CSS 动画实现**：首帧即播、随页面绘制逐层浮现，
  不再等水合后才由 JS 加类（旧实现会先画出完整内容、瞬间隐藏再入场，观感发硬）；
  步进从 60ms 放宽到 90ms，位移时长 0.7s、强减速曲线，尾部有沉降感；
- **v-reveal 滚动入场同套曲线**：位移 0.7s 长尾减速 + 透明度 0.45s 先落位，
  上浮距离 14px → 20px，`left` / `right` 放宽到 24px；
- **修复 v-reveal 方向变体失效**：指令写入的 data 属性是遗留的 `data-ew-reveal`，
  与 CSS 的 `[data-ev-reveal=…]` 选择器对不上，`left` / `right` / `zoom` / `fade`
  四种类型一直退化成默认上浮，现已统一为 `data-ev-reveal`。

### @wil-works/evoke-business-ui — README 开发中警示

- README 头部加「开发迭代中，请勿用于生产环境」警示；无代码变化。

### @wil-works/evoke-charts — 旭日图标签旋转化 / 层级图聚焦强调

- **标签改 ECharts 形态**：各环（含内环）标签一律沿半径旋转、居中在自己的环带里，
  左半圆翻转 180° 保证从左往右读；不再把最外圈标签牵到盘外画引线——引线标签
  留给饼图/环形图；`showValues` 时数值作为第二行沿环厚方向堆叠；
- 标签容差：环厚 ≥ 12 且弦长 ≥ 11 且文字长度 ≤ 环厚 + 20px 才画，更长的名字
  交给 tooltip（不再硬塞、也不再整环无字）；
- **层级图统一「聚焦子树」强调**：悬浮某节点时它与其全部子孙保持原色、其余段
  与标签淡出到 0.25（220ms 缓动，切焦段不重播），被悬浮节点自身加深一档；
  旭日图与矩形树图同一套规则；
- 矩形树图顺带撤掉悬浮时的发光阴影（库里唯一的阴影例外），改为一档加深 +
  聚焦淡化，与「默认无阴影」原则一致。

### @wil-works/evoke-charts — 漏斗图标签与动效精修

- 段内两行标签行距放宽（中心 ±9px），放不下的判定收紧：梯形中位宽需留出
  两侧各 14px、层高需 ≥ 36px，否则自动转外侧引线标签
- 外侧引线标签纵向最小步进 36px 防重叠，虚线引线随标签位移斜连
- 动效：形状展开改 cubic ease-out 收尾；标签随进度平滑淡入
  （72% → 100% 区间 0 → 1），不再硬蹦出现

### @wil-works/evoke-charts — 旭日图重做（扇区收敛 / 同色系 / 标签外置）

- **子扇区收敛父扇区**：子节点扫角改按「父扇区扫角 × 该节点在兄弟中的占比」
  计算，兄弟首尾相接铺满父扇区——同一射线穿过的各层才是同一条路径。此前子层
  按整圆占比铺开，外圈整片越界压到别的分支上，配色与标签怎么调都救不回来；
- **环带回正**：取消按数值外延的花瓣与 66% 半径预算，各层厚度一致、最外圈是
  一条干净的圆；层与层、段与段之间 2px 背景色分隔；
- **分支同色系**：一级分支各占一个色相、子孙继承同一色相，按深度向背景方向
  混合（浅色主题向白 26%/层、上限 60%；暗色主题向黑 14%/层、上限 34%），
  外圈大面积不再刺眼，一条射线读下来是同一色族的深浅；
- **标签分层**：内环 12px 加粗水平排布；中间层沿半径旋转 10px（环带窄时允许
  轻微越界，不再整环无字）；最外层标签外置，与饼图共用同一套「径向 + 折线」
  引线、左右分列与 16px 纵向防重叠，放不下即隐藏、靠 tooltip 兜底；
  `showValues` 让外置标签带数值；
- **文字取反色改按 WCAG 对比度选**（原先按亮度阈值，逐层提亮后的中间调会被
  判成白字而看不清）；颜色混合统一输出 `#rrggbb`，`getContrastText` 同时认
  `rgb()` 写法——树图、热力图的内嵌标签一并受益；
- **悬浮命中与绘制共用同一份几何**（此前两边各自算半径，外环切片点不中），
  悬浮只加深同色一档，不位移、不引入强调色描边。

### @wil-works/evoke-charts — 散点图点图例

- `scatterData` 各点的 `label` 自动进入图例（着色与点位一致），图例点选可
  显隐对应散点；无 `label` 的点不进图例——「每个点是一个类目」的场景
  （基金风险收益、部门人效等）不再只能靠悬浮辨认
- 图例交互沿用既有 `toggleSeries` / `legend.interactive` 配置

### @wil-works/evoke-charts — 雷达图视觉升级

- 填充与面积图对齐同标准：整块平涂改**纵向浅渐变**（`@25% → @3%`），多系列
  叠加不再糊成重色块；悬停系列填充微增、线宽 2.5px
- 线宽 2px → 1.5px（与折线一致）；**顶点圆点默认不画**，`radarSeries` 项传
  `showSymbol: true` 才画（原默认全部顶点带大圆点）
- 各维度共用同一 `max` 时，最上轴旁自动标注环刻度数值（20/40/…），环代表
  多少一望即知；维度各自定 `max` 时不标注（环刻度会有歧义）

### @wil-works/evoke-charts — 修复：旭日图父节点省略 value 时只剩第一个分支

- `sunburstData` 父节点省略 `value` 时布局层直接读 `n.value` 得到 NaN——
  顶层角宽分配失效，**只有第一个分支的子层可见**（多分支数据被画成两三片的
  环形图模样），后续兄弟分支角度全部失效。现在父节点由子孙节点递归汇总，
  与文档「父节点可省略（由子节点汇总）」的承诺一致；显式 value 行为不变
- `showValues` 标注同步改用聚合值，父节点不再出现 undefined

## [charts 0.3.0] — 2026-09-12

> 单包发版波（workflow_dispatch charts）：仅 @wil-works/evoke-charts 0.2.0 → 0.3.0，
> business-ui / ui 版本不变。含**行为变化**：容器默认去边框、显式 ticks 升级为
> 硬上限，升级前请核对以下各节。

### @wil-works/evoke-charts — lint 视觉自检加深

- 无头渲染新增**文本重叠碰撞**检查：同一基线带内的两两文字（轴标签拥挤、
  注解互相遮挡）按估宽计算重叠面积，超短边 30% 记入 `text-overlap`
- 新增**自定义色板对比度**检查：spec 自带 `theme.colors` 时，明暗两套背景
  各自过 WCAG 图形阈值 3:1，不达标记入 `low-contrast`（默认色板为库级验证
  过的，不重复检查）
- 几何检查依赖 DOM canvas，SSR 环境自动跳过（`headless-skipped` 标记）

### @wil-works/evoke-charts — 图层逃逸口：layers 绘制钩子与 overlay 插槽

- 新增 `layers: [{ at, draw }]`：canvas 自定义绘制按锚点插入渲染管线——
  `back`（数据层之下）、`after-series`（系列之后、注解之前）、`front`（注解
  之上、图例之前，默认）；`draw(ctx, renderCtx)` 拿到与渲染器同一套
  `{ plotArea, theme, options, progress }`，自定义内容跟随主题与布局
- 新增 `#overlay` 作用域插槽：HTML 内容绝对定位铺满容器，默认
  `pointer-events: none`（子元素可自行开启），层级低于 tooltip；插槽参数
  `{ plotArea, theme, options }`，富文本旁白 / 自定义标记不必再硬塞进 canvas

### @wil-works/evoke-charts — 提示词示例库（few-shot）

- `buildChartPrompt` 默认附「## 示例」段：4 条「需求 → Spec」对照（折线 / 饼图
  / 横向条形 / 散点），由 `SPEC_EXAMPLES` / `formatExamples` 导出复用；
  `examples: false` 关闭
- 示例有自一致性测试把关：每条 spec 都通过 schema 校验与 lint 无 error，
  模型照抄不会抄出不合格配置

### @wil-works/evoke-charts — AI 生成引擎：数据直生 / 提示词契约 / 渲染自检

- 新增 `generateChartSpec(data, hint)`：CSV / TSV / 对象数组 / 二维数组 →
  Spec。自动推断列类型（时间 / 数值 / 类目，≥60% 命中率阈值）、按意图或数据
  形状选型（趋势 / 占比 / 排行 / 堆叠 / 关系 / 对比）、字段映射与图例组装；
  返回 `{ spec, report }`，report 给出选型理由与告警，数据不可用时报错不抛错
- `hint.narrative: true` 自动注入叙述注解：全局峰值 callout + 首系列末点环比
  delta（受单图 3 处注解预算约束）；`hint.hint` / `hint.title` 支持意图关键词
  （趋势 / 占比 / 排行 / 堆叠 / 关系 / 对比）
- 新增 `lintChartSpec(spec)`：交付前自检——schema 校验 → 焦点预算（注解 ≤3
  自动裁剪）→ 饼图扇区数建议 → 类目拥挤的单系列柱状自动转横向 → 无头渲染
  文本越界检查（依赖 DOM，SSR 自动跳过）；返回 `{ issues, spec }`（修后副本）
- 新增 `buildChartPrompt({ data, requirement })`：把 options JSON Schema、数据
  预览与硬性规则打包成提示词，喂给任意大模型后把返回 JSON 过 `lintChartSpec`
  自检、`setSpec` 回放——模型调用在宿主侧，包内零网络依赖
- 底层 `parseDataTable` / `parseNumeric` / `inferColumns` / `detectIntent` 一并
  导出，供宿主复用

### @wil-works/evoke-charts — scenes 编排时间轴：分幕 reveal / step / loop

- 新增 `scenes: { autoplay, loop, items: [{ patch, duration, hold }] }`：每幕一个
  options 浅合并补丁（顶层键替换），初始停在第一幕；`duration` 为该幕过渡时长
  （ms，覆盖全局动画），`hold` 为过渡后额外停留；`autoplay` 自动推进、
  `loop` 到尾幕回卷
- 组件方法 `nextScene()` / `prevScene()` / `gotoScene(i)`（首末幕夹界）与
  `getSceneIndex()`；事件 `scene-change`（`{ index, total }`）供宿主做进度指示，
  受控推进即可挂滚动叙事
- 新增 `getEffectiveSpec()`：返回当前实际生效的 Spec（含缩放切片与场景补丁，
  剔除 `__` 内部键），与 `getSpec()`（基底）对照可核对编排状态
- `setSpec()` 整体替换后场景重置回第一幕

### @wil-works/evoke-charts — 叙述注解 annotations[] 与焦点 emphasis

- 新增 `annotations[]` 五类型（直角系图表）：`text`（次要色斜体文字）、
  `callout`（旁注 + 1px 虚线引线 + 端点小圆点，8 向锚点）、`point`（r3 实心 +
  r6 外环固定高亮点，按系列名取色）、`delta`（三角符号 + 结论数字，涨跌色
  跟随 K 线涨跌约定）、`region`（类目区间 primary @6% 填充 + 左上斜体标签）
- 定位：`x`（类目值或索引）+ `y`（数值），或 `xPx` / `yPx` 像素定位（优先）；
  `offsetX` / `offsetY` 像素微调
- 新增 `emphasis: { series, dimOthers: true }` 焦点强调：焦点系列原样、其余
  系列降到 22% 透明度（与图例悬浮强调同一通道）；生效期间图例悬浮不抢占，
  移除即恢复
- 旧 `annotation: { texts, arrows }` 字段兼容保留，行为不变

### @wil-works/evoke-charts — Spec 契约：getSpec / setSpec 与 options JSON Schema

- 新增 `getSpec()` / `setSpec(spec)` 组件方法：前者返回当前 Spec 的深拷贝
  （可安全存储、diff，改副本不反噬图表），后者整体替换 Spec（清掉旧键与
  图例显隐、缩放等交互状态后重绘）——`update()` 管增量调数，`setSpec()`
  管换图
- 新增 `chartOptionsSchema`（options 的 JSON Schema 描述）与
  `validateOptions(options)` 轻量校验（返回 `ok` 与带 path 定位的
  `warnings`），均从包根导出，供宿主与生成端在存档 / 回放前自检
- dev 模式下组件对 options 自动做上述校验，非法配置在控制台去重告警
  （不阻断渲染，单实例最多提示 8 条）

### @wil-works/evoke-charts — 容器默认去边框（边框交宿主）

- `.ev-chart` 容器不再自带 1px 描边——是否加框、加多粗由宿主决定，图表只负责
  内容；原依赖默认边框做卡片观感的宿主请自行给容器加 `border`。
  `--ev-app-card-border` 退出图表令牌契约（容器面只剩 `--ev-bg-color` /
  `--ev-bg-color-overlay`）

### @wil-works/evoke-charts — y 轴刻度密度自适应、硬上限与量程余量

- 显式 `yAxis.ticks` 升级为硬上限：nice 步进产生的多余中间档自动抽稀
  （保留首末两端、整数倍步长），`ticks: 3` 不再溢出成 5 档
- 绘图高度不足时按「每档 ≥ 24px」自适应降密——64px 监控长条自动降到 2–3 档，
  刻度不再挤压；常规高度且未显式传 `ticks` 的图表保持原 nice 结果不变
- 自动量程余量改取「数据极差 10%」与「幅值 5%」较大者：内存 580±6 这类平直
  指标在零基线轴上不再顶满绘图区上缘；显式 `min`/`max` 不受影响
- 横向条形图左留白按最宽分类名自适应（同一 40–140 契约）——「线下门店」这类
  分类标签不再被截成「线下…」；显式 `padding.left` 优先
- 新增 `yAxis.width` / `yAxisRight.width`：显式定轴槽宽（px），列表/批量小图场景
  多图传同一值即统一绘图区起点，不再随各图刻度标签宽度漂移

### @wil-works/evoke-charts — tooltip 允许浮出矮容器

- 图表容器不再裁剪溢出（圆角下沉到 canvas 与浮层自身）：容器高度装不下
  tooltip 时（监控长条等 64px 小图）按视口剩余空间选上/下侧溢出显示，
  时间戳 / 大数值不再被截断；常规尺寸图表行为不变

## [0.4.0] — 2026-09-12

### @wil-works/evoke-charts@0.2.0 — 渲染设计升级与配色方案

> 本版含多项**默认值与行为变化**，升级前请核对：
> 1. `showSymbol` 语义反转——数据点圆点默认不绘制，需要圆点显式传 `showSymbol: true`；
> 2. 系列色不再读取 `--ev-color-success / -warning / -danger / -info` 语义色令牌——
>    经语义色改图表配色的宿主请改用 `--ev-color-series-1..8` 槽位（或 `applySeriesPalette`）；
> 3. 轴类图表默认右留白 40 → 24、标题改为左对齐——对像素级布局有依赖的页面请复查。

- 新增 `applySeriesPalette(palette)` / `clearSeriesPalette()`：把一套数据色板写入
  `--ev-color-series-1..8` 并派发 `ev-theme-change`（全图重绘）；`palette` 支持数组
  （明暗共用）或 `{ light, dark }`（随暗色自动换挡）——宿主接入图表配色无需各自
  实现令牌写入与事件广播
- 数据系列色板与状态语义色解耦：系列色改读专用令牌 `--ev-color-series-1..8`
  （逐槽回落成套数据色板，品牌蓝锚定、取材 AntV 经典系；暗色板同色相提亮）；
  槽 1 回读 `--ev-color-primary`，品牌换肤跟随不变
- 新增 `options.padding`（数字或 { top, right, bottom, left }）覆写绘图区静态留白，
  标题 / 图例 / dataZoom / 轴标题等 chrome 空间照常叠加；`xAxis.show: false` 时
  底部 46px 轴位预留自动收窄为 12px，隐藏轴的批量小图绘图区不再被压扁
- 左留白按 y 刻度标签实测宽度自适应（夹在 40–140，替代固定 65）——大数量级
  零截断，小量级不再浪费绘图宽度；尊重 `padding.left` 与 `yAxis.min/max`
- 新增平滑曲线：`series.smooth` / `options.smooth` 单调三次插值（Fritsch–Carlson
  限幅），曲线过每个数据点且无过冲；SVG 导出同步支持
- 折线渲染设计升级（对齐云控制台观感）：数据点圆点默认不绘制（悬浮点仍以空心圆环
  标注，十字准线与 tooltip 不变）、默认线宽 2 → 1.5、标题左对齐 13px/600、
  图例改细圆角短横条、y 轴刻度新增「标签 + 短横」对位标记、dataZoom 滑块精修
  （遮罩裁剪圆角轨道 + 面板底手柄）
- 错误态字符图标替换为内联 SVG 警示圆环

### @wil-works/evoke-business-ui@0.4.0 — 图表配色与双注册名

- 主题工具新增 `setSeriesPalette(colors)` / `clearSeriesPalette()` / `getSeriesPalette()`：
  写入或清除 `--ev-color-series-1..8` 并派发 `ev-theme-change`（图表即时重绘）；
  `resetTheme` 一并清除系列槽位；持久化沿用 `eb-theme-config` 存档通道
- `EbConfigProvider` 新增 `series` prop（≤8 色数组），支持 `persistTheme` 持久化联动
- 模板同时支持 `<ev-chart>` / `<eb-chart>` 组件名（同一图表引擎）

### @wil-works/evoke-ui@0.4.0 — 主题配置支持图表系列色板

- `useThemeConfig` / `ConfigProvider` 新增 `series`（≤8 色数组）：
  `resolveThemeVars` 写入 `--ev-color-series-1..8`，`setSeries()` 应用或清除，
  配合 evoke-charts 的数据色板解耦，主题工具可整体切换图表配色

## [0.3.2] — 2026-09-11

### @wil-works/evoke-business-ui — Tooltip 箭头纯三角化与暗色可读性修复

- **修复箭头显示为菱形残角**：原「旋转方块 + overflow 裁剪」结构对亚像素渲染敏感，
  部分环境下整颗菱形露出、不呈纯三角；改为 `::before` 填充 + `::after` 描边双层
  border 三角，随方向贴浮层边缘、不依赖任何裁剪
- 箭头配色走新增的 `--eb-arrow-color` / `--eb-arrow-edge` 令牌（默认值落浮层根，
  主题可覆盖）：深色主题描边与填充同色，浅色主题保留 1px 斜边描边
- **修复暗色模式白底白字**：is-dark 气泡底色原跟随 `--eb-text-color-primary`，
  暗色下该令牌翻转为浅色导致不可读；暗色下改用浮层抬升面 `--eb-bg-color-overlay`，
  箭头随底色

### @wil-works/evoke-business-ui — 容器组件新增 blur 磨砂强度 prop

- **组件级磨砂模糊半径**：card / dialog / drawer / section-card 新增 `blur`
  （number | string，px），内联覆盖 `--eb-glass-blur` 令牌实现单组件独立调节，
  缺省不产出内联样式、跟随令牌（14px）；仅磨砂生效时应用
- dialog 内联模式（appendToBody=false）补齐 glass 类绑定，与 Teleport 分支行为一致

### @wil-works/evoke-business-ui — Card 交互反馈降噪

- **悬浮边框不再用强调色，仅轻微加深**：hoverable 卡片悬浮时边框由
  `--eb-color-primary-light-5`（主色浅阶）改为 `--eb-border-color-dark`
  （中性色深一档，明暗主题自动适配），避免与可点击强调语义混淆
- **默认悬浮移除位移动效**：不再上移、移除按压缩放，悬浮反馈仅剩
  边框微深 + 投影；组件不再自带 transform，需要浮起/缩放等效果时
  由使用方自行叠加自定义样式实现

## [0.3.1] — 2026-09-11

### @wil-works/evoke-business-ui@0.3.1 — README 同步 eb-* 命名

- 随 0.3.0 发布的 README 未同步更名，仍沿用旧命名：`EvMessage` / `EvNotify` /
  `EvMsgbox` 命令式 API 示例、`<ev-button>` / `<ev-input>` / `<ev-data-table>` /
  `<ev-icon>` 模板示例、`--ev-color-primary` 换肤示例全部更正为
  `Eb*` / `eb-*` / `--eb-*`
- 新增「图表」使用段：`EbChart` 随库注册无需单独安装、需引入
  `@wil-works/evoke-charts/styles`、主题/暗色/运行时换肤自动跟随
- 仅文档修正，代码无变化

## [0.3.0] — 2026-09-11

### @wil-works/evoke-business-ui@0.3.0 — 全线更名 eb-* 与图表能力独立（破坏性）

- **组件名整体切换 `Ev*` → `Eb*`**（如 `EvButton` → `EbButton`，模板标签
  `<ev-button>` → `<eb-button>`），类名 `ev-*` → `eb-*`，令牌 `--ev-*` → `--eb-*`，
  主题事件 `ev-theme-change` → `eb-theme-change`，持久化键 `ev-theme-config` →
  `eb-theme-config`，密度/磨砂属性 `data-ev-*` → `data-eb-*`，
  locale 键路径 `zhCN.ev.*` → `zhCN.eb.*`，`EV_THEME_PRESETS` → `EB_THEME_PRESETS`；
  compat-check 改为校验 Eb 注册表纯度 + EbChart 别名。
  升级方式：组件名与标签、类名、令牌前缀同步替换
- **图表改为依赖独立包**：以 npm 依赖引入 `@wil-works/evoke-charts`，
  对外以 `EbChart`（`<eb-chart>`）提供，样式仍从 `@wil-works/evoke-charts/styles` 引入；
  样式包内置 `--ev-*` ← `--eb-*` 映射适配层，换肤时同步派发 `ev-theme-change`，
  两库同用时图表自动跟随业务主题、暗色与运行时换肤；business-ui 不再自带图表实现
- **输入涟漪升级为实体色层**：`focus-ripple.css` 由「双圈细环 scale 扩散」改为与
  evoke-ui 同款的实体涟漪——与输入体同形状的实体色层（z-index: -1 衬底）自框体
  向外扩展约 4px 后消散（0.7s 单次，圆角随扩散同步放大且跟随输入圆角令牌
  `--eb-input-border-radius` 适配定制圆角，避免直角与圆角偏差），
  错误态跟随 danger 色（`--eb-field-ring-color` 可覆盖）；
  覆盖 eb-input__wrapper 家族与 eb-select__wrapper，`data-eb-ripple='off'` 开关不变
- **主题切换移至顶栏**：明暗切换由侧边栏底部的开关改为顶栏右侧的图标按钮
  （`isDark` / `@toggle` 接口不变；`#theme-toggle` 插槽仍可整体覆盖，渲染位置跟随到顶栏）。
  同时消除侧栏收起/展开时 footer 高度瞬跳造成的抖动，折叠按钮「收起」文字改为随宽度过渡淡入淡出；
  侧栏菜单激活态去掉左侧竖条指示器，仅保留激活背景色 + 文字变色
  （`--eb-sidebar-indicator` 令牌随之移除）；侧栏 LOGO 区与菜单之间增加默认 12px 间距
- **明暗切换过渡动效**：`useDarkMode` 的 `toggleDark` 优先走 View Transitions 整页交叉淡入淡出
  （浅→深 / 深→浅柔和过渡），不支持的浏览器与 `prefers-reduced-motion` 用户自动退化为直接切换
- **EbMenu 折叠/展开动效与滚动条修复**：`collapse` 模式下菜单文字随容器宽度淡出收拢/淡入展开
  （时长与侧栏宽度过渡同步 0.45s，负 margin 抵消 gap 保证图标居中），修复此前折叠后文字被
  侧栏裁切露出的破相；菜单项 padding 参与过渡；折叠宽度补 `max-width: 100%`，
  消除宿主容器略窄时的 1px 横向溢出导致的自绘横向滚动条；
  侧栏折叠按钮补 `white-space: nowrap`，消除展开初期文字折行引起的 footer 高度抖动
- **铁律检查扩面**：`check-token-rule` 扫描范围从仅 `src/` 扩至 `src/ + test/`
  （business-ui 另含 `examples/` 示例工程）；类名正则收紧，
  修复 `el-col`/`el-row` 等单词类名因缺少尾随连字符而漏检的盲区
- **business 文档站**：全站演示改为 `eb-*`；`/chart/` 分区以 `ev-chart`
  演示 charts 独立包并注明 business 集成方式

### @wil-works/evoke-ui@0.3.0 — 全线更名 ev-* 与官网新组件（破坏性）

- **组件名整体切换 `Ew*` → `Ev*`**（如 `EwButton` → `EvButton`），
  类名/令牌 `ew-*` / `--ew-*` → `ev-*` / `--ev-*`，磨砂属性 `data-ew-glass` → `data-ev-glass`，
  暗色持久化键 `ew-theme` → `ev-theme`；从此与 evoke-charts 共享 `--ev-*` 令牌面，
  图表在其站点内自动跟随主题。docs-web 全站与测试/脚本同步完成前缀切换。
  升级方式：`Ew*` 组件名改为 `Ev*`，令牌与类名前缀同步替换
- **聚焦动效改为实体涟漪**：input / textarea / select / search-box 聚焦（select 含展开下拉）时，
  原双重 1px 波纹环（连续两次扩散，视觉上像细线闪烁）替换为单次实体涟漪——一块与输入体同形状的
  实体色层（`z-index: -1` 衬底）自框体向外扩展约 4px 后消散（0.5s，先扩展后消散，非环线非光晕）；
  同时移除常驻焦点环（input / textarea 聚焦环与错误聚焦环、select 展开环），
  聚焦态只保留主色 1px 边框，search-box 保留其原有浮起阴影；
  错误态色层自动跟随 danger 色（`--ev-field-ring-color` 令牌可覆盖）；
  `data-ev-ripple='off'` 全局开关与 `prefers-reduced-motion` 自动停用行为不变；
  顺手修复 select 展开态动效此前不受 `data-ev-ripple` 开关控制的问题
- **EvWaterfall 瀑布流**：新增 `EvWaterfall`，多列瀑布流布局，条目按「最短列优先」分发，
  列高随内容比例自动均衡（`columns` / `gap` / `radius` 可调）
  - items 支持 url 字符串或 `{ src, alt, caption, ratio, width, height }`；
    未声明比例时按 4:3 占位、图片加载后按真实比例重新归位；
    声明 `ratio`（高/宽）或 `width/height` 则首屏即按真实比例排布
  - 默认图片卡：底部 `caption` 渐变蒙层、hover 缩放，点击打开 EvImagePreview 灯箱
    （`preview` 可关，关闭后仅派发 select 事件）
  - `#item` 作用插槽（参数 `{ item, index }`）完全接管单元格，
    可承载任意高度不一的内容实现内容瀑布流
- **文档**：新增 Waterfall 组件页（基础用法 / 列数与间距 / 蒙层与声明比例 / 自定义内容瀑布流）；
  组件总览补齐此前漏列的 Article / ExecCard / ImageWall / ImagePreview / Modal / BorderBeam，
  首页搜索补齐对应条目；组件总数口径统一为 57（首页 49、总览 48 为旧口径）
- **EvCodeBlock 语法高亮 / Markdown 组件**：
  - **弹层滚动锁定防抖动**：新增共享 `useScrollLock`（引用计数，支持多弹层叠加），
    锁定期间按滚动条宽度为 body 补偿 `padding-right`，
    消除「滚动条消失 → 视口变宽 → 内容回流」的抖动；Modal / ImagePreview / ActionSheet 统一接入
  - **BorderBeam 静态描边**：`EvBorderBeam` 自带 1px 细描边（box-shadow 实现，
    `--ev-border-color-light`，圆角自动跟随），流光未扫过时卡片仍有边界
  - **Markdown 组件**：新增 `EvMarkdown`（渲染）与 `EvMarkdownEditor`（编辑器）
    - 解析器零依赖内置（markdown.js）：标题/段落/有序·无序列表（缩进嵌套）/引用/
      分隔线/GFM 表格（含对齐）/围栏代码块 + 行内格式（加粗/斜体/删除线/行内代码/链接/图片）；
      代码围栏复用 EvCodeBlock 高亮分词器（js/json/shell，auto 识别）
    - 安全模型：原文全量 HTML 转义后渲染，链接/图片地址仅放行安全协议，
      阻断 `javascript:` 注入，v-html 安全
    - 编辑器：工具栏快捷排版（Ctrl/⌘+B / I 快捷键）、`split` 双栏实时预览与
      `toggle` 编辑/预览切换、v-model、placeholder/height/disabled；
      编辑区聚焦不做主色光环（屏蔽全局 ：focus-visible 焦点环），由面板边框加深一档承担反馈
    - 核心图标集新增 8 个工具栏图标（bold/italic/strikethrough/heading/
      list-unordered/list-ordered/code/markdown，72 个）
  - **内置语法高亮**：新增零依赖轻量分词器，覆盖 shell / js / json 三种语言
    （`language` 属性，默认 `auto` 按内容特征识别）；代码区按语义令牌渲染 token 配色，
    明暗主题自动跟随；原文全量转义后渲染，v-html 安全；默认插槽仍可整体覆写；
    代码块支持多行内容（提示符与代码行高对齐）；
    窗口控制点增加悬浮/按压反馈（悬停组显现 ×/−/+ 符号、单点缩放提亮）
  - **文档措辞**：macOS 窗框的「红绿灯」口语化表述统一改为「窗口控制点」；
    gauge 文档的「红绿灯」语义改为「状态灯（绿/黄/红）」

### @wil-works/evoke-charts@0.1.0 — 新增：图表能力独立包（已先行发布）

- **新包 `@wil-works/evoke-charts`**：Canvas 自绘图表引擎自 evoke-business-ui 整体迁出，
  以独立 npm 包发布（零运行时依赖、仅 peer Vue 3）。
  20+ 图表类型、交互（tooltip / 图例点选 / dataZoom / 框选 / connect 联动）、
  PNG / 真 SVG 导出与无障碍能力原样保留
- **组件命名 `EvChart`**：模板标签 `<ev-chart>`，类名 `ev-chart__*`；令牌读取面 `--ev-*`
  （系列色 / 表面 / 文字 / 边线 / 填充共 21 枚，任一缺失即整组回落内置色板），
  运行时换肤事件监听 `ev-theme-change`；`ev` 命名空间与 evoke-ui 共属基础生态，
  暗色跟随约定为 `html.dark` 下重映射令牌
- **主题适配层（business-ui 侧）**：evoke-business-ui 依赖本包并以 `EbChart`
  （模板 `<eb-chart>`）提供同一组件，其样式包内置 `--eb-*` → `--ev-*` 映射、
  换肤时同步派发 `ev-theme-change`，两库同用时图表自动跟随其主题、暗色与运行时换肤；
  单用图表库时按 README 声明 `--ev-*` 即可接入任意主题
- **工程**：新包自带 check-token-rule 铁律（禁第三方与跨库命名空间回流 + `--ev-*` 令牌
  完整性），挂入 build；CI 构建矩阵与 publish 工作流新增 charts；根脚本新增 `build:charts`

### @wil-works/evoke-charts@0.1.1 — README 去开发视角

- README 移除面向开发过程的说明（monorepo 管理声明、开发命令、仓库相对链接），
  内容改为纯使用视角；随本 Release 首次经 CI 发布

## [0.2.0] — 2026-09-11

### @wil-works/evoke-business-ui@0.2.0 — 企业级能力补全与主题动态配置

### Breaking

- **EvList 移除（废弃）**：对标 ant-design v6 以虚拟列表替代通用 List。`<ev-list>` 不再注册，
  迁移到 `EvVirtualList` / 别名 `EvListy`（`@load-more` → `@scroll-bottom`，骨架/空态改用
  EvSkeleton / EvEmpty 组合）；文档站保留 [废弃迁移页](docs/components/list.md)
- **令牌命名空间**：历史第三方命名空间令牌全量迁移为 `--ev-*`（含组件级变量）。若消费方直接覆盖过旧令牌，需按新名覆盖。
- **locale 键**：语言包内部命名空间 `el:` → `ev:`（使用 ConfigProvider 自定义语言包的业务方需同步）。
- **图标 API**：`getIconNames()` 移除第三方历史库别名。
- `vite build` 前新增 `check-token-rule` 铁律检查（禁止第三方组件库命名/依赖）。

### Added — 组件

- `EvVirtualList`：虚拟滚动基元（固定行高 / 动态实测、scrollTo、scroll-bottom、range-change）；
  同时以 `EvListy` 别名注册（`<ev-listy>` 等价 `<ev-virtual-list>`），承接 List 废弃后的迁移
- `EvStatistic`：统计数值（千分位/精度、前后缀与插槽、formatter、loading 占位、flip 数值翻动）
- `EvList`：业务列表（虚拟滚动、骨架、空态、无限加载）
- `EvAutoComplete`：输入联想（静态/异步数据源、防抖、过期丢弃、键盘导航）
- `EvTour`：新手引导（聚光遮罩、避让定位、键盘步进）
- `EvQrcode`：二维码（纯 JS 编码器 byte/M/v1-10 + Canvas 高清渲染，零依赖；命名注意：kebab-case 解析要求单大写段，避免连续大写如 `QR`）
- `EvMention`：@提及输入
- `EvFloatButton` / `EvFloatButtonGroup`：悬浮按钮与按钮组
- `EvComment`：评论（嵌套回复）
- `EvAuth`：权限容器

### Added — 工具类（Utils）

- **图标扩充 182 → 433**（`pnpm gen:icons` 重新生成静态数据）：新增品牌 Logo
  （wechat / wechat-pay ±fill、alipay、mini-program、qq、dingding、weibo、zhihu、bilibili、
  douyin、taobao、github、gitee、gitlab、google、apple、android、windows、chrome、visa、
  mastercard、paypal、vue/react/nodejs/java、openai、deepseek 等）、商务（图表/日历事件/公文包/
  徽章/客服/回复/名片）、财务（银行卡/人民币/安全支付/红包/优惠券/退款/保险箱/购物车）、
  开发、设备、媒体、文档、地图出行、用户组织、健康等常用类目；同时补齐薄弱分类
  （设计/编辑/天气/食饮/游戏运动/健康医疗等各 6-17 个，全部类目 ≥6）
- **文档站新增独立「图标总览」页**（/components/icon-gallery，侧栏「通用」分类）：
  全部内置图标按类目分组展示、搜索、点击复制、一键加载 Remix 全量 3229 个；
  页内含 Remix Icon 官网外链（remixicon.com）；IconGallery 组件补全 20 个类目的中文标签

- `formatNumber` / `formatFileSize` / `formatDate` / `formatRelativeTime` / `formatDuration` / `formatPercent`：
  B 端格式化工具，与组件零耦合、非法输入不抛错，从包根导出
- 文档站新增底部「工具」分类：工具总览 / 格式化 / 主题与颜色 / 组合式函数四个页面
- 文档站补齐已有组件的文档页：ConfigProvider（全局配置，通用分类）、Spin（加载中，反馈分类）、
  Mention（输入提及，数据录入分类）、BorderBeam（边框流光，能力增强分类）、Statistic（数据展示分类）

### Added — B 端生态

- `usePermission` / `setPermissions`：权限判定（精确/通配/任一/全部/自定义）
- `v-permission`：权限指令（remove / disable，热更新）
- `useTable`：列表页数据流 hook（分页/筛选/竞态保护）
- `v-copy` / `useClipboard`：复制（Clipboard API + execCommand 兜底）
- `v-infinite-scroll`：无限滚动指令
- `useFullscreen`：全屏

### Added — 主题能力

- `setPrimaryColor(hex)`：运行时换主色，7 档梯度 + rgb 三元组自动派生，图表自动重绘
- `setDensity(mode)` / `getDensity()`：密度三档切换（compact / default / loose）
- `ConfigProvider` 新增 `theme-color` / `density` / `permissions`
- 扩展分类色令牌：`--ev-color-ext-{cyan,teal,violet,magenta,indigo,lime,amber,slate}`（含 `-light` 派生）
- 图表色板/主题色实时读取 CSS 令牌，明暗与换肤自动跟随
- 表格/统计数字启用 `tabular-nums`
- `setSemanticColors(map)`：语义色（success / warning / danger / info）运行时部分更新，梯度规则同主色
- `resetTheme()` / `getPrimaryColor()`：移除注入令牌回到样式表默认 / 查询当前运行时主色
- `saveThemeConfig` / `loadThemeConfig` / `clearThemeConfig`：主题持久化（localStorage `ev-theme-config`）
- `EV_THEME_PRESETS`：常用预设色板，可直接生成换色选项
- **暗色感知梯度**：运行时注入的主色/语义色在 `html.dark` 下自动反向派生（light 档向深底混合，
  与暗色手调梯度同向），明暗切换跟随重注入，不再发灰发亮
- `ConfigProvider` 新增 `semantic`（语义色）与 `persist-theme`（持久化，存档优先于声明式配置）
- 文档站新增「主题定制器」页（/guide/customizer）：主色 / 语义色 / 密度 / 磨砂实时预览并生成等效配置

### Added — 动效与体验

- 输入/选择类组件聚焦边框波纹：`ev-input__wrapper` 家族与 `ev-select__wrapper` 聚焦时边框
  向外扩散两圈涟漪；`data-ev-ripple='off'` 全局关闭，prefers-reduced-motion 自动停用
- `ConfigProvider` 新增 `glass` / 组件级三态 prop：容器类组件磨砂玻璃质感（HTML data-attr 全局开关）

### Added — 排版与导航（对标 ant-design v6 盘点后补齐）

- `EvTitle` / `EvParagraph`：Typography 排版家族，5 级标题刻度、多行省略、copyable
- `EvText` 增强：`ellipsis`（多行）、`copyable`、行内语义标记（mark / code / underline / delete / strong）
- `EvAnchor` / `EvAnchorLink`：锚点导航（scrollspy 高亮、平滑滚动、滑动轴线、容器模式）
- `EvFloatButtonGroup` 重做：`direction` 展开方向、`position-type`（fixed / absolute）、
  点击外部 / Esc 收起、展开动画与主按钮图标旋转
- 文档站：侧栏分类重排（通用/布局等基类在上，能力增强/业务组件沉底）；
  新增 17 个组件文档页（Transfer / Affix / Calendar / Backtop / Carousel / Segmented /
  Tooltip / Popover / Popconfirm / Image / Result / Watermark / Cascader / Tree 等）
- 动效令牌补齐 `--ev-ease-in`

### Fixed

- **EvSelect 根节点不透传 class/style**：`inheritAttrs:false` 后根 div 未绑定 `$attrs`，
  消费方传的宽度类（如 `w-full`、`class="tsel"`）静默丢失；已在根节点补 `v-bind="$attrs"`
  （class/style 由 Vue 自动合并，语义同前）
- **EvSelect filterable 选中态文本双写**：选中后未聚焦时，选中项 span 与 filter input 的
  placeholder 镜像同一 label，视觉左右重复；input 不再镜像 label，改为聚焦输入时
  `v-show` 隐藏选中项 span（typing 态无重叠）
- **EvInput/EvTextarea 根节点丢 class**：attrs 分流注释声称「class/style 留在根节点」，
  实际只绑了 `:style="attrs.style"`，class 被 `inheritAttrs:false` 静默丢弃
  （消费方的 `w-full`/定制宽度类全部失效）；两个分支（input/textarea）补
  `attrs.class` 绑定
- **Tooltip 深色主题箭头出现菱形/白角**：popper 箭头重构为「8×8 裁剪窗口 + ::before 形体」后，
  Tooltip 的箭头配色仍写在窗口元素上（窗口自身不被裁剪，深色方块露出）；已将深/浅两套配色
  全部迁移到 `::before` 伪元素，组件库内其余覆写排查无同类问题
- **VirtualList 字符串高度导致虚拟化失效**：`height="160"` 这类纯数字字符串未带单位，容器高度
  声明无效被内容撑开（clientHeight=40 万 px），窗口计算认为全部可见、上万条目全量渲染；
  现对纯数字字符串自动补 `px`
- **Popover/Popconfirm/Tooltip 箭头定位失效**：`EvPopper` 未把自身 `arrowRef` 传入 `useFloating`，
  箭头中间件从未注册，箭头停留在文档流默认位置；已支持外部传入 arrow ref 并在每次重算时
  解包真实元素，箭头正确锚定触发元素（floating-ui arrow middleware）
- **Segmented 无法在无 v-model 时切换**：原为纯受控实现，未绑定 v-model 时点击只 emit 不更新；
  已增加非受控内态（传入 v-model 则完全受控，行为不变）
- **Cascader 触发框内出现空壳输入框**：非搜索（readonly）/未聚焦时 query input 仍占 `flex: 1`，
  视觉上像多出一个输入框；已默认折叠为零宽，仅 filterable 聚焦搜索时展开
- **Carousel 文档示例无效**：示例误用裸 div 而非 `ev-carousel-item`，子项无法注册导致不轮播；
  已修正并补齐指示器位置 / 手动控制 / 垂直方向等场景
- `EvPopconfirm` 新增 `confirm-button-type`（危险操作红色确认按钮）
- 文档充实：Carousel / Segmented / Popover / Popconfirm / Tooltip / Image / Cascader 每页
  扩充至 3-5 个场景（含 12 方位、预览、多选、块级铺满等）

- **气泡箭头重构为窗口式裁剪**：原旋转方块 + `z-index: -1` 的实现会把整颗菱形压在浮层
  边框上（负 z-index 只能藏到内容后、藏不到父级背景后）；现改为外层 8×8 `overflow: hidden`
  裁剪窗口 + 按方向注入 `data-popper-side`，仅露出朝外的半角三角形（antd 同款视觉），
  静态侧偏移由 -4px 调整为 -8px
- **Timeline 倒序竖线断裂**：`reverse` 用 `column-reverse` 反转后，视觉末节点实为 DOM 首节点，
  「末节点短尾线」规则错套在视觉首节点上导致竖线断开；已按视觉位置对调首/末尾线规则
- **InputNumber 重构为 antd 风格三段式统一容器**：`[-│输入│+]` 共用一个圆角描边，
  按钮不再各自带底色圆角，中缝 1px 分隔线；修复此前按钮置于 wrapper 内部盖住描边
  导致左右边框消失的问题（模板/样式已对齐为 flex 兄弟节点结构）；
  `controls-position="right"` 保持右侧上下两格布局；hover 边框加深、focus 主色
- **文档演示规范**：清除全部 emoji 图标（改用图标系统 sun-line / moon-line / check-line）；
  demo 控制/操作按钮统一默认尺寸（16 处，不再与旁边正常尺寸组件失调）；
  修复 useFullscreen 演示进入全屏后黑屏（全屏元素补背景色与居中样式）
- `EvAutoComplete` 下拉面板补齐边框与阴影（此前仅圆角底色，悬浮层级感不足）
- `EvList` 列表项悬停背景由 `--ev-fill-color-light` 提升为 `--ev-fill-color`（原悬停效果几乎不可见），并补 `cursor: pointer`
- 铁律脚本新增**令牌引用完整性检查**：`var(--ev-*)` 不带 fallback 时必须存在库内定义，杜绝「变量未定义导致 border/box-shadow 声明整体失效」一类样式静默丢失
- **`ev-theme-change` 事件不冒泡**：事件派发在 documentElement 而图表监听在 document，
  运行时换主色后图表换肤重绘实际收不到通知；已改为冒泡派发（两处监听均可收到）
- **EvCascader filterable 占位双写**：输入关键字时占位文案与关键字并排显示；有关键字时
  占位/已选文案让位给过滤输入框，清空后恢复

### Added — 国际化 / 工程

- locale 新增 `ja`（日语）、`zh-TW`（繁体中文）
- `tsconfig.json` 脚手架 + TS 试点模块 `utils/color.ts`
- 新增测试 60+ 用例（总计 680+ 全绿）

### @wil-works/evoke-ui@0.2.0 — 官网组件与体验增强

#### Added — 组件

- `EwBorderBeam`：边框流光（conic 光带沿边框循环，宽度/速度/方向/双色可调；@property 插值，不支持的浏览器退化静态环）
- `EwExecCard`：高管/团队介绍卡（透明 PNG 半身图锚定舞台底边，内置人物剪影占位，展示体标题排版）
- `EwArticle`：文章内容（眉题/标题/摘要/元信息页头 + 正文插槽自带阅读排版，作用域收敛）
- `EwImageWall` / `EwImagePreview`：图片墙与灯箱预览（键盘 ← → 切换、Esc、滚动锁定、计数）
- `EwModal`：弹出层（Esc / 遮罩 / 滚动锁定 / 焦点归还，open / opened / close / closed 完整事件）

#### Added — 能力

- `EwSearchBox` 远程搜索：`remote` 异步接口 + 防抖（默认 300ms）+ select 下拉形态结果 +
  ↑↓ / Enter / Esc 键盘导航 + `select` 事件回填
- `EwCarousel` 新增 `variant`：`image` 纯图片 / `banner` 图片+渐变遮罩文字注释（`aspect` 控画幅）
- 输入/选择类组件聚焦边框波纹（input / textarea / select / search-box；`data-ew-ripple='off'`
  全局关闭，prefers-reduced-motion 自动停用）
- `EwNavbar` / `EwButton` 链接形态支持 `rel` 透传

#### Changed

- Cta / 首页动作按钮形状统一（此前 pill 与方角混排）
- 首页跑马灯文案调整（为官网而生 / 开箱即用 / 即插即用…）
- 首页「下载」按钮挂接 npm 包页（此前无链接，点击无效）

#### 文档与案例

- 新增 6 个组件文档页与侧栏入口；输入组件文档补波纹说明
- 企业官网案例：核心团队板块（ExecCard）、流光定价卡（BorderBeam）、预约演示弹层（Modal + 表单）
- 个人博客案例：本期长文阅读区（EwArticle）
- 案例品牌定名：积云数合 / cumubase（企业官网品牌、云笔记更名 cumubase 笔记、假域名同步更换）
- 双站导航互链：business 顶栏新增 Evoke UI 外链，evoke 首页下载按钮挂接 npm
