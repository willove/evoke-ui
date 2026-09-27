# EtFormulaBar · 公式栏

**office 层**的输入带：引用位 + 编辑区 + 动作位，高度钉死 chrome 预算（26px）。
产品放自己的编辑器（公式高亮 / 自动补全）就填默认槽；要可编辑的名称框就填 `#reference`。

<script setup>
import { ref } from 'vue'
const value = ref('=SUM(B2:B8)')
const cell = ref('B9')
const last = ref('')
</script>

<DemoBlock densities>
  <div class="demo-col">
    <div class="demo-row">
      <et-tool-button
        v-for="c in ['B9', 'C12', 'D3:D9']"
        :key="c"
        size="small"
        :icon="'grid'"
        :label="c"
        :active="cell === c"
        @click="cell = c"
      />
    </div>
    <et-formula-bar v-model="value" :reference="cell" placeholder="输入内容或公式" @submit="last = $event" @cancel="last = '已取消'" />
  </div>
</DemoBlock>

<p class="demo-readout">最近提交 <code>{{ last || '—' }}</code></p>

## API

<CompApi id="formula-bar" />

## 契约要点

- **键盘**：Enter 提交、Esc 收敛、Shift+Enter 放行（多行编辑器），IME 组字期间不拦；
- **只读**：`readonly` 时 Enter 不提交，但内容仍可读、可选中复制；
- **展开**：显式用户操作，展开态高度交给内容——chrome 预算由产品/布局树自理占位；
- **办公语义不在本组件**：引用怎么格式化、编辑什么内容，都由产品给（本件不认识"单元格"）。
