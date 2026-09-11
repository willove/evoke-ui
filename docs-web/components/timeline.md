# Timeline 时间线

`EvTimeline` 以竖向时间线展示更新日志、版本历史或里程碑。最新条目的圆点默认着主色并带
光晕，`tag` 字段直接复用 [EvTag](./tag) 的色调体系标注条目类型。

## 基础用法

<DemoBlock title="更新日志" description="date + tag + 标题 + 描述四要素；首条高亮表示最新。">

<EvTimeline
  :items="[
    { date: '2026-09-01', tag: '新功能', title: '团队空间上线', description: '共享文档、评论协作与权限管理一步到位。' },
    { date: '2026-08-15', tag: '优化', tagTone: 'success', title: '同步引擎提速', description: '增量同步，平均耗时降低 60%。' },
    { date: '2026-07-30', tag: '修复', tagTone: 'warning', title: '离线冲突处理', description: '修复多端同时编辑时的极小概率冲突。' },
  ]"
/>

```vue
<EvTimeline :items="[
  { date: '2026-09-01', tag: '新功能', title: '团队空间上线', description: '…' },
  { date: '2026-08-15', tag: '优化', tagTone: 'success', title: '同步引擎提速' },
]" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 条目 `[{ date?, tag?, tagTone?, title, description? }]` | array | `[]` |
| highlight-latest | 最新条目圆点着主色 | boolean | `true` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| title | 标题覆写（作用域插槽：`{ item, index }`） |
| description | 描述覆写（作用域插槽：`{ item, index }`） |
