# PageHeader 页头

页面顶部标准头：主标题 + 副标题 + 右侧动作区，中后台详情页、列表页的开头统一结构。

## 基础用法

<DemoBlock>
  <eb-page-header title="订单详情" />
</DemoBlock>

## 副标题与动作区

动作区通过 `actions` 插槽放置操作按钮：

<DemoBlock>
  <eb-page-header title="订单管理" subtitle="共 1,284 条待处理">
    <template #actions>
      <eb-button type="primary" @click="created++">新建订单</eb-button>
      <eb-button @click="exported = true">导出</eb-button>
    </template>
  </eb-page-header>
  <eb-text v-if="created" size="small" type="info" style="margin-top:8px">已创建 {{ created }} 张订单</eb-text>
  <eb-text v-if="exported" size="small" type="success" style="margin-top:8px">导出任务已提交</eb-text>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const created = ref(0)
const exported = ref(false)
</script>

<ApiTable title="PageHeader Props" :rows="[
  { name: 'title', desc: '主标题', type: 'string', default: '—' },
  { name: 'subtitle', desc: '副标题', type: 'string', default: '' },
]" />

<ApiTable title="PageHeader Slots" :rows="[
  { name: 'actions', desc: '右侧动作区', type: '—', default: '—' },
]" />
