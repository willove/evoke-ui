<template>
  <div class="demo">
    <!-- 演示控制面（不是产品 chrome：只放密度与主题两个开关 + 视图切换） -->
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
        <label class="demo__control demo__control--inline">
          <span class="demo__control-label">暗色</span>
          <eb-switch v-model="isDark" size="small" />
        </label>
      </div>
    </header>

    <!-- ═══ 视图一：工作台骨架（chrome 环绕画布） ═══ -->
    <template v-if="view === 'workbench'">
      <div class="wb">
        <div class="wb__titlebar">
          <span class="wb__doc">季度报表.xlsx</span>
          <span class="wb__spacer" />
          <!-- 窗口控制位：Web 形态的自定义控件（16 档图标，成套同源）；桌面壳由宿主
               提供原生按钮，M3 的 EtTitleBar 把它做成可适配的 -->
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

        <et-tab-strip
          v-model="activeTab"
          class="wb__tabstrip"
          :tabs="tabs"
          aria-label="文档标签"
          @change="onTabChange"
          @close="onTabClose"
          @context="onTabContext"
        />

        <div class="wb__toolarea">
          <et-tool-group label="剪贴板">
            <et-tool-button icon="copy" label="复制" tip="复制" combo="mod+c" />
            <et-tool-button icon="brush" label="格式刷" tip="格式刷" />
            <et-tool-button icon="close" label="清除" tip="清除" :disabled="true" />
          </et-tool-group>
          <et-divider />
          <et-tool-group label="字体">
            <et-tool-button icon="bold" label="加粗" tip="加粗" combo="mod+b" :active="true" />
            <et-tool-button icon="italic" label="倾斜" tip="倾斜" combo="mod+i" />
            <et-tool-button icon="underline" label="下划线" tip="下划线" combo="mod+u" />
            <et-select v-model="fontFamily" :options="fontFamilyOptions" style="width: calc(var(--et-size-toolbtn-large) * 2)" />
          </et-tool-group>
          <et-divider />
          <et-tool-group label="视图">
            <et-tool-button size="small" icon="zoom-in" label="放大" tip="放大" combo="mod+plus" />
            <et-tool-button size="small" icon="search" label="查找" tip="查找" combo="mod+f" />
            <et-tool-button size="small" icon="more" label="更多" tip="更多命令" combo="mod+period" />
            <et-tool-spacer />
            <et-tool-button size="small" icon="table" label="表格" tip="插入表格" />
          </et-tool-group>
        </div>

        <div class="wb__auxbar">
          <span class="wb__auxbar-fx">fx</span>
          <span class="wb__auxbar-formula">=SUM(B2:B14)</span>
        </div>

        <main class="wb__canvas">
          <!-- 空态即首屏：一句引导 + 一个主按钮，不是空白网格（计划 06 §三 文案门） -->
          <div class="wb__empty">
            <p class="wb__empty-line">从粘贴一段数据开始</p>
            <button type="button" class="wb__empty-cta" @click="onEmptyCta">新建表格</button>
            <p v-if="canvasHint" class="wb__empty-hint">{{ canvasHint }}</p>
          </div>
          <div class="wb__grid" />
        </main>

        <footer class="wb__statusbar">
          <span class="wb__status">就绪</span>
          <span class="wb__spacer" />
          <span class="wb__status">3 项选中</span>
          <span class="wb__status">100%</span>
        </footer>
      </div>
    </template>

    <!-- ═══ 视图二：图标底座对比（Remix vs Fluent，同一批命令）═══ -->
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
  </div>
</template>

<script setup>
/**
 * 工作台装配示例（tools-ui 计划 07：L4 集成的落地形态 / 视觉自验证的截图面）
 *
 * 装的是 M0 交付物：EtProvider（三档密度）+ EtTabStrip + EtToolGroup/EtToolButton
 * + EtSelect + EtDivider/EtToolSpacer + EtScreenTip（经 tip prop 包裹小钮）。
 * density 开关直接切 <html data-density> —— 整组控件随令牌换档，无一条 px 字面量。
 */
import { computed, h, onMounted, ref, watch } from 'vue'
import {
  EbSegmented,
  EbSwitch,
  registerIcons,
  useDarkMode,
} from '@wil-works/evoke-business-ui'
import { FLUENT_ICON_PATHS } from './fluent-icons'

// ─── Fluent 对比资产：注册为 custom:fluent-* 语义名（运行时零依赖） ───
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

// 密度开关直接写 <html data-density>（与 EtProvider 同一机制；示例里手写一遍，
// 让"换档 = 换一组令牌"的效果在没有 Provider 包裹时也看得见）
const density = ref('default')
watch(density, (v) => {
  document.documentElement.setAttribute('data-density', v)
})
onMounted(() => {
  document.documentElement.setAttribute('data-density', density.value)
})

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

const activeTab = ref('sheet-1')
const tabs = ref([
  { id: 'sheet-1', label: '一季度' },
  { id: 'sheet-2', label: '二季度' },
  { id: 'sheet-3', label: '备注', closable: true },
])

const canvasHint = ref('')
const fontFamily = ref('pingfang')
const fontFamilyOptions = [
  { label: '苹方', value: 'pingfang' },
  { label: '思源黑体', value: 'source-han' },
  { label: '微软雅黑', value: 'ms-yahei' },
]

/** 两版对比用同一批命令（只收录 Remix 内置集里同名的语义） */
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

function onTabChange(id) {
  activeTab.value = id
}
function onTabClose(id) {
  const i = tabs.value.findIndex((t) => t.id === id)
  if (i >= 0) tabs.value.splice(i, 1)
}
function onTabContext(id) {
  activeTab.value = id
}

/** 空态主按钮（演示：无真实副作用） */
function onEmptyCta() {
  canvasHint.value = '已新建（演示）'
}
</script>

<style src="./workbench.css"></style>
