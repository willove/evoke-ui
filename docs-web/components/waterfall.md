# Waterfall 瀑布流

<script setup>
import { ref } from 'vue'
const wfColumns = ref(3)
const wfNotes = [
  { title: '把首屏交给一张图', text: '大图定调，文字退后。高度不一的素材按真实比例落位，列与列自动找平。', time: '09:20' },
  { title: '错落，而不是对齐', text: '统一的 4:3 网格适合产品列表；风景、长图、竖版海报各有各的形状，瀑布流让它们都保持原样。', time: '10:05' },
  { title: '最短列优先', text: '新条目总是落进当前最矮的一列，加载多少就补多少。', time: '11:42' },
  { title: '内容也适用', text: '卡片、笔记、摘要，任何高度不一的内容流都能用 #item 插槽接管。', time: '13:18' },
  { title: '加载后自动归位', text: '未声明比例的图片先按占位画幅排布，真实尺寸到位后整体重排一次。', time: '15:00' },
]
</script>

`EwWaterfall` 多列瀑布流：条目按「最短列优先」分发，列高随内容比例自动均衡。
与 [ImageWall 图片墙](./image-wall) 的分工——ImageWall 是统一画幅的均匀网格，
Waterfall 让每张图保持自己的高宽比，错落排布。
默认渲染图片卡，点击打开 [ImagePreview 图片预览](./image-preview) 灯箱（可关）；
`#item` 作用插槽可完全接管单元格，实现任意内容的瀑布流。

## 基础用法

<DemoBlock title="错落排布，点击预览" description="未声明比例的图片先按占位画幅排布，加载完成后按真实比例重新归位；点击任意一张打开灯箱。">

<EwWaterfall
  :items="[
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70', alt: '山脊线' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=70', alt: '雾中山林' },
    { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=70', alt: '林间光' },
    { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=70', alt: '原野' },
    { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=70', alt: '湖畔' },
    { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=70', alt: '湖上小屋' },
    { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=70', alt: '工作台' },
    { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=70', alt: '协作' },
  ]"
/>

```vue
<script setup>
const photos = [
  { src: '/images/ridge.jpg', alt: '山脊线' },
  { src: '/images/mist.jpg', alt: '雾中山林' },
  { src: '/images/forest.jpg', alt: '林间光', caption: '林间光' },
]
</script>

<template>
  <EwWaterfall :items="photos" :columns="3" />
</template>
```

</DemoBlock>

## 列数与间距

<DemoBlock title="切换列数" description="columns 改变后按同一套最短列策略重新分发；gap 同时控制列距与行距。">

<div style="display: flex; gap: 8px; margin-bottom: 16px;">
  <EwButton
    v-for="n in [2, 3, 4]"
    :key="n"
    :variant="wfColumns === n ? 'soft' : 'ghost'"
    @click="wfColumns = n"
  >
    {{ n }} 列
  </EwButton>
</div>

<EwWaterfall
  :columns="wfColumns"
  :items="[
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70', alt: '山脊线' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=70', alt: '雾中山林' },
    { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=70', alt: '林间光' },
    { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=70', alt: '原野' },
    { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=70', alt: '湖畔' },
    { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=70', alt: '湖上小屋' },
  ]"
/>

```vue
<EwWaterfall :items="photos" :columns="4" :gap="10" :radius="8" />
```

</DemoBlock>

## 标题蒙层与声明比例

<DemoBlock title="caption 蒙层 + ratio 声明" description="caption 在图片底部生成渐变蒙层；条目声明 ratio（高/宽）或 width/height 后跳过占位，首屏即按真实比例排布。">

<EwWaterfall
  :items="[
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=750&fit=crop&q=70', alt: '山脊线', caption: '山脊线', ratio: 1.25 },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=396&fit=crop&q=70', alt: '雾中山林', caption: '雾中山林', ratio: 0.66 },
    { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=480&fit=crop&q=70', alt: '林间光', caption: '林间光', ratio: 0.8 },
    { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=336&fit=crop&q=70', alt: '原野', caption: '原野', ratio: 0.56 },
    { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=600&fit=crop&q=70', alt: '湖畔', caption: '湖畔', ratio: 1 },
    { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&h=450&fit=crop&q=70', alt: '湖上小屋', caption: '湖上小屋', ratio: 0.75 },
  ]"
/>

```vue
<EwWaterfall
  :items="[
    { src: '/images/ridge.jpg', caption: '山脊线', ratio: 1.25 },
    { src: '/images/field.jpg', caption: '原野', ratio: 0.56 },
  ]"
/>
```

</DemoBlock>

## 自定义内容瀑布流

<DemoBlock title="#item 插槽接管单元格" description="插槽参数为 { item, index }；承载笔记卡片这类高度不一的内容流，点击行为由内容自己决定。">

<EwWaterfall :items="wfNotes" :columns="3" :gap="12" :preview="false">
  <template #item="{ item }">
    <div class="wf-note">
      <p class="wf-note__title">{{ item.title }}</p>
      <p class="wf-note__body">{{ item.text }}</p>
      <span class="wf-note__time">{{ item.time }}</span>
    </div>
  </template>
</EwWaterfall>

```vue
<EwWaterfall :items="notes" :columns="3" :preview="false">
  <template #item="{ item }">
    <article class="note">
      <h3>{{ item.title }}</h3>
      <p>{{ item.text }}</p>
    </article>
  </template>
</EwWaterfall>
```

</DemoBlock>

<style>
.wf-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-md);
  background: var(--ew-bg-container);
}
.wf-note__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ew-text-primary);
}
.wf-note__body {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--ew-text-secondary);
}
.wf-note__time {
  font-size: 11px;
  color: var(--ew-text-tertiary, var(--ew-text-secondary));
}
</style>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 条目列表：url 字符串或 `{ src, alt, caption, ratio, width, height }`（ratio 为高/宽） | array | `[]` |
| columns | 列数 | number | `3` |
| gap | 间距（px，列距与行距同值） | number | `14` |
| radius | 圆角（px） | number | `12` |
| preview | 点击打开预览灯箱 | boolean | `true` |

### 事件

| 事件 | 说明 |
| --- | --- |
| select | 点击图片时触发，参数为 `(item, index)` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| item | 单元格内容，参数为 `{ item, index }`；使用后不再渲染默认图片卡 |
