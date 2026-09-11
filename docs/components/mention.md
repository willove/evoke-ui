# Mention 输入提及

在文本域中输入触发前缀（默认 `@`）唤起候选面板，选中后插入提及标记。适用于评论、工单指派、公告 @ 成员等场景。支持键盘导航（↑ ↓ 回车 Esc）。

## 基础用法

输入 `@` 唤起面板，继续输入过滤，回车或点击选中：

<DemoBlock>
  <eb-mention
    v-model="comment"
    :options="members"
    placeholder="输入 @ 提及成员，例如：@张三 看一下这个工单"
  ></eb-mention>
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">modelValue：{{ comment || '（空）' }}</div>
</DemoBlock>

## 自定义触发前缀

`prefix` 可换成 `#`（话题）、`/`（指令）等；`split` 控制选中后的分隔符：

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <eb-mention
      v-model="topic"
      :options="topics"
      prefix="#"
      placeholder="输入 # 关联话题"
    ></eb-mention>
    <eb-mention
      v-model="command"
      :options="commands"
      prefix="/"
      split=""
      :rows="2"
      placeholder="输入 / 唤起指令（split 为空串，插入后不加空格）"
    ></eb-mention>
  </div>
</DemoBlock>

## 对象候选与事件

候选支持 `{ value, label }` 对象（label 缺省用 value）；`search` 在过滤时触发，`select` 在选中时触发：

<DemoBlock>
  <eb-mention
    v-model="assignee"
    :options="userOptions"
    @select="onSelect"
    @search="onSearch"
    placeholder="输入 @ 选择负责人"
  ></eb-mention>
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    最近选中：{{ lastSelected || '（无）' }}；最近过滤词：{{ lastQuery || '（无）' }}
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const comment = ref('')
const topic = ref('')
const command = ref('')
const assignee = ref('')
const lastSelected = ref('')
const lastQuery = ref('')

const members = ['张伟', '王芳', '李娜', '刘洋', '陈静', '赵磊']
const topics = ['前端性能', '数据库优化', '发布流程', '安全审计']
const commands = ['assign', 'priority:high', 'close', 'reopen']
const userOptions = [
  { value: 'zhangwei', label: '张伟（前端组）' },
  { value: 'wangfang', label: '王芳（后端组）' },
  { value: 'lina', label: '李娜（测试组）' },
  { value: 'liuyang', label: '刘洋（运维组）' },
]

function onSelect(option) {
  lastSelected.value = typeof option === 'string' ? option : option.label || option.value
}
function onSearch(query) {
  lastQuery.value = query
}
</script>

## Mention API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | String | `''` | 输入内容（v-model） |
| options | Array | `[]` | 候选：`string[]` 或 `{ value, label? }[]` |
| prefix | String | `'@'` | 触发前缀 |
| split | String | `' '` | 选中插入后的分隔符（`''` 不追加） |
| placeholder | String | `''` | 占位文案 |
| rows | Number | `3` | 文本域行数 |
| disabled | Boolean | `false` | 禁用 |

### Events

| 名称 | 参数 | 说明 |
| --- | --- | --- |
| update:modelValue | `(value)` | 输入内容变化 |
| search | `(query)` | 触发面板后每次过滤输入 |
| select | `(option)` | 选中候选 |
