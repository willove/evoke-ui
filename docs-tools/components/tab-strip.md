# EtTabStrip · 下划线式 tab 条

纯文字 tab 条（对齐 Excel/WPS）：roving 漫游、Delete 关闭、窄屏溢出「更多」。

<script setup>
import { ref } from 'vue'
const active = ref('home')
const closed = ref([])
const tabs = [
  { id: 'home', label: '开始' },
  { id: 'insert', label: '插入', closable: true },
  { id: 'data', label: '数据', closable: true },
  { id: 'review', label: '审阅', disabled: true },
  { id: 'view', label: '视图' },
  { id: 'help', label: '帮助' },
]
function onClose(_, id) {
  closed.value.push(id)
  if (active.value === id) active.value = 'home'
}
</script>

<DemoBlock densities>
  <et-tab-strip v-model="active" :tabs="tabs" @close="onClose" />
</DemoBlock>

<p class="demo-readout">当前 <code>{{ active }}</code> · 已关闭 <code>{{ closed.join('、') || '—' }}</code></p>

## API

<CompApi id="tab-strip" />

## 行为

- ARIA 只有 `tablist` / `tab` / `aria-selected`；不渲染 tabpanel，激活态由消费方自己渲染。
- 键盘：左右 / Home / End 漫游并把焦点落到对应 DOM；Delete 关闭当前可关闭条目。
- 溢出：ResizeObserver 量容器宽，尾部条目收进「更多」下拉；观察器卸载时断开。
- 同文件导出纯函数 `planOverflow(widths, available, { gap, moreWidth })`，返回 `{ visible, overflow }`（条目下标划分）。
- 关闭钮 `tabindex="-1"` 不进 Tab 序列，`aria-label` 满足 G4。
- 暴露 `measure()`。

## 令牌与门禁

- 度量与 `EtDocumentTabs` 逐项共用（同槽位视觉一致）。
- G5：Delete 判 `isImeComposing`。
- 内存预算：观察器必须 disconnect。
