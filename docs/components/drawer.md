# Drawer 抽屉

> 移动端：侧滑抽屉改为 `direction="btt"` 底部面板，参见 [移动端 · 反馈与浮层](/mobile/feedback)。

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const dirVisible = ref(false)
const dir = ref('rtl')
const pctVisible = ref(false)
const pxVisible = ref(false)
const guardVisible = ref(false)
const saving = ref(false)
const destroyVisible = ref(false)

function openDir(d) {
  dir.value = d
  dirVisible.value = true
}

function guardClose(done) {
  if (saving.value) return
  saving.value = true
  setTimeout(() => {
    saving.value = false
    done()
  }, 800)
}
</script>

从屏幕边缘滑出的浮层面板，适合承载表单、详情等大块内容。支持四个方向滑入、自定义尺寸、焦点圈禁与滚动锁定，通过 `v-model` 绑定显隐；`before-close` 可统一拦截右上角按钮 / ESC / 遮罩等所有关闭途径。

## 基础用法

默认从右侧滑入（rtl），`size` 控制面板宽度（默认 30%，数字按 px）。关闭按钮、遮罩、ESC 或 footer 按钮均可关闭。

<DemoBlock>
  <eb-button type="primary" @click="visible = true">打开抽屉</eb-button>
  <eb-drawer v-model="visible" title="详情抽屉" size="40%">
    <p>这里是抽屉内容，点击关闭按钮、遮罩或下方按钮均可关闭。</p>
    <template #footer>
      <eb-button @click="visible = false">取消</eb-button>
      <eb-button type="primary" style="margin-left: 12px;" @click="visible = false">确定</eb-button>
    </template>
  </eb-drawer>
</DemoBlock>

## 四个方向

`direction` 决定滑出方向与停靠边缘，滑入滑出动画随方向变化：

- `rtl`：从右侧滑入（默认），面板停靠屏幕右缘；
- `ltr`：从左侧滑入，面板停靠屏幕左缘；
- `ttb`：从顶部下滑，面板停靠屏幕顶部，`size` 表示高度；
- `btt`：从底部上滑，面板停靠屏幕底部，`size` 表示高度。

<DemoBlock>
  <eb-button @click="openDir('rtl')">右侧 rtl</eb-button>
  <eb-button style="margin-left: 8px;" @click="openDir('ltr')">左侧 ltr</eb-button>
  <eb-button style="margin-left: 8px;" @click="openDir('ttb')">顶部 ttb</eb-button>
  <eb-button style="margin-left: 8px;" @click="openDir('btt')">底部 btt</eb-button>
  <eb-drawer v-model="dirVisible" :direction="dir" :title="'方向：' + dir" size="360px">
    <p>当前从 {{ dir }} 方向滑入，size 在水平方向为宽度、垂直方向为高度。</p>
  </eb-drawer>
</DemoBlock>

## 尺寸

`size` 接受百分比字符串（相对视口）或数字（按 px），水平方向为宽度、垂直方向为高度。

<DemoBlock>
  <eb-button @click="pctVisible = true">size 50%</eb-button>
  <eb-button style="margin-left: 12px;" @click="pxVisible = true">size 420px</eb-button>
  <eb-drawer v-model="pctVisible" title="百分比尺寸" direction="ltr" size="50%">
    <p>size 为 50%，随视口宽度变化。</p>
  </eb-drawer>
  <eb-drawer v-model="pxVisible" title="固定像素尺寸" size="420">
    <p>size 传数字 420 时按 420px 渲染。</p>
  </eb-drawer>
</DemoBlock>

## 拦截关闭（before-close）

`before-close` 接收 done 回调，不调用 done 则阻止本次关闭，可用于未保存提示或异步校验。

<DemoBlock>
  <eb-button type="warning" @click="guardVisible = true">关闭前校验</eb-button>
  <eb-drawer v-model="guardVisible" title="异步校验" size="380px" :before-close="guardClose">
    <p>{{ saving ? '校验中，暂不可关闭……' : '点击关闭按钮或按 ESC，800ms 后放行关闭。' }}</p>
  </eb-drawer>
</DemoBlock>

## 关闭后销毁内容

`destroy-on-close` 关闭时卸载默认插槽内容，再次打开重新渲染（表单输入等内部状态会被重置）。

<DemoBlock>
  <eb-button @click="destroyVisible = true">打开抽屉</eb-button>
  <eb-drawer v-model="destroyVisible" title="销毁内容" size="380px" destroy-on-close>
    <p>在输入框中输入内容后关闭抽屉，再次打开会看到内容被清空。</p>
    <input placeholder="输入一些内容" style="margin-top: 12px; padding: 6px 10px; border: 1px solid var(--eb-border-color); border-radius: 4px;" />
  </eb-drawer>
</DemoBlock>

## API

<ApiTable title="Drawer Props" :rows="[
  { name: 'v-model', desc: '显示控制', type: 'boolean', default: 'false' },
  { name: 'title', desc: '标题（header 插槽优先）', type: 'string', default: '' },
  { name: 'direction', desc: '滑出方向', type: 'ltr | rtl | ttb | btt', default: 'rtl' },
  { name: 'size', desc: '尺寸，水平为宽度、垂直为高度，数字按 px', type: 'string | number', default: '30%' },
  { name: 'with-header', desc: '是否显示标题区', type: 'boolean', default: 'true' },
  { name: 'show-close', desc: '是否显示关闭按钮', type: 'boolean', default: 'true' },
  { name: 'destroy-on-close', desc: '关闭后销毁内容', type: 'boolean', default: 'false' },
  { name: 'append-to-body', desc: '挂载到 body', type: 'boolean', default: 'true' },
  { name: 'modal', desc: '遮罩模式（false 时点击遮罩不关闭）', type: 'boolean', default: 'true' },
  { name: 'close-on-click-modal', desc: '点击遮罩关闭', type: 'boolean', default: 'true' },
  { name: 'close-on-press-escape', desc: 'ESC 关闭', type: 'boolean', default: 'true' },
  { name: 'lock-scroll', desc: '打开时锁定页面滚动', type: 'boolean', default: 'true' },
  { name: 'glass', desc: '面板磨砂玻璃质感；缺省跟随全局（EbConfigProvider 的 glass）', type: 'boolean', default: '—' },
  { name: 'blur', desc: '面板磨砂模糊半径（px），仅磨砂生效时应用；缺省跟随 --eb-glass-blur 令牌（14px）', type: 'number | string', default: '—' },
  { name: 'before-close', desc: '关闭前拦截，调用 done() 完成关闭', type: '(done) => void', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: '抽屉内容，destroy-on-close 时随关闭销毁', type: '—', default: '—' },
  { name: 'header', desc: '替换整个标题区', type: '—', default: '—' },
  { name: 'footer', desc: '底部操作区，未提供时不渲染', type: '—', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue', desc: '显隐受控更新', type: '(v: boolean) => void', default: '—' },
  { name: 'open', desc: '打开前触发', type: '() => void', default: '—' },
  { name: 'opened', desc: '打开动画结束后触发', type: '() => void', default: '—' },
  { name: 'close', desc: '开始关闭时触发', type: '() => void', default: '—' },
  { name: 'closed', desc: '关闭动画结束后触发', type: '() => void', default: '—' },
]" />

<ApiTable title="Exposes" :rows="[
  { name: 'visible', desc: '当前显示状态', type: 'boolean', default: '—' },
  { name: 'handleClose', desc: '触发关闭（走 before-close 拦截流程）', type: '() => void', default: '—' },
  { name: 'ref', desc: '抽屉面板根 DOM 元素（焦点圈禁容器）', type: 'HTMLElement', default: '—' },
]" />
