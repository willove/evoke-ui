# AutoComplete 输入联想

输入联想组件：静态候选自动前缀过滤，或经 `fetch-suggestions` 异步取数（内置防抖与过期响应丢弃）。键盘 ↑↓ 移动高亮、Enter 选中、Esc 关闭。

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
</script>

## 静态候选

<DemoBlock>
  <ev-space size="middle">
    <ev-auto-complete
      v-model="value1"
      :suggestions="staticSuggestions"
      placeholder="输入 e / b / c 试试"
      style="width: 260px"
    />
    <span>当前值：{{ value1 || '—' }}</span>
  </ev-space>
</DemoBlock>

## 异步联想

<DemoBlock>
  <ev-auto-complete
    v-model="value2"
    :fetch-suggestions="remoteSearch"
    placeholder="模拟远程搜索：输入任意字符"
    style="width: 260px"
  />
</DemoBlock>

## AutoComplete API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | String / Number | — | 绑定值 |
| suggestions | Array | — | 静态候选（string 或 `{ value }`） |
| fetch-suggestions | Function | — | `(query, cb) => void` 异步联想 |
| filterable | Boolean | `true` | 静态候选本地过滤开关 |
| debounce | Number | `200` | 输入防抖（ms） |
| minlength | Number | `0` | 触发联想最小字符数 |
| value-on-select | Boolean | `true` | 选中后回填输入框 |
| input-props | Object | `{}` | 透传内部 EvInput（placeholder / size / disabled…） |

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
    <ev-mention v-model="mentionValue" :options="['张三', '李四', '王五', '赵六']" placeholder="输入 @ 唤起成员" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--ev-text-color-secondary);">内容：{{ mentionValue || '—' }}</p>
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
