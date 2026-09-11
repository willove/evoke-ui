# Hero 首屏

`EvHero` 承载官网的第一印象：淡蓝灰光带渐变底、细字重展示标题、顶部胶囊徽章位与动作区。
访客对整站的第一印象在首屏成形，本组件把这套视觉语言封装成 props 与插槽。

## 基础用法

<DemoBlock title="徽章 + 展示标题 + 描述 + 动作" description="标题自动平衡换行；actions 内常用 pill 大按钮。">

<EvHero
  title="轻盈优雅的云端笔记"
  description="为专注写作与团队协作而生的云笔记。免费开始，随处访问，灵感永不丢失。"
>
  <template #badge>
    <EvTag tone="primary" icon="star">v2.0 全新发布</EvTag>
  </template>
  <template #actions>
    <EvButton size="large" pill icon="download">立即下载</EvButton>
    <EvButton size="large" variant="outline" icon-right="arrow-right">了解更多</EvButton>
  </template>
</EvHero>

```vue
<EvHero title="轻盈优雅的云端笔记" description="…">
  <template #badge>
    <EvTag tone="primary" icon="star">v2.0 全新发布</EvTag>
  </template>
  <template #actions>
    <EvButton size="large" pill icon="download">立即下载</EvButton>
  </template>
</EvHero>
```

</DemoBlock>

## 居中 + 大搜索栏（知识库/帮助中心首屏骨架）

<DemoBlock title="center 对齐 + default 插槽" description="居中标题 + 特性行 + 大搜索栏，是知识库、帮助中心与工具站的经典首屏结构。">

<EvHero
  align="center"
  title="答案，一搜即达"
  description="接入你的内容源，为用户提供即时、精准的全站检索体验。"
>
  <template #actions>
    <EvFeatureGrid
      variant="bullets"
      :items="[
        { icon: 'device-line', title: '即时返回' },
        { icon: 'compass-3-line', title: '全文检索' },
        { icon: 'flashlight-line', title: '多源聚合' },
      ]"
    />
  </template>
  <EvSearchBox large placeholder="搜索文章、模板或帮助…" :categories="['全部', '文章', '模板', '帮助']" style="max-width:640px; margin-inline:auto; width:100%;" />
</EvHero>

```vue
<EvHero align="center" title="答案，一搜即达" description="…">
  <template #actions>
    <EvFeatureGrid variant="bullets" :items="featureBullets" />
  </template>
  <EvSearchBox large placeholder="搜索文章、模板或帮助…" :categories="categories" />
</EvHero>
```

</DemoBlock>

## 首屏入场动效

<DemoBlock title="reveal 错峰入场" description="reveal 开启后，徽章→标题→描述→动作按 60ms 步进依次浮现；刷新页面即可看到。">

<EvHero
  reveal
  align="center"
  title="轻盈，也是一种生产力"
  description="本演示开启了 reveal —— 徽章、标题、描述与按钮依次入场。"
>
  <template #badge>
    <EvTag tone="primary" icon="star">reveal</EvTag>
  </template>
  <template #actions>
    <EvButton pill>立即体验</EvButton>
  </template>
</EvHero>

```vue
<EvHero reveal title="…" description="…">
  <template #actions><EvButton pill>立即体验</EvButton></template>
</EvHero>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标题（细字重展示体，自动平衡换行） | string | — |
| description | 描述 | string | — |
| align | 对齐 | `'left' \| 'center'` | `'left'` |
| tinted | 淡蓝灰光带渐变底 | boolean | `true` |
| reveal | 错峰入场动效（60ms 步进） | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| badge | 顶部胶囊徽章位 |
| title / description | 标题/描述覆写 |
| actions | 动作按钮区 |
| default | 主体（搜索框等大件） |
| aside | 右侧视觉位（窄屏自动隐藏） |
