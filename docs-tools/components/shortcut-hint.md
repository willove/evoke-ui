# EtShortcutHint · 助记键内联提示

一个键位 + 可选标签的内联提示：工具区尾部、ScreenTip 说明行、设置项旁边。

```vue
<et-shortcut-hint keys="mod+s" label="保存" />
<et-shortcut-hint keys="mod+k" />
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `keys` | String | `''` | 规范组合键串；空串不渲染键帽 |
| `label` | String | `''` | 可选标签（命令名）；为空时只有键帽 |
| `platform` | String | `'auto'` | `auto` 走运行时识别；`mac` / `win` 可钉死 |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | —— | 无 |

## 行为

- `keys` 与 `label` 都为空时整体不渲染（不留空 DOM）。
- 平台符号化复用 `EtKeyHint`。

## 令牌与门禁

- 与 `EtKeyHint` 共用 `runtime/keys` 的符号表，禁止第二套展示逻辑。
