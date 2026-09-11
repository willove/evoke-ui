# ActionSheet 动作面板

移动端「更多操作」的标准形态：底部滑入的纵向动作列表 + 取消栏，替代桌面上依赖
hover 的 Dropdown / Popconfirm（见[移动端 · 反馈与浮层](/mobile/feedback)）。动作项
支持副标题、警示色与禁用；破坏性动作用 `color` 标红并排在最末。遮罩点击 / ESC /
取消栏均可关闭，`before-close` 统一拦截；焦点圈禁、滚动锁定与 zIndex 自增与 Drawer
同一套基础设施。

## 基础用法

<DemoBlock>
<MobileStage title="订单详情">
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__head">
        <span class="mb-card__title">报销单 CL-0908-01</span>
        <eb-status-tag value="pending" :statuses="[{ value: 'pending', label: '审批中', type: 'warning' }]" />
      </div>
    </div>
    <eb-button style="align-self: stretch;" @click="sheetOpen = true">更多操作</eb-button>
  </div>
  <eb-action-sheet
    v-model="sheetOpen"
    title="单据操作"
    :actions="actions"
    :append-to-body="false" :lock-scroll="false"
    @select="onSelect"
  />
</MobileStage>
</DemoBlock>

```html
<eb-button @click="sheetOpen = true">更多操作</eb-button>

<eb-action-sheet
  v-model="sheetOpen"
  title="单据操作"
  :actions="[
    { name: '转发审批' },
    { name: '编辑单据', subname: '进入全屏编辑' },
    { name: '撤回单据', color: 'var(--eb-color-danger)' },
  ]"
  @select="onSelect"
/>
```

```js
function onSelect(action, index) {
  console.log('选中', index, action.name) // close-on-click-action 默认已关闭面板
}
```

要点：

- **破坏性动作**：用 `color` 着警示色并排在动作列表最末，与普通动作保持视觉分离；
  组件不内置「危险二次确认」，撤回/删除类操作建议在 `select` 里再走 Dialog 确认
  （见[移动端 · 危险操作确认](/mobile/feedback)）。
- **舞台/嵌套滚动容器**：演示壳内置 `:append-to-body="false"`（并配 `:lock-scroll="false"` 防止锁文档页滚动）（弹层留在原地被舞台
  裁剪）；真机页面保持默认 Teleport 到 body 即可。

## 自定义面板内容

`default` 插槽替换动作列表（如分享目标九宫格）；`title` 插槽自定义标题；
`cancel-text` 传空串隐藏取消栏，适合「选择后必须决策」的场景。

<DemoBlock>
<MobileStage>
  <div class="mb-page">
    <eb-button style="align-self: stretch;" @click="shareOpen = true">分享到…</eb-button>
  </div>
  <eb-action-sheet v-model="shareOpen" :cancel-text="''" :append-to-body="false" :lock-scroll="false">
    <template #title>
      <span style="font-weight: 600; color: var(--eb-text-color-primary);">分享到</span>
    </template>
    <div style="display: flex; flex-direction: column;">
      <button v-for="t in ['微信好友', '企业微信', '复制链接']" :key="t" type="button" style="padding: 14px; border: none; background: var(--eb-bg-color); color: var(--eb-text-color-primary); font-size: 15px; cursor: pointer;" @click="shareOpen = false">{{ t }}</button>
    </div>
  </eb-action-sheet>
</MobileStage>
</DemoBlock>

## API

<ApiTable title="ActionSheet Props" :rows="[
  { name: 'v-model', desc: '显隐（源 prop 为 modelValue）', type: 'boolean', default: 'false' },
  { name: 'actions', desc: '动作列表', type: '{ name, subname?, color?, disabled? }[]', default: '[]' },
  { name: 'title', desc: '顶部标题，空且无插槽时不渲染', type: 'string', default: '' },
  { name: 'cancel-text', desc: '取消栏文案，空串隐藏', type: 'string', default: '取消' },
  { name: 'round', desc: '顶部大圆角', type: 'boolean', default: 'true' },
  { name: 'close-on-click-action', desc: '点选动作后关闭', type: 'boolean', default: 'true' },
  { name: 'close-on-click-modal', desc: '点击遮罩关闭', type: 'boolean', default: 'true' },
  { name: 'close-on-press-escape', desc: 'ESC 关闭', type: 'boolean', default: 'true' },
  { name: 'append-to-body', desc: 'Teleport 到 body；嵌套滚动容器/演示壳内置 false', type: 'boolean', default: 'true' },
  { name: 'lock-scroll', desc: '打开期间锁定页面滚动', type: 'boolean', default: 'true' },
  { name: 'before-close', desc: '关闭前拦截，不调用入参 done 则阻止', type: '(done) => void', default: '—' },
]" />

<ApiTable title="ActionSheet Events" :rows="[
  { name: 'select', desc: '点选动作（禁用项不触发）', type: '(action, index) => void', default: '—' },
  { name: 'cancel', desc: '点击取消栏', type: '—', default: '—' },
  { name: 'open / opened / close / closed', desc: '显隐流转', type: '—', default: '—' },
]" />

<ApiTable title="ActionSheet Slots" :rows="[
  { name: 'default', desc: '自定义面板内容（替换动作列表）；列表块不做水平内缩，内容需自带内边距（建议左右 ≥12px，底部留出圆角空间）', type: '—', default: '动作列表' },
  { name: 'title', desc: '自定义标题', type: '—', default: 'title 文案' },
]" />

<script setup>
import { ref } from 'vue'

const sheetOpen = ref(false)
const shareOpen = ref(false)
const actions = [
  { name: '转发审批' },
  { name: '编辑单据', subname: '进入全屏编辑' },
  { name: '导出 PDF' },
  { name: '撤回单据', color: 'var(--eb-color-danger)' },
  { name: '不可用项', disabled: true },
]
function onSelect() {}
</script>
