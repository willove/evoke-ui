# EtShortcutPanel · 快捷键一览

从命令表生成的键位表面板：按域分组，冲突直接展示，不手写列表。

```vue
<et-shortcut-panel :registry="registry" />
<et-shortcut-panel :registry="registry" platform="mac" />
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `registry` | Object | 必填 | 命令注册表（`buildShortcutTable` 的数据源） |
| `platform` | String | `'auto'` | `auto` 走运行时识别；`mac` / `win` 可钉死 |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | —— | 无 |

## 行为

- 分组取命令的 `group`，缺省落到 `surfaces[0]` 或「通用」。
- 没有 `keys` 的命令不进面板。
- 冲突区：`detectKeyConflicts` 的结果直接渲染在面板里（登记期就能发现的事故，不该等用户按出来）。
- 注册表为空且无冲突时整体不渲染。
- `tabindex="0"` + `role="region"`，可被键盘focus到后滚动阅读。

## 令牌与门禁

- 单一来源 = 命令注册表：命令表加一行，本页自动多一行。
- 键帽展示走 `EtKeyHint` 平台符号化。
