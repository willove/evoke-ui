# EtShortcutHint · 助记键内联提示

一个键位 + 可选标签的内联提示：工具区尾部、ScreenTip 说明行、设置项旁边。

<DemoBlock densities>
<et-shortcut-hint keys="mod+s" label="保存" />
<et-shortcut-hint keys="mod+k" />
</DemoBlock>

## API

<CompApi id="shortcut-hint" />

## 行为

- `keys` 与 `label` 都为空时整体不渲染（不留空 DOM）。
- 平台符号化复用 `EtKeyHint`。

## 令牌与门禁

- 与 `EtKeyHint` 共用 `runtime/keys` 的符号表，禁止第二套展示逻辑。
