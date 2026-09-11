# Image 图片

图片容器：`fit` 填充模式、懒加载、加载失败占位、圆角；传入 `preview-src-list` 后点击可全屏预览（复用 EbImageViewer，支持多图切换 / 缩放 / Esc 关闭）。

## 基础用法与填充模式

<DemoBlock>
  <eb-space size="middle">
    <eb-image src="https://picsum.photos/seed/evfit1/300/160" width="150" height="100" fit="cover" />
    <eb-image src="https://picsum.photos/seed/evfit1/300/160" width="150" height="100" fit="contain" />
    <eb-image src="https://picsum.photos/seed/evfit1/300/160" width="150" height="100" fit="fill" />
  </eb-space>
  <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">同一张图在 cover / contain / fill 下的表现</p>
</DemoBlock>

## 点击预览（大图查看）

传入 `preview-src-list` 即可点击预览；多张图时预览器内可左右切换：

<DemoBlock>
  <eb-space size="middle">
    <eb-image
      v-for="(src, i) in gallery"
      :key="i"
      :src="src"
      width="120"
      height="80"
      fit="cover"
      :preview-src-list="gallery"
      :initial-index="i"
      style="border-radius: 6px;"
    />
  </eb-space>
  <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">点击任意一张打开预览（Esc 或点击遮罩关闭）</p>
</DemoBlock>

## 加载失败占位

<DemoBlock>
  <eb-image src="https://invalid.example.com/broken.png" width="200" height="120">
    <template #error>
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--eb-text-color-secondary); font-size: 13px;">
        图片加载失败，点击重试
      </div>
    </template>
  </eb-image>
</DemoBlock>

<script setup>
const gallery = [
  'https://picsum.photos/seed/evp1/900/600',
  'https://picsum.photos/seed/evp2/900/600',
  'https://picsum.photos/seed/evp3/900/600',
]
</script>

## Image API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| src | String | — | 图片地址 |
| fit | String | `cover` | fill / contain / cover / none / scale-down |
| width / height | String / Number | — | 尺寸 |
| round | Boolean | `false` | 圆角 |
| lazy | Boolean | `false` | 懒加载（IntersectionObserver） |
| preview-src-list | Array | `[]` | 可预览的大图地址列表；传入后点击图片打开预览器 |
| initial-index | Number | `0` | 预览器初始定位 |
| hide-on-click-modal | Boolean | `false` | 点击遮罩关闭预览 |
| alt / referrerpolicy | String | — | 原生属性透传 |

事件：`load`、`error`、`switch(预览切换)`、`close(预览关闭)`；插槽：`error`、`placeholder`。
