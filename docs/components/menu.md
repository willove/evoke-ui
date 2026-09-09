# Menu 导航菜单

> 移动端：多级菜单压平为底部标签栏 + 返回栏，参见 [移动端 · 布局与导航壳](/mobile/layout)。

<script setup>
import { ref } from 'vue'

const lastSelect = ref('')
function onSelect(index, indexPath) {
  lastSelect.value = `${index}（路径：${indexPath.join(' > ')}）`
}
</script>

后台系统的垂直 / 水平导航：菜单项点击激活高亮，子菜单在垂直模式 inline 展开、水平或折叠模式弹层浮出，支持分组、折叠、唯一展开与 router 模式跳转。

## 基础用法

通过 `default-active` 指定默认激活项（对应 menu-item 的 index），`ev-sub-menu` 包裹二级菜单，`ev-menu-item-group` 为菜单项分区。

<DemoBlock>
  <ev-menu style="width: 240px;" default-active="2-1">
    <ev-menu-item index="1">首页</ev-menu-item>
    <ev-menu-item-group title="业务">
      <ev-sub-menu index="2" title="订单管理">
        <ev-menu-item index="2-1">订单列表</ev-menu-item>
        <ev-menu-item index="2-2" disabled>退款售后</ev-menu-item>
      </ev-sub-menu>
    </ev-menu-item-group>
  </ev-menu>
</DemoBlock>

## 水平模式

`mode` 设为 'horizontal' 渲染为顶栏：菜单项横排，激活项底部高亮，子菜单 hover 弹层浮出。

<DemoBlock>
  <ev-menu mode="horizontal" default-active="1">
    <ev-menu-item index="1">首页</ev-menu-item>
    <ev-sub-menu index="2" title="产品">
      <ev-menu-item index="2-1">组件库</ev-menu-item>
      <ev-menu-item index="2-2">设计规范</ev-menu-item>
    </ev-sub-menu>
    <ev-menu-item index="3">关于</ev-menu-item>
  </ev-menu>
</DemoBlock>

## 折叠模式

垂直菜单设 `collapse` 收窄为 64px 图标栏，子菜单转为右侧弹层；折叠后菜单项仅展示图标，需自备图标（子菜单同理，建议用图标替代文字标题）。

<DemoBlock>
  <ev-menu collapse default-active="1" style="width: 64px;">
    <ev-menu-item index="1">
      <ev-icon name="home-filled" />
    </ev-menu-item>
    <ev-sub-menu index="2">
      <template #title>
        <ev-icon name="document" />
      </template>
      <ev-menu-item index="2-1">订单列表</ev-menu-item>
      <ev-menu-item index="2-2">退款售后</ev-menu-item>
    </ev-sub-menu>
  </ev-menu>
</DemoBlock>

## 唯一展开与默认展开

`unique-opened` 保证同时只展开一个子菜单，展开新项时自动收起已展开项；`default-openeds` 传入 index 数组指定初始展开的子菜单。

<DemoBlock>
  <ev-menu unique-opened :default-openeds="['2']" style="width: 240px;">
    <ev-sub-menu index="2" title="订单管理">
      <ev-menu-item index="2-1">订单列表</ev-menu-item>
      <ev-menu-item index="2-2">退款售后</ev-menu-item>
    </ev-sub-menu>
    <ev-sub-menu index="3" title="系统设置">
      <ev-menu-item index="3-1">成员管理</ev-menu-item>
      <ev-menu-item index="3-2">日志审计</ev-menu-item>
    </ev-sub-menu>
  </ev-menu>
</DemoBlock>

## router 模式与 select 事件

任意菜单项被点击都会触发根组件的 `select` 事件（参数为 index 与 indexPath 数组）；开启 `router` 后由注入的 router 执行跳转（菜单项 `route` 属性可覆盖跳转目标，缺省用 index）。本站未接入路由，点击仅演示事件回传。

<DemoBlock>
  <ev-menu router default-active="/orders" style="width: 240px;" @select="onSelect">
    <ev-menu-item index="/home">首页</ev-menu-item>
    <ev-menu-item index="/orders" :route="{ path: '/orders/list' }">订单列表</ev-menu-item>
    <ev-menu-item index="/settings">系统设置</ev-menu-item>
  </ev-menu>
  <p style="margin-top: 8px; font-size: 13px; color: #909399;">最近选中：{{ lastSelect || '点击菜单项试试' }}</p>
</DemoBlock>

## 点击触发的弹层子菜单

`menu-trigger` 控制弹层子菜单（水平模式或折叠态垂直模式）的打开方式，默认 'hover'，设为 'click' 后需点击标题才展开弹层。

<DemoBlock>
  <ev-menu mode="horizontal" menu-trigger="click" default-active="1">
    <ev-menu-item index="1">首页</ev-menu-item>
    <ev-sub-menu index="2" title="消息中心">
      <ev-menu-item index="2-1">系统通知</ev-menu-item>
      <ev-menu-item index="2-2">互动消息</ev-menu-item>
    </ev-sub-menu>
    <ev-menu-item index="3">设置</ev-menu-item>
  </ev-menu>
</DemoBlock>

## API

<ApiTable title="Menu Props" :rows="[
  { name: 'mode', desc: '模式', type: 'vertical | horizontal', default: 'vertical' },
  { name: 'default-active', desc: '默认激活菜单项的 index', type: 'string', default: '' },
  { name: 'default-openeds', desc: '默认展开的 sub-menu index 数组', type: 'array', default: '[]' },
  { name: 'collapse', desc: '折叠为图标栏（仅垂直模式，折叠后子菜单转弹层）', type: 'boolean', default: 'false' },
  { name: 'unique-opened', desc: '同时只展开一个子菜单', type: 'boolean', default: 'false' },
  { name: 'menu-trigger', desc: '弹层子菜单触发方式（水平 / 折叠态生效）', type: 'hover | click', default: 'hover' },
  { name: 'router', desc: '路由模式：选中后用注入的 router 跳转（route 属性或缺省 index 作为目标）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Menu Events" :rows="[
  { name: 'select', desc: '菜单项被点击激活', type: '(index, indexPath) => void', default: '—' },
  { name: 'open', desc: '子菜单展开', type: '(index, openedMenus) => void', default: '—' },
  { name: 'close', desc: '子菜单收起', type: '(index, openedMenus) => void', default: '—' },
]" />

<ApiTable title="MenuItem Props" :rows="[
  { name: 'index', desc: '唯一标识（必填），激活判定与 select 事件回传', type: 'string | number', default: '—' },
  { name: 'route', desc: 'router 模式跳转目标（路由地址或 location 对象），缺省用 index', type: 'string | object', default: '—' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
]" />

<ApiTable title="SubMenu Props" :rows="[
  { name: 'index', desc: '唯一标识（必填），展开态记录于根组件 openedMenus', type: 'string | number', default: '—' },
  { name: 'title', desc: '子菜单标题（title 插槽兜底）', type: 'string', default: '' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'show-timeout / hide-timeout', desc: '弹层展开 / 收起延时（hover 触发）', type: 'number', default: '150 / 300' },
  { name: 'popper-class', desc: '弹层自定义类名', type: 'string', default: '' },
]" />

<ApiTable title="MenuItemGroup Props" :rows="[
  { name: 'title', desc: '分组标题（title 插槽兜底）', type: 'string', default: '' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: 'Menu / SubMenu / MenuItemGroup 的菜单内容', type: '—', default: '—' },
  { name: 'title', desc: 'SubMenu / MenuItemGroup 的标题，缺省渲染 title 属性', type: '—', default: '—' },
  { name: 'default（MenuItem）', desc: '菜单项内容，可内嵌 ev-icon（折叠态仅展示图标）', type: '—', default: '—' },
]" />
