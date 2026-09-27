# EtThemeBridge · 主题 → 画布桥

把主题令牌解析成画布调色板的零 DOM 桥接件：不占布局、不吃事件、无色值。

<script setup>
import { ref } from 'vue'

const last = ref(null)
const dark = ref(false)
function toggle() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
}
</script>

<DemoBlock>
  <div class="demo-col">
    <div class="demo-row">
      <et-tool-button size="small" icon="moon" label="切换明暗" :active="dark" @click="toggle" />
    </div>
    <et-theme-bridge @change="last = $event" />
    <p class="demo-readout">
      最近一次刷新 <code>{{ last ? Object.keys(last).length + ' 个角色' : '—' }}</code> ·
      <code>canvas-bg</code> = <code>{{ last?.['canvas-bg']?.value || '—' }}</code>
    </p>
  </div>
</DemoBlock>

## API

<CompApi id="theme-bridge" />

## 行为

- 按登记表把每个画布角色对到主题侧已有令牌名，运行期读实际值写成 `--ot-<role>`；本件与契约同源，一个颜色字面量都没有（G1 红线）。
- 联动：`observeThemeChanges` 盯 `:root` 的 `class` / `style` / `data-theme` / `data-density`，变化即重跑解析与落值；写值自身触发订阅，按签名去重，不会自激。
- **`@change` 是给引擎类消费方的订阅面**：画布产品（canvas 取值后还要 `setTheme`）据此重读自己的 `--ot-*` 换主题，不必再自写 `MutationObserver`；挂载即发首值，值没变不重复发。
- `target` / `palette` 变更重建订阅（旧订阅先退，不叠观察器）；解析不到目标静默不桥接。
- 空值角色不写 `--ot-*`（不静默注入错色），由画布侧自己兜底。
- 画布侧消费方 = 产品层 CSS（网格线 / 选区 / 表头 / 活动格规则引用 `--ot-*`）；**`--ot-*` 的语义权威在产品层**，本件只保证"主题令牌变了，画布令牌跟着变"。

## 令牌与门禁

- 登记表 `CANVAS_PALETTE` 与落值前缀 `--ot-` 见[主题与画布桥](/guide/theme#登记表)。
- G1：框架层不认识色值，只认识令牌名；换品牌色/暗色都不用改本件。
- 订阅必须可退订，禁观察器泄漏（卸载时 `unsubscribe`）。
