# FloatButton 悬浮按钮

固定悬浮操作按钮与按钮组：主按钮展开子项（点击外部 / Esc 收起）、徽标、悬停提示、上下两种展开方向，`position-type` 支持固定视口或容器内布置。

## 单按钮

<DemoBlock>
  <ev-space size="middle">
    <ev-float-button icon="question-line" tooltip="联系客服" @click="() => {}" />
    <ev-float-button icon="plus" type="primary" shape="square" />
    <ev-float-button icon="notification" :badge-value="8" />
    <ev-float-button icon="top" tooltip="回到顶部" @click="onBacktop" />
  </ev-space>
</DemoBlock>

## 按钮组（容器内演示，点击主按钮展开）

<DemoBlock>
  <div style="position: relative; height: 260px; border: 1px dashed var(--ev-border-color); border-radius: 8px; overflow: hidden;">
    <ev-float-button-group
      :position="{ right: 24, bottom: 24 }"
      position-type="absolute"
      trigger="plus"
    >
      <ev-float-button icon="question-line" tooltip="联系客服" />
      <ev-float-button icon="edit" tooltip="意见反馈" />
      <ev-float-button icon="download" tooltip="导出数据" />
    </ev-float-button-group>
    <span style="position: absolute; left: 16px; top: 12px; font-size: 12px; color: var(--ev-text-color-secondary);">
      点击右下角主按钮展开子项，点击空白处或按 Esc 收起
    </span>
  </div>
</DemoBlock>

实际页面中布置到视口右下角（`position-type` 默认 fixed）：

```vue
<ev-float-button-group :position="{ right: 40, bottom: 40 }" trigger="plus">
  <ev-float-button icon="question-line" tooltip="联系客服" />
  <ev-float-button icon="edit" tooltip="意见反馈" />
</ev-float-button-group>
```

<script setup>
function onBacktop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

## FloatButton API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| icon | String | — | 图标名（默认插槽优先） |
| shape | String | `circle` | circle / square |
| type | String | `default` | default / primary / danger |
| size | Number | `44` | 尺寸（px） |
| tooltip | String | — | 悬停提示 |
| badge-value | Number | — | 徽标数值 |

事件：`click`。

## FloatButtonGroup API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| trigger | String | — | 触发图标名；不传则平铺子按钮 |
| close-icon | String | `close` | 展开后的收起图标 |
| type | String | `primary` | 主按钮语义色 |
| shape | String | `circle` | 子按钮形态 |
| direction | String | `up` | 展开方向 up / down |
| position | Object | — | `{ top/right/bottom/left }`，数字按 px |
| position-type | String | `fixed` | fixed（视口）/ absolute（最近定位父级） |

暴露方法：`toggle()` / `open()` / `close()`；点击组外部或 Esc 自动收起。
