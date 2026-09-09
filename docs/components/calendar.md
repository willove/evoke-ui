# Calendar 日历

月/年双模式日历面板：支持事件标记、禁用日期、周起始日切换与范围限制，可用于日程概览或轻量排期。

## 基础用法

<DemoBlock>
  <div style="max-width: 640px">
    <ev-calendar v-model="date" :events="events" @select="onSelect" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--ev-text-color-secondary);">
      当前选中：{{ date ? date.toLocaleDateString('zh-CN') : '—' }}
    </p>
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const date = ref(new Date())
const y = new Date().getFullYear()
const m = new Date().getMonth()
const events = [
  { date: new Date(y, m, 5), label: '版本发布', color: 'primary' },
  { date: new Date(y, m, 12), label: '季度评审', color: 'warning' },
  { date: new Date(y, m, 18), label: '需求冻结', color: 'danger' },
]
function onSelect(d) {}
</script>

## Calendar API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | Date | 今天 | 当前选中日期（v-model） |
| mode | String | `month` | month / year |
| events | Array | `[]` | 事件项 `{ date, label, color }` |
| disabled-date | Function | — | `(date) => boolean` 禁用日期 |
| first-day-of-week | Number | `1` | 周起始：0 周日 / 1 周一 |
| range | Array | — | 可选范围 `[start, end]` |

事件：`select(date)`、`panel-change({ year, month })`、`event-click(event)`。
