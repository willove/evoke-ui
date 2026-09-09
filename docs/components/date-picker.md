# DatePicker 日期选择器

<script setup>
import { ref } from 'vue'

const v = ref('')
const vDatetime = ref('')
const vMonth = ref('')
const vYear = ref('')
const vShort = ref('')
const dstr = ref('')
const dstrTime = ref('')
const mDate = ref('')
const dr = ref([])
</script>


dayjs 驱动的日期选择器，`type` 覆盖日期、日期时间、月份、年份及对应区间共 7 种类型，支持快捷选项、禁用日期、value-format 与时间默认值。点击输入框打开面板，选中即回填；含时间的类型（datetime / datetimerange）面板底部有确定按钮，需确认后关闭。值变更与清空会自动触发所属表单项的 change 校验。

## 基础用法

默认 `type="date"`，`placeholder` 自定义占位；选择后悬停输入框出现清空按钮（`clearable`）。

<DemoBlock>
  <div class="demo-row">
    <ev-date-picker v-model="v" placeholder="请选择日期" style="width: 220px;" />
    <ev-date-picker v-model="vDatetime" type="datetime" style="width: 240px;" />
    <ev-date-picker v-model="vMonth" type="month" placeholder="选择月份" style="width: 220px;" />
  </div>
</DemoBlock>

## 选择器类型

单值类型 date / datetime / month / year，区间类型 daterange / datetimerange / monthrange；展示格式缺省按 type 取默认（如 year 为 YYYY、datetime 为 YYYY-MM-DD HH:mm:ss）。

<DemoBlock>
  <div class="demo-row">
    <ev-date-picker :model-value="'2026'" type="year" placeholder="选择年份" style="width: 160px;" />
    <ev-date-picker :model-value="'2026-09'" type="month" placeholder="选择月份" style="width: 160px;" />
    <ev-date-picker :model-value="'2026-09-01'" type="date" style="width: 180px;" />
    <ev-date-picker :model-value="'2026-09-01 12:30:45'" type="datetime" style="width: 210px;" />
  </div>
</DemoBlock>

## 区间选择

区间类型为双输入框 + 双面板，`range-separator` 自定义分隔符，`unlink-panels` 让左右面板独立切换年月，`start-placeholder` / `end-placeholder` 分别设置两个输入框的占位。

<DemoBlock>
  <ev-date-picker
    v-model="dstr"
    type="daterange"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    style="width: 320px;"
  />
  <ev-date-picker v-model="dstrTime" type="datetimerange" style="width: 400px;" />
  <ev-date-picker
    v-model="dr"
    type="monthrange"
    unlink-panels
    range-separator="至"
    start-placeholder="开始月份"
    end-placeholder="结束月份"
    style="width: 300px;"
  />
</DemoBlock>

## 快捷选项与禁用日期

`shortcuts` 为 `{ text, value }` 数组（value 可为 Date 或返回 Date 的函数），显示在面板左侧；`disabled-date` 返回 true 的日期置灰不可选。

<DemoBlock>
  <ev-date-picker
    v-model="vShort"
    value-format="YYYY-MM-DD"
    :shortcuts="[{ text: '今天', value: new Date() }, { text: '一周后', value: () => new Date(Date.now() + 7 * 86400000) }]"
    :disabled-date="(d) => d.getTime() > Date.now()"
    style="width: 220px;"
  />
</DemoBlock>

## 格式化与默认时间

`value-format` 指定对外值格式（v-model 得到字符串，缺省输出 Date 对象）；`format` 只改输入框展示格式；`default-time` 让 datetime 选中日期后时间部分取默认值，区间类型传数组分别作用于起止。

<DemoBlock>
  <ev-date-picker v-model="dstr" value-format="YYYY-MM-DD" placeholder="值为字符串" style="width: 200px;" />
  <span style="margin-left: 12px;">当前值：{{ dstr || 'null' }}</span>
</DemoBlock>

<DemoBlock>
  <ev-date-picker type="datetime" default-time="09:30:00" style="width: 210px;" />
  <ev-date-picker type="datetimerange" :default-time="['09:00:00', '18:00:00']" style="width: 400px;" />
</DemoBlock>

## 手动输入与空值定位

`editable` 允许在输入框按展示格式直接键入日期（无效输入自动回滚）；`default-value` 指定空值时面板默认定位到的日期，常用于"默认定位到业务月份"。

<DemoBlock>
  <ev-date-picker :editable="false" placeholder="不可手动输入" style="width: 200px;" />
  <ev-date-picker default-value="2026-09-01" placeholder="默认定位 9 月" style="width: 200px;" />
</DemoBlock>

## 尺寸与禁用

`size` 控制输入框高度（large / default / small），`disabled` 禁用后点击与输入均无响应；两者均可由所属 Form 的 size / disabled 注入。

<DemoBlock>
  <ev-date-picker size="large" placeholder="large" style="width: 180px;" />
  <ev-date-picker placeholder="default" style="width: 180px;" />
  <ev-date-picker size="small" placeholder="small" style="width: 180px;" />
  <ev-date-picker disabled placeholder="禁用状态" style="width: 180px;" />
</DemoBlock>

## API

<ApiTable title="DatePicker Props" :rows="[
  { name: 'v-model', desc: '绑定值，区间类型为 [start, end]', type: 'Date | string | number | array', default: 'null' },
  { name: 'type', desc: '选择器类型', type: 'date | datetime | daterange | datetimerange | month | monthrange | year', default: 'date' },
  { name: 'placeholder', desc: '单值占位文本，datetime 缺省为 选择日期 选择时间', type: 'string', default: '' },
  { name: 'startPlaceholder / endPlaceholder', desc: '区间占位文本', type: 'string', default: '开始日期 / 结束日期' },
  { name: 'rangeSeparator', desc: '区间分隔符', type: 'string', default: '-' },
  { name: 'format', desc: '展示格式，缺省按 type 取默认（如 datetime 为 YYYY-MM-DD HH:mm:ss）', type: 'string', default: '' },
  { name: 'valueFormat', desc: '对外值格式，缺省输出 Date 对象', type: 'string', default: '' },
  { name: 'clearable', desc: '可清空（有值时悬停显示清空按钮）', type: 'boolean', default: 'true' },
  { name: 'editable', desc: '允许按展示格式手动输入，无效输入回滚', type: 'boolean', default: 'true' },
  { name: 'disabled', desc: '禁用（响应表单禁用注入）', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸，空时取 Form 注入', type: 'large | default | small', default: 'default' },
  { name: 'name', desc: '原生 input name（区间时两个输入框同名）', type: 'string', default: '—' },
  { name: 'shortcuts', desc: '快捷选项列表，value 可为 Date 或 () => Date', type: '{ text, value }[]', default: 'null' },
  { name: 'disabledDate', desc: '返回 true 的日期不可选', type: '(date: Date) => boolean', default: 'null' },
  { name: 'defaultValue', desc: '空值时面板默认定位日期', type: 'Date | string | number', default: 'null' },
  { name: 'defaultTime', desc: '选中日期后默认时间（HH:mm:ss），区间传数组', type: 'string | array', default: '' },
  { name: 'unlinkPanels', desc: '区间双面板独立切换年月', type: 'boolean', default: 'false' },
  { name: 'prefixIcon', desc: '前缀图标名', type: 'string', default: 'calendar' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue', desc: '值变化，value-format 输出格式化字符串', type: '(value) => void', default: '—' },
  { name: 'change', desc: '确认选中值，同时触发表单项 change 校验', type: '(value) => void', default: '—' },
  { name: 'clear', desc: '点击清空（区间清空为 [null, null]）', type: '() => void', default: '—' },
  { name: 'focus', desc: '输入框聚焦', type: '() => void', default: '—' },
  { name: 'blur', desc: '面板关闭时失焦', type: '() => void', default: '—' },
  { name: 'visible-change', desc: '面板显隐', type: '(visible: boolean) => void', default: '—' },
  { name: 'calendar-change', desc: '区间面板选中起始日期变化', type: '(start, end) => void', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'focus', desc: '聚焦输入框并打开面板', type: '() => void', default: '—' },
  { name: 'blur', desc: '关闭面板', type: '() => void', default: '—' },
  { name: 'handleOpen', desc: '打开面板', type: '() => void', default: '—' },
  { name: 'handleClose', desc: '关闭面板', type: '() => void', default: '—' },
]" />

## 移动端适配

容器环境为 mobile 时（ConfigProvider `platform` / 全局 `setPlatform()` / 自动探测），日期面板改为**底部弹出**呈现（全宽日历 + 安全区适配），确认选择即关闭；桌面环境保持浮层形态。下方演示强制移动形态：

<DemoBlock>
  <ev-config-provider platform="mobile">
    <ev-date-picker v-model="mDate" type="date" placeholder="选择日期（移动形态）" style="width: 240px" />
  </ev-config-provider>
</DemoBlock>

