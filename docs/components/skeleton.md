# Skeleton 骨架屏

<script setup>
import { ref } from 'vue'

const loading = ref(true)
</script>

在内容加载完成前提供占位图形，减少布局闪动。`loading` 为 true 时渲染占位，false 时切换渲染默认插槽的真实内容；`throttle` 可延迟占位渲染，避免快速加载完成时的闪烁。也可脱离 eb-skeleton 单独使用各形态占位单元。

## 基础用法

默认按 `rows` 渲染多行段落占位（末行自动短一截），`animated` 开启扫光动画。

<DemoBlock>
  <eb-skeleton animated :rows="4" />
</DemoBlock>

## 常用版式预设 preset

不想手工拼装占位单元时，直接选一个 `preset`：`article`（标题 + 段落）、`avatar-text`（头像 + 两行）、`card`（封面 + 标题摘要）、`table`（表头 + 数据行，行数列数可调）、`profile`（大头像 + 署名）。

<DemoBlock>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px;">
  <div>
    <p style="margin: 0 0 8px; font-size: 13px; color: var(--eb-text-color-secondary);">article</p>
    <eb-skeleton animated preset="article" />
  </div>
  <div>
    <p style="margin: 0 0 8px; font-size: 13px; color: var(--eb-text-color-secondary);">avatar-text</p>
    <eb-skeleton animated preset="avatar-text" />
  </div>
  <div>
    <p style="margin: 0 0 8px; font-size: 13px; color: var(--eb-text-color-secondary);">profile</p>
    <eb-skeleton animated preset="profile" />
  </div>
  <div>
    <p style="margin: 0 0 8px; font-size: 13px; color: var(--eb-text-color-secondary);">card</p>
    <eb-skeleton animated preset="card" />
  </div>
</div>
<p style="margin: 20px 0 8px; font-size: 13px; color: var(--eb-text-color-secondary);">table（:table-rows="5" :table-cols="5"）</p>
<eb-skeleton animated preset="table" :table-rows="5" :table-cols="5" />
</DemoBlock>

## 多块与渲染延迟

`count` 渲染多个占位块（如列表多卡片场景）；`throttle` 延迟毫秒数后才渲染占位，快速返回的请求不会闪出骨架屏。

<DemoBlock>
  <eb-skeleton animated :rows="2" :count="2" style="margin-bottom: 20px;" />
  <eb-skeleton animated :rows="2" :throttle="500" />
</DemoBlock>

## 动态切换加载态

`loading` 置为 false 时渲染默认插槽中的真实内容，与占位结构保持一致可避免跳动。

<DemoBlock>
  <eb-skeleton :loading="loading" animated :rows="3">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--eb-color-primary-light-7);"></div>
      <div>
        <p style="margin: 0; font-weight: 600;">Evoke Design</p>
        <p style="margin: 4px 0 0; font-size: 13px; color: var(--eb-text-color-secondary);">内容加载完成，骨架屏已被默认插槽替换。</p>
      </div>
    </div>
  </eb-skeleton>
  <eb-button style="margin-top: 12px;" @click="loading = !loading">{{ loading ? '完成加载' : '重新加载' }}</eb-button>
</DemoBlock>

## 组合占位单元

直接使用 `eb-skeleton-item`（variant 可选 text / p / caption / h1 / h3 / h5 / circle / rect / image / button / avatar）及 `eb-skeleton-avatar`、`eb-skeleton-button`、`eb-skeleton-input`、`eb-skeleton-image` 快捷组件拼装任意占位结构。

<DemoBlock>
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <eb-skeleton-avatar animated />
    <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
      <eb-skeleton-item variant="h3" animated />
      <eb-skeleton-item variant="caption" animated />
    </div>
  </div>
  <div style="display: flex; gap: 12px;">
    <eb-skeleton-button animated />
    <eb-skeleton-input animated />
    <eb-skeleton-image animated />
  </div>
</DemoBlock>

## template 插槽自定义占位块

`#template` 插槽替换每块的默认段落占位（插槽内容按 `count` 次重复渲染），可自由组合占位单元。

<DemoBlock>
  <eb-skeleton animated :count="2" style="display: flex; flex-direction: column; gap: 16px;">
    <template #template>
      <div style="display: flex; gap: 12px;">
        <eb-skeleton-item variant="circle" animated style="width: 40px; height: 40px; flex-shrink: 0;" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <eb-skeleton-item variant="h3" animated />
          <eb-skeleton-item variant="p" animated />
        </div>
      </div>
    </template>
  </eb-skeleton>
</DemoBlock>

## API

<ApiTable title="Skeleton Props" :rows="[
  { name: 'loading', desc: '是否处于加载态，false 时渲染默认插槽', type: 'boolean', default: 'true' },
  { name: 'animated', desc: '是否开启扫光动画', type: 'boolean', default: 'false' },
  { name: 'count', desc: '渲染的占位块数（template 插槽重复次数）', type: 'number', default: '1' },
  { name: 'rows', desc: '每块内的占位行数（preset=text 且无 template 插槽时生效）', type: 'number', default: '3' },
  { name: 'preset', desc: '常用版式预设，免去手工拼装占位单元', type: 'text | article | avatar-text | card | table | profile', default: 'text' },
  { name: 'tableRows', desc: 'preset=table 时的行数（含表头行）', type: 'number', default: '4' },
  { name: 'tableCols', desc: 'preset=table 时的列数', type: 'number', default: '4' },
  { name: 'throttle', desc: '渲染延迟（ms），避免加载态闪烁', type: 'number', default: '0' },
]" />

<ApiTable title="SkeletonItem Props" :rows="[
  { name: 'variant', desc: '占位形态', type: 'text | p | caption | h1 | h3 | h5 | circle | rect | image | button | avatar', default: 'text' },
]" />

<ApiTable title="SkeletonButton / Avatar / Input / Image Props" :rows="[
  { name: 'animated', desc: '是否开启扫光动画，形态分别固定为 button / avatar / text / image', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: '加载完成后的真实内容（loading 为 false 时渲染）', type: '—', default: '—' },
  { name: 'template', desc: '自定义每个占位块的内容，按 count 次重复渲染', type: '—', default: '—' },
]" />
