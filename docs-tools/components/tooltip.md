# EtTooltip · 工具界面文字提示

底座 `EbTooltip` 的密度适配包装：默认延迟改成工具界面口径，浮层类名做合并而非覆盖。

<DemoBlock>
<et-tooltip content="复制选区" placement="top" :show-after="400">
  <et-tool-button size="small" icon="copy" label="复制" />
</et-tooltip>
</DemoBlock>

## API

<CompApi id="tooltip" />

## 行为

- `popper-class` 合并而非覆盖：保留底座结构类（`eb-tooltip__popper` / `is-{effect}` / `eb-tooltip`，暗色与箭头样式靠它们）再拼 `et-tooltip` 与调用方追加值。
- 调用方传的 `popper-class` 从透传属性中剔除（kebab 与 camel 两种键都剔），避免重复绑定。
- 与 `EtScreenTip` 的分界：本件是纯文本提示；要名称 + 说明 + 快捷键后缀、单例与双触发，用 ScreenTip。

## 令牌与门禁

- `--et-screentip-delay-first` / `--et-screentip-delay-hide`。
- `EbTooltip` 的 `trigger` 校验集缺 `'manual'`（`EbPopper` 有）：想完全接管触发路径会吃一条 dev warn，`EtScreenTip` 用「默认 hover + 切档后重调 show()」绕过。
