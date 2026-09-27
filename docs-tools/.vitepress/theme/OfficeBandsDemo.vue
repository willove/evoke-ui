<template>
  <!--
    组合契约页的现场样板：**多槽拼装的最小闭环**。

    横带序列（办公皮肤 .et-office-bands）里放：公式栏（引用位 / 编辑区 / 动作位三槽）→
    画布宿主（默认槽 = 画布内容，overlay 槽 = 不随滚动的浮层）→ 表页签 + 状态栏。
    这里刻意不引入工作台：样板只演示"槽怎么拼"，整页装配见案例区。
  -->
  <div class="slot-demo">
    <div class="et-office-bands">
      <div class="et-office-bands__top">
        <et-formula-bar
          v-model="formula"
          :reference="reference"
          placeholder="输入内容或公式"
          @submit="onSubmit"
        >
          <template #reference>
            <span class="slot-demo__ref">{{ reference }}</span>
          </template>
          <template #actions>
            <et-tool-button size="small" icon="function-line" label="插入函数" />
          </template>
        </et-formula-bar>
      </div>

      <div class="et-office-bands__canvas">
        <et-sheet-canvas-host
          label="示例画布"
          :content-width="720"
          :content-height="480"
          @scroll="onScroll"
        >
          <div class="slot-demo__sheet">
            <p class="slot-demo__sheet-tip">默认槽 = 画布内容（真实产品这里放 canvas / 自绘网格）</p>
          </div>
          <template #overlay>
            <div class="slot-demo__floating">浮层位：不随内容滚动</div>
          </template>
        </et-sheet-canvas-host>
      </div>

      <div class="et-office-bands__bottom">
        <et-sheet-tabs v-model="sheet" :tabs="sheets" />
        <et-status-bar :items="statusItems" zoom="100%" />
      </div>
    </div>

    <p class="slot-demo__hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const reference = ref('B7')
const formula = ref('=SUM(B2:B6)')
const sheet = ref('summary')
const sheets = [
  { id: 'summary', label: '汇总' },
  { id: 'detail', label: '明细', color: '#f59e0b' },
  { id: 'draft', label: '草稿' },
]
const statusItems = [{ key: 'ready', label: '就绪' }]
const hint = ref('滚动画布试试：浮层位不动，滚动量由 #scroll 事件报出来')

function onScroll({ scrollLeft, scrollTop }) {
  hint.value = `滚动位置 ${Math.round(scrollLeft)}, ${Math.round(scrollTop)}`
}

function onSubmit() {
  hint.value = `已提交：${formula.value}`
}
</script>

<style scoped>
.slot-demo .et-office-bands {
  height: 420px;
  border: 1px solid var(--td-border);
  border-radius: 10px;
  overflow: hidden;
}
.slot-demo__ref {
  font-family: var(--td-mono);
  font-size: 12px;
}
.slot-demo__sheet {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background:
    repeating-linear-gradient(0deg, transparent 0 23px, var(--td-border-light) 23px 24px),
    repeating-linear-gradient(90deg, transparent 0 95px, var(--td-border-light) 95px 96px);
}
.slot-demo__sheet-tip {
  padding: 6px 12px;
  border-radius: 4px;
  background: var(--td-bg);
  font-size: 12.5px;
  color: var(--td-text-tertiary);
}
.slot-demo__floating {
  position: absolute;
  inset-block-start: 18px;
  inset-inline-start: 24px;
  padding: 5px 10px;
  border: 1px solid var(--td-primary);
  border-radius: 6px;
  background: var(--td-bg);
  font-size: 12px;
  color: var(--td-primary);
}
.slot-demo__hint {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--td-text-tertiary);
  font-variant-numeric: tabular-nums;
}
</style>