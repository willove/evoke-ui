# Dialog 对话框

> 移动端：居中模态让位于底部动作面板与全屏表单页，参见 [移动端 · 反馈与浮层](/mobile/feedback)。

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const alignVisible = ref(false)
const topVisible = ref(false)
const fullVisible = ref(false)
const headerVisible = ref(false)
const guardVisible = ref(false)
const saving = ref(false)
const lockVisible = ref(false)

function guardClose(done) {
  if (saving.value) return
  saving.value = true
  setTimeout(() => {
    saving.value = false
    done()
  }, 800)
}
</script>

模态对话框，在保留页面上下文的前提下承载临时交互：表单填报、操作确认、内容详情等。内置焦点圈禁（Tab 循环锁定在对话框内）、ESC 关闭、遮罩点击关闭、计数式滚动锁定与 zIndex 自动递增；`v-model` 控制显隐，`before-close` 可统一拦截所有关闭途径（右上角按钮 / ESC / 遮罩 / 程序化 `handleClose`）。

## 基础用法

`v-model` 绑定显隐；`title` 设置标题（同时作为 aria-label），`width` 控制宽度，数字按 px、字符串原样输出（默认 520px，且最大不超过视口减 32px）。footer 通过插槽传入操作按钮。

<DemoBlock>
<eb-button type="primary" @click="visible = true">打开对话框</eb-button>
<eb-dialog v-model="visible" title="标题" width="480px">
  <p>对话框内容</p>
  <template #footer>
    <eb-button @click="visible = false">取消</eb-button>
    <eb-button type="primary" @click="visible = false">确定</eb-button>
  </template>
</eb-dialog>
</DemoBlock>

## 垂直居中与顶部偏移

对话框默认距视口顶部 15vh，`top` 可调整偏移；`align-center` 让对话框在视口内水平垂直双居中（设置后 top 不生效），适合确认类小弹窗。

<DemoBlock>
<eb-button @click="alignVisible = true">垂直居中</eb-button>
<eb-button style="margin-left: 12px;" @click="topVisible = true">顶部偏移 8vh</eb-button>
<eb-dialog v-model="alignVisible" title="居中对话框" width="420px" align-center>
  <p>align-center：水平垂直双居中，常用于二次确认场景。</p>
</eb-dialog>
<eb-dialog v-model="topVisible" title="顶部对齐对话框" width="560px" top="8vh">
  <p>top 控制距视口顶部的偏移，内容较多的对话框可调小以获得更多纵向空间。</p>
</eb-dialog>
</DemoBlock>

## 全屏与自定义头部

`fullscreen` 铺满整个视口（忽略 width 与 top）；`#header` 插槽替换默认标题区，右上角关闭按钮独立于插槽渲染，不会被覆盖。

<DemoBlock>
<eb-button @click="fullVisible = true">全屏对话框</eb-button>
<eb-button style="margin-left: 12px;" @click="headerVisible = true">自定义头部</eb-button>
<eb-dialog v-model="fullVisible" title="全屏" fullscreen>
  <p>fullscreen 为 true 时忽略 width 与 top，铺满视口，适合大表单或文档预览。</p>
</eb-dialog>
<eb-dialog v-model="headerVisible" width="480px">
  <template #header>
    <span style="font-weight: 600; color: var(--eb-color-primary);">自定义头部</span>
  </template>
  <p>header 插槽替换默认标题文字，关闭按钮仍然保留。</p>
</eb-dialog>
</DemoBlock>

## 拦截关闭（before-close）

`before-close` 接收 done 回调：不调用 done 则本次关闭被阻止。右上角关闭按钮、ESC、点击遮罩触发的关闭都会先经过它，可在此做异步校验或二次确认。

<DemoBlock>
<eb-button type="warning" @click="guardVisible = true">关闭前校验</eb-button>
<eb-dialog v-model="guardVisible" title="异步校验" width="440px" :before-close="guardClose">
  <p>{{ saving ? '校验中，暂不可关闭……' : '点击右上角关闭按钮或按 ESC，800ms 后放行关闭。' }}</p>
</eb-dialog>
</DemoBlock>

## 禁用遮罩与 ESC 关闭

表单类对话框不希望误触丢失内容：`close-on-click-modal` 与 `close-on-press-escape` 置为 false 后，只能通过显式按钮关闭；`show-close` 置为 false 还可隐藏右上角关闭按钮。

<DemoBlock>
<eb-button @click="lockVisible = true">仅按钮可关闭</eb-button>
<eb-dialog v-model="lockVisible" title="受控关闭" width="440px" :close-on-click-modal="false" :close-on-press-escape="false">
  <p>点击遮罩与按 ESC 均不会关闭，请使用下方按钮。</p>
  <template #footer>
    <eb-button type="primary" @click="lockVisible = false">我已知晓，关闭</eb-button>
  </template>
</eb-dialog>
</DemoBlock>

## API

<ApiTable title="Dialog Props" :rows="[
  { name: 'v-model', desc: '显示控制（源 prop 为 modelValue）', type: 'boolean', default: 'false' },
  { name: 'title', desc: '标题，同时作为 aria-label 兜底', type: 'string', default: '' },
  { name: 'width', desc: '宽度，数字按 px，最大不超过视口减 32px', type: 'string | number', default: '520px' },
  { name: 'fullscreen', desc: '全屏铺满（忽略 width / top）', type: 'boolean', default: 'false' },
  { name: 'top', desc: '距视口顶部偏移，align-center 时失效', type: 'string', default: '15vh' },
  { name: 'modal', desc: '遮罩模式，false 时点击遮罩不关闭', type: 'boolean', default: 'true' },
  { name: 'close-on-click-modal', desc: '点击遮罩关闭', type: 'boolean', default: 'true' },
  { name: 'close-on-press-escape', desc: '按 ESC 关闭', type: 'boolean', default: 'true' },
  { name: 'show-close', desc: '右上角关闭按钮', type: 'boolean', default: 'true' },
  { name: 'destroy-on-close', desc: '关闭后销毁默认插槽内容，下次打开重新渲染', type: 'boolean', default: 'false' },
  { name: 'append-to-body', desc: 'Teleport 到 body，避免父级层叠上下文裁剪', type: 'boolean', default: 'true' },
  { name: 'lock-scroll', desc: '打开期间锁定页面滚动（计数式，多层叠加安全）', type: 'boolean', default: 'true' },
  { name: 'center', desc: '头部与底部操作区水平居中', type: 'boolean', default: 'false' },
  { name: 'align-center', desc: '对话框在视口水平垂直双居中', type: 'boolean', default: 'false' },
  { name: 'glass', desc: '面板磨砂玻璃质感；缺省跟随全局（EbConfigProvider 的 glass）', type: 'boolean', default: '—' },
  { name: 'blur', desc: '面板磨砂模糊半径（px），仅磨砂生效时应用；缺省跟随 --eb-glass-blur 令牌（14px）', type: 'number | string', default: '—' },
  { name: 'before-close', desc: '关闭前拦截，不调用入参 done 则阻止关闭', type: '(done) => void', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: '对话框内容，destroy-on-close 时随关闭销毁', type: '—', default: '—' },
  { name: 'header', desc: '替换标题区（关闭按钮独立于插槽）', type: '—', default: '—' },
  { name: 'footer', desc: '底部操作区，未提供时不渲染 footer', type: '—', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue', desc: '显隐受控更新', type: '(v: boolean) => void', default: '—' },
  { name: 'open', desc: '打开时立即触发', type: '() => void', default: '—' },
  { name: 'opened', desc: '打开动画结束后触发', type: '() => void', default: '—' },
  { name: 'close', desc: '开始关闭时触发（走完 before-close 拦截流程后）', type: '() => void', default: '—' },
  { name: 'closed', desc: '关闭动画结束后触发', type: '() => void', default: '—' },
]" />

<ApiTable title="Exposes" :rows="[
  { name: 'visible', desc: '当前显示状态', type: 'boolean', default: '—' },
  { name: 'handleClose', desc: '程序化关闭（同样经过 before-close 拦截流程）', type: '() => void', default: '—' },
  { name: 'ref', desc: '对话框根 DOM 元素（焦点圈禁容器）', type: 'HTMLElement', default: '—' },
]" />
