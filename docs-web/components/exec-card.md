# ExecCard 高管介绍卡

`EvExecCard` 为「透明背景半身人物图」设计的团队/高管介绍卡：人物图锚定在渐变舞台底边，
像从卡片里走出来一样，天然兼容抠好图的 PNG。标题用强字距展示体，职务为大写字距小标签。
未传 `image` 时渲染内置人物剪影占位。

## 基础用法

<DemoBlock title="三个人物 · 透明 PNG 半身图" description="image 传透明背景 PNG（人物居中、底部裁切）；不传则渲染内置剪影占位。portrait-height 控制舞台高度。">

<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
  <EvExecCard
    name="林一舟"
    role="创始人 / CEO"
    description="连续创业者，负责产品方向与设计语言。"
    :portrait-height="170"
  />
  <EvExecCard
    name="苏晚晴"
    role="设计合伙人"
    description="主导 Evoke UI 的 Clean Navy 视觉系统与插画语言。"
    :portrait-height="170"
  />
  <EvExecCard
    name="程亦风"
    role="工程合伙人"
    description="负责渲染层与图表引擎，拥抱 Electron 与离线场景。"
    :portrait-height="170"
  />
</div>

```vue
<EvExecCard
  name="林一舟"
  role="创始人 / CEO"
  image="/images/ceo.png"
  description="连续创业者，负责产品方向与设计语言。"
/>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| name | 姓名 | string | `''` |
| role | 职务/头衔（大写字距小标签） | string | `''` |
| description | 一句话介绍 | string | `''` |
| image | 人物半身图（建议透明背景 PNG） | string | `''` |
| portrait-height | 人物舞台高度（px） | number | `190` |
| glass | 磨砂玻璃质感；缺省跟随全局 | boolean | — |
| blur | 磨砂强度（px），内联覆盖 `--ev-glass-blur` | string / number | — |
| saturate | 磨砂饱和度（倍数），内联覆盖 `--ev-glass-saturate` | string / number | — |
| tint | 磨砂底色浓度（%），内联覆盖 `--ev-glass-bg` | string / number | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 介绍文字覆写 |
| name / role | 姓名 / 职务覆写 |
| actions | 底部动作位（社交链接等） |
