# Footer 页脚

`EwFooter` 是站点页脚：品牌区（名称/口号/社交）+ 多栏链接 + 底部版权条。链接栏推荐用
大写小标做栏目标题，链接保持安静灰、hover 回到墨色。

## 基础用法

<DemoBlock title="品牌区 + 多栏链接 + 版权条" description="soft 开启淡雾底；social 插槽放图标按钮组。">

<EwFooter
  soft
  logo-text="Nimbus"
  slogan="为专注写作与团队协作而生的云笔记。"
  copyright="© 2026 Nimbus Labs"
  :columns="[
    { title: '产品', links: [{ label: '功能', href: '#' }, { label: '定价', href: '#' }, { label: '更新日志', href: '#' }] },
    { title: '资源', links: [{ label: '帮助中心', href: '#' }, { label: '开发者 API', href: '#' }] },
    { title: '公司', links: [{ label: '关于我们', href: '#' }, { label: '加入我们', href: '#' }] },
  ]"
>
  <template #social>
    <EwIconButton icon="github" size="small" aria-label="GitHub" />
    <EwIconButton icon="x" size="small" aria-label="X" />
    <EwIconButton icon="wechat" size="small" aria-label="微信公众号" />
  </template>
</EwFooter>

```vue
<EwFooter logo-text="Nimbus" :columns="footerCols" copyright="© 2026 Nimbus Labs">
  <template #social>
    <EwIconButton icon="github" size="small" />
  </template>
</EwFooter>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| columns | 链接栏 `[{ title, links: [{ label, href, target }] }]` | array | `[]` |
| logo-text | 品牌名 | string | — |
| slogan | 品牌语 | string | — |
| copyright | 版权文案 | string | — |
| soft | 淡雾底形态 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| brand | 品牌区整体覆写 |
| default | 覆写全部链接栏 |
| social | 社交图标区 |
| legal | 版权条右侧的法务链接区 |
