<template>
  <div class="et-panelgroup">
    <!--
      多面板 tab 化（M2 口径）：tab 条只列未折叠、未隐藏的面板（被折叠/隐藏的
      不进 tab 条——折叠态由激活面板自己的标题栏表达，隐藏态整条退出渲染）。
      单条目时不渲染条：没有可切换的对象，一条空tab 条只占 chrome 高度。
      键盘漫游（左右 / Home / End）由 EtTabStrip 提供，这里只监听 change
      （selectTab 同时发 update:modelValue 与 change，两个都绑会双发）。
    -->
    <et-tab-strip
      v-if="tabTabs.length > 1"
      :model-value="activePanel?.id ?? ''"
      :tabs="tabTabs"
      @change="onSelect"
    />
    <et-panel
      v-if="activePanel"
      :panel="activePanel"
      :maximized="activePanel.id === maximizedPanel"
      @collapse="(id) => emit('collapse', id)"
      @expand="(id) => emit('expand', id)"
      @close="(id) => emit('close', id)"
      @maximize="(id) => emit('maximize', id)"
      @restore="() => emit('restore')"
    >
      <!-- 内容与工具位透传给激活面板：作用域参数换成激活面板节点（停靠链
           EtDock → 本件 → EtPanel 逐层下递，见 EtDock 的 panel 槽） -->
      <slot :panel="activePanel" />
      <template #tools>
        <slot name="tools" :panel="activePanel" />
      </template>
    </et-panel>
  </div>
</template>

<script setup>
/**
 * EtPanelGroup — 同一 dock 内多面板的呈现（tools-ui 计划 05 §四 L3 / M2）
 *
 * M2 口径：同 dock 多面板 tab 化——标题行是 tab 条，内容区只渲染激活面板的
 * EtPanel（其余面板在 tab 条里可达，不占 DOM）。折叠/隐藏的面板不进 tab 条；
 * 激活面板折叠时它的标题栏就是该面板在内容区的全部呈现（展开钮可还原）。
 *
 * emit 面在契约的 select/collapse/close/maximize/restore 之外多一个 expand：
 * 激活面板折叠后要靠 EtPanel 的展开钮还原，不转发这个事件，tab 化 dock 里
 * 被折叠的面板就永远回不来了。
 *
 * 槽透传：default（作用域 { panel }）与 tools 都转发给激活面板的 EtPanel——
 * 停靠链 EtDock → 本件 → EtPanel 上，内容/工具位按面板节点分发，消费方一套
 * 模板服务整个 dock 的面板集合。
 */
import { computed } from 'vue'
import EtTabStrip from '../tab-strip/index.vue'
import EtPanel from './index.vue'

defineOptions({ name: 'EtPanelGroup' })

const props = defineProps({
  /** 同一 dock 的面板节点数组（至少 1 个；顺序即 tab 顺序） */
  panels: { type: Array, default: () => [] },
  /** 激活面板 id */
  activeId: { type: String, default: '' },
  /** 全屏面板 id（全局唯一；透传给激活面板做视觉放大） */
  maximizedPanel: { type: String, default: null },
})

const emit = defineEmits(['select', 'collapse', 'expand', 'close', 'maximize', 'restore'])

/** 隐藏面板整条退出（产品层用 showPanel 拉回来——隐藏 ≠ 不可达） */
const visiblePanels = computed(() => props.panels.filter((panel) => !panel.hidden))

const tabTabs = computed(() =>
  visiblePanels.value
    .filter((panel) => !panel.collapsed)
    .map((panel) => ({ id: panel.id, label: panel.title })),
)

/** 激活面板：activeId 落空（切走/被隐藏）时落到首个可见面板，内容区不留空 */
const activePanel = computed(
  () => visiblePanels.value.find((panel) => panel.id === props.activeId) ?? visiblePanels.value[0] ?? null,
)

function onSelect(id) {
  emit('select', id)
}
</script>

/* EtPanelGroup 与 EtPanel 共用同目录 style.css（同 EtSplitter / EtSplitterPanel
   的范式：族内子件一份样式表，入口构建时归入共享 chunk） */
<style src="./style.css"></style>
