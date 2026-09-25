<template>
  <et-provider :density="density">
    <div class="demo">
    <!-- 演示控制面（不是产品 chrome：密度/视图/选区/命令/键位/暗色） -->
    <header class="demo__bar">
      <span class="demo__title">工作台装配示例</span>
      <div class="demo__controls">
        <label class="demo__control">
          <span class="demo__control-label">密度</span>
          <eb-segmented v-model="density" :options="densityOptions" size="small" />
        </label>
        <label class="demo__control">
          <span class="demo__control-label">视图</span>
          <eb-segmented v-model="view" :options="viewOptions" size="small" />
        </label>
        <label class="demo__control">
          <span class="demo__control-label">选区</span>
          <eb-segmented v-model="selection" :options="selectionOptions" size="small" />
        </label>
        <button type="button" class="demo__btn" @click="paletteOpen = true">命令面板</button>
        <button type="button" class="demo__btn" @click="showKeys = !showKeys">
          {{ showKeys ? '收起键位' : '键位表' }}
        </button>
        <label class="demo__control demo__control--inline">
          <span class="demo__control-label">暗色</span>
          <eb-switch v-model="isDark" size="small" />
        </label>
      </div>
    </header>

    <div v-if="showKeys" class="demo__keys">
      <et-shortcut-panel :registry="demoRegistry" class="demo__keys-panel" />
    </div>

    <!-- ═══ 视图一：工作台骨架（M1：schema 驱动的功能区） ═══ -->
    <template v-if="view === 'workbench'">
      <div class="wb">
        <div class="wb__titlebar">
          <span class="wb__doc">季度报表.xlsx</span>
          <span class="wb__spacer" />
          <button type="button" class="wb__win" aria-label="最小化">
            <et-icon name="minus" :size="16" />
          </button>
          <button type="button" class="wb__win" aria-label="最大化">
            <et-icon name="fullscreen" :size="16" />
          </button>
          <button type="button" class="wb__win" aria-label="关闭">
            <et-icon name="close" :size="16" />
          </button>
        </div>

        <!-- 功能区：tab 条 + 组 + 条目 + 真折叠/溢出/上下文 tab（M0 手工版 → M1 声明式） -->
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          class="wb__ribbon"
          :schema="DEMO_RIBBON_SCHEMA"
          :registry="demoRegistry"
          :context-tabs="DEMO_CONTEXT_TABS"
          :ctx="ctx"
          persist-key="demo-ribbon-collapsed"
          @command="onCommand"
        />

        <div class="wb__auxbar">
          <span class="wb__auxbar-fx">fx</span>
          <span class="wb__auxbar-formula">=SUM(B2:B14)</span>
          <span class="wb__spacer" />
          <span class="wb__auxbar-hint">Ctrl+F1 折叠功能区</span>
        </div>

        <!-- 画布满区右键菜单（与工具区同一命令表） -->
        <et-context-menu :registry="demoRegistry" :schema="DEMO_CONTEXT_SCHEMA" :ctx="ctx" class="wb__ctx">
          <main class="wb__canvas">
            <div class="wb__empty">
              <p class="wb__empty-line">从粘贴一段数据开始</p>
              <button type="button" class="wb__empty-cta" @click="onEmptyCta">新建表格</button>
              <p v-if="canvasHint" class="wb__empty-hint">{{ canvasHint }}</p>
            </div>
            <div class="wb__grid" />
          </main>
        </et-context-menu>

        <footer class="wb__statusbar">
          <span class="wb__status">就绪</span>
          <span class="wb__spacer" />
          <span class="wb__status">{{ ctx.hasSelection ? '有选区' : '无选区' }}</span>
          <span class="wb__status">100%</span>
        </footer>
      </div>
    </template>

    <!-- ═══ 视图二：图标底座对比（M0 留档面） ═══ -->
    <template v-else>
      <div class="cmp">
        <section class="cmp__row">
          <h2 class="cmp__title">Remix（business-ui 现成）</h2>
          <div class="cmp__toolarea">
            <et-tool-group label="字体">
              <et-tool-button v-for="c in compareCommands" :key="c.icon" :icon="c.icon" :label="c.label" :tip="c.label" />
            </et-tool-group>
          </div>
        </section>
        <section class="cmp__row">
          <h2 class="cmp__title">Fluent System Icons（24 regular）</h2>
          <div class="cmp__toolarea">
            <et-tool-group label="字体">
              <et-tool-button v-for="c in compareCommands" :key="c.icon" :icon="`custom:fluent-${c.icon}`" :label="c.label" :tip="c.label" />
            </et-tool-group>
          </div>
        </section>
        <p class="cmp__note">同一批命令、同一渲染路径，只换图标形状数据。</p>
      </div>
    </template>

    <!-- ⌘K 命令面板（数据来自命令表） -->
    <et-command-palette
      v-model="paletteOpen"
      :registry="demoRegistry"
      :ctx="ctx"
      recent-key="demo-recent-commands"
      @command="onCommand"
    />
    </div>
  </et-provider>
</template>

<script setup>
/**
 * 工作台装配示例（M1：声明式功能区）
 *
 * 装配关系（计划 07 M1）：命令表 → schema → EtRibbonBar；同一命令表再驱动
 * EtCommandPalette（⌘K）与 EtContextMenu（右键）。enabled/active 由
 * ctx（选区/焦点）推演——工具区、右键、命令面板三处状态同源。
 */
import { computed, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'
import { EbSegmented, EbSwitch, registerIcons, useDarkMode } from '@wil-works/evoke-business-ui'
import { comboMatchesEvent } from '@wil-works/evoke-tools-ui/runtime'
import {
  DEMO_CONTEXT_SCHEMA,
  DEMO_CONTEXT_TABS,
  DEMO_RIBBON_SCHEMA,
  demoRegistry,
} from './commands'
import { FLUENT_ICON_PATHS } from './fluent-icons'

// ─── Fluent 对比资产（M0 留档） ───
const fluentIcons = {}
for (const [name, entry] of Object.entries(FLUENT_ICON_PATHS)) {
  fluentIcons[`fluent-${name}`] = () =>
    h(
      'svg',
      { xmlns: 'http://www.w3.org/2000/svg', viewBox: entry.viewBox, 'aria-hidden': 'true' },
      entry.paths.map((p) => h('path', { fill: 'currentColor', d: p.d })),
    )
}
registerIcons(fluentIcons)

const { isDark } = useDarkMode()

// 密度开关交给 EtProvider（A-19 修复后：prop 变 → <html data-density> 即时跟随）
const density = ref('default')

const densityOptions = [
  { label: '紧凑', value: 'compact' },
  { label: '默认', value: 'default' },
  { label: '宽松', value: 'relaxed' },
]
const viewOptions = [
  { label: '工作台', value: 'workbench' },
  { label: '图标对比', value: 'icons' },
]
const view = ref('workbench')

// 选区上下文：驱动 enabled/active 与上下文 tab（计划 01：状态由选区与焦点推演）
const selection = ref('none')
const selectionOptions = [
  { label: '无', value: 'none' },
  { label: '图片', value: 'picture' },
  { label: '表格', value: 'table' },
]
const ctx = computed(() => ({
  hasSelection: selection.value !== 'none',
  selection: selection.value === 'none' ? null : selection.value,
  format: { bold: selection.value === 'picture' },
}))

const activeTab = ref('home')
const collapsed = ref(false)
const paletteOpen = ref(false)
const showKeys = ref(false)
const canvasHint = ref('')

function onCommand(id) {
  canvasHint.value = `执行命令：${id}`
}

function onEmptyCta() {
  canvasHint.value = '已新建（演示）'
}

// ⌘K 开命令面板（产品级全局键位；组字期不抢）
function onGlobalKeydown(e) {
  if (isImeComposing(e)) return
  if (comboMatchesEvent('mod+k', e)) {
    e.preventDefault()
    paletteOpen.value = !paletteOpen.value
  }
}
onMounted(() => document.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onGlobalKeydown))

const compareCommands = [
  { icon: 'bold', label: '加粗' },
  { icon: 'italic', label: '倾斜' },
  { icon: 'underline', label: '下划线' },
  { icon: 'search', label: '查找' },
  { icon: 'filter', label: '筛选' },
  { icon: 'table', label: '表格' },
  { icon: 'copy', label: '复制' },
  { icon: 'zoom-in', label: '放大' },
  { icon: 'brush', label: '格式刷' },
  { icon: 'more', label: '更多' },
  { icon: 'close', label: '关闭' },
]
</script>

<style src="./workbench.css"></style>
