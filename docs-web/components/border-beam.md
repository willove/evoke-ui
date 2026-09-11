# BorderBeam 边框流光

`EwBorderBeam` 包住任意内容，一道主色流光沿边框循环扫过，为关键卡片制造「正在发生」的注意力焦点。
基于 CSS `@property` 角度插值实现，不支持的浏览器自动退化为静态渐变细环。

## 基础用法

<DemoBlock title="包住一张卡片" description="圆角写在 EwBorderBeam 上（ring 同步取圆角），内容自带底色即可。">

<EwBorderBeam class="beam-demo" :width="2" :duration="5000">
  <EwCard flat style="border-radius: 14px; margin: 2px;">
    <p style="margin:0; font-weight:600;">重点推荐</p>
    <p style="margin:4px 0 0; font-size:13px; color:var(--ew-text-secondary);">流光沿边框循环扫过，把注意力交给它。</p>
  </EwCard>
</EwBorderBeam>

```vue
<EwBorderBeam :width="2" :duration="5000" style="border-radius: 14px">
  <EwCard flat>…</EwCard>
</EwBorderBeam>
```

</DemoBlock>

<style>
.beam-demo { border-radius: 14px; max-width: 420px; margin: 0 auto; }
</style>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| width | 光带宽度（px） | number | `2` |
| duration | 一圈时长（ms，越小越快） | number | `6000` |
| delay | 起始延迟（ms） | number | `0` |
| color-from | 流光渐变起点色 | string | `transparent` |
| color-to | 流光渐变主色 | string | `var(--ew-color-primary)` |
| reverse | 反向扫动 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 被包裹的内容 |
