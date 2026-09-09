<template>
  <div
    class="ev-tabs ev-tabs"
    :class="[`ev-tabs--${tabPosition}`, `ev-tabs--${type}`, { 'is-top': tabPosition === 'top' }]"
  >
    <div class="ev-tabs__header" :class="[`is-${tabPosition}`]">
      <div class="ev-tabs__nav-wrap" :class="[`is-${tabPosition}`, { 'is-scrollable': isScrollable }]">
        <div ref="navScrollRef" class="ev-tabs__nav-scroll" @wheel="handleWheel">
          <div ref="navRef" class="ev-tabs__nav" :class="[`is-${tabPosition}`]">
            <div
              class="ev-tabs__active-bar"
              :class="[`is-${tabPosition}`]"
              :style="activeBarStyle"
            />
            <div
              v-for="pane in panes"
              :key="pane.paneName"
              class="ev-tabs__item"
              :class="[
                `is-${tabPosition}`,
                {
                  'is-active': pane.paneName === currentName,
                  'is-disabled': pane.disabled,
                  'is-closable': pane.closable,
                },
              ]"
              role="tab"
              :aria-selected="pane.paneName === currentName"
              :tabindex="pane.disabled ? -1 : 0"
              @click="handleTabClick(pane)"
              @keydown.enter="handleTabClick(pane)"
            >
              <span class="ev-tabs__item-text">
                <component :is="pane.slots.label?.()" v-if="pane.slots.label" />
                <template v-else>{{ pane.label }}</template>
              </span>
              <ev-icon
                v-if="pane.closable && editable === false"
                class="ev-tabs__close-icon"
                name="close"
                @click.stop="handleTabRemove(pane)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ev-tabs__content">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EvTabs — 标签页
 * type：''（默认线条）/ card / border-card；tabPosition：top/right/bottom/left
 * 子 TabPane 注册模式；v-model 当前激活
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, toRef, watch } from 'vue'
import EvIcon from '../icon/index.vue'
import { provideTabsContext } from './tabs-context'

defineOptions({ name: 'EvTabs' })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: {
    type: String,
    default: '',
    validator: (v) => ['', 'card', 'border-card'].includes(v),
  },
  tabPosition: {
    type: String,
    default: 'top',
    validator: (v) => ['top', 'right', 'bottom', 'left'].includes(v),
  },
  closable: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  /** 懒渲染（激活过才渲染） */
  lazy: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'tab-click', 'tab-change', 'tab-remove', 'edit'])

const panes = ref([])
const navRef = ref(null)
const navScrollRef = ref(null)

const currentName = ref(props.modelValue || '')

// ─── TabPane 注册 ───
function registerPane(pane) {
  if (!panes.value.some((p) => p.paneName === pane.paneName)) {
    panes.value.push(pane)
  }
  // 无激活值时默认第一个
  if (!currentName.value && panes.value.length) {
    currentName.value = panes.value[0].paneName
    emit('update:modelValue', currentName.value)
  }
}

function unregisterPane(pane) {
  panes.value = panes.value.filter((p) => p !== pane)
}

provideTabsContext({
  currentName,
  registerPane,
  unregisterPane,
  lazy: toRef(props, 'lazy'),
})

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== '') currentName.value = val
  }
)

watch(currentName, (val) => {
  emit('update:modelValue', val)
  emit('tab-change', val)
  nextTick(() => {
    updateScrollable()
    updateActiveBar()
    scrollActiveIntoView()
  })
})

// ─── 激活指示条 ───
const activeBarStyle = ref({})

async function updateActiveBar() {
  await nextTick()
  const nav = navRef.value
  if (!nav) return
  const idx = panes.value.findIndex((p) => p.paneName === currentName.value)
  const items = nav.querySelectorAll('.ev-tabs__item')
  const active = items[idx]
  if (!active) {
    activeBarStyle.value = { display: 'none' }
    return
  }
  const vertical = props.tabPosition === 'left' || props.tabPosition === 'right'
  if (vertical) {
    activeBarStyle.value = {
      width: '2px',
      height: `${active.offsetHeight}px`,
      transform: `translateY(${active.offsetTop}px)`,
    }
  } else {
    activeBarStyle.value = {
      width: `${active.offsetWidth}px`,
      transform: `translateX(${active.offsetLeft}px)`,
    }
  }
}

// ─── 窄容器横向滚动（移动端 / 窄侧栏） ───
// 页签总宽超出容器时进入可滚动态：nav-scroll 放开横向滚动（触控/滚轮皆可），
// 激活页签自动滚入可视区；未溢出时保持原状，滚轮事件放行页面滚动
const isScrollable = ref(false)
let navResizeObserver = null

function updateScrollable() {
  const wrapEl = navScrollRef.value
  const nav = navRef.value
  if (!wrapEl || !nav) {
    isScrollable.value = false
    return
  }
  isScrollable.value = nav.scrollWidth > wrapEl.clientWidth + 1
}

/** 激活页签滚入可视区 */
function scrollActiveIntoView() {
  const wrapEl = navScrollRef.value
  if (!wrapEl || !isScrollable.value) return
  const idx = panes.value.findIndex((p) => p.paneName === currentName.value)
  const item = wrapEl.querySelectorAll('.ev-tabs__item')[idx]
  if (!item) return
  if (item.offsetLeft < wrapEl.scrollLeft) {
    wrapEl.scrollTo({ left: item.offsetLeft, behavior: 'smooth' })
  } else if (item.offsetLeft + item.offsetWidth > wrapEl.scrollLeft + wrapEl.clientWidth) {
    wrapEl.scrollTo({
      left: item.offsetLeft + item.offsetWidth - wrapEl.clientWidth,
      behavior: 'smooth',
    })
  }
}

function handleWheel(e) {
  if (!isScrollable.value) return
  e.preventDefault()
  navScrollRef.value?.scrollBy({ left: e.deltaY })
}

function handleTabClick(pane) {
  if (pane.disabled) return
  emit('tab-click', pane)
  currentName.value = pane.paneName
}

function handleTabRemove(pane) {
  if (pane.disabled) return
  emit('tab-remove', pane)
  emit('edit', pane.paneName, 'remove')
  unregisterPane(pane)
  if (currentName.value === pane.paneName && panes.value.length) {
    currentName.value = panes.value[0].paneName
  }
}

onMounted(() => {
  updateScrollable()
  updateActiveBar()
  // 容器/页签尺寸变化（窗口缩放、页签增删、字体就绪）时重测溢出状态
  if (typeof ResizeObserver !== 'undefined' && navScrollRef.value && navRef.value) {
    navResizeObserver = new ResizeObserver(() => {
      updateScrollable()
      updateActiveBar()
    })
    navResizeObserver.observe(navScrollRef.value)
    navResizeObserver.observe(navRef.value)
  }
})
watch(
  () => [panes.value.length, props.tabPosition],
  () => nextTick(() => {
    updateScrollable()
    updateActiveBar()
  })
)

onBeforeUnmount(() => {
  navResizeObserver?.disconnect()
  navResizeObserver = null
  panes.value = []
})

defineExpose({
  currentName,
  /** 当前激活 tab */
  activeTab: computed(() => currentName.value),
})
</script>

<style src="./style.css"></style>
