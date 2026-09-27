# 风格体系 · 中性工具壳

**气质锚：一间安静的仪器房。** chrome 近无色，工具退到背景里，内容与状态是唯一的主角。
仲裁规则：两个方案打架时，选**更安静、更少彩色、更少 chrome** 的那个。

三条纪律贯穿全部组件，令牌与门禁都围着它们转：

1. **chrome 近无色**——标题栏 / tab 条 / 工具区 / 状态栏只用中性灰阶；彩色只给**状态**与**内容**。
2. **描边优先于阴影**——chrome 内部一律 1px 分隔线；阴影只留给浮层（临时 UI）。
3. **聚焦不靠品牌色**——焦点环用高对比中性色，在任意底色上都看得见。

## 色彩：chrome 侧近无色

| 用途 | 令牌 | 取值来源 |
| --- | --- | --- |
| chrome 底（标题栏 / tab 条 / 工具区） | `--et-chrome-bg` | `--eb-bg-color` |
| 次级横带底（辅助栏 / 公式栏位） | `--et-chrome-band-bg` | `--eb-bg-color-page` |
| chrome 内分隔线 | `--et-chrome-separator` | `--eb-border-color-light` |
| 组标题文字 | `--et-chrome-group-label-color` | `--eb-text-color-secondary` |
| 工具钮文字 / 图标 | `--et-toolbtn-fg` | `--eb-text-color-regular` |

**规则**：chrome 内同屏**彩色种类 ≤ 3**（主色 + 危险 + 成功/警告之一）；主色只出现在
**选中态的文字/图标**、**主操作按钮**与**焦点之外的必需指示**上。选中态底色走中性
`--et-state-selected-bg`（不是主色浅底）——彩色留给"数据在说话"。

## 状态与焦点

| 状态 | 视觉 |
| --- | --- |
| default | 透明底，次级色文字 / 图标 |
| hover | `--et-state-hover-bg`（浅一档中性底） |
| active（按下） | `--et-state-active-bg`（比 hover 深一档） |
| selected（如「加粗」已生效） | 中性底 + **主色文字/图标**（`--et-state-selected-fg`） |
| disabled | `--et-state-disabled-fg` + 双保险拦截 |
| focus-visible | 2px **中性**环、offset 0（见下） |
| readonly / 受限 | 视觉同 disabled，提示语不同 |

**焦点环规格**（`--et-focus-ring-*`）：宽度 2px、偏移 **0**、只在 `:focus-visible` 出现；
颜色是**高对比中性色**（亮色黑 / 暗色白，`dark.css` 重映射）——主色环落在彩色内容或深底上会看不见。
浮层与画布这类"底色不可控"的位置用**双色环** `--et-focus-ring-dual`（内 1px + 外 1px 中性双色）。
`forced-colors` 模式下改用系统 `Highlight`。

<DemoBlock>
  <p style="margin: 0 0 10px; font-size: 13px; color: var(--eb-text-color-secondary)">
    按 <et-key-hint combo="tab" /> 键走一遍：焦点环紧贴元素外缘、两层中性色，在任何底色上都成立。
  </p>
  <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
    <et-tool-button size="large" icon="bold" label="可聚焦" />
    <et-tool-button size="small" icon="copy" label="小钮" tip="小钮（2px 圆角）" />
    <span style="padding: 6px 12px; border: 1px solid var(--eb-border-color); border-radius: var(--et-radius-md); font-size: 13px;">输入类（4px 圆角）</span>
    <span style="padding: 6px 12px; border: 1px solid var(--eb-border-color-light); border-radius: var(--et-radius-lg); font-size: 13px; background: var(--eb-bg-color-page);">面板 / 浮层（8px）</span>
    <span style="padding: 6px 12px; border: 1px solid var(--eb-border-color-light); border-radius: var(--et-radius-xl); font-size: 13px; box-shadow: var(--et-shadow-dialog);">对话框（12px）</span>
  </div>
</DemoBlock>

## 圆角与阴影阶梯

| 元素 | 圆角 | 描边 / 阴影 |
| --- | --- | --- |
| `<32px` 的元素（小钮、键帽、状态栏条目） | **2** `--et-radius-sm` | 无描边，hover 铺底色 |
| 大钮 / 输入 / 下拉 / 公式栏（≥32px） | **4** `--et-radius-md` | 1px `--eb-border-color` |
| 面板 / 卡片 / 菜单与下拉浮层 | **8** `--et-radius-lg` | 1px 描边；浮层用 `--et-shadow-pop` |
| 对话框 / backstage | **12** `--et-radius-xl` | `--et-shadow-dialog` |

**规则**：同类元素同屏同值；chrome 内**禁自定义阴影**，浮层只用三档固定映射
（`--et-shadow-pop` 命令栏/下拉/ScreenTip · `--et-shadow-callout` callout/侧底面板 ·
`--et-shadow-dialog` 对话框）。描边粗细只用 1px 与 2px。

## 动效三档

| 场景 | 时长 | 曲线 |
| --- | --- | --- |
| hover / 按下 / 边框反馈（**仅颜色**） | `--et-duration-hover` 100ms | `--et-ease-decelerate` |
| 浮层进出（允许 4px 上浮） | `--et-duration-pop` 150ms | 进场 decelerate / 离场 `--et-ease-accelerate` |
| 面板与工具区折叠、backstage 全屏页 | `--et-duration-collapse` 200ms | decelerate |

**规则**：chrome 内部**禁位移与缩放**（面板尺寸变化除外）；`prefers-reduced-motion` 时全部降为 0；
超过 200ms 的动效需要评审。

## 验收清单（可判定）

- [ ] chrome 内彩色种类 ≤ 3，且没有一处用主色当选中**底色**；
- [ ] chrome 内部的边界全是 1px 描边，没有一条自定义阴影；
- [ ] 键盘 Tab 走一遍：每个可聚焦元素的焦点环都看得见（亮底与暗底各试一次）；
- [ ] 圆角只出现 2 / 4 / 8 / 12 四个值；同类元素同屏同值；
- [ ] 三档密度下 chrome 高度进预算（见[设计规范](design.md#chrome-度量与预算)），单行不换行；
- [ ] 关掉动画（`prefers-reduced-motion: reduce`）后功能不受影响。
