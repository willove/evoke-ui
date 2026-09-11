# Anchor 锚点

长页面 / 详情页的区块导航：滚动时自动高亮当前区块（scrollspy），点击平滑滚动到目标位置，带滑动轴线指示。

## 基础用法

<DemoBlock>
  <div style="display: flex; gap: 32px;">
    <eb-anchor style="width: 140px; flex-shrink: 0">
      <eb-anchor-link href="#anchor-demo-a" title="基本信息" />
      <eb-anchor-link href="#anchor-demo-b" title="合同条款" />
      <eb-anchor-link href="#anchor-demo-c" title="付款记录" />
    </eb-anchor>
    <div style="flex: 1; min-width: 0;">
      <div id="anchor-demo-a" style="height: 180px; border: 1px dashed var(--eb-border-color); border-radius: 8px; padding: 16px;">
        <strong>基本信息</strong>
        <p style="margin-top: 8px; color: var(--eb-text-color-secondary); font-size: 13px;">滚动下方容器，观察左侧高亮跟随。</p>
      </div>
      <div id="anchor-demo-b" style="height: 180px; border: 1px dashed var(--eb-border-color); border-radius: 8px; padding: 16px; margin-top: 16px;">
        <strong>合同条款</strong>
        <p style="margin-top: 8px; color: var(--eb-text-color-secondary); font-size: 13px;">第二区块。</p>
      </div>
      <div id="anchor-demo-c" style="height: 180px; border: 1px dashed var(--eb-border-color); border-radius: 8px; padding: 16px; margin-top: 16px;">
        <strong>付款记录</strong>
        <p style="margin-top: 8px; color: var(--eb-text-color-secondary); font-size: 13px;">第三区块。</p>
      </div>
    </div>
  </div>
</DemoBlock>

滚动容器内的锚点用 `target` 指定容器选择器（上例滚动发生在文档流外层容器时可直接不传，默认监听 window）：

```vue
<eb-anchor target="#detail-scroll-container">
  <eb-anchor-link href="#section-1" title="基本信息" />
  <eb-anchor-link href="#section-2" title="合同条款" />
</eb-anchor>
```

## Anchor API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| target | String | window | 滚动容器选择器 |
| offset-top | Number | `0` | 高亮判定与滚动落点的顶部偏移 |
| bound | Number | `5` | 判定容差（px） |
| show-marker | Boolean | `true` | 显示滑动轴线 |
| smooth | Boolean | `true` | 平滑滚动 |

事件：`click(e, href)`、`change(href)`；暴露 `scrollTo(href)` / `refresh()`。

## EbAnchorLink API

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| href | String | 目标区块选择器（`#id`），必填 |
| title | String | 展示标题 |
