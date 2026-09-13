# Tabbar 底部标签栏

`EvTabbar` + `EvTabbarItem` 提供移动端一级导航：固定吸底（fixed）+ 全面屏安全区适配 +
等高占位（placeholder，防止脱离文档流后遮挡内容尾部）。页内内容切换由业务持有
`v-model`；页签未设 `name` 时以注册顺序索引为标识。`fixed: false` 可作为普通块级
标签栏内联使用（如卡片底部、演示壳内）。

## 基础用法

<DemoBlock title="吸底标签栏 + 内容切换" description="fixed 模式吸底（真机自动适配安全区）；v-model 驱动页内切换。演示壳内用 fixed=false 内联。">

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
      <ev-tabbar-item name="discover" icon="search" badge="5">发现</ev-tabbar-item>
      <ev-tabbar-item name="mine" icon="user">我的</ev-tabbar-item>
    </ev-tabbar>
  </template>
</MobileStage>

```vue
<script setup>
import { ref } from 'vue'

const tab = ref('home')
</script>

<template>
  <component :is="pages[tab]" />

  <!-- 真机：fixed 吸底 + 安全区适配 + 自动占位 -->
  <EvTabbar v-model="tab">
    <EvTabbarItem name="home" icon="home">首页</EvTabbarItem>
    <EvTabbarItem name="discover" icon="search" badge="5">发现</EvTabbarItem>
    <EvTabbarItem name="mine" icon="user">我的</EvTabbarItem>
  </EvTabbar>
</template>
```

</DemoBlock>

<script setup>
import { ref } from 'vue'

const tab = ref('home')
const tab2 = ref('feed')
const tabContent = {
  home: { title: '首页', desc: '精选内容与推荐位' },
  discover: { title: '发现', desc: '5 条新内容待浏览' },
  mine: { title: '我的', desc: '个人资料与设置' },
}
</script>

## 图标与红点

页签图标用 `icon` 属性（EvIcon 注册名），需要区分选中态时用 `#icon` 插槽
（参数 `active`）；`dot` 红点与 `badge` 角标都渲染在图标右上角，dot 优先。

<DemoBlock title="icon 插槽 + dot/badge" description="#icon 插槽按 active 切换填充风格；「消息」红点常亮。">

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
          <ev-icon :name="active ? 'star-fill' : 'star'" :size="20" />
        </template>
        订阅
      </ev-tabbar-item>
      <ev-tabbar-item name="msg" icon="chat" dot>消息</ev-tabbar-item>
      <ev-tabbar-item name="me" icon="user" badge="New">我的</ev-tabbar-item>
    </ev-tabbar>
  </template>
</MobileStage>

```vue
<EvTabbar v-model="tab">
  <EvTabbarItem name="feed">
    <template #icon="{ active }">
      <EvIcon :name="active ? 'star-fill' : 'star'" :size="20" />
    </template>
    订阅
  </EvTabbarItem>
  <EvTabbarItem name="msg" icon="chat" dot>消息</EvTabbarItem>
  <EvTabbarItem name="me" icon="user" badge="New">我的</EvTabbarItem>
</EvTabbar>
```

</DemoBlock>

## API

### EvTabbar

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | string / number | '' | 当前激活项标识（v-model） |
| fixed | boolean | true | 吸底固定；false 时内联使用 |
| placeholder | boolean | true | fixed 时渲染等高占位 |
| border | boolean | true | 顶部分隔线 |
| safe-area-inset-bottom | boolean | true | 适配全面屏底部安全区 |
| glass | boolean | — | 磨砂玻璃标签栏；缺省跟随全局（ConfigProvider glass） |
| blur | number / string | — | 磨砂强度（px），内联覆盖 `--ev-glass-blur` |

### EvTabbarItem

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| name | string / number | '' | 标识，缺省用注册顺序索引 |
| icon | string | '' | 图标名（EvIcon 注册名） |
| dot | boolean | false | 红点（优先于 badge） |
| badge | string / number | '' | 角标内容 |
| disabled | boolean | false | 禁用切换 |

### 事件与插槽

- EvTabbar：`change(value)` / `update:modelValue`；无插槽。
- EvTabbarItem：`#icon` 插槽参数 `{ active }`；默认插槽为文字标签。
