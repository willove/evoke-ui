# EtBackstage · 全屏页骨架

全屏页（文件菜单那种）：左导航 + 内容区 + 返回/Esc，开关不引发画布尺寸跳动。

<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>

<DemoBlock>
  <div class="demo-col">
    <et-tool-button size="small" icon="folder-open" label="文件" @click="open = true" />
    <et-backstage v-model="open" title="文件">
      <template #nav>
        <et-tool-button v-for="n in ['最近', '打开', '另存为']" :key="n" size="small" icon="file" :label="n" @click="open = false" />
      </template>
      <p>最近文档（产品内容）</p>
    </et-backstage>
  </div>
</DemoBlock>

## API

<CompApi id="backstage" />

## 行为

- 不引发画布尺寸跳动的三条结构保证：Teleport 到 body 不参与文档流、挂载点只留零尺寸锚点、打开期间 `documentElement` 挂计数式锁滚动 class（`overflow: hidden` + 实测滚动条缺口补 `padding-right`——有滚动条才补、没有就是 0；不用 `scrollbar-gutter: stable`，它在无滚动条页面会凭空造槽位，实测抓过 5px 横跳）。
- 焦点陷阱 / Esc 收敛 / 焦点归还与 EtDialog、EtCommandPalette 共用 `useModalFocus`（同一套契约）。
- `role="dialog"` + `aria-modal="true"`，`tabindex="-1"`。
- 锁滚动计数在模块作用域：多实例叠加时只有最后一个个例摘 class。

## 令牌与门禁

- 左导航宽缺省走 `--eb-sidebar-width`。
- M3 验收：backstage 开关不引发画布尺寸跳动；焦点三处一致。
- 过渡名走常量绑定（G2 图标名提取器会把过渡名的字面属性当图标名）。
