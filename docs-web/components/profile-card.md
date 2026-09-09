# ProfileCard 个人名片

`EwProfileCard` 介绍一个人：头像、姓名、角色、简介，外加可选的数据行与社交链接行。
适用于「关于我们」的团队墙、个人主页的自我介绍位。

## 基础用法

<DemoBlock title="团队墙三连" description="无头像时姓名首字自动兜底；stats/social 插槽按需开启。">

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px;">
  <EwProfileCard
    name="林一舟"
    role="产品设计师"
    bio="做让人安心的产品，相信留白的力量。"
  >
    <template #social>
      <EwIconButton icon="github" size="small" aria-label="GitHub" />
      <EwIconButton icon="x" size="small" aria-label="X" />
    </template>
  </EwProfileCard>
  <EwProfileCard
    name="Ada Lovelace"
    role="创始工程师"
    bio="把复杂留给代码，把简单留给用户。"
  >
    <template #stats>
      <EwStatistic value="120" label="提交" align="center" />
      <EwStatistic value="32" label="评审" align="center" />
    </template>
  </EwProfileCard>
  <EwProfileCard
    name="Wen"
    role="内容负责人"
    bio="写字的人，也是删字最多的人。"
  />
</div>

```vue
<EwProfileCard name="林一舟" role="产品设计师" bio="…">
  <template #social>
    <EwIconButton icon="github" size="small" />
  </template>
</EwProfileCard>
```

</DemoBlock>

::: tip plain 形态
`plain` 去掉卡面边框与底色，适合放进 [EwCard](./card) 的粉彩底或深色卡内做团队介绍。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| name | 姓名（无头像时回退首字） | string | — |
| role | 角色/职位 | string | — |
| bio | 简介文案 | string | — |
| avatar | 头像图片地址 | string | — |
| avatar-size | 头像尺寸（px 或 EwAvatar 预设） | number / string | `72` |
| plain | 朴素形态（无卡面） | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| name / role / bio | 姓名/角色/简介覆写 |
| stats | 数据行（常放 EwStatistic） |
| social | 社交链接行（常放 EwIconButton） |
