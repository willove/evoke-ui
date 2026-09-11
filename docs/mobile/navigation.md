# 页面导航

桌面的导航组件各管一段（Menu 管站点结构、Breadcrumb 管位置、Pagination 管翻页），移动端把它们压缩进两条动线：**底部标签栏管一级入口，页栈返回管层级**，中途的分页与页签则换成滚动与加载。

## 一级导航：底部标签栏

Menu 的多级树在移动端压平为 3–5 个底部页签，规则见[布局与导航壳](/mobile/layout)。超过 5 个一级入口说明信息架构需要重组：把低频入口合并进「我的 / 更多」页签的功能列表，而不是造「更多」标签页里再套九宫格。

## 位置感：返回栏替代面包屑

Breadcrumb 在移动端没有生存空间——窄屏放不下层级链，用户也不读。位置感由三件事共同承担：导航栏**标题即当前位置**、左上角**返回箭头**即上一级、必要时在页面内用「来源」单元格说明从哪来（如审批消息点进来的单据，在详情页标出来源渠道）。

<DemoBlock>
<MobileStage title="订单详情">
  <div class="mb-page">
    <div class="mb-card">
      <eb-cell-stack main="来自消息 · 审批提醒" sub="09-08 10:24 · 张三推送给您" />
      <eb-divider style="margin: 0;" />
      <eb-cell-stack main="差旅报销单 CL-0908-01" sub="¥1,860 · 审批中" />
    </div>
    <div class="mb-divider-text" style="padding: 0;">左上角返回箭头回到消息列表，层级由页栈管理</div>
  </div>
</MobileStage>
</DemoBlock>

## 页签：窄容器横向滚动

Tabs 在窄容器（375px 视口、手机侧栏）下自动进入**横向滚动**模式：页签溢出时可横滑（触控与滚轮皆可），激活页签自动滚入可视区，无需任何额外配置。这是本库为移动场景补齐的组件能力——此前超宽页签会被静默裁剪。

<DemoBlock>
<MobileStage title="项目动态">
  <div class="mb-page mb-page--flush">
    <eb-tabs v-model="tab">
      <eb-tab-pane v-for="t in tabPanes" :key="t.name" :label="t.label" :name="t.name">
        <div class="mb-page" style="padding-top: 12px;">
          <div class="mb-card">
            <eb-cell-stack v-for="item in t.items" :key="item.main" :main="item.main" :sub="item.sub" />
          </div>
        </div>
      </eb-tab-pane>
    </eb-tabs>
  </div>
</MobileStage>
</DemoBlock>

实现说明：溢出检测由组件内 ResizeObserver 驱动，容器变宽（旋转屏、窗口拉伸）时自动退出滚动态；「全部」这类入口型页签放第一位，激活时自动滚回最左。桌面宽容器下行为不变。

## 长列表：加载更多替代页码器

Pagination 的页码跳转在触屏上没有意义（用户不会「想去第 4 页」），改为**加载更多**按钮或触底自动加载；信息尾态用「没有更多了」收束，配合计数说明已加载数量。

<DemoBlock>
<MobileStage title="报销单">
  <div class="mb-page">
    <div class="mb-list-gap">
      <div v-for="o in loaded" :key="o.id" class="mb-card mb-card--pad">
        <div class="mb-card__head">
          <span class="mb-card__title">{{ o.id }}</span>
          <eb-status-tag :value="o.status" :statuses="statuses" />
        </div>
        <div class="mb-card__rows">
          <div><div class="mb-card__label">申请人</div><div class="mb-card__value">{{ o.owner }}</div></div>
          <div><div class="mb-card__label">金额</div><div class="mb-card__value">¥{{ o.amount.toLocaleString() }}</div></div>
        </div>
      </div>
    </div>
    <eb-load-more v-model:status="loadStatus" :auto-load="false" @load-more="loadMore" />
  </div>
</MobileStage>
</DemoBlock>

下方演示即 [LoadMore](/mobile/components/load-more) 组件（`:auto-load="false"` 改为点击触发，
便于观察；真机保持默认，滚动距底部 `preload` px 内自动触发）。触底自动加载的判定挂在
内容滚动区（IntersectionObserver 观察哨兵元素，组件已内置「最近滚动祖先」探测），不要挂
`window`——移动页面滚动发生在壳的内容区，见[布局与导航壳](/mobile/layout)。

<script setup>
import { ref } from 'vue'

const tab = ref('all')
const tabPanes = [
  {
    name: 'all', label: '全部动态',
    items: [
      { main: '王芳上传了 3 个设计稿', sub: '10 分钟前' },
      { main: '李工完成了里程碑 M3 验收', sub: '1 小时前' },
      { main: '系统 · 昨日构建全部通过', sub: '昨天 22:04' },
    ],
  },
  {
    name: 'dev', label: '开发进展',
    items: [
      { main: '工单系统提测', sub: '今天 09:30' },
      { main: '支付网关联调完成', sub: '昨天 17:12' },
    ],
  },
  {
    name: 'design', label: '设计资源',
    items: [
      { main: '移动端组件规范 v2', sub: '09-06 更新' },
      { main: '图标库新增 24 枚', sub: '09-02 更新' },
    ],
  },
  {
    name: 'review', label: '待我评审',
    items: [
      { main: '报销流程改造方案', sub: '今天 11:00 截止' },
      { main: '登录页改版视觉稿', sub: '明天 18:00 截止' },
    ],
  },
  {
    name: 'released', label: '已发布',
    items: [
      { main: 'v2.4.0 灰度发布', sub: '09-07' },
      { main: 'v2.3.2 全量', sub: '08-30' },
    ],
  },
  {
    name: 'archived', label: '归档',
    items: [
      { main: '一期验收材料', sub: '08-12 归档' },
    ],
  },
]

const statuses = [
  { value: 'pending', label: '审批中', type: 'warning' },
  { value: 'approved', label: '已通过', type: 'success' },
]
const pool = [
  { id: 'CL-0908-01', owner: '李工', amount: 1860, status: 'pending' },
  { id: 'PO-0905-07', owner: '王芳', amount: 432, status: 'approved' },
  { id: 'CL-0901-03', owner: '张三', amount: 3260, status: 'pending' },
  { id: 'CL-0829-02', owner: '赵六', amount: 980, status: 'approved' },
]
const loaded = ref(pool.slice(0, 2))
const loadStatus = ref('idle')
function loadMore() {
  // 组件触发时已置 loading；加载完成后按余量改回 idle / noMore
  setTimeout(() => {
    const next = pool.slice(loaded.value.length, loaded.value.length + 2)
    loaded.value = loaded.value.concat(next)
    loadStatus.value = loaded.value.length >= pool.length ? 'noMore' : 'idle'
  }, 600)
}
</script>
