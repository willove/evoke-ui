# ImagePreview 图片预览

<script setup>
import { ref } from 'vue'
const previewVisible = ref(false)
const previewIndex = ref(0)
const glassPreviewVisible = ref(false)
</script>

`EvImagePreview` 全屏灯箱预览：遮罩 + 居中大图，支持左右箭头与键盘 ← → 切换、
Esc / 点击遮罩关闭、打开期间锁定页面滚动，多图时右下角显示计数。
通常配合 [ImageWall 图片墙](./image-wall) 使用，也可独立受控调用。

## 独立受控用法

<DemoBlock title="按钮打开预览" description="v-model 控制可见性，v-model:index 双向绑定当前下标。">

<EvImagePreview
  v-model="previewVisible"
  v-model:index="previewIndex"
  :images="[
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=75', alt: '山脊线' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=75', alt: '雾中山林' },
  ]"
/>
<EvButton @click="previewVisible = true">打开图片预览</EvButton>

```vue
<EvImagePreview v-model="visible" v-model:index="index" :images="images" />
<EvButton @click="visible = true">打开图片预览</EvButton>
```

</DemoBlock>

## 磨砂预览背景

<DemoBlock title="glass 磨砂灯箱" description="开启后遮罩减淡并整幅磨砂，页面在预览背后融成雾面；关闭/箭头按钮同步玻璃化。">

<EvImagePreview
  v-model="glassPreviewVisible"
  glass
  :images="[
    { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=75', alt: '山脊线' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=75', alt: '雾中山林' },
  ]"
/>
<EvButton @click="glassPreviewVisible = true">打开磨砂预览</EvButton>

```vue
<EvImagePreview v-model="visible" glass :images="images" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| modelValue (v-model) | 可见性 | boolean | `false` |
| images | 图片列表：url 字符串或 `{ src, alt }` | array | `[]` |
| index (v-model:index) | 当前下标 | number | `0` |
| esc-close | Esc 关闭 | boolean | `true` |
| glass | 磨砂预览背景；缺省跟随全局（ConfigProvider glass） | boolean | — |
| blur | 磨砂强度（px），内联覆盖 `--ev-glass-blur` | string / number | — |

### 事件

| 事件 | 说明 |
| --- | --- |
| update:modelValue / update:index | 双向绑定 |
| open / close | 打开 / 关闭时触发 |
| change | 切换图片时触发，参数为新下标 |
