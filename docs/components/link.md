# Link 链接

<script setup>
import { ref } from 'vue'

const clickLog = ref('尚未点击')
</script>

超链接文字组件：`type` 提供语义配色，`underline` 支持 always / hover / never 三种下划线策略，可携带前置图标；`disabled` 时移除 href 与 target 并拦截 click 事件，`href` + `target` 组合可完成站外跳转。

## 基础用法

六种语义类型，`type` 缺省为 default；error 视觉同 danger。

<DemoBlock>
  <ev-space size="middle">
    <ev-link>默认链接</ev-link>
    <ev-link type="primary">主要链接</ev-link>
    <ev-link type="success">成功链接</ev-link>
    <ev-link type="warning">警告链接</ev-link>
    <ev-link type="danger">危险链接</ev-link>
    <ev-link type="info">信息链接</ev-link>
  </ev-space>
</DemoBlock>

## 下划线策略

`underline` 默认 `always` 常显下划线，`hover` 悬停时显示，`never` 关闭（传布尔值时映射为 always / never）。

<DemoBlock>
  <ev-space size="middle">
    <ev-link type="primary" href="https://example.com" target="_blank">always</ev-link>
    <ev-link type="primary" href="https://example.com" target="_blank" underline="hover">hover</ev-link>
    <ev-link type="primary" href="https://example.com" target="_blank" underline="never">never</ev-link>
  </ev-space>
</DemoBlock>

## 图标与禁用

`icon` 传入图标名称渲染前置图标（14px，与文字自动留间距）；`disabled` 移除 href 并阻止点击跳转。

<DemoBlock>
  <ev-space size="middle">
    <ev-link type="primary" icon="link" href="https://example.com" target="_blank">带图标链接</ev-link>
    <ev-link type="primary" href="https://example.com" disabled>禁用链接</ev-link>
    <ev-link type="danger" icon="delete" underline="never">删除记录</ev-link>
  </ev-space>
</DemoBlock>

## click 事件

未设 `href` 时也可单独作为文字按钮使用，点击触发 `click` 事件。

<DemoBlock>
  <ev-space size="middle" style="align-items: center;">
    <ev-link type="primary" :underline="false" @click="clickLog = 'click 事件已触发'">查看更多</ev-link>
    <span style="font-size: 13px; color: var(--ev-text-color-secondary);">状态：{{ clickLog }}</span>
  </ev-space>
</DemoBlock>

## 组合场景

表格操作列、表单底部辅助操作等常见组合。

<DemoBlock>
  <div style="display: flex; gap: 16px; align-items: center;">
    <ev-link type="primary" icon="view" :underline="false">查看详情</ev-link>
    <ev-link type="primary" icon="edit" :underline="false">编辑</ev-link>
    <ev-link type="danger" icon="delete" :underline="false">删除</ev-link>
    <ev-link type="info" underline="never" style="margin-left: auto;">帮助文档</ev-link>
  </div>
</DemoBlock>

## 布尔下划线与文字按钮

`underline` 传布尔值时按旧语义映射：true 等同 always、false 等同 never；不设 `href` 时组件退化为纯文字按钮，配合 `:underline="false"` 常用于表格内的行内操作。

<DemoBlock>
  <ev-space size="middle">
    <ev-link type="primary" :underline="true">布尔 true</ev-link>
    <ev-link type="primary" :underline="false">布尔 false</ev-link>
    <ev-link type="primary" :underline="false">文字按钮</ev-link>
  </ev-space>
</DemoBlock>

## API

<ApiTable title="Link Props" :rows="[
  { name: 'type', desc: '语义色（error 等同 danger）', type: 'primary | success | warning | info | danger | error | default', default: 'default' },
  { name: 'underline', desc: '下划线策略（布尔值映射为 always / never）', type: 'boolean | always | hover | never', default: 'always' },
  { name: 'disabled', desc: '禁用态，移除 href / target 并阻止点击', type: 'boolean', default: 'false' },
  { name: 'href', desc: '跳转地址（禁用或为空时不渲染 href）', type: 'string', default: '' },
  { name: 'target', desc: '打开方式，如 _blank / _self', type: 'string', default: '' },
  { name: 'icon', desc: '前置图标名（14px）', type: 'string', default: '' },
]" />

<ApiTable title="Link Events" :rows="[
  { name: 'click', desc: '点击链接时触发（禁用时不触发并阻止默认行为）', type: '(e: MouseEvent) => void', default: '—' },
]" />

<ApiTable title="Link Slots" :rows="[
  { name: 'default', desc: '链接内容', type: '—', default: '—' },
]" />
