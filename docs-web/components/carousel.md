# Carousel 轮播

`EvCarousel` 提供轻量的轮播能力：平滑位移、左右箭头、胶囊圆点，`autoplay` 开启自动轮播且
hover 暂停。三种形态：`default` 由 `#item` 作用域插槽完全自定义、`image` 纯图片轮播、
`banner` 图片 + 文字注释（渐变遮罩贴底）。

## 基础用法

<DemoBlock title="评价轮播" description="与 EvQuote 组合是最常见的用法；试试点箭头与圆点。">

<EvCarousel
  :items="[
    { quote: '同步速度和离线体验是我们团队迁移的全部理由。', author: '林一舟', role: '产品负责人' },
    { quote: '搜索快到离谱，找三年前的会议记录也就一两秒。', author: 'Ada', role: '项目经理' },
    { quote: '界面安静克制，写东西的时候不会被任何元素打扰。', author: 'Wen', role: '专栏作者' },
  ]"
  style="max-width:560px; margin-inline:auto;"
>
  <template #item="{ item }">
    <EvQuote v-bind="item" sticker />
  </template>
</EvCarousel>

```vue
<EvCarousel :items="quotes" :autoplay="5000">
  <template #item="{ item }">
    <EvQuote v-bind="item" sticker />
  </template>
</EvCarousel>
```

</DemoBlock>

## 纯图片轮播

<DemoBlock title="variant=&quot;image&quot;" description="items 传 { src, alt }，aspect 控制画幅，object-fit: cover 自动裁切。">

<EvCarousel
  variant="image"
  aspect="16 / 7"
  :autoplay="4000"
  :items="[
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1100&q=70', alt: '山脊线' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1100&q=70', alt: '雾中山林' },
    { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1100&q=70', alt: '林间光' },
  ]"
/>

```vue
<EvCarousel variant="image" aspect="16 / 7" :autoplay="4000" :items="photos" />
```

</DemoBlock>

## 图片 + 文字注释

<DemoBlock title="variant=&quot;banner&quot;" description="注释带渐变遮罩贴底，标题用展示体——适合案例展示与活动横幅。">

<EvCarousel
  variant="banner"
  aspect="16 / 7"
  :items="[
    { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1100&q=70', title: '为团队而建的工作台', desc: '把日常协作收进同一个界面，少一次切换，多一分专注。' },
    { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1100&q=70', title: '一起把想法做完', desc: '从白板到发布，每个阶段都有顺手的工具。' },
  ]"
/>

```vue
<EvCarousel
  variant="banner"
  aspect="16 / 7"
  :items="[{ src: '/images/a.jpg', title: '为团队而建的工作台', desc: '把日常协作收进同一个界面' }]"
/>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 轮播数据（长度即页数） | array | `[]` |
| variant | 形态：`'default'` 自定义插槽 / `'image'` 纯图片 / `'banner'` 图片+注释 | string | `'default'` |
| aspect | image / banner 形态的画幅比例（CSS aspect-ratio 值） | string | `'16 / 9'` |
| autoplay | 自动轮播间隔 ms（0 关闭，hover 暂停） | number | `0` |
| dots | 展示圆点指示器 | boolean | `true` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| item | 每页内容（作用域：`{ item, index }`），仅 default 形态 |
