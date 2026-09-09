# FeatureGrid 特性

`EwFeatureGrid` 展示产品特性，两种形态对应页面的两种位置：`bullets` 行内特性条用于首屏
（三两个词点出核心卖点），`cards` 特性卡用于功能区（图标 + 标题 + 描述的三栏结构）。

## bullets 行内特性条

<DemoBlock title="首屏特性行" description="细线分隔的图标 + 词条，安静而有信息量。">

<EwFeatureGrid
  variant="bullets"
  :items="[
    { icon: 'device-line', title: '像素对齐' },
    { icon: 'compass-3-line', title: '矢量无损' },
    { icon: 'flashlight-line', title: '风格统一' },
  ]"
/>

```vue
<EwFeatureGrid variant="bullets" :items="[
  { icon: 'device-line', title: '像素对齐' },
  { icon: 'compass-3-line', title: '矢量无损' },
]" />
```

</DemoBlock>

## cards 特性卡

<DemoBlock title="三栏特性卡" description="hover 轻抬 + 主色描边；列数 1~4 可选，窄屏自动降列。">

<EwFeatureGrid
  variant="cards"
  :columns="3"
  :items="[
    { icon: 'brush-line', title: '写作优先', description: '无干扰编辑器与 Markdown 快捷语法，让注意力回到内容本身。' },
    { icon: 'search', title: '全局即时搜索', description: '全文 + 标签 + 附件内容统一检索，百毫秒级返回结果。' },
    { icon: 'device-line', title: '多端离线', description: '桌面与移动端全量离线可用，联网后自动增量同步。' },
  ]"
/>

```vue
<EwFeatureGrid variant="cards" :columns="3" :items="features" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 特性项 `[{ icon, title, description }]` | array | `[]` |
| variant | 形态 | `'bullets' \| 'cards'` | `'cards'` |
| columns | cards 列数 | `1 \| 2 \| 3 \| 4` | `3` |
| stagger | v-reveal 交错延迟步长 ms | number | `60` |
