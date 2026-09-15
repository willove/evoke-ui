# AppToolbar 应用工具栏

列表页顶部的标准工具栏：内置搜索框（v-model），左侧筛选插槽 + 右侧动作插槽，与 [SearchFilter](/components/search-filter)、[DataTable](/components/data-table) 组成列表页三件套。

## 基础用法

<DemoBlock>
  <eb-app-toolbar v-model="keyword" search-placeholder="搜订单号 / 客户名">
    <template #filters>
      <eb-select v-model="status" placeholder="全部状态" style="width:140px">
        <eb-option value="paid" label="已支付" />
        <eb-option value="pending" label="待支付" />
      </eb-select>
    </template>
    <template #actions>
      <eb-button type="primary" @click="created++">新建订单</eb-button>
    </template>
  </eb-app-toolbar>
  <eb-text size="small" type="info" style="margin-top:8px;display:block">关键词：{{ keyword || '—' }} · 状态：{{ status || '全部' }} · 已建 {{ created }} 单</eb-text>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const keyword = ref('')
const status = ref('')
const created = ref(0)
</script>

<ApiTable title="AppToolbar Props" :rows="[
  { name: 'modelValue', desc: '搜索关键词（v-model）', type: 'string', default: '' },
  { name: 'searchable', desc: '显示内置搜索框', type: 'boolean', default: 'true' },
  { name: 'search-placeholder', desc: '搜索占位文案', type: 'string', default: '搜索...' },
]" />

<ApiTable title="AppToolbar Slots" :rows="[
  { name: 'filters', desc: '搜索框右侧的筛选控件区', type: '—', default: '—' },
  { name: 'actions', desc: '右侧动作区', type: '—', default: '—' },
]" />
