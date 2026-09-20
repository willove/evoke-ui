# Navbar 导航

`EvNavbar` 是站点导航：吸顶 + 滚动后背景磨砂与细边（可关），链接默认安静（hover 只变色不铺底），
品牌名用强字距展示体。移动端自动折叠为汉堡菜单，按钮带 aria-expanded 与
「打开/关闭菜单」动态标签。

## 基础用法

<DemoBlock title="logo + 导航项 + 动作区" description="以下为真实组件：sticky 已关闭便于预览，实际使用保持默认开启。">

<EvNavbar
  :sticky="false"
  logo-text="cumubase"
  :items="[
    { label: '产品', href: '#' },
    { label: '定价', href: '#' },
    { label: '博客', href: '#' },
    { label: '文档', href: '#' },
  ]"
  style="border:1px solid var(--ev-border-color-light); border-radius:14px;"
>
  <template #actions>
    <EvThemeToggle />
    <EvIconButton icon="github" aria-label="GitHub" />
    <EvIconButton icon="download" variant="soft" />
  </template>
</EvNavbar>

```vue
<EvNavbar logo-text="cumubase" :items="navItems">
  <template #actions>
    <EvThemeToggle />
    <EvIconButton icon="github" aria-label="GitHub" />
    <EvIconButton icon="download" variant="soft" />
  </template>
</EvNavbar>
```

</DemoBlock>

## 当前项高亮

<DemoBlock title="active" description="active 传 label 或 href；也可以在每个 item 上单独标记 active。">

<EvNavbar
  :sticky="false"
  logo-text="cumubase"
  active="定价"
  :items="[{ label: '产品', href: '#' }, { label: '定价', href: '#' }]"
  style="border:1px solid var(--ev-border-color-light); border-radius:14px;"
/>

```vue
<EvNavbar logo-text="cumubase" active="定价" :items="navItems" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 导航项 `[{ label, href, target, active }]` | array | `[]` |
| sticky | 吸顶 | boolean | `true` |
| blur | 滚动后背景磨砂 | boolean | `true` |
| glass | 常驻磨砂（不滚动也有玻璃质感）；缺省跟随全局（ConfigProvider glass） | boolean | — |
| hide-on-scroll | 下滑隐藏、上滑浮现（沉浸式长页面） | boolean | `false` |
| logo | 是否渲染默认品牌位 | boolean | `true` |
| logo-text | 品牌名 | string | — |
| logo-icon | 品牌图标名 | string | — |
| logo-image | 品牌图片地址 | string | — |
| active | 当前激活项（匹配 label 或 href） | string | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| logo | 品牌位整体覆写 |
| start | 左侧追加内容 |
| center | 中部导航覆写 |
| actions | 右侧动作区 |
| default | 移动端菜单附加内容 |
