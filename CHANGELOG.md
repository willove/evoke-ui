# Changelog

本库遵循 [Semantic Versioning](https://semver.org/)。

## [Unreleased]

### @wil-works/evoke-business-ui — Card 交互边框去强调色

- **悬浮/按压边框不再用强调色**：hoverable 卡片悬浮（hover）时边框由
  `--eb-color-primary-light-5`（主色浅阶）改为中性加深一档的
  `--eb-border-color-hover`（明暗主题自动适配）；按压（active）态同步补上
  同款边框加深，与浮起、投影共同构成层次反馈，色彩语义不再与可点击强调混淆

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
