# AvatarGroup 头像组

`EvAvatarGroup` 将多个头像层叠排布，用于团队成员、协作者与参与用户等群体展示。
超过 `max` 数量时自动折叠为 `+N` 计数；层叠缝隙带页面底色描边，明暗主题下都干净。

## 基础用法

<DemoBlock title="层叠与溢出折叠" description="max 控制直接展示的数量，剩余折叠为 +N。">

<div style="display:flex; align-items:center; gap:32px; flex-wrap:wrap;">
  <EvAvatarGroup
    :items="[{ name: '林一舟' }, { name: 'Ada Lovelace' }, { name: 'Wen' }, { name: 'K' }]"
    :max="3"
  />
  <EvAvatarGroup
    :items="[{ icon: 'github' }, { icon: 'vue' }, { icon: 'react' }]"
  />
</div>

```vue
<EvAvatarGroup :items="team" :max="3" />
<EvAvatarGroup :items="[{ icon: 'github' }, { icon: 'vue' }]" />
```

</DemoBlock>

## 搭配文字

<DemoBlock title="信任背书位" description="常与一句说明并置，用于落地页的信任背书。">

<div style="display:flex; align-items:center; gap:12px;">
  <EvAvatarGroup
    :items="[{ name: '林一舟' }, { name: 'Ada' }, { name: 'Wen' }, { name: 'Ming' }, { name: 'Zoe' }]"
    :max="4"
  />
  <span style="font-size:13px; color:var(--ev-text-secondary);">已有 <b style="color:var(--ev-text-primary)">12,800+</b> 位创作者加入</span>
</div>

```vue
<EvAvatarGroup :items="users" :max="4" />
<span>已有 12,800+ 位创作者加入</span>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 头像项 `[{ src?, name?, icon?, alt? }]`，字段同 EvAvatar | array | `[]` |
| max | 直接展示上限，溢出折叠为 +N（0 表示全部展示） | number | `0` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 追加自定义头像（置于折叠计数之前） |
