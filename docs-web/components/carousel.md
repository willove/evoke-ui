# Carousel 轮播

`EwCarousel` 提供轻量的轮播能力：平滑位移、左右箭头、胶囊圆点，`autoplay` 开启自动轮播且
hover 暂停。内容完全由 `#item` 作用域插槽自定义 —— 常用于评价墙、案例展示与活动横幅。

## 基础用法

<DemoBlock title="评价轮播" description="与 EwQuote 组合是最常见的用法；试试点箭头与圆点。">

<EwCarousel
  :items="[
    { quote: '同步速度和离线体验是我们团队迁移的全部理由。', author: '林一舟', role: '产品负责人' },
    { quote: '搜索快到离谱，找三年前的会议记录也就一两秒。', author: 'Ada', role: '项目经理' },
    { quote: '界面安静克制，写东西的时候不会被任何元素打扰。', author: 'Wen', role: '专栏作者' },
  ]"
  style="max-width:560px; margin-inline:auto;"
>
  <template #item="{ item }">
    <EwQuote v-bind="item" sticker />
  </template>
</EwCarousel>

```vue
<EwCarousel :items="quotes" :autoplay="5000">
  <template #item="{ item }">
    <EwQuote v-bind="item" sticker />
  </template>
</EwCarousel>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 轮播数据（长度即页数） | array | `[]` |
| autoplay | 自动轮播间隔 ms（0 关闭，hover 暂停） | number | `0` |
| dots | 展示圆点指示器 | boolean | `true` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| item | 每页内容（作用域：`{ item, index }`） |
