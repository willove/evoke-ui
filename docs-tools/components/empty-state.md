# EtEmptyState · 工具界面空态

空态即首屏：一句引导 + 一个主按钮，图标取 lg 档、无插画、强调色只出现一次。

```vue
<et-empty-state
  icon="search"
  title="从粘贴一段数据开始"
  desc="支持 CSV 与 JSON。"
  action-label="新建表格"
  @action="onAction"
/>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `icon` | String | `'search'` | 第 ② 层语义名（缺省档引导情景） |
| `title` | String | 必填 | 引导句，一行 |
| `desc` | String | `''` | 一行补充说明；空串不渲染该行 |
| `actionLabel` | String | `''` | 主按钮文案；给了 `action` 槽时忽略 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `action` | —— | 主按钮点击（仅在用 `actionLabel` 时） |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| `action` | —— | 主按钮位：整体替换默认主钮（仍是全组件唯一强调色操作） |

## 行为

- `role="status"`：空态常驻首屏，读屏进入即播报。
- 图标盒 `aria-hidden`：图标是引导的视线锚，不是可读信息，可访问名由标题承担。
- 图标未命中走 `EtIcon` 兜底（显式兜底图标 + dev warn，不渲染空白）。
- 与底座 `EbEmptyState` 的分界：底座面向中后台数据表格（插画 + 描述 + 底部操作位），本件对齐工具界面的安静密度。

## 令牌与门禁

- `--et-icon-lg`（图标盒 24 / 20 / 28 随密度）。
- G6 文案门：引导句动词开头、说人话；空态禁成段介绍。
