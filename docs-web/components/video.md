# Video 视频

`EwVideo` 在固定画幅内优雅地承载视频：默认渲染原生 `video` 控件（支持封面图），也可用默认插槽
嵌入视频平台的 iframe 分享代码。画幅四档可选，避免上传视频导致的页面跳动。

## 基础用法

<DemoBlock title="占位与画幅" description="未传 src 时渲染占位态，适合先排版后接视频。">

<EwVideo caption="30 秒了解 Nimbus 的新编辑器" style="max-width:560px;" />

```vue
<EwVideo src="/demo.mp4" poster="/cover.jpg" caption="30 秒了解新编辑器" />
```

</DemoBlock>

## 画幅比例

<DemoBlock title="16:9 / 4:3 / 1:1 / 9:16" description="竖屏 9:16 适合手机实拍展示。">

<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; max-width:560px;">
  <EwVideo aspect="16:9" />
  <EwVideo aspect="1:1" />
</div>

```vue
<EwVideo aspect="16:9" />
<EwVideo aspect="9:16" />
```

</DemoBlock>

::: tip 嵌入平台视频
使用默认插槽放置 iframe，画幅容器依然生效：`<EwVideo><iframe src="…" /></EwVideo>`
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| src | 视频地址（渲染原生 video） | string | — |
| poster | 封面图 | string | — |
| aspect | 画幅比例 | `'16:9' \| '4:3' \| '1:1' \| '9:16'` | `'16:9'` |
| caption | 下方说明文案 | string | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 覆写媒体内容（可放 iframe） |
| caption | 说明文案覆写 |

### 事件

| 事件 | 说明 |
| --- | --- |
| play / pause | 原生 video 播放/暂停时派发 |
