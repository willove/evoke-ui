# EtEmptyState · 工具界面空态

空态即首屏：一句引导 + 一个主按钮，图标取 lg 档、无插画、强调色只出现一次。

<script setup>
import { ref } from 'vue'
const actions = ref(0)
</script>

<DemoBlock densities>
  <et-empty-state
    icon="search"
    title="从粘贴一段数据开始"
    desc="支持 CSV 与 JSON。"
    action-label="新建表格"
    @action="actions++"
  />
</DemoBlock>

<p class="demo-readout">主按钮点击 <code>{{ actions }}</code> 次</p>

## API

<CompApi id="empty-state" />

## 行为

- `role="status"`：空态常驻首屏，读屏进入即播报。
- 图标盒 `aria-hidden`：图标是引导的视线锚，不是可读信息，可访问名由标题承担。
- 图标未命中走 `EtIcon` 兜底（显式兜底图标 + dev warn，不渲染空白）。
- 与底座 `EbEmptyState` 的分界：底座面向中后台数据表格（插画 + 描述 + 底部操作位），本件对齐工具界面的安静密度。

## 令牌与门禁

- `--et-icon-lg`（图标盒 24 / 20 / 28 随密度）。
- G6 文案门：引导句动词开头、说人话；空态禁成段介绍。
