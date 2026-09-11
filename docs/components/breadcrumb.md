# Breadcrumb 面包屑

> 移动端：层级链由返回栏承担，参见 [移动端 · 页面导航](/mobile/navigation)。

显示当前页面在层级结构中的位置：支持插槽式与 items 配置式两种写法，设置 `to` 的项渲染为链接样式，点击时优先用注入的 router 跳转，http(s) 外链则直接整页跳转；分隔符支持文本与图标两种形式。

## 基础用法

按挂载顺序自动识别最后一项为当前页（不带分隔符、无链接样式），其余项设 `to` 后呈现可点击的链接态。

<DemoBlock>
  <eb-breadcrumb>
    <eb-breadcrumb-item to="/">首页</eb-breadcrumb-item>
    <eb-breadcrumb-item to="/project">项目管理</eb-breadcrumb-item>
    <eb-breadcrumb-item>项目详情</eb-breadcrumb-item>
  </eb-breadcrumb>
</DemoBlock>

## 配置式用法

传入 `items` 数组即可渲染，适合由路由表或后台菜单驱动的场景；item 的 `icon` 渲染为前置图标（字符串图标名），`to` / `replace` 语义与插槽式一致。

<DemoBlock>
  <eb-breadcrumb :items="[
    { label: '首页', icon: 'home-filled', to: '/' },
    { label: '内容管理', icon: 'folder', to: '/content' },
    { label: '文章详情' },
  ]" />
</DemoBlock>

## 对象地址与 replace 模式

`to` 可传路由 location 对象（如 `{ path: '/project' }`）；`replace` 为 true 时使用 router.replace 跳转，不留历史记录。应用未注入 router 时仅 http(s) 字符串外链会跳转（window.location），对象地址不产生动作，生产环境请配合 vue-router 使用。

<DemoBlock>
  <eb-breadcrumb>
    <eb-breadcrumb-item :to="{ path: '/' }">首页</eb-breadcrumb-item>
    <eb-breadcrumb-item :to="{ path: '/project' }" replace>项目管理</eb-breadcrumb-item>
    <eb-breadcrumb-item>项目详情</eb-breadcrumb-item>
  </eb-breadcrumb>
</DemoBlock>

## 外链跳转

`to` 为 http(s) 地址时点击直接整页跳转（window.location），不依赖 router 注入，适合跨越到外部系统的入口（点击会离开当前文档站）。

<DemoBlock>
  <eb-breadcrumb>
    <eb-breadcrumb-item to="/">首页</eb-breadcrumb-item>
    <eb-breadcrumb-item to="https://www.example.com">组件库官网</eb-breadcrumb-item>
    <eb-breadcrumb-item>当前页</eb-breadcrumb-item>
  </eb-breadcrumb>
</DemoBlock>

## 插槽自定义内容

默认插槽完全自定义项内容，可混排图标、文本等元素；不影响最后一项判定与分隔符渲染。

<DemoBlock>
  <eb-breadcrumb separator-icon="arrow-right">
    <eb-breadcrumb-item to="/">
      <eb-icon name="home-filled" :size="14" style="vertical-align: -2px; margin-right: 4px;" />首页
    </eb-breadcrumb-item>
    <eb-breadcrumb-item to="/content">文档中心</eb-breadcrumb-item>
    <eb-breadcrumb-item>组件总览</eb-breadcrumb-item>
  </eb-breadcrumb>
</DemoBlock>

## 自定义分隔符

`separator` 自定义分隔文本；`separator-icon` 设置图标后替代文本，两者均由 item 从父级注入。`separator-spacing` 调整分隔符与两侧项的间距（数字按 px，字符串支持 px / pt / em 等单位）。

<DemoBlock>
  <eb-breadcrumb separator="|" style="margin-bottom: 12px;">
    <eb-breadcrumb-item>首页</eb-breadcrumb-item>
    <eb-breadcrumb-item>商品</eb-breadcrumb-item>
    <eb-breadcrumb-item>详情</eb-breadcrumb-item>
  </eb-breadcrumb>
  <eb-breadcrumb separator-icon="arrow-right" :separator-spacing="4" style="margin-bottom: 12px;">
    <eb-breadcrumb-item>首页</eb-breadcrumb-item>
    <eb-breadcrumb-item>订单</eb-breadcrumb-item>
    <eb-breadcrumb-item>订单详情</eb-breadcrumb-item>
  </eb-breadcrumb>
  <eb-breadcrumb separator="/" separator-spacing="16px">
    <eb-breadcrumb-item>首页</eb-breadcrumb-item>
    <eb-breadcrumb-item>活动管理</eb-breadcrumb-item>
    <eb-breadcrumb-item>活动详情</eb-breadcrumb-item>
  </eb-breadcrumb>
</DemoBlock>

## API

<ApiTable title="Breadcrumb Props" :rows="[
  { name: 'items', desc: '配置式数据源：[{ label, to, replace, icon }]，传入后忽略默认插槽之外的写法', type: 'array', default: '—' },
  { name: 'separator', desc: '分隔符文本', type: 'string', default: '/' },
  { name: 'separator-icon', desc: '分隔符图标名（设置后替代文本）', type: 'string', default: '' },
  { name: 'separator-spacing', desc: '分隔符左右间距：数字按 px，字符串支持任意 CSS 单位（如 8px / 6pt / 0.5em）', type: 'number | string', default: '—' },
]" />

<ApiTable title="BreadcrumbItem Props" :rows="[
  { name: 'to', desc: '跳转目标：路由地址 / location 对象 / http(s) 外链；设置后渲染链接样式', type: 'string | object', default: '' },
  { name: 'replace', desc: '跳转时使用 router.replace 而非 push', type: 'boolean', default: 'false' },
]" />

<ApiTable title="BreadcrumbItem Slots" :rows="[
  { name: 'default', desc: '项内容（配置式 items 时为 label 文本 + 前置图标）', type: '—', default: '—' },
]" />

<ApiTable title="Breadcrumb Slots" :rows="[
  { name: 'default', desc: '手写 eb-breadcrumb-item 列表（传入 items 时配置项与插槽项按声明顺序共同渲染）', type: '—', default: '—' },
]" />
