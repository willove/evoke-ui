# Container 布局容器

页面外层骨架的 flex 容器，与 EvHeader / EvAside / EvMain / EvFooter 搭配搭建后台框架。容器默认渲染为 `section` 元素（`tag` 可更换）；`direction` 缺省时自动检测：默认插槽的子级包含 EvHeader 或 EvFooter 即纵向（column），否则横向（row）。容器可任意嵌套；Aside 固定不收缩（内容滚动），Main 自动占满剩余空间并自带内边距与滚动。

## 经典后台布局

外层容器子级含 Header 与 Footer，自动纵向；中层容器只含 Aside 与 Main，自动横向，形成上中下加左右侧栏的经典后台骨架。

<DemoBlock>
<ev-container style="height:240px;">
  <ev-header style="background:#eef3ff;border-radius:4px;line-height:56px;">Header</ev-header>
  <ev-container>
    <ev-aside style="background:#f4f4f5;border-radius:4px;padding:16px;">Aside</ev-aside>
    <ev-main style="background:#eef3ff;border-radius:4px;padding:16px;">Main</ev-main>
  </ev-container>
  <ev-footer style="background:#f4f4f5;border-radius:4px;line-height:48px;">Footer</ev-footer>
</ev-container>
</DemoBlock>

## 上中下布局

不含侧边栏的纵向结构：Header 与 Footer 高度固定（默认 60px，可用 `height` 属性调整），Main 撑满剩余高度并独立滚动。

<DemoBlock>
<ev-container style="height:160px;">
  <ev-header height="48px" style="background:#eef3ff;border-radius:4px;line-height:48px;">Header</ev-header>
  <ev-main style="background:#f4f4f5;border-radius:4px;padding:16px;">Main</ev-main>
  <ev-footer height="40px" style="background:#eef3ff;border-radius:4px;line-height:40px;">Footer</ev-footer>
</ev-container>
</DemoBlock>

## 横向布局

子级只含 Aside / Main 时自动横向排布，常用于内容区内部的左右分栏。

<DemoBlock>
<ev-container style="height:120px;">
  <ev-aside style="background:#eef3ff;border-radius:4px;padding:16px;">Aside</ev-aside>
  <ev-main style="background:#f4f4f5;border-radius:4px;padding:16px;">Main</ev-main>
</ev-container>
</DemoBlock>

## 显式指定方向与标签

`direction` 传 vertical / horizontal 可覆盖自动检测（例如子级是自定义组件、探测不到 EvHeader / EvFooter 时需要显式声明）；`tag` 可更换渲染元素。

<DemoBlock>
<ev-container direction="vertical" tag="div" style="height:120px;">
  <ev-header style="background:#eef3ff;border-radius:4px;line-height:56px;">Header</ev-header>
  <ev-main style="background:#f4f4f5;border-radius:4px;padding:16px;">Main</ev-main>
</ev-container>
</DemoBlock>

## 嵌套布局

容器可任意嵌套：内层容器同样参与方向自动检测（子级含 EvHeader 即纵向），常用于主内容区内部的工具条与分栏。

<DemoBlock>
<ev-container style="height:280px;border:1px solid #e4e7ed;border-radius:6px;overflow:hidden;">
  <ev-header style="background:#eef3ff;line-height:56px;">顶部导航</ev-header>
  <ev-container>
    <ev-aside width="160px" style="background:#f4f4f5;padding:16px;">菜单</ev-aside>
    <ev-container>
      <ev-header height="44px" style="background:#f9fafc;line-height:44px;">面包屑 / 工具条</ev-header>
      <ev-main style="background:#eef3ff;">主内容区，可继续嵌套 Row / Col 排版</ev-main>
    </ev-container>
  </ev-container>
</ev-container>
</DemoBlock>

## 主内容区配合栅格

ev-main 自带内边距与滚动，内部直接用 Row / Col 排版内容块，构成完整的页面级布局。

<DemoBlock>
<ev-container style="height:180px;">
  <ev-header style="background:#eef3ff;border-radius:4px;line-height:48px;height:48px;">Header</ev-header>
  <ev-main style="background:#f9fafc;">
    <ev-row :gutter="12">
      <ev-col :span="12"><div style="background:#eef3ff;border-radius:4px;padding:16px;">统计卡 A</div></ev-col>
      <ev-col :span="12"><div style="background:#dce6ff;border-radius:4px;padding:16px;">统计卡 B</div></ev-col>
    </ev-row>
  </ev-main>
</ev-container>
</DemoBlock>

## 使用提示

- 自动检测只看默认插槽的直接子级组件名（EvHeader / EvFooter），Fragment 会展开递归查找；子级是自定义组件时请显式传 `direction`。
- ev-container / ev-main 均设置 `flex: 1`，多层嵌套时每层都会正确伸缩；ev-aside `flex-shrink: 0` 且 `overflow: auto`。
- ev-header / ev-footer 通过 `height` 属性控制高度，ev-aside 通过 `width` 控制宽度，均支持任意 CSS 长度值。

## API

<ApiTable title="Container Props" :rows="[
  { name: 'direction', desc: '布局方向，缺省自动检测（默认插槽子级含 EvHeader / EvFooter 则纵向）', type: 'horizontal | vertical', default: '' },
  { name: 'tag', desc: '自定义元素标签', type: 'string', default: 'section' },
]" />

<ApiTable title="Container Slots" :rows="[
  { name: 'default', desc: '容器内容，可放 EvHeader / EvAside / EvMain / EvFooter 或嵌套 EvContainer', type: '—', default: '—' },
]" />

<ApiTable title="Header / Aside / Main / Footer Props" :rows="[
  { name: 'height（EvHeader / EvFooter）', desc: '区域高度', type: 'string', default: '60px' },
  { name: 'width（EvAside）', desc: '侧栏宽度', type: 'string', default: '300px' },
  { name: 'tag', desc: '自定义元素标签（Header / Aside / Main / Footer 分别默认 header / aside / main / footer）', type: 'string', default: '见描述' },
]" />

<ApiTable title="Header / Aside / Main / Footer Slots" :rows="[
  { name: 'default', desc: '各区域内容，四个子组件均只提供默认插槽', type: '—', default: '—' },
]" />
