# Tabbar 底部标签栏

移动端一级导航：`EvTabbar` + `EvTabbarItem` 固定吸底（fixed）+ 全面屏安全区适配 +
等高占位（placeholder，防止脱离文档流后遮挡内容尾部）。页内内容切换由业务持有
`v-model`；页签未设 `name` 时以注册顺序索引为标识。`fixed: false` 可作为普通块级
标签栏内联使用（如卡片底部、演示壳内）。多级菜单压平为底部页签的完整规则见
[移动端 · 布局与导航壳](/mobile/layout)。

## 基础用法

<DemoBlock>
<MobileStage>
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">{{ tabContent[tab].title }}</div>
      <div class="mb-card__label" style="margin-top: 4px;">{{ tabContent[tab].desc }}</div>
    </div>
  </div>
  <template #bottom>
    <ev-tabbar v-model="tab" :fixed="false">
      <ev-tabbar-item name="home" icon="home">首页</ev-tabbar-item>
      <ev-tabbar-item name="orders" icon="file-list" badge="6">订单</ev-tabbar-item>
      <ev-tabbar-item name="msgs" icon="chat" dot>消息</ev-tabbar-item>
      <ev-tabbar-item name="mine" icon="user">我的</ev-tabbar-item>
    </ev-tabbar>
  </template>
</MobileStage>
</DemoBlock>

```html
<!-- 真机：fixed 吸底 + 安全区适配 + 自动占位，内容切换由 v-model 驱动 -->
<ev-tabbar v-model="tab">
  <ev-tabbar-item name="home" icon="home">首页</ev-tabbar-item>
  <ev-tabbar-item name="orders" icon="file-list" badge="6">订单</ev-tabbar-item>
  <ev-tabbar-item name="msgs" icon="chat" dot>消息</ev-tabbar-item>
  <ev-tabbar-item name="mine" icon="user">我的</ev-tabbar-item>
</ev-tabbar>
```

```js
const tab = ref('home')
// watch(tab) 切换页内内容；跨页跳转直接 tab.value = 'mine'
```

要点：

- **吸底三件**：`fixed` 脱离文档流吸底、`safe-area-inset-bottom` 适配全面屏安全区、
  `placeholder` 自动渲染等高占位——三者默认全开，普通页面零配置。
- **未读表达**：`dot` 红点与 `badge` 角标都渲染在图标右上角，dot 优先；角标读数来自
  页面状态，标签栏与页面数据同源。

## 图标与选中态

页签图标用 `icon` 属性（ev-icon 名）；需要区分选中态时用 `#icon` 插槽（参数
`active`）。未注册的图标名需先注册（见 [Icon](/components/icon)）。

<DemoBlock>
<MobileStage>
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__title">当前所在：{{ tab2 }}</div>
    </div>
  </div>
  <template #bottom>
    <ev-tabbar v-model="tab2" :fixed="false">
      <ev-tabbar-item name="feed">
        <template #icon="{ active }">
          <ev-icon name="star" :size="20" :style="{ color: active ? 'var(--ev-color-primary)' : 'var(--ev-text-color-secondary)' }" />
        </template>
        订阅
      </ev-tabbar-item>
      <ev-tabbar-item name="msg" icon="chat" dot>消息</ev-tabbar-item>
      <ev-tabbar-item name="me" icon="user" badge="New">我的</ev-tabbar-item>
    </ev-tabbar>
  </template>
</MobileStage>
</DemoBlock>

## API

<ApiTable title="Tabbar Props" :rows="[
  { name: 'v-model', desc: '当前激活项标识（v-model）', type: 'string | number', default: `''` },
  { name: 'fixed', desc: '吸底固定；false 时作为普通块级标签栏内联使用', type: 'boolean', default: 'true' },
  { name: 'placeholder', desc: 'fixed 时渲染等高占位', type: 'boolean', default: 'true' },
  { name: 'border', desc: '顶部分隔线', type: 'boolean', default: 'true' },
  { name: 'safe-area-inset-bottom', desc: '适配全面屏底部安全区', type: 'boolean', default: 'true' },
]" />

<ApiTable title="TabbarItem Props" :rows="[
  { name: 'name', desc: '标识，缺省用注册顺序索引', type: 'string | number', default: `''` },
  { name: 'icon', desc: '图标名（ev-icon），自定义选中态用 #icon 插槽', type: 'string', default: `''` },
  { name: 'dot', desc: '红点提醒（优先于 badge）', type: 'boolean', default: 'false' },
  { name: 'badge', desc: '角标内容', type: 'string | number', default: `''` },
  { name: 'disabled', desc: '禁用切换', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Tabbar Events" :rows="[
  { name: 'change', desc: '激活项变化', type: '(name) => void', default: '—' },
  { name: 'update:modelValue', desc: 'v-model 同步', type: '(name) => void', default: '—' },
]" />

<ApiTable title="TabbarItem Slots" :rows="[
  { name: 'icon', desc: '自定义图标，支持选中态切换', type: '{ active }', default: 'icon 属性' },
  { name: 'default', desc: '文字标签', type: '—', default: '—' },
]" />

<script setup>
import { ref } from 'vue'

const tab = ref('home')
const tab2 = ref('feed')
const tabContent = {
  home: { title: '首页', desc: '快捷数据与待办' },
  orders: { title: '订单', desc: '6 笔进行中' },
  msgs: { title: '消息', desc: '有未读消息' },
  mine: { title: '我的', desc: '个人资料与设置' },
}
</script>
