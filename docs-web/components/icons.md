# 全部图标

内置展示集的全量浏览：按 Remix 分类分组，支持关键词搜索与 line / fill 形态切换。
**点击任意单元格即复制图标名**（hover 浮现「+」，复制成功短暂变为主色对勾）。

该页由 [EvIconGrid](./icon-grid) 直接驱动，零配置渲染；图标扩展方式见
[Icon 图标](./icon#扩展到全量-remix-icon)。

<DemoBlock title="Remix 展示集（900+，动态加载）" description="数据为独立 chunk 按需加载，主包不承担体积。">

<EvIconGrid style="max-width:100%;" />

```vue
<EvIconGrid />
```

</DemoBlock>

::: tip 线性与面性成对采样
展示集按分类对 line / fill 形态成对采样（如 `brush-line` / `brush-fill`），
同一图标的两种形态在相邻单元格，方便对比选用。
:::
