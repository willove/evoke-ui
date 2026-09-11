# 数据展示

桌面端的信息密度手段（宽表格、多栏描述列表、大数盘点）在移动端全部换一种载体：**表格 → 卡片列表**，**描述列表 → 分组单元格**，**统计区 → 2×2 网格**。字段的取舍比排布更重要——卡片上只留「决策需要」的字段，其余进详情。

## 表格 → 卡片列表

DataTable 在移动端不缩列、不出横向滚动条，而是把「一行」翻译成「一张卡片」：

| 表格列 | 卡片槽位 |
| --- | --- |
| 业务主键（单号） | 主行标题 |
| 状态列 | 主行右侧状态标签 |
| 金额 / 时间 / 负责人 | 两列字段网格（最多 4 格） |
| 操作列 | 底部金额 + 一个动作按钮 |

行点击进详情页承担「查看更多」，卡片内不再放第二、第三个操作按钮。

<DemoBlock>
<MobileStage title="报销单">
  <div class="mb-page">
    <eb-segmented v-model="status" block :options="['全部', '审批中', '已通过']" />
    <div class="mb-list-gap">
      <div v-for="o in filteredOrders" :key="o.id" class="mb-card mb-card--pad" @click="$message.info('进入详情页：' + o.id)">
        <div class="mb-card__head">
          <span class="mb-card__title">{{ o.id }}</span>
          <eb-status-tag :value="o.status" :statuses="statuses" />
        </div>
        <div class="mb-card__rows">
          <div><div class="mb-card__label">申请人</div><div class="mb-card__value">{{ o.owner }}</div></div>
          <div><div class="mb-card__label">提交时间</div><div class="mb-card__value">{{ o.time }}</div></div>
          <div><div class="mb-card__label">类型</div><div class="mb-card__value">{{ o.type }}</div></div>
          <div><div class="mb-card__label">关联项目</div><div class="mb-card__value">{{ o.project }}</div></div>
        </div>
        <div class="mb-card__foot">
          <span class="mb-card__amount is-primary">¥{{ o.amount.toLocaleString() }}</span>
          <eb-button size="small" plain @click.stop="$message.info('进入详情页：' + o.id)">查看详情</eb-button>
        </div>
      </div>
    </div>
    <div v-if="!filteredOrders.length" class="mb-divider-text">该状态下暂无报销单</div>
  </div>
</MobileStage>
</DemoBlock>

筛选器是移动列表的标配：分段器（`Segmented block`）承担高频枚举筛选，实时过滤当前列表；低频组合条件进「筛选」底部面板（见[数据录入](/mobile/data-entry)）。

## 描述列表 → 分组单元格

DetailDescriptions / Descriptions 的「label-value 对」在移动端改为**分组卡片 + 双行单元格**：相关字段聚成一组卡片，组内一行一个字段，读起来是「从上往下扫」，而不是桌面「从左往右对」。

<DemoBlock>
<MobileStage title="客户详情">
  <div class="mb-page">
    <div class="mb-card">
      <eb-cell-stack main="基本信息" sub="更新于 09-01" />
      <eb-divider style="margin: 0;" />
      <eb-cell-stack main="客户名称" sub="上海云启科技有限公司" />
      <eb-cell-stack main="行业" sub="软件与信息服务" />
      <eb-cell-stack main="规模" sub="200-500 人" />
    </div>
    <div class="mb-card">
      <eb-cell-stack main="商务信息" sub="归属：华东大区" />
      <eb-divider style="margin: 0;" />
      <eb-cell-stack main="客户等级" sub="A 级 · 年框客户" />
      <eb-cell-stack main="负责人" sub="李工 · 销售一部" />
      <eb-cell-stack main="下次跟进" sub="09-12（续约谈判）" />
    </div>
  </div>
</MobileStage>
</DemoBlock>

分组标题用 CellStack 的主行（加粗、小号），与字段行的区别靠前后间距，不再依赖桌面的分栏与分隔线。

## 统计区 → 2×2 网格

桌面顶部一排四五个 Statistic 在移动端折叠为 2×2 网格：数值保留，标签缩短，趋势说明（同比箭头、辅助文案）仅在空间富余时保留。超过 4 个指标说明还没想清楚移动端要什么——先做减法。

<DemoBlock>
<MobileStage title="经营概览">
  <div class="mb-page">
    <div class="mb-stats">
      <div class="mb-stat"><span class="mb-stat__label">本月营收（元）</span><span class="mb-stat__value">286,400</span></div>
      <div class="mb-stat"><span class="mb-stat__label">新增客户</span><span class="mb-stat__value">36</span></div>
      <div class="mb-stat"><span class="mb-stat__label">回款率</span><span class="mb-stat__value">92.4%</span></div>
      <div class="mb-stat"><span class="mb-stat__label">逾期订单</span><span class="mb-stat__value">3</span></div>
    </div>
    <div class="mb-divider-text">数据更新于 10:24 · 点按卡片查看明细</div>
  </div>
</MobileStage>
</DemoBlock>

<script setup>
import { computed, ref } from 'vue'

const status = ref('全部')
const statuses = [
  { value: 'pending', label: '审批中', type: 'warning' },
  { value: 'approved', label: '已通过', type: 'success' },
  { value: 'rejected', label: '已驳回', type: 'danger' },
]
const orders = [
  { id: 'CL-0908-01', owner: '李工', time: '09-08 10:24', type: '差旅', project: '智慧园区一期', amount: 1860, status: 'pending' },
  { id: 'PO-0905-07', owner: '王芳', time: '09-05 15:47', type: '办公', project: '—', amount: 432, status: 'approved' },
  { id: 'CL-0901-03', owner: '张三', time: '09-01 09:12', type: '差旅', project: '中台改造', amount: 3260, status: 'rejected' },
]
const filteredOrders = computed(() =>
  status.value === '全部' ? orders : orders.filter((o) => statuses.find((s) => s.value === o.status)?.label === status.value),
)
</script>
