# LogoCloud 品牌墙

`EwLogoCloud` 以弱化字标网格展示合作品牌或用户团队，是官网常见的信任背书位。默认自适应列宽，
hover 时字标回到墨色并浮现淡底；也可传图标名代替纯文字。

## 基础用法

<DemoBlock title="文字字标墙" description="字标用强字距展示体，弱灰呈现，hover 回到墨色。">

<EwLogoCloud
  title="这些团队每天都在用 Nimbus"
  :items="['Horizon', 'Fieldnote', 'Mono Studio', 'Arcadia', 'Northwind', 'Papercup']"
/>

```vue
<EwLogoCloud title="这些团队每天都在用 Nimbus" :items="['Horizon', 'Mono Studio']" />
```

</DemoBlock>

## 图标字标

<DemoBlock title="带图标项" description="items 混合字符串与 { label, icon } 对象。">

<EwLogoCloud
  :items="[
    { label: 'Nimbus', icon: 'compass-3-line' },
    { label: 'Fieldnote', icon: 'brush-line' },
    { label: 'Arcadia', icon: 'device-line' },
  ]"
/>

```vue
<EwLogoCloud :items="[{ label: 'Nimbus', icon: 'compass-3-line' }]" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | `[string]` 或 `[{ label, icon? }]` | array | `[]` |
| title | 顶部说明文案 | string | — |
| columns | 列数（缺省自适应） | number | `0` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| title | 标题覆写 |
