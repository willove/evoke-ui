# EtTitleBar · 标题栏

产品外壳标题栏：产品名 / 快捷访问位 / 文档名 / 窗口控制位（双宿主适配）。

```vue
<et-title-bar
  title="我的工具"
  doc-title="报表.xlsx"
  :host="hostMode"
  @window-control="onWinCtl"
>
  <template #quick>
    <et-key-hint combo="mod+s" />
  </template>
</et-title-bar>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | String | `''` | 产品名（`brand` 槽未提供时渲染） |
| `docTitle` | String | `''` | 文档名（`center` 槽未提供时渲染；空串不渲染文档名位） |
| `host` | String | `'auto'` | `auto` 走探测；`web` / `desktop` 显式钉死 |
| `windowControls` | Boolean | `true` | 窗口控制位总开关（桌面壳且为 true 才渲染） |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `window-control` | `'close'` / `'minimize'` / `'maximize'` | 窗口动作只冒泡；宿主 API 归产品侧 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| `brand` | —— | 产品名位（整体替换） |
| `quick` | —— | 快捷访问位（保存、撤销等） |
| `center` | —— | 文档名位（整体替换） |

## 行为

- 宿主 × 平台矩阵全部查 `runtime/window/host` 的表，本件不写平台 if-else。
- Web 宿主无窗口控制位；桌面壳 macOS 左置 traffic lights（close 先），Win / Linux 右置三联钮（minimize 先）。
- `documentElement` 的 `data-host` 属性优先于 UA 探测（宿主自证 + 测试注入同一条路径）。
- 拖曳区与可点区不冲突：`-webkit-app-region: drag` 只加在纯空白条带上，控制位与快捷位显式 no-drag。
- 快捷键提示一律走 `EtKeyHint`（平台符号化，不手拼字符）。

## 令牌与门禁

- `--et-chrome-titlebar-height`（32px）、`--et-icon-sm`（控制位 16 档）。
- G4：控制位是图标钮，必须 `aria-label`。
- M3 验收：两种宿主下布局正确，拖拽区与可点区零重叠。
