# 组合契约（槽位）

组件不是"配置出来的"，是**槽拼出来的**：一个壳件同时开 3–8 个槽，编辑器的内容、面板的
工具位、画布上的浮层各归其位。本页是槽位的**唯一清单**（数据来自包内 `src/slots.js`，
与 SFC 双向核对，漏记或删槽都会让 G10 门变红）。

## 四条规则

1. **槽优先于 prop**：能放进槽的都不做成开关。`EtStatusBar` 的右槽一旦提供，内置缩放位整体让位；
   `EtSheetTabs` 的 `#actions` 一旦提供，内置加号消失。产品不会被内置件挡住。
2. **默认槽 = 内容**：`#default` 永远是"这块区域的内容"，不是装饰。壳件的默认槽就是画布位。
3. **作用域槽给选择依据**：需要按条目渲染的槽（`#panel`、`#tab`）用作用域把数据递出来，
   产品只写"怎么渲染"，不写"有哪些"。
4. **透传不是免登记**：popper 包装件（`EtSelect` / `EtDropdown` / `EtTooltip` / `EtSplitter`）
   原样透传底座全部命名槽，契约里标为"透传底座槽"——槽名与作用域以底座文档为准。

## 现场样板：一个办公装配

下面这 20 行就是"多槽拼装"的最小闭环：底带表页签、公式栏、画布宿主、状态栏各就各位，
画布宿主的浮层位浮在内容之上但不随内容滚动。按 <et-key-hint combo="tab" /> 走一遍能看到
焦点在画布、标签、状态栏之间按视觉顺序移动。

<OfficeBandsDemo />

## 五条常用配方

| 配方 | 拼法 | 要点 |
| --- | --- | --- |
| **整页工作台** | `EtWorkbench`：`#titlebar` + `#documents` + `#toolbar` + `#left/#panel/#right` + `#bottom` + `#statusbar`，默认槽放画布 | 布局树是数据，`EtWorkbench` 是唯一写树处；区域槽顺序即视觉顺序 |
| **办公整页** | `EtWorkbench` 五条带：`#titlebar` + `#documents` + `#toolbar`（功能区 + 公式栏）+ 默认槽 `EtSheetCanvasHost` + `#tabbar`（`EtSheetTabs`）+ `#statusbar` | 带高全走令牌（32 / 26+72 / 26 / 26 / 24）；不需要额外写布局 CSS |
| **只拼横带**（无工作台） | `.et-office-bands`（办公皮肤）：顶带 → 弹性画布位 → 底带 | 独立页面 / 嵌入式面板里用；整页装推荐上面的 Workbench 五条带 |
| **画布 + 浮层编辑器** | `EtSheetCanvasHost` 默认槽放画布，`#overlay` 放编辑器；`scrollTo()` 由产品算目标位置 | 浮层固定于视口；尺寸/滚动事件供虚拟化算可见区 |
| **面板三件套** | `EtDock` `#panel` → `EtPanelGroup`（`#tools`）→ `EtPanel`（默认槽套 `EtScrollArea`） | 面板内容滚动不影响外壳；工具位在标题栏右侧 |
| **命令四处可达** | `EtRibbonBar`（工具区）+ `EtCommandPalette`（⌘K）+ `EtContextMenu`（右键）+ `EtShortcutPanel`（键位表） | 四面共用一张命令表，状态单点（`createCommandRegistry`） |

## 全量清单（按两层）

<SlotContract />

## 边界

- **同屏只留一个画布位**：一个装配里只该有一个弹性区（`EtWorkbench` 默认槽或
  `EtSheetCanvasHost`），两个弹性区会互相挤压出横向溢出。
- **槽里不放第二个壳**：`EtWorkbench` 内不要再套 `EtWorkbench`；嵌套壳会让焦点循环与
  布局持久化打架。
- **浮层归浮层**：需要跟随滚动的定位（单元格编辑器）走 `#overlay` + 产品自己算坐标；
  不跟随的全局浮层（菜单 / 对话框）走组件自身，别塞进画布。