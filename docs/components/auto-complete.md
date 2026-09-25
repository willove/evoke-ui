# AutoComplete 输入联想

输入联想组件：静态候选自动前缀过滤，或经 `fetch-suggestions` 异步取数（内置防抖与过期响应丢弃）。键盘 ↑↓ 移动高亮、Enter 选中、Esc 关闭。候选支持字符串 / 数字 / `{ value, label? }` 对象（显示 label，回退 value）；有输入且无结果时展示「无匹配数据」空态行（文案随语言包）；输入框带 combobox / listbox / aria-activedescendant 无障碍语义。

<script setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')
const staticSuggestions = ['Apple', 'Banana', 'Cherry', 'Durian', 'Grape', 'Mango']

function remoteSearch(query, cb) {
  // 实际项目中替换为接口请求；候选支持 { value, ...payload } 携带附加数据
  setTimeout(() => {
    cb([{ value: `${query} 相关订单 A-001` }, { value: `${query} 相关订单 A-002` }])
  }, 300)
}

const mentionValue = ref('')

const objectValue = ref('')
const objectSuggestions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
]
const firstOptionValue = ref('')
</script>

## 静态候选

<DemoBlock>
  <eb-space size="middle">
    <eb-auto-complete
      v-model="value1"
      :suggestions="staticSuggestions"
      placeholder="输入 e / b / c 试试"
      style="width: 260px"
    />
    <span>当前值：{{ value1 || '—' }}</span>
  </eb-space>
</DemoBlock>

## 异步联想

<DemoBlock>
  <eb-auto-complete
    v-model="value2"
    :fetch-suggestions="remoteSearch"
    placeholder="模拟远程搜索：输入任意字符"
    style="width: 260px"
  />
</DemoBlock>

## 候选字段与默认高亮

候选为 `{ value, label? }` 对象时展示 `label`、回退 `value`，选中仍回填 `value`；`default-active-first-option` 开启后结果更新自动高亮第一条（antd 默认 true，本组件默认 false），Enter 直接选中。

<DemoBlock>
  <eb-space size="middle">
    <eb-auto-complete
      v-model="objectValue"
      :suggestions="objectSuggestions"
      :default-active-first-option="true"
      placeholder="输入 j 试试"
      style="width: 220px"
    />
    <span>当前值：{{ objectValue || '—' }}</span>
    <eb-auto-complete
      v-model="firstOptionValue"
      :suggestions="objectSuggestions"
      placeholder="未开启默认高亮"
      style="width: 220px"
    />
  </eb-space>
</DemoBlock>

## 空态提示

有输入但无匹配结果时，面板内展示「无匹配数据」空态行（取语言包 `select.noMatch`），随 ConfigProvider 语言切换；清空输入或匹配到结果后自动恢复候选列表。

## AutoComplete API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | String / Number | — | 绑定值 |
| suggestions | Array | — | 静态候选：string / number 或 `{ value, label? }`（展示 label 回退 value） |
| fetch-suggestions | Function | — | `(query, cb) => void` 异步联想 |
| filterable | Boolean | `true` | 静态候选本地过滤开关（按 value 匹配） |
| debounce | Number | `200` | 输入防抖（ms），组件卸载时自动清理挂起定时器 |
| minlength | Number | `0` | 触发联想最小字符数 |
| default-active-first-option | Boolean | `false` | 结果更新自动高亮第一条（antd 默认 true），Enter 直接选中 |
| value-on-select | Boolean | `true` | 选中后回填输入框 |
| input-props | Object | `{}` | 透传内部 EbInput（placeholder / size / disabled…） |
| ripple | Boolean | `true` | 激活涟漪动效开关：聚焦时实体色影向内收拢消散；也可在 Form 上批量关闭或全局 `setRipple(false)` |

### 事件

| 名称 | 说明 |
| --- | --- |
| select | 选中候选，参数 `(item, index)` |
| suggest | 发起联想 |
| clear | 值被清空 |

### 插槽

`option`（`{ item }`）自定义候选项内容；未声明的 attrs 直接透传内部输入框。

# Mention 提及

多行输入框的 @ 提及：输入 `@` 弹出候选（镜像 div 测量光标坐标定位），支持键盘选择，选中后以 `@xxx ` 回填。

## 基础用法

<DemoBlock>
  <div style="max-width: 420px">
    <eb-mention v-model="mentionValue" :options="['张三', '李四', '王五', '赵六']" placeholder="输入 @ 唤起成员" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">内容：{{ mentionValue || '—' }}</p>
  </div>
</DemoBlock>

## Mention API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | String | — | 内容 |
| options | Array | `[]` | 候选成员 |
| prefix | String | `@` | 触发前缀 |
| split | String | 空格 | 选中后分隔符 |
| rows | Number | `3` | 行数 |

事件：`select`、`search(query, prefix)`（可在此接入远程成员搜索）。
