# EtSheetTabs · 工作表标签

**office 层**的底带表页签：当前页白底 + 底边强调条，窄了收进「更多」。
与 `EtTabStrip` 的区别是语义——这是**内容页签**（选中表 = 换画布），不是命令 tab。

<script setup>
import { ref } from 'vue'
const active = ref('summary')
const sheets = ref([
  { id: 'summary', label: '汇总' },
  { id: 'detail', label: '明细', color: '#f59e0b' },
  { id: 'draft', label: '草稿' },
])
const lastAction = ref('')
function addSheet() {
  const id = `sheet-${sheets.value.length + 1}`
  sheets.value.push({ id, label: `表 ${sheets.value.length + 1}` })
  active.value = id
  lastAction.value = `新增 ${id}`
}
</script>

<DemoBlock densities>
  <et-sheet-tabs v-model="active" :tabs="sheets" @add="addSheet" @context="lastAction = '右键菜单（产品接管）'" />
</DemoBlock>

<p class="demo-readout">当前表 <code>{{ active }}</code> · 最近动作 <code>{{ lastAction || '—' }}</code></p>

## API

<CompApi id="sheet-tabs" />

## 契约要点

- **键盘**：roving tabindex（左右 / Home / End），整组只占一个 Tab 停靠点；与 `EtTabStrip`、`EtDocumentTabs` 同一套漫游契约，组字期间不漫游；
- **全条目常驻 DOM**：溢出的只收起不卸载——溢出规划要实测宽，且可见集变化不重建条目，焦点不丢；
- **溢出算法**复用 `EtTabStrip` 的 `planOverflow` 纯函数（口径一致，可单测）；
- **底带高度** = `--et-chrome-tabstrip-height`，禁换行禁撑高。
