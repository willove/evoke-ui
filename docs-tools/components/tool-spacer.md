# EtToolSpacer · 弹性占位

工具区弹性占位：把后续组推到行尾（对齐 Office 功能区右侧留白的形态）。

<DemoBlock>
<et-tool-group label="视图">
  <et-tool-button icon="zoom-in" label="放大" />
  <et-tool-spacer />
  <et-tool-button icon="more" label="更多" />
</et-tool-group>
</DemoBlock>

## API

<CompApi id="tool-spacer" />

## 行为

- 可访问性上无意义，整件对读屏隐藏（`aria-hidden="true"`）。
- 纯布局件：不渲染子内容，只占位。

## 令牌与门禁

- 伸缩行为走布局令牌，件内无 px 字面量。
