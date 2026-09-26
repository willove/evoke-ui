# EtKeyHint · 键帽文本

快捷键文本的平台符号化：`mod` 在 macOS 印 ⌘，在 Windows/Linux 印 Ctrl。

```vue
<et-key-hint combo="mod+shift+z" />
<et-key-hint combo="mod+shift+z" platform="mac" />
<et-key-hint combo="ctrl+f1" platform="win" />
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `combo` | String | `''` | 规范组合键串；未规范化也接受，构造期校验键名合法性 |
| `platform` | String | `'auto'` | `auto` 走运行时识别；`mac` / `win` 可钉死（测试与文档用） |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | —— | 无 |

## 行为

- `combo` 为空时键帽文本为空串。
- 渲染 `<kbd>` 元素，类名带平台档（`et-keyhint--{platform}`）。
- 暴露 `text`（当前展示串）。
- 修饰键同义词（`cmd` / `meta` / `super` / `opt` …）归并后展示，不硬编码平台字符。

## 令牌与门禁

- 键名字符表在 `runtime/keys`，`formatCombo` 是唯一定制点。
- G6：平台符号由代码生成，禁止在模板里手拼平台键字符。
