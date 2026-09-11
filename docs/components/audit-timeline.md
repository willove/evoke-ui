# AuditTimeline 审计时间线

面向操作审计的时间线：操作者头像色按名字稳定取色，时间放轴对侧，字段级 diff 可展开查看变更前后值。

规则要点：

- 操作者名依次取 `operator`、`user`，都没有时显示 `系统`；同名操作者永远得到同一节点色；
- 仅当 `expandable` 为真且该条 `diff` 非空时才显示展开按钮，按钮文案为展开变更（条数）；
- `before` 为 undefined 或空串时显示（空），适合新建类记录（无变更前值）；
- 展开键为 `item.id`（缺省用下标），因此受控/非受控都建议给每条记录配稳定 `id`。

## 基础用法

<DemoBlock>
  <eb-audit-timeline
    :items="[
      { id: 'a1', operator: '张三', action: '更新了订单金额', createdAt: '2026-09-05 10:00', diff: [{ field: '金额', before: 100, after: 200 }] },
      { id: 'a2', operator: '李四', action: '创建了订单', createdAt: '2026-09-05 09:00', detail: '来源：后台录入' },
    ]"
  />
</DemoBlock>

<script setup>
import { ref } from 'vue'
const atExpanded = ref(['a1'])
const atItems = [
  { id: 'a1', operator: '张三', action: '更新了订单金额', createdAt: '2026-09-05 10:00', detail: '风控审核通过', diff: [{ field: '金额', before: 100, after: 200 }, { field: '备注', before: '', after: '加急处理' }] },
  { id: 'a2', user: '李四', action: '创建了订单', createdAt: '2026-09-05 09:00', detail: '来源：后台录入' },
  { id: 'a3', action: '自动对账', createdAt: '2026-09-05 08:00', diff: [{ field: '差异笔数', before: 3, after: 0 }] },
]
</script>

## 受控展开

传 `expanded-items`（可配 `v-model:expanded-items`）即为受控模式，展开状态交给外部，便于默认展开某条或跨组件联动；未传时组件内部维护展开状态。本例默认展开 `a1`，其中备注字段的 `before` 为空串，渲染为（空）。

<DemoBlock>
  <eb-audit-timeline
    v-model:expanded-items="atExpanded"
    :items="atItems"
  />
  <p style="margin-top: 8px;">当前展开 {{ atExpanded.length }} 条变更明细</p>
</DemoBlock>

`a2` 没有 `diff`（不显示按钮），`a3` 没有 `operator / user`（显示为系统）。无论受控与否，每次切换都会 emit `expand-change`，携带展开键数组。

## 关闭展开

`expandable: false` 隐藏全部展开按钮，diff 内容不再可见，时间线退化为纯流水。

<DemoBlock>
  <eb-audit-timeline :items="atItems" :expandable="false" />
</DemoBlock>

## 自定义格式化

`formatTime` 与 `formatDiffValue` 分别接管时间与 diff 值的展示，例如时间戳转本地格式、数值千分位。

<DemoBlock>
  <eb-audit-timeline
    :items="[
      { id: 'b1', operator: '王五', action: '调整了库存', createdAt: 1757032800000, diff: [{ field: '库存', before: 10, after: 998000 }] },
    ]"
    :format-time="(t) => new Date(t).toLocaleString()"
    :format-diff-value="(v) => (typeof v === 'number' ? v.toLocaleString() : String(v))"
  />
</DemoBlock>

## 常见问题

- 展开按钮不显示：确认 `expandable` 未被关闭，且该条 `diff` 是非空数组；
- 受控模式下点击无反应：需要监听 `update:expandedItems`（或用 `v-model:expanded-items`）并回写，组件不会修改外部数组；
- 记录很多时建议在组件外层自行分页或虚拟滚动，组件只负责渲染传入的 `items`；
- 展开状态以 `id` 为键，列表重排或追加记录时已展开项不会错位，因此务必保证 `id` 稳定唯一。

## API

<ApiTable title="AuditTimeline Props" :rows="[
  { name: 'items', desc: '审计记录', type: 'Item[]', default: '[]' },
  { name: 'expandable', desc: '允许展开 diff', type: 'boolean', default: 'true' },
  { name: 'expandedItems', desc: '受控展开项（item.id，未传则内部维护）', type: 'array', default: '—' },
  { name: 'formatTime', desc: '时间格式化', type: '(t) => string', default: '(t) => String(t)' },
  { name: 'formatDiffValue', desc: 'diff 值格式化', type: '(v) => string', default: '(v) => String(v)' },
]" />

<ApiTable title="Item" :rows="[
  { name: 'id', desc: '唯一标识（展开状态键，缺省用下标）', type: 'string | number', default: '—' },
  { name: 'operator / user', desc: '操作者（取色与展示，依次取 operator、user）', type: 'string', default: '系统' },
  { name: 'action', desc: '操作描述', type: 'string', default: '' },
  { name: 'createdAt', desc: '时间（显示在轴对侧）', type: 'string | number', default: '—' },
  { name: 'detail', desc: '补充说明', type: 'string', default: '—' },
  { name: 'diff', desc: '字段变更数组，项为 { field, before, after }；before 为空时显示（空）', type: 'array', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'expand-change', desc: '展开项变化（受控/非受控都触发）', type: '(keys: array) => void', default: '—' },
  { name: 'update:expandedItems', desc: '受控展开更新', type: '(keys: array) => void', default: '—' },
]" />

本组件无插槽与实例方法，纯展示。
