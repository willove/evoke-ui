# 数据录入

移动端表单的三条铁律：**标签上置**（`label-position="top"`，窄屏上左右结构会让输入区不足 200px）、**能选不输**（枚举字段一律底部选择面板，日期用面板点选，自由文本只留给「事由 / 备注」）、**主按钮吸底**（拇指收势位置，见[布局与导航壳](/mobile/layout)）。

## 表单页范式

下方演示覆盖了移动表单的四种典型控件：分段选择（互斥枚举）、底部选择面板（引用型字段）、日期快捷面板、多行文本。表单较长时内容区滚动，提交栏始终吸底。

<DemoBlock>
<MobileStage title="新建报销单">
  <div class="mb-page">
    <eb-form label-position="top">
      <eb-form-item label="报销类型"><eb-segmented v-model="draft.type" block :options="['差旅', '招待', '办公']" /></eb-form-item>
      <eb-form-item label="金额（元）"><eb-input v-model="draft.amount" placeholder="0.00" inputmode="decimal" /></eb-form-item>
      <eb-form-item label="所属项目">
        <div class="mb-field" @click="projectOpen = true">
          <span :class="['mb-field__value', { 'is-placeholder': !draft.project }]">{{ draft.project || '请选择项目' }}</span>
          <BdIcon name="arrow-right" :size="14" class="mb-field__arrow" />
        </div>
      </eb-form-item>
      <eb-form-item label="发生日期">
        <div class="mb-field" @click="dateOpen = true">
          <span :class="['mb-field__value', { 'is-placeholder': !draft.date }]">{{ draft.date || '请选择日期' }}</span>
          <BdIcon name="arrow-right" :size="14" class="mb-field__arrow" />
        </div>
      </eb-form-item>
      <eb-form-item label="事由"><eb-input v-model="draft.reason" type="textarea" :rows="3" placeholder="简要说明报销事由，方便审批人理解" /></eb-form-item>
    </eb-form>
  </div>
  <template #bottom>
    <div class="mb-submit">
      <eb-button type="primary" @click="onSubmit">提交审批</eb-button>
    </div>
  </template>
  <eb-drawer v-model="projectOpen" direction="btt" size="320px" :append-to-body="false" :lock-scroll="false" title="选择项目">
    <div class="mb-picker">
      <div v-for="p in projects" :key="p" :class="['mb-picker__item', { 'is-active': draft.project === p }]" @click="draft.project = p; projectOpen = false">
        <span>{{ p }}</span>
        <BdIcon v-if="draft.project === p" name="check" :size="16" />
      </div>
    </div>
  </eb-drawer>
  <eb-drawer v-model="dateOpen" direction="btt" size="300px" :append-to-body="false" :lock-scroll="false" title="发生日期">
    <div class="mb-picker">
      <div v-for="d in dateOptions" :key="d" :class="['mb-picker__item', { 'is-active': draft.date === d }]" @click="draft.date = d; dateOpen = false">
        <span>{{ d }}</span>
        <BdIcon v-if="draft.date === d" name="check" :size="16" />
      </div>
    </div>
  </eb-drawer>
</MobileStage>
</DemoBlock>

要点：

- **底部选择面板替代下拉 popper**。Select / Cascader / DatePicker 的弹出层在触屏上的正确形态是底部面板（`Drawer direction="btt"`）：选项纵向排布、点选即关、拇指可达。高频日期字段先给「今天 / 昨天 / 本周」快捷项，精确日期再进完整日历。
- **键盘类型跟字段走**。金额字段声明 `inputmode="decimal"` 唤起数字键盘，减少切换成本；`enterkeyhint` 按表单流向声明（下一项 / 完成）。
- **校验时机**。文本类字段失焦即校验（`blur`），选择类字段选中即校验（`change`）；错误内联在字段下方，不用弹窗报错。

## 列表筛选

桌面 SearchFilter 的多行筛选表单在移动端压缩为两段：**搜索框 + 分段器**直接外露（覆盖 80% 的筛选诉求），其余条件收进「筛选」底部面板。筛选状态变化即时生效，不需要「查询」按钮。

<DemoBlock>
<MobileStage title="报销单">
  <div class="mb-page">
    <eb-input v-model="keyword" placeholder="搜索单号或申请人" clearable>
      <template #prefix><BdIcon name="search" :size="14" /></template>
    </eb-input>
    <eb-segmented v-model="tab" block :options="['全部', '审批中', '已通过', '已驳回']" />
    <div class="mb-divider-text" style="padding: 0;">共 {{ filtered.length }} 条结果</div>
    <div class="mb-list-gap">
      <div v-for="o in filtered" :key="o.id" class="mb-card mb-card--pad">
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
    <div v-if="!filtered.length" class="mb-divider-text">没有匹配的报销单，换个关键词试试</div>
  </div>
</MobileStage>
</DemoBlock>

结果计数常驻（「共 N 条」），让筛选反馈可感知；空结果给引导文案而不是白屏（见 [Empty](/components/empty)）。

<script setup>
import { computed, ref } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'

const draft = ref({
  type: '差旅',
  amount: '',
  project: '',
  date: '',
  reason: '',
})
const projectOpen = ref(false)
const dateOpen = ref(false)
const projects = ['智慧园区一期', '中台改造', '数据大屏二期', '内部效能工具']
const dateOptions = ['今天', '昨天', '本周一', '上周五', '自定义…']
function onSubmit() {
  if (!draft.value.amount || !draft.value.project) {
    EbMessage.warning('请先填写金额并选择项目')
    return
  }
  EbMessage.success('已提交审批（演示）')
}

const keyword = ref('')
const tab = ref('全部')
const statuses = [
  { value: 'pending', label: '审批中', type: 'warning' },
  { value: 'approved', label: '已通过', type: 'success' },
  { value: 'rejected', label: '已驳回', type: 'danger' },
]
const pool = [
  { id: 'CL-0908-01', owner: '李工', amount: 1860, status: 'pending' },
  { id: 'PO-0905-07', owner: '王芳', amount: 432, status: 'approved' },
  { id: 'CL-0901-03', owner: '张三', amount: 3260, status: 'rejected' },
]
const filtered = computed(() => {
  const kw = keyword.value.trim()
  return pool.filter((o) => {
    const hitTab = tab.value === '全部' || statuses.find((s) => s.value === o.status)?.label === tab.value
    const hitKw = !kw || o.id.toLowerCase().includes(kw.toLowerCase()) || o.owner.includes(kw)
    return hitTab && hitKw
  })
})
</script>
