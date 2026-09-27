# EtSplitterPanel · 分隔面板子件

`EtSplitter` 族的一格：尺寸 / 最小最大 / 可折叠全部透传底座，工具度量由同目录样式覆盖。
**包装件**——槽位透传底座全部命名槽，键盘 resize 由底座拖拽条（`role=separator`）承担。

```vue
<et-splitter orientation="horizontal" @resize="onResize">
  <et-splitter-panel :size="280" :min="200" :max="420" collapsible>
    <et-panel title="大纲" />
  </et-splitter-panel>
  <et-splitter-panel>
    <et-panel title="属性" />
  </et-splitter-panel>
</et-splitter>
```

## API

<CompApi id="splitter-panel" />

## 契约要点

- **与 `EtSplitter` 同族**：度量（可视厚度 / 热区 / 把手）来自 `--et-splitter-*` 令牌；
- **键盘可达**：拖拽条即 separator，方向键 ±`keyboardStep`、Home/End 到 min/max，与拖拽同一套夹角；
- **组字期间不响应**（G5 输入法门）。
