# EtToolButton · 工具区按钮

大钮（图标行 + caption）与小钮（图标 + ScreenTip）两种形态，尺寸走令牌、组内齐次。

```vue
<et-tool-button icon="copy" label="复制" size="large" />

<et-tool-button
  size="small"
  icon="copy"
  label="复制"
  :active="true"
  :tip="{ title: '复制', desc: '复制选区到剪贴板', combo: 'mod+c' }"
  @click="run"
/>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | String | `'large'` | `large` / `small`；只切形态，不实现密度分支 |
| `icon` | String | `''` | 第 ② 层语义名或已登记领域名 |
| `label` | String | `''` | large = caption；small = 可访问名来源 |
| `active` | Boolean | `false` | 激活态，渲染 `aria-pressed` |
| `disabled` | Boolean | `false` | 禁用态，点击双保险拦截 |
| `caret` | Boolean | `false` | 「按钮+下拉」指示，渲染在 caption 行右侧 |
| `tip` | String \| Object | `null` | 小钮富提示；对象形如 `{ title, desc?, combo? }` |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | `click` | 载荷 MouseEvent；`disabled` 时不发 |
| Slots | —— | 无 |

## 行为

- large：固定方形图标盒 + caption 行；caption 为空且无 caret 时 caption 整体不渲染。
- small：只渲染图标；有 `tip` 时用 `EtScreenTip` 包裹，无 `tip` 走直通件（不多包 DOM，不破坏宿主 flex 行的条目间距）。
- 图标未命中不渲染空白：回落显式兜底图标 + dev warn（见 [EtIcon](icons.md)）。
- `label` 为空时 small 钮没有可访问名，G4 会红。

## 令牌与门禁

- `--et-size-toolbtn-large` / `--et-size-toolbtn-small` / `--et-toolbtn-icon-box` / `--et-toolbtn-caption-line-height`。
- G2：同组条目要么全有图标要么全纯文字，禁混排。
- G7：本件不出现 px 字面量。
