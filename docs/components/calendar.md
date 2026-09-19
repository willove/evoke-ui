# Calendar 日历

月/年双模式日历面板：支持事件标记、禁用日期、周起始日切换与范围限制，可用于日程概览或轻量排期。

## 基础用法

事件按 `date`（`YYYY-MM-DD` 字符串）匹配到格子，`content` 为事件文案，`type` 决定配色（primary / success / warning / danger）；点击事件条触发 `event-click`：

<DemoBlock>
  <div style="max-width: 640px">
    <eb-calendar v-model="date" :events="events" @event-click="onEventClick" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
      当前选中：{{ date ? date.toLocaleDateString('zh-CN') : '—' }}
    </p>
    <p v-if="clickedEvent" style="margin-top: 4px; font-size: 12px; color: var(--eb-text-color-secondary);">
      最近点击的事件：{{ clickedEvent }}
    </p>
  </div>
</DemoBlock>

## 禁用日期与范围高亮

`disabled-date` 返回 true 的日期不可选中（此处禁用周末）；`range` 传入起止日期，区间内格子持续高亮：

<DemoBlock>
  <div style="max-width: 640px">
    <eb-calendar v-model="plannedDate" :disabled-date="blockWeekend" :range="weekRange" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
      本周（{{ weekRange[0].toLocaleDateString('zh-CN') }} 至 {{ weekRange[1].toLocaleDateString('zh-CN') }}）高亮，周末不可选
    </p>
  </div>
</DemoBlock>

## 年视图与实例方法

通过 ref 调用 `setMode` / `today` 等实例方法；年视图为 12 个月的迷你格（有事件的日期带标记点），点任意月份回到月视图，`panel-change` 回报当前面板年月：

<DemoBlock>
  <div style="max-width: 720px">
    <eb-space wrap style="margin-bottom: 8px">
      <eb-button @click="showCalYear">年视图</eb-button>
      <eb-button @click="showCalMonth">月视图</eb-button>
      <eb-button @click="calBackToday">回到今天</eb-button>
      <eb-text size="small" type="info">当前面板：{{ calPanel }}</eb-text>
    </eb-space>
    <eb-calendar ref="modeCalRef" :events="events" @panel-change="onCalPanel" />
  </div>
</DemoBlock>

## 自定义单元格

`date-cell` 插槽接管格子内容，`data` 携带 `day` / `date` / `isToday` / `isCurrentMonth` / `events`，适合加假期标记、角标等自定义内容：

<DemoBlock>
  <div style="max-width: 640px">
    <eb-calendar v-model="markedDate">
      <template #date-cell="{ data }">
        <div style="margin-bottom: 4px">{{ data.day }}</div>
        <div v-if="data.isCurrentMonth && data.date === payDay" style="font-size: 11px; color: var(--eb-color-success)">发薪日</div>
        <div v-if="data.isCurrentMonth && data.date === reviewDay" style="font-size: 11px; color: var(--eb-color-warning)">需求评审</div>
      </template>
    </eb-calendar>
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const now = new Date()
const ymd = (day) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

// 基础用法：事件标记与点击
const date = ref(new Date())
const events = [
  { date: ymd(5), content: '版本发布', type: 'primary' },
  { date: ymd(12), content: '季度评审', type: 'warning' },
  { date: ymd(18), content: '需求冻结', type: 'danger' },
]
const clickedEvent = ref('')
const onEventClick = (evt) => {
  clickedEvent.value = evt.content
}

// 禁用日期与范围高亮
const plannedDate = ref(new Date())
const blockWeekend = (d) => d.getDay() === 0 || d.getDay() === 6
const monday = new Date(now)
monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
const sunday = new Date(monday)
sunday.setDate(monday.getDate() + 6)
const weekRange = [monday, sunday]

// 年视图与实例方法
const modeCalRef = ref(null)
const calPanel = ref(`${now.getFullYear()} 年 ${now.getMonth() + 1} 月`)
const onCalPanel = ({ year, month }) => {
  calPanel.value = `${year} 年 ${month} 月`
}
const showCalYear = () => modeCalRef.value?.setMode('year')
const showCalMonth = () => modeCalRef.value?.setMode('month')
const calBackToday = () => modeCalRef.value?.today()

// 自定义单元格
const markedDate = ref(new Date())
const payDay = ymd(10)
const reviewDay = ymd(24)
</script>

## Calendar API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | Date | 今天 | 当前选中日期（v-model） |
| mode | String | `month` | month / year |
| events | Array | `[]` | 事件项 `{ date: 'YYYY-MM-DD', content, type, id?, class? }` |
| disabled-date | Function | — | `(date) => boolean` 禁用日期 |
| first-day-of-week | Number | `1` | 周起始：0 周日 / 1 周一 |
| range | Array | — | 可选范围 `[start, end]`，区间内格子高亮 |
| weekdays | Array | — | 自定义周标签（默认一至日） |
| title-format | Function | — | `(year, month) => string` 自定义标题文案 |

事件：`select(date, { source })`、`panel-change({ year, month })`、`event-click(event, cell)`。

实例方法：`prev()` / `next()` / `today()` / `setMode('month' | 'year')`。

插槽：`header`（作用域含 `title` / `year` / `month` / `mode` 与 `prev` / `next` / `today` / `setMode`）、`date-cell`（作用域为格子数据）。
