# 布局与导航壳

移动页面的骨架由三段组成：**顶部导航栏**（返回 + 标题 + 右侧动作）、**中部内容滚动区**（单列信息流）、**底部固定区**（标签栏或吸底操作栏）。桌面端的「侧边菜单 + 面包屑 + 内容区」三栏结构在移动端整体让位给这一垂直壳，层级关系由页栈导航承担。

## 完整页面壳

下方演示是一个可交互的最小壳：底部标签栏切换四个真实页签，内容区独立滚动。桌面文档页里它呈现为居中手机列；真机上删除外壳装饰后即为全宽页面（配合 `max-width: 420px` 的页面壳居中，见[适配总览](/mobile/)）。

<DemoBlock>
<MobileStage>
  <div v-if="activeTab === 'home'" class="mb-page">
    <div class="mb-greet">早上好，李工</div>
    <div class="mb-sub">9 月 8 日 星期二 · 有 3 个待办</div>
    <div class="mb-stats">
      <div class="mb-stat"><span class="mb-stat__label">本月报销（元）</span><span class="mb-stat__value">12,480</span></div>
      <div class="mb-stat"><span class="mb-stat__label">待我审批</span><span class="mb-stat__value">6</span></div>
      <div class="mb-stat"><span class="mb-stat__label">进行中项目</span><span class="mb-stat__value">4</span></div>
      <div class="mb-stat"><span class="mb-stat__label">未读消息</span><span class="mb-stat__value">12</span></div>
    </div>
    <div class="mb-card">
      <ev-cell-stack main="差旅报销单 CL-0908-01" sub="¥1,860 · 待审批" />
      <ev-cell-stack main="服务器扩容审批" sub="张三提交于 10:24" />
    </div>
  </div>
  <div v-else-if="activeTab === 'orders'" class="mb-page">
    <ev-segmented v-model="orderRange" block :options="['本周', '本月', '本季']" />
    <div class="mb-card mb-card--pad">
      <div class="mb-card__head">
        <span class="mb-card__title">差旅报销单 CL-0908-01</span>
        <ev-status-tag value="pending" :statuses="orderStatuses" />
      </div>
      <div class="mb-card__foot">
        <span class="mb-card__amount is-primary">¥1,860</span>
        <ev-button size="small" plain>查看详情</ev-button>
      </div>
    </div>
    <div class="mb-card mb-card--pad">
      <div class="mb-card__head">
        <span class="mb-card__title">办公用品采购 PO-0905-07</span>
        <ev-status-tag value="approved" :statuses="orderStatuses" />
      </div>
      <div class="mb-card__foot">
        <span class="mb-card__amount is-primary">¥432</span>
        <ev-button size="small" plain>查看详情</ev-button>
      </div>
    </div>
  </div>
  <div v-else-if="activeTab === 'msgs'" class="mb-page">
    <ev-button style="align-self: flex-end;" size="small" plain @click="msgs.forEach((m) => (m.read = true)); $message.success('已全部标记为已读')">全部已读</ev-button>
    <div class="mb-card">
      <ev-cell-stack v-for="m in msgs" :key="m.id" :main="m.title" :sub="m.time" @click="m.read = true">
        <template #sub>
          <span style="display: inline-flex; align-items: center; gap: 6px;">{{ m.time }}<i v-if="!m.read" style="width: 8px; height: 8px; border-radius: 50%; background: var(--ev-color-danger, #f54a45); display: inline-block;" /></span>
        </template>
      </ev-cell-stack>
    </div>
  </div>
  <div v-else class="mb-page">
    <div class="mb-card mb-card--pad" style="display: flex; align-items: center; gap: 12px;">
      <ev-avatar :size="48">李</ev-avatar>
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-size: 16px; font-weight: 600; color: var(--bd-text);">李工</span>
        <span style="font-size: 12px; color: var(--bd-text-tertiary);">交付部 · 项目管理</span>
      </div>
    </div>
    <div class="mb-card">
      <ev-cell-stack main="我的报销单" sub="本月 4 笔" />
      <ev-cell-stack main="消息设置" sub="审批提醒已开启" />
      <ev-cell-stack main="账号安全" sub="上次登录 今天 08:12" />
    </div>
    <ev-button style="margin-top: 8px;" plain type="danger" @click="$message.info('演示环境，退出仅作提示')">退出登录</ev-button>
  </div>
  <template #bottom>
    <ev-tabbar v-model="activeTab" :fixed="false">
      <ev-tabbar-item name="home">首页</ev-tabbar-item>
      <ev-tabbar-item name="orders">订单</ev-tabbar-item>
      <ev-tabbar-item name="msgs" :badge="unreadCount || ''">消息</ev-tabbar-item>
      <ev-tabbar-item name="mine">我的</ev-tabbar-item>
    </ev-tabbar>
  </template>
</MobileStage>
</DemoBlock>

实现要点：

- **内容区独立滚动**。滚动发生在壳的内容区（`overflow-y: auto` + `overscroll-behavior: contain`），标签栏吸底不动，避免整页滚动把标签栏推走。
- **未读角标实时联动**。Tabbar 的角标读数来自页面状态（`unreadCount`），点按消息或「全部已读」后角标即时消失——标签栏不是静态装饰，必须与页面数据同源。
- **真机固定吸底 + 安全区自动适配**。页面上使用 `fixed` 默认值：脱离文档流吸底、`safe-area-inset-bottom` 自动适配全面屏并渲染等高占位；演示壳内用 `:fixed="false"` 内联（见 [Tabbar](/mobile/components/tabbar)）。
- **业务自有吸底元素用 `useSafeArea()`**。悬浮 CTA、吸底提交栏等自绘吸底元素，读取实时 insets 并补写 viewport 标记（不调用它，`env()` 在缺 `viewport-fit=cover` 的页面恒为 0）：

```js
import { useSafeArea, ensureViewportFit } from '@wil-works/evoke-business-ui'

ensureViewportFit()
const safeArea = useSafeArea() // 响应式 { top, bottom, left, right }
```

```html
<div class="float-cta" :style="{ paddingBottom: safeArea.bottom + 'px' }">…</div>
```

<script setup>
import { computed, ref } from 'vue'

const draft = ref({ type: '差旅', amount: '', reason: '' })
const activeTab = ref('home')
const orderRange = ref('本月')
const msgs = ref([
  { id: 1, title: '您的报销单已通过初审', time: '10:24', read: false },
  { id: 2, title: '「9 月迭代」有新的评论', time: '09:41', read: false },
  { id: 3, title: '系统将于今晚 22:00 升级', time: '昨天', read: true },
])
const unreadCount = computed(() => msgs.value.filter((m) => !m.read).length)
const orderStatuses = [
  { value: 'pending', label: '审批中', type: 'warning' },
  { value: 'approved', label: '已通过', type: 'success' },
]
const detailStatuses = orderStatuses
</script>

## 顶部导航栏

二级页面的导航栏承担三件事：返回上一页（替代桌面面包屑，见[页面导航](/mobile/navigation)）、标注当前位置（标题即位置）、承载页面级动作（右侧动作位放一个高频操作，不放按钮组）。

<DemoBlock>
<MobileStage title="订单详情">
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__head">
        <span class="mb-card__title">差旅报销单 CL-0908-01</span>
        <ev-status-tag value="pending" :statuses="detailStatuses" />
      </div>
      <div class="mb-card__rows">
        <div><div class="mb-card__label">申请人</div><div class="mb-card__value">李工</div></div>
        <div><div class="mb-card__label">提交时间</div><div class="mb-card__value">09-08 10:24</div></div>
        <div><div class="mb-card__label">报销类型</div><div class="mb-card__value">差旅</div></div>
        <div><div class="mb-card__label">关联项目</div><div class="mb-card__value">智慧园区一期</div></div>
      </div>
    </div>
    <div class="mb-card">
      <ev-cell-stack main="审批轨迹 · 张三已通过" sub="09-08 11:02" />
      <ev-cell-stack main="审批轨迹 · 财务复核中" sub="待处理" />
    </div>
  </div>
  <template #action>
    <span style="font-size: 14px; color: var(--bd-primary);" @click="$message.success('已催办审批人')">催办</span>
  </template>
</MobileStage>
</DemoBlock>

规则：标题始终居中且可截断；右侧动作位只放**一个**文字级高频操作（如「催办」「保存」），更多操作进底部动作面板（见[反馈与浮层](/mobile/feedback)），不要在导航栏堆按钮组。

## 吸底操作栏

表单页的主按钮吸底，与标签栏互斥（一页只保留一个底部固定区）。内容不足一屏时按钮贴近表单，超屏滚动时按钮始终可见。

<DemoBlock>
<MobileStage title="新建报销单">
  <div class="mb-page">
    <ev-form label-position="top">
      <ev-form-item label="报销类型"><ev-segmented v-model="draft.type" block :options="['差旅', '招待', '办公']" /></ev-form-item>
      <ev-form-item label="金额（元）"><ev-input v-model="draft.amount" placeholder="0.00" inputmode="decimal" /></ev-form-item>
      <ev-form-item label="事由"><ev-input v-model="draft.reason" placeholder="简要说明报销事由" /></ev-form-item>
    </ev-form>
  </div>
  <template #bottom>
    <div class="mb-submit">
      <ev-button type="primary" @click="$message.success('已提交审批（演示）')">提交审批</ev-button>
    </div>
  </template>
</MobileStage>
</DemoBlock>

吸底栏真机适配：`padding-bottom: calc(12px + env(safe-area-inset-bottom))`，按钮宽度撑满减去左右 16px 页边距。
