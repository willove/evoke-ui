<template>
  <div class="et-panel" :class="{ 'is-collapsed': collapsed, 'is-maximized': maximized }">
    <header class="et-panel__header">
      <span class="et-panel__title" :title="title">{{ title }}</span>
      <span v-if="$slots.tools" class="et-panel__tools">
        <slot name="tools" />
      </span>
      <span class="et-panel__actions">
        <button
          type="button"
          class="et-panel__btn"
          :aria-label="collapsed ? '展开面板' : '折叠面板'"
          @click="onToggleCollapsed"
        >
          <et-icon :name="collapsed ? ICON_EXPAND : ICON_COLLAPSE" :size="ICON_SIZE" />
        </button>
        <button
          type="button"
          class="et-panel__btn"
          :aria-label="maximized ? '还原面板' : '最大化面板'"
          @click="onToggleMaximize"
        >
          <et-icon :name="maximized ? ICON_RESTORE : ICON_MAXIMIZE" :size="ICON_SIZE" />
        </button>
        <button
          v-if="closable"
          type="button"
          class="et-panel__btn"
          aria-label="关闭面板"
          @click="onClose"
        >
          <et-icon :name="ICON_CLOSE" :size="ICON_SIZE" />
        </button>
      </span>
    </header>
    <!-- 折叠态只露标题栏：内容整体不渲染（v-if 省 DOM，不是 visibility 隐藏） -->
    <div v-if="!collapsed" class="et-panel__body" :class="{ 'is-scroll': bodyScroll }">
      <!-- 内容槽带 { panel } 作用域参数：停靠链（EtDock → EtPanelGroup → 本件）
           按面板节点分发内容，消费方一套模板服务整个 dock 的面板集合 -->
      <slot :panel="props.panel" />
    </div>
  </div>
</template>

<script setup>
/**
 * EtPanel — 侧/底停靠面板（tools-ui 计划 05 §四 L3 / M2）
 *
 * 标题栏 = 标题 + tools 工具位 + 右侧动作组（折叠 / 最大化|还原 / 关闭）。
 * 槽：default（{ panel }，内容区）/ tools（标题栏右侧工具位，无槽不占位）。
 * 三条纪律：
 *   ① 状态只由 props 来——本件不存 collapsed / maximized，与 M1 命令状态
 *      同源（单一事实源 = 布局树，写树入口在 EtWorkbench）；
 *   ② 折叠态内容不渲染（v-if）：省 DOM，也让"折叠后面板不占事件"天然成立；
 *   ③ 全屏态只做视觉放大—— EtWorkbench 的全屏是 grid 让位重排（对应 rail
 *      跨满行列），本件撑满停靠位并把层级抬到面板层之上即可；不用 fixed
 *      定位（那会提出工作台流、盖住 chrome，与外壳让位语义重复，选型注释见
 *      style.css 的 is-maximized 段）。
 */
import { computed } from 'vue'
import EtIcon from '../../icons/icon.vue'

defineOptions({ name: 'EtPanel' })

const props = defineProps({
  /** 布局节点：{ id, title, size, min, max, collapsed, hidden, closable } */
  panel: { type: Object, default: null },
  /** 全屏态（由 EtDock / EtWorkbench 持有并传入；同刻全局只有一个面板为真） */
  maximized: { type: Boolean, default: false },
  /** 内容区滚动（默认开；关掉后内容自溢出由消费方自己管） */
  bodyScroll: { type: Boolean, default: true },
})

const emit = defineEmits(['collapse', 'expand', 'close', 'maximize', 'restore'])

/** 标题栏图标一律 16 档（--et-icon-sm），同一族件齐次 */
const ICON_SIZE = 'var(--et-icon-sm)'
const ICON_COLLAPSE = 'arrow-down'
const ICON_EXPAND = 'arrow-up'
const ICON_MAXIMIZE = 'fullscreen'
const ICON_RESTORE = 'contract'
const ICON_CLOSE = 'close'

const title = computed(() => props.panel?.title ?? '')
const collapsed = computed(() => !!props.panel?.collapsed)
/** closable 缺省 true（与布局树契约的布尔落定一致：closable !== false） */
const closable = computed(() => props.panel?.closable !== false)

function onToggleCollapsed() {
  if (collapsed.value) emit('expand', props.panel?.id)
  else emit('collapse', props.panel?.id)
}

function onToggleMaximize() {
  if (props.maximized) emit('restore')
  else emit('maximize', props.panel?.id)
}

function onClose() {
  emit('close', props.panel?.id)
}
</script>

<style src="./style.css"></style>
