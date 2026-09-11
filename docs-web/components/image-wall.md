# ImageWall 图片墙

`EwImageWall` 网格图片墙：默认三列、统一 4:3 画幅，点击任意图片直接打开
[ImagePreview 图片预览](./image-preview) 灯箱；`preview` 关闭后只派发 select 事件。

## 基础用法

<DemoBlock title="三列网格 + 点击预览" description="images 支持字符串 url 或 { src, alt }；点击任意一张打开灯箱，← → 键切换。">

<EwImageWall
  :images="[
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70', alt: '山脊线' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=70', alt: '雾中山林' },
    { src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=70', alt: '林间光' },
    { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=70', alt: '原野' },
    { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=70', alt: '湖畔' },
    { src: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=70', alt: '湖上小屋' },
  ]"
/>

```vue
<EwImageWall
  :images="[
    { src: '/images/a.jpg', alt: '山脊线' },
    { src: '/images/b.jpg', alt: '雾中山林' },
  ]"
  :columns="3"
/>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| images | 图片列表：url 字符串或 `{ src, alt }` | array | `[]` |
| columns | 列数 | number | `3` |
| gap | 间距（px） | number | `14` |
| radius | 圆角（px） | number | `12` |
| preview | 点击打开预览灯箱 | boolean | `true` |

### 事件

| 事件 | 说明 |
| --- | --- |
| select | 点击图片时触发，参数为 `(item, index)` |
