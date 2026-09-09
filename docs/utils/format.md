# 格式化工具

B 端高频格式化函数，与组件零耦合，可独立引入：

```js
import { formatNumber, formatFileSize } from '@wil-works/evoke-business-ui'
```

## formatNumber — 数字千分位

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-family: monospace;">
    <div>formatNumber(1234567.891, {{ '{ precision: 2 }' }}) → {{ demo1 }}</div>
    <div>formatNumber(1000, {{ "{ separator: '' }" }}) → {{ demo2 }}</div>
    <div>formatNumber(98765, {{ "{ separator: '.' }" }}) → {{ demo3 }}</div>
    <div>formatNumber('abc') → '{{ demo4 }}'（非数字原样返回）</div>
  </div>
</DemoBlock>

## formatFileSize — 文件大小

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-family: monospace;">
    <div>formatFileSize(0) → '{{ f0 }}'</div>
    <div>formatFileSize(512) → '{{ f512 }}'</div>
    <div>formatFileSize(1536) → '{{ f1536 }}'（附件列表显示）</div>
    <div>formatFileSize(1073741824) → '{{ f1g }}'（即 1GB）</div>
  </div>
</DemoBlock>

## formatDate — 日期模板

模板令牌：`YYYY MM DD HH mm ss SSS`：

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-family: monospace;">
    <div>formatDate(now, 'YYYY-MM-DD') → '{{ d1 }}'</div>
    <div>formatDate(now, 'HH:mm:ss') → '{{ d2 }}'（日志时间戳）</div>
    <div>formatDate(now, 'MM月DD日 HH:mm') → '{{ d3 }}'</div>
    <div>formatDate('not-a-date') → '{{ d4 }}'（非法输入返回空串）</div>
  </div>
</DemoBlock>

## formatRelativeTime — 相对时间

消息流、操作日志、评论区的标准展示：

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
    <div>30 秒内 → '{{ r1 }}'</div>
    <div>3 分钟前 → '{{ r2 }}'</div>
    <div>5 小时前 → '{{ r3 }}'</div>
    <div>昨天 → '昨天 14:30'（形如）</div>
    <div>往年 → '2025-01-05'（形如）</div>
  </div>
</DemoBlock>

## formatDuration / formatPercent

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-family: monospace;">
    <div>formatDuration(205) → '{{ du1 }}'（音视频播放器）</div>
    <div>formatDuration(3723) → '{{ du2 }}'（超 1 小时自动进位）</div>
    <div>formatPercent(0.1234) → '{{ pe1 }}'（进度/占比）</div>
    <div>formatPercent(0.06, {{ '{ precision: 0 }' }}) → '{{ pe2 }}'</div>
  </div>
</DemoBlock>

<script setup>
import {
  formatNumber,
  formatFileSize,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatPercent,
} from '@wil-works/evoke-business-ui'

const now = new Date()

const demo1 = formatNumber(1234567.891, { precision: 2 })
const demo2 = formatNumber(1000, { separator: '' })
const demo3 = formatNumber(98765, { separator: '.' })
const demo4 = formatNumber('abc')

const f0 = formatFileSize(0)
const f512 = formatFileSize(512)
const f1536 = formatFileSize(1536)
const f1g = formatFileSize(1024 ** 3)

const d1 = formatDate(now, 'YYYY-MM-DD')
const d2 = formatDate(now, 'HH:mm:ss')
const d3 = formatDate(now, 'MM月DD日 HH:mm')
const d4 = formatDate('not-a-date')

const nowTs = now.getTime()
const r1 = formatRelativeTime(nowTs - 10 * 1000, nowTs)
const r2 = formatRelativeTime(nowTs - 3 * 60 * 1000, nowTs)
const r3 = formatRelativeTime(nowTs - 5 * 60 * 60 * 1000, nowTs)

const du1 = formatDuration(205)
const du2 = formatDuration(3723)
const pe1 = formatPercent(0.1234)
const pe2 = formatPercent(0.06, { precision: 0 })
</script>

## API

```ts
formatNumber(value: number, options?: {
  precision?: number          // 小数位
  separator?: string          // 千分位符号，默认 ','；传 '' 关闭
  decimalSeparator?: string   // 小数点符号，默认 '.'
}): string

formatFileSize(bytes: number, options?: {
  precision?: number          // 默认 1
  base?: 1024 | 1000         // 默认 1024
}): string                   // 非法输入返回 ''

formatDate(date: Date | number | string, pattern?: string): string

formatRelativeTime(date: Date | number | string, now?: Date | number): string

formatDuration(seconds: number, options?: { forceHours?: boolean }): string

formatPercent(ratio: number, options?: { precision?: number }): string
```

所有函数对非法输入**不抛错**：数字类返回 `String(value)` 或 `''`，日期类返回 `''`，可直接用于模板插值。
