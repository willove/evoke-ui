# GanttProgress 甘特式阶段进度

甘特式阶段进度柱：各阶段按状态（completed / active / pending）呈现不同高度与配色，贯穿连接线表达整体推进比例，active 阶段自带脉冲动画。适合项目里程碑、迭代阶段、上线流程等「阶段推进」场景。

## 基础用法

`stages` 数组声明各阶段，`status` 取 `completed / active / pending`，高度按状态自动区分（1 / 0.7 / 0.35）。

<DemoBlock>
  <eb-gantt-progress
    :stages="[
      { name: '需求评审', status: 'completed' },
      { name: '开发排期', status: 'completed' },
      { name: '迭代开发', status: 'active' },
      { name: '集成测试', status: 'pending' },
      { name: '发布上线', status: 'pending' },
    ]"
  />
</DemoBlock>

## 阶段日期标注

阶段可携带 `date` 字段，显示在阶段名下方（如计划完成时间）。

<DemoBlock>
  <eb-gantt-progress
    :stages="[
      { name: '立项', date: '09-01', status: 'completed' },
      { name: '设计', date: '09-08', status: 'completed' },
      { name: '研发', date: '09-26', status: 'active' },
      { name: '验收', date: '10-12', status: 'pending' },
    ]"
  />
</DemoBlock>

## 自定义阶段高度

`height` 覆盖状态默认高度（0 ~ 1，相对栅格总高的比例），可强调关键阶段。

<DemoBlock>
  <eb-gantt-progress
    :stages="[
      { name: '风险评审', status: 'completed', height: 0.5 },
      { name: '灰度发布', status: 'active', height: 1 },
      { name: '全量发布', status: 'pending', height: 0.8 },
      { name: '复盘', status: 'pending' },
    ]"
  />
</DemoBlock>

## 自定义颜色

`completed-color` / `active-color` / `pending-color` 三组颜色覆盖，可做健康度语义（如风险项转橙）。

<DemoBlock>
  <eb-gantt-progress
    completed-color="#22A45D"
    active-color="#E67E17"
    pending-color="#E5E7EB"
    :stages="[
      { name: '环境准备', status: 'completed' },
      { name: '数据迁移', status: 'completed' },
      { name: '联调中', status: 'active' },
      { name: '切流', status: 'pending' },
    ]"
  />
</DemoBlock>

## 项目落地：迭代里程碑

与 PageHeader / StatCard 组合成迭代进度计划视图（完整用法见[项目协作示例](/examples/project)）。

<DemoBlock>
  <div style="max-width: 640px;">
    <eb-section-card title="v2.3 迭代 · 里程碑推进">
      <eb-gantt-progress
        :stages="[
          { name: '需求冻结', date: '09-02', status: 'completed' },
          { name: '开发完成', date: '09-18', status: 'completed' },
          { name: '提测', date: '09-22', status: 'active' },
          { name: '回归通过', date: '09-28', status: 'pending' },
          { name: '发布', date: '09-30', status: 'pending' },
        ]"
      />
    </eb-section-card>
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'
</script>

## API

<ApiTable title="GanttProgress Props" :rows="[
  { name: 'stages', desc: '阶段数组：{ name, date?, status, height? }，status 取 completed / active / pending', type: 'array', default: '[]' },
  { name: 'completedColor', desc: '已完成阶段颜色', type: 'string', default: 'var(--eb-color-primary)' },
  { name: 'activeColor', desc: '进行中阶段颜色', type: 'string', default: 'var(--eb-color-primary)' },
  { name: 'pendingColor', desc: '未开始阶段颜色', type: 'string', default: 'var(--eb-border-color)' },
]" />

<ApiTable title="Stage 阶段项" :rows="[
  { name: 'name', desc: '阶段名称', type: 'string', default: '空字符串' },
  { name: 'date', desc: '阶段时间标注（如计划完成日期），非空时显示', type: 'string', default: '空字符串' },
  { name: 'status', desc: '阶段状态：completed / active / pending', type: 'string', default: 'pending' },
  { name: 'height', desc: '柱高比例（0 ~ 1），缺省按状态取 1 / 0.7 / 0.35', type: 'number', default: '—' },
]" />
