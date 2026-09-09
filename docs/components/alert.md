# Alert 警告提示

<script setup>
import { ref } from 'vue'

const alertKey = ref(0)
const closeLog = ref('尚未关闭')
</script>

页面内的非阻断提示，用于展示需要用户关注但无需立即处理的信息。支持 5 种语义类型（success / warning / info / error / primary，primary 视觉同 info）与 light / dark 两种视觉风格，可带图标、描述与关闭按钮，关闭自带淡出过渡。注意：关闭由组件内部状态控制，关闭后不会自行恢复，需重新挂载（如更换 key）。

## 基础用法

四种语义类型：`title` 加粗为标题，`description` 提供常规灰色描述文案；`closable` 置为 false 隐藏关闭按钮。

<DemoBlock>
  <ev-alert title="恭喜你，这是一条成功消息" type="success" />
  <ev-alert title="提示的消息" type="info" description="这是一条带描述信息的提示，标题加粗、描述常规灰。" style="margin-top: 12px;" />
  <ev-alert title="警告的消息" type="warning" :closable="false" style="margin-top: 12px;" />
  <ev-alert title="错误的消息" type="error" effect="dark" style="margin-top: 12px;" />
</DemoBlock>

关闭按钮点击后组件淡出并从页面移除；需要常驻的提示可关闭 `closable`，或在外层监听 `close` 事件做业务兜底。

## light 与 dark 主题

`effect` 控制视觉风格：light 为浅色底 + 语义色文字（默认），dark 为语义色实底 + 白色文字，适合强提醒场景。

<DemoBlock>
  <ev-alert title="浅色主题（light）" type="success" show-icon style="margin-bottom: 12px;" />
  <ev-alert title="深色主题（dark）" type="success" show-icon effect="dark" />
</DemoBlock>

## 图标与居中

`show-icon` 在左侧显示与 `type` 对应的图标（success 对应对勾、warning 对应叹号等填充图标），`center` 让内容水平居中；也可通过 `#icon` 插槽自定义图标、`#title` / 默认插槽自定义内容。

<DemoBlock>
  <ev-alert title="成功状态的居中提示" type="success" show-icon center style="margin-bottom: 12px;" />
  <ev-alert title="自定义图标与内容" type="warning" show-icon>
    <template #icon>
      <ev-icon name="warning" :size="16" />
    </template>
    内容通过默认插槽传入，优先级高于 description 属性。
  </ev-alert>
</DemoBlock>

## 关闭事件与重新显示

点击关闭按钮时触发 `close` 事件（入参为原始鼠标事件），随后组件淡出隐藏。由于关闭是组件内部行为，重新显示需重新挂载组件（示例通过更换 key 实现）。

<DemoBlock>
  <ev-alert :key="alertKey" title="账户将于 7 天后过期，请及时续费" type="warning" show-icon @close="closeLog = 'close 事件已触发'" />
  <ev-button style="margin-top: 12px;" @click="alertKey++">重新显示</ev-button>
  <p style="margin: 8px 0 0; color: var(--ev-text-color-secondary); font-size: 13px;">状态：{{ closeLog }}</p>
</DemoBlock>

## 标题与描述插槽

`#title` 插槽自定义标题（优先于 title 属性），默认插槽自定义描述内容，可承载链接、按钮等富内容。

<DemoBlock>
  <ev-alert type="info" show-icon :closable="false">
    <template #title>
      内容审核未通过
    </template>
    违规原因：标题含敏感词。前往 <ev-link type="primary" style="margin: 0 4px;">修改页面</ev-link> 调整后重新提交。
  </ev-alert>
</DemoBlock>

## primary 类型与类型映射

`type` 还接受 primary，视觉与 info 一致，便于与按钮等语义色直接对应；图标按类型自动映射：success / warning / info / error 分别对应圆打勾、叹号、叹号、圆叉的填充图标。

<DemoBlock>
  <ev-alert title="primary 类型提示" type="primary" show-icon style="margin-bottom: 12px;" />
  <ev-alert title="info 类型提示" type="info" show-icon />
</DemoBlock>

## API

<ApiTable title="Alert Props" :rows="[
  { name: 'title', desc: '标题', type: 'string', default: '' },
  { name: 'type', desc: '类型，primary 视觉同 info，error 同 danger 色', type: 'primary | success | warning | info | error', default: 'info' },
  { name: 'description', desc: '描述文案（默认插槽优先）', type: 'string', default: '' },
  { name: 'closable', desc: '是否可关闭', type: 'boolean', default: 'true' },
  { name: 'show-icon', desc: '是否显示类型图标（或提供 icon 插槽时显示图标区）', type: 'boolean', default: 'false' },
  { name: 'center', desc: '内容水平居中', type: 'boolean', default: 'false' },
  { name: 'effect', desc: '视觉风格', type: 'light | dark', default: 'light' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: '描述内容，优先于 description 属性', type: '—', default: '—' },
  { name: 'title', desc: '标题内容，优先于 title 属性', type: '—', default: '—' },
  { name: 'icon', desc: '自定义图标（提供时即使未设 show-icon 也显示图标区）', type: '—', default: '—' },
  { name: 'close', desc: '自定义关闭按钮内容', type: '—', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'close', desc: '点击关闭按钮触发，随后组件淡出隐藏（不可自行恢复）', type: '(e: Event) => void', default: '—' },
]" />
