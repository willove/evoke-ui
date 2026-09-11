# Avatar 头像

头像组件：支持图片地址（加载失败自动回退到默认插槽）、文字内容与三档尺寸，圆形与方形两种形状；AvatarGroup 将相邻头像叠放显示，并统一向子头像注入 size / shape。头像也可与 Badge 组合显示未读数。

## 基础用法

`size` 传数字时按像素渲染（宽高与行高同步），传 small / default / large 走三档（24 / 40 / 56px）；`shape="square"` 切换方形。

<DemoBlock>
  <eb-space size="middle" style="margin-right: 24px;">
    <eb-avatar src="https://avatars.githubusercontent.com/u/1?v=4" alt="用户头像" />
    <eb-avatar size="small" src="https://avatars.githubusercontent.com/u/2?v=4" />
    <eb-avatar size="large" src="https://avatars.githubusercontent.com/u/3?v=4" />
    <eb-avatar :size="64" src="https://avatars.githubusercontent.com/u/4?v=4" />
  </eb-space>
  <eb-space size="middle">
    <eb-avatar>W</eb-avatar>
    <eb-avatar shape="square">W</eb-avatar>
    <eb-avatar shape="square" size="large" src="https://avatars.githubusercontent.com/u/5?v=4" />
  </eb-space>
</DemoBlock>

## 文字头像

无 `src` 时直接渲染默认插槽内容，可通过样式定制底色与字号，常用于姓名首字、团队名。

<DemoBlock>
  <eb-space size="middle">
    <eb-avatar style="background: var(--eb-color-primary);">W</eb-avatar>
    <eb-avatar style="background: var(--eb-color-success); font-size: 18px;">wil</eb-avatar>
    <eb-avatar shape="square" style="border-radius: 6px;">团队</eb-avatar>
  </eb-space>
</DemoBlock>

## 加载失败回退

`src` 加载失败（onerror）时自动切换为默认插槽内容；未提供插槽则显示为空白底。`alt` 与 `srcSet` 透传给 img。

<DemoBlock>
  <eb-space size="middle">
    <eb-avatar src="https://invalid.example.com/a.png">回</eb-avatar>
    <eb-avatar src="https://invalid.example.com/b.png" size="large" alt="加载失败示例">
      <span style="font-size: 12px;">N/A</span>
    </eb-avatar>
  </eb-space>
</DemoBlock>

## 头像组叠放

AvatarGroup 统一注入 size 与 shape，相邻头像自动叠放并带背景描边；组内末尾常放置计数头像（如 +3）表示更多成员。

<DemoBlock>
  <eb-space size="middle">
    <eb-avatar-group :size="40">
      <eb-avatar src="https://avatars.githubusercontent.com/u/1?v=4" />
      <eb-avatar src="https://avatars.githubusercontent.com/u/2?v=4" />
      <eb-avatar src="https://avatars.githubusercontent.com/u/3?v=4" />
      <eb-avatar>+3</eb-avatar>
    </eb-avatar-group>
    <eb-avatar-group shape="square" size="small">
      <eb-avatar src="https://avatars.githubusercontent.com/u/4?v=4" />
      <eb-avatar src="https://avatars.githubusercontent.com/u/5?v=4" />
      <eb-avatar src="https://avatars.githubusercontent.com/u/6?v=4" />
    </eb-avatar-group>
  </eb-space>
</DemoBlock>

## 组内单项覆盖

子头像显式指定 size（非 default）时以子头像为准，可突出关键成员；shape 则由组统一决定，子级设置会被组覆盖。

<DemoBlock>
  <eb-avatar-group size="small" shape="circle">
    <eb-avatar src="https://avatars.githubusercontent.com/u/1?v=4" />
    <eb-avatar :size="48" src="https://avatars.githubusercontent.com/u/2?v=4" />
    <eb-avatar src="https://avatars.githubusercontent.com/u/3?v=4" />
  </eb-avatar-group>
</DemoBlock>

## 与徽标组合

头像与 Badge 组合展示未读数或在线状态，Badge 自动定位到头像右上角。

<DemoBlock>
  <eb-space size="middle">
    <eb-badge :value="6">
      <eb-avatar src="https://avatars.githubusercontent.com/u/1?v=4" />
    </eb-badge>
    <eb-badge is-dot>
      <eb-avatar src="https://avatars.githubusercontent.com/u/2?v=4" />
    </eb-badge>
    <eb-badge value="TOP">
      <eb-avatar shape="square" size="large">W</eb-avatar>
    </eb-badge>
  </eb-space>
</DemoBlock>

## API

<ApiTable title="Avatar Props" :rows="[
  { name: 'size', desc: '尺寸，数字按像素，否则走三档（24 / 40 / 56px）', type: 'number | small | default | large', default: 'default' },
  { name: 'src', desc: '图片地址，加载失败时回退到默认插槽', type: 'string', default: '' },
  { name: 'srcSet', desc: '图片 srcset，透传给 img', type: 'string', default: '' },
  { name: 'alt', desc: '图片描述文本，透传给 img', type: 'string', default: '' },
  { name: 'shape', desc: '形状（组内会被 AvatarGroup 的 shape 覆盖）', type: 'circle | square', default: 'circle' },
  { name: 'icon', desc: '预留图标名（当前版本未参与渲染）', type: 'string', default: '' },
]" />

<ApiTable title="AvatarGroup Props" :rows="[
  { name: 'size', desc: '统一注入子头像的尺寸（子头像显式指定非 default 尺寸时以子头像为准）', type: 'number | small | default | large', default: 'default' },
  { name: 'shape', desc: '统一注入子头像的形状（优先于子头像自身设置）', type: 'circle | square', default: 'circle' },
]" />

<ApiTable title="Avatar Slots" :rows="[
  { name: 'default', desc: '无图或加载失败时的回退内容', type: '—', default: '—' },
]" />
