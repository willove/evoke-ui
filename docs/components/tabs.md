# Tabs 标签页

<script setup>
import { ref } from 'vue'

const active = ref('user')
const editableTabs = ref([
  { label: '订单', name: 'order' },
  { label: '商品', name: 'goods' },
  { label: '对账', name: 'bill' },
])
const editableActive = ref('order')
let tabSeed = 0
function addTab() {
  tabSeed += 1
  const name = `tab-${tabSeed}`
  editableTabs.value.push({ label: `新标签 ${tabSeed}`, name })
  editableActive.value = name
}
function removeTab(pane) {
  const idx = editableTabs.value.findIndex((t) => t.name === pane.paneName)
  if (idx !== -1) editableTabs.value.splice(idx, 1)
}
</script>

以标签方式组织同层级内容区块：tab-pane 注册式声明，标题栏自动生成跟随激活项的指示条，支持 card / border-card 风格、四向标签位置、动态增删与懒渲染，v-model 双向绑定当前激活项。容器宽度不足时（移动端、窄侧栏）页签自动进入横向滚动，激活项始终滚入可视区，见 [移动端 · 页面导航](/mobile/navigation)。

## 基础用法

未传 v-model 时默认激活第一个 pane；`name` 缺省时以 `label` 作为标识；pane 设 `disabled` 后标签不可点击。

<DemoBlock>
  <ev-tabs>
    <ev-tab-pane label="用户管理" name="user">用户管理内容</ev-tab-pane>
    <ev-tab-pane label="角色管理" name="role">角色管理内容</ev-tab-pane>
    <ev-tab-pane label="操作日志" name="log" disabled>日志内容</ev-tab-pane>
  </ev-tabs>
</DemoBlock>

## v-model 绑定与程序切换

v-model 绑定当前激活 pane 的 name，点击与外部改写双向同步，外部赋值即可程序化切换标签。

<DemoBlock>
  <ev-tabs v-model="active">
    <ev-tab-pane label="用户管理" name="user">用户管理内容</ev-tab-pane>
    <ev-tab-pane label="角色管理" name="role">角色管理内容</ev-tab-pane>
    <ev-tab-pane label="操作日志" name="log">日志内容</ev-tab-pane>
  </ev-tabs>
  <p style="margin-top: 8px; font-size: 13px; color: #909399;">当前激活：{{ active }}</p>
  <ev-button @click="active = 'log'">切到操作日志</ev-button>
</DemoBlock>

## 卡片风格

type 为 'card' 时标签呈卡片拼接，'border-card' 时整体渲染为带边框底色的卡片。

<DemoBlock>
  <ev-tabs type="card">
    <ev-tab-pane label="标签一" name="a">卡片风格内容</ev-tab-pane>
    <ev-tab-pane label="标签二" name="b" closable>内容二</ev-tab-pane>
  </ev-tabs>
  <ev-tabs type="border-card" style="margin-top: 16px;">
    <ev-tab-pane label="标签一" name="a">边框卡片内容</ev-tab-pane>
    <ev-tab-pane label="标签二" name="b">内容二</ev-tab-pane>
  </ev-tabs>
</DemoBlock>

## 标签位置

`tab-position` 支持 top / right / bottom / left，指示条方向自适应。

<DemoBlock>
  <ev-tabs tab-position="left" style="height: 160px;">
    <ev-tab-pane label="概览" name="overview">左侧标签内容</ev-tab-pane>
    <ev-tab-pane label="配置" name="config">配置内容</ev-tab-pane>
    <ev-tab-pane label="日志" name="log">日志内容</ev-tab-pane>
  </ev-tabs>
</DemoBlock>

## 动态增删标签

pane 设 `closable` 显示关闭图标，点击触发 `tab-remove`（参数为 pane 对象，含 paneName）并从组件内注销，需在回调中同步移除数据源；配合按钮追加数据实现新增。根组件设 `editable` 后不渲染关闭图标，用于纯新增场景。

<DemoBlock>
  <ev-button style="margin-bottom: 8px;" @click="addTab">新增标签</ev-button>
  <ev-tabs v-model="editableActive" @tab-remove="removeTab">
    <ev-tab-pane v-for="t in editableTabs" :key="t.name" :label="t.label" :name="t.name" closable>
      {{ t.label }}内容
    </ev-tab-pane>
  </ev-tabs>
</DemoBlock>

## 懒渲染

`lazy`（根级或单 pane 级）开启后，内容延迟到首次激活才渲染，适合图表等开销大的面板；渲染过即保持挂载，切回不重复初始化。

<DemoBlock>
  <ev-tabs lazy>
    <ev-tab-pane label="常规" name="a">随组件一起挂载的内容</ev-tab-pane>
    <ev-tab-pane label="懒加载" name="b">首次激活后才挂载这段内容</ev-tab-pane>
  </ev-tabs>
</DemoBlock>

## API

<ApiTable title="Tabs Props" :rows="[
  { name: 'v-model', desc: '当前激活 pane 的 name', type: 'string | number', default: '' },
  { name: 'type', desc: '风格类型，空字符串为默认线条风格', type: 'card | border-card', default: '' },
  { name: 'tab-position', desc: '标签位置', type: 'top | right | bottom | left', default: 'top' },
  { name: 'closable', desc: '声明于根组件，未级联至子项（以 pane 的 closable 为准）', type: 'boolean', default: 'false' },
  { name: 'editable', desc: '编辑态，为 true 时不渲染关闭图标', type: 'boolean', default: 'false' },
  { name: 'lazy', desc: '全局懒渲染（激活过才渲染内容）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="TabPane Props" :rows="[
  { name: 'label', desc: '标签标题（name 缺省时兼作标识）', type: 'string', default: '' },
  { name: 'name', desc: '标识，对应 v-model 的值', type: 'string | number', default: '' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'closable', desc: '显示关闭图标，点击触发 tab-remove 并注销该 pane', type: 'boolean', default: 'false' },
  { name: 'lazy', desc: '当前项懒渲染（优先于根级 lazy）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Tabs Events" :rows="[
  { name: 'update:model-value', desc: '激活项变化时同步 v-model', type: '(name) => void', default: '—' },
  { name: 'tab-click', desc: '标签被点击（禁用项不触发）', type: '(pane) => void', default: '—' },
  { name: 'tab-change', desc: '激活项变化', type: '(name) => void', default: '—' },
  { name: 'tab-remove', desc: '关闭标签（先于注销，需同步移除数据源）', type: '(pane) => void', default: '—' },
  { name: 'edit', desc: '编辑动作（当前仅 remove）', type: '(name, action) => void', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default（Tabs）', desc: 'tab-pane 列表', type: '—', default: '—' },
  { name: 'label（TabPane）', desc: '自定义标签标题（替代 label 文本）', type: '—', default: '—' },
  { name: 'default（TabPane）', desc: '标签页内容', type: '—', default: '—' },
]" />

<ApiTable title="Tabs Methods" :rows="[
  { name: 'currentName', desc: '当前激活项标识（ref）', type: 'Ref<string | number>', default: '—' },
  { name: 'activeTab', desc: '当前激活项标识（兼容别名，同 currentName）', type: 'ComputedRef<string | number>', default: '—' },
]" />
