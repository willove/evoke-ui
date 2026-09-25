# Evoke Tools UI — 设计语言白皮书

> `@wil-works/evoke-tools-ui` —— evoke-ui 体系里的**产品级 GUI 框架**（命名空间 `--et-*`）。
> 服务对象：要把界面做成**一个软件**的产品（第一个消费者是 `cumubase-project/office-works` 的表格工具）。
> 计划全文在 `plans/tools-ui/01–07`；本文件是它的设计面结论，与 `src/styles/variables.css`（令牌单一事实源）、
> `docs-tools/guide/design.md`（全量令牌表）三者同源。

## 〇、定调三问（先答再动手）

1. **这个界面像谁？** **安静的 Excel** —— chrome（标题栏 / 工具区 / 状态栏）环绕画布，控件低噪声，
   键盘优先；不是营销页，也不是中后台列表页。
2. **用户 5 秒内要完成的第一件事？** 在工具区找到并点中目标命令：大钮 caption 一眼可读，
   小钮快捷键一查即有（ScreenTip）。
3. **哪些功能第一眼可以不看见？** 藏的清单比露的长：次要命令、高级选项、说明文字、键位明细、
   图标缺失兜底告警、面板折叠态——全部按 tooltip / 折叠 / 溢出菜单下沉，默认态一个都不占视野。

## 一、为什么需要第四个库

三个库都填不上"让一个人长时间在软件里干活"这个洞：

| 维度 | business-ui `--eb-*` | evoke-ui `--ew-*` | **tools-ui `--et-*** |
| --- | --- | --- | --- |
| 界面隐喻 | 页面（列表/表单/详情） | 叙事（首屏/区块/CTA） | **工作台**（文档 + 工具，chrome 环绕内容） |
| 谁占中心 | 数据表格与筛选器 | 内容与品牌 | **文档/画布**（工具退到边缘） |
| 信息节奏 | 一屏一任务，滚动为主 | 上下滚动 | 常驻布局，**零滚动或局部滚动** |
| 密度 | 常规（控件 32px） | 透气 | **三档：24 / 32 / 40** |
| 输入方式 | 鼠标优先 | 鼠标/触屏 | **键盘优先**（快捷键、命令面板、焦点漫游） |
| 状态模型 | 组件内部状态 | 无状态 | **命令驱动**（可用/选中态由选区与焦点推演） |
| 布局能力 | 栅格 + 卡片 | 容器 + 区块 | **可停靠/可折叠/可拖分隔/可全屏** |

business-ui 的 115 个组件里，splitter / command-palette / context-menu / dropdown / menu /
tooltip / popper / scrollbar / virtual-list / dialog / color-picker / segmented / config-provider
**已经就位**——它们解决"浮层/列表/布局基元"。因此 tools-ui 只新建
"business-ui 语境下不存在的东西"（工具区、停靠、外壳件），外加两件组件库给不了的：
**布局运行时**与**数据契约**（命令表 / 菜单 schema / 折叠溢出状态机）。

## 二、灵感来源与实测

| 来源 | 取什么 | 实测结论 |
| --- | --- | --- |
| Fluent UI / WinUI | **密度阶梯** | 控件高 small 24 / medium 32 / large 40（Input/Dropdown 同值，Button padding 推算一致，MenuItem minHeight 32）。本库三档直接映射该阶梯，**不发明自己的档位** |
| Excel / WPS 功能区 | **工具区形态** | tab 条纯文字（无图标）；组标题行一条基线；大钮 = 图标行 + caption；组间 1px 分隔；窄宽收「更多」不换行 |
| Windows Ribbon Framework | **分量降级** | 每个组声明降级终点（IdealSizes + 逐组 Scale → 整组变下拉），任意宽度可渲染 |
| Univer Sheets | **布局数据模型** | 条目布局用 `gridLayout`（row/column/rowSpan/columnSpan/width/showLabel），不用散落的 size prop；命令/菜单接口形状对齐 `ICommand`/`IMenuItem`/`IRibbonService`，状态流用 Vue `Ref`/`computed` 表达 |
| 上一代 office-suite（自家） | **教训清单** | 一个功能区混 5 种按钮形态；组名行 3 个基线（y=153/167/257）；150 个功能区按钮 71 个无图标、2 个渲染成 38×24 纯白方块；93/117 个 e2e 走"展开全部"逃生口 |

## 三、设计语言（五条）

1. **三档密度，令牌切片**。密度是根级属性（`<html data-density>`，EtProvider 写入），
   不是组件 prop。组件只引用令牌（`--et-density-*` / `--et-size-*`），密度切换 = 换一组令牌值，
   **禁止每个组件各写三套分支**（上一代"5 种形态"的根因）。
2. **chrome 预算是可检查的约束**。各带高度与合计预算都是 calc 派生（改分量、预算自动跟随）：
   顶部 156px = 标题栏 32 + tab 条 26 + 工具区 72 + 辅助栏 26；合计 180px；折叠后顶部 84px。
   G7 门把"布局属性禁字面量 px"做成构建期硬检查。
3. **命令驱动**。每个可点控件绑命令 id，`enabled/active` 只有一处实现（推演自选区与焦点），
   "加一个功能 = 加一行数据"，不是改一个 2556 行文件。同一命令在菜单/快捷键/右键/命令面板
   四处可达且状态一致（M1 出口条件）。
4. **键盘优先，组字安全**。焦点漫游 roving tabindex、Enter/Esc 提交路径必过组字守卫
   （G5 门）；快捷键平台符号化（macOS ⌘/⌥/⇧，Windows Ctrl/Alt/Shift）。
5. **图标纪律**。三层命名（Remix 原生名 / 组件语义名 / 领域语义名）跨层引用即违规；
   同容器尺寸档 ≤2；line 风格为默认、fill 仅用于激活/选中；未命中禁渲染空白——
   回落显式兜底图标 + dev warn（G2 门把悬空名做成构建期失败）。

## 四、令牌（`--et-*`，双层架构）

- **语义层**（主题 API 入口，产品可覆盖）：`--et-chrome-*`（各带高度与预算）、
  `--et-density-*`（三档基准）、`--et-focus-*`、`--et-z-*`（层级阶梯）、`--et-state-*`（七态）。
- **设计层**（度量常量）：`--et-size-*`（控件/图标尺寸）、`--et-space-*`（工具界面间距）、
  `--et-radius-*`（比中后台小一档）、`--et-duration-*`、`--et-icon-*`、`--et-menu-*`、
  `--et-panel-*`、`--et-statusbar-*`。

三层令牌契约（上层只准引用下层，禁止反向回流，每层独立门禁）：

```
--eb-*/--ew-*  基础（品牌色、中性色阶、间距、圆角、阴影、字体基线）
      ↓ 被引用
--et-*         工具框架（密度三档、chrome 度量与预算、焦点环、控件尺寸/状态、图标规格）
      ↓ 被引用
--ot-*         办公语义（画布网格/选区/表头/公式栏/单元格状态）  ← office-works
```

`--et-*` **不新增色板**：状态色一律引用 `--eb-*` 语义层；暗色只声明"与亮色不同映射"的少数项
（`src/styles/dark.css`）。`EtThemeBridge`（M3）把主题变化桥接到画布调色板，语义名由产品层提供。

## 五、组件 ↔ 语言映射

| 组件 | 语言条目 | 里程碑 |
| --- | --- | --- |
| `EtProvider` | 密度三档 + 底座配置透传 | M0 |
| `EtToolButton` | 大钮（图标行 + caption）与小钮（图标 + ScreenTip）两种形态，齐次同组 | M0 |
| `EtToolGroup` | 控件行 + 组标题行固定一条基线 + 1px 分隔 | M0 |
| `EtTabStrip` | Excel/WPS 纯文字 tab 条，下划线指示 | M0 |
| `EtScreenTip` | 替代 `title`：名称 + 一行说明 + 快捷键后缀，单例 | M0 |
| `EtKeyHint` / `EtDivider` / `EtToolSpacer` | 键帽文本 / 组分隔 / 弹性占位 | M0 |
| `EtDropdown` / `EtSelect` / `EtTooltip` / `EtSplitter` | business-ui 同名件的密度适配包装 | M0 |
| `EtToolArea`(RibbonBar) / `EtOverflowMenu` | 真折叠 + 溢出折叠 + 上下文 tab + 分量降级 | M1 |
| `EtCommandPalette` / `EtContextMenu` / `EtShortcutPanel` | 命令表驱动的面板/右键/键位表 | M1 |
| `EtWorkbench` / `EtPanel` / `EtDock` / `EtDocumentTabs` | 面板树、停靠、布局持久化 | M2 |
| `EtTitleBar` / `EtStatusBar` / `EtBackstage` / `EtThemeBridge` / `EtDialog` | 产品外壳件与主题桥接 | M3 |

## 六、M0 边界（本版交付）

令牌（三档密度 + chrome 预算）+ G1/G2/G4/G5/G7 五道门 + 图标解析兜底与领域别名 API +
12 个 L1 原子件 + 键位表/焦点漫游基座 + 本白皮书与文档站设计规范页。
M1 起才交付命令/菜单/折叠溢出（L2 工具区框架）——**门禁前置，先有 G1/G7 再写第一个组件**。

## 七、工程约定（与底座同构）

- 命名：组件前缀 `Et`，class `et-*`，令牌 `--et-*`；纯 JS + JSDoc（TD-2），契约用
  `@typedef` 表达，`vue-tsc` 产出 `.d.ts` 供 TS strict 消费方对接。
- 目录：`src/components/<name>/index.vue + style.css`；`src/runtime/`（L0 契约，与组件分家——
  产品外壳能力不是组件，混进 components 就是"每个形态各写一份状态机"的起点）；
  `src/icons/`（解析兜底 + 领域别名）；`src/composables/`。
- 构建：Vite lib 多入口（主入口 + runtime/icons 契约入口 + 每组件子路径），
  样式聚合 `dist/evoke-tools-ui.css`；构建前置跑五道门。
- 依赖：白名单制——peer 只有 `vue` + `@wil-works/evoke-business-ui`，零第三方 UI 库；
  底座按 peer 解析，保证消费方单实例（ConfigProvider 的 inject key 是模块级 Symbol）。
- 复用检验（M2 出口）：用 tools-ui 搭一个**非办公**工具界面；需要为它改办公逻辑 = 分层失败，打回。
