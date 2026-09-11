<template>
  <div
    class="eb-space eb-space"
    :class="[`eb-space--${direction}`, { 'is-wrap': wrap, 'is-fill': fill }]"
    :style="containerStyle"
  >
    <div v-for="(child, i) in children" :key="child.key ?? i" class="eb-space__item" :style="itemStyle">
      <vnode-renderer :vnode="child" />
    </div>
  </div>
</template>

<script setup>
/**
 * EbSpace — 间距
 * size 数字/枚举/[x,y]；fill 撑满；spacer 未支持
 */
import { computed, useSlots, defineComponent, Fragment, Comment, Text } from 'vue'

const props = defineProps({
  size: { type: [Number, String, Array], default: 'small' },
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  wrap: { type: Boolean, default: false },
  alignment: {
    type: String,
    default: undefined,
    validator: (v) => [undefined, 'start', 'end', 'center', 'baseline'].includes(v),
  },
  fill: { type: Boolean, default: false },
})

const slots = useSlots()

// vnode 单次渲染限制：包一层函数式渲染器
const VnodeRenderer = defineComponent({
  props: { vnode: { type: Object, required: true } },
  setup(cellProps) {
    return () => cellProps.vnode
  },
})

// 收集平铺后的子节点（跳过注释/空文本）
const children = computed(() => {
  const out = []
  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      if (!n || n.type === Comment || (n.type === Text && typeof n.children === 'string' && !n.children.trim())) continue
      if (n.type === Fragment) {
        walk(n.children)
        continue
      }
      out.push(n)
    }
  }
  walk(slots.default?.())
  return out
})

const SIZE_MAP = { small: 8, default: 12, large: 16 }

function resolveGap() {
  const s = props.size
  if (typeof s === 'number') return [s, s]
  if (typeof s === 'string') return [SIZE_MAP[s] ?? 8, SIZE_MAP[s] ?? 8]
  if (Array.isArray(s)) return [s[0] ?? 0, s[1] ?? s[0] ?? 0]
  return [8, 8]
}

// gap: [x, y] → CSS gap: <row-gap> <column-gap>（方向决定主轴语义）
const containerStyle = computed(() => {
  const [gx, gy] = resolveGap()
  const style = {
    '--eb-space-gap-x': `${gx}px`,
    '--eb-space-gap-y': `${gy}px`,
  }
  if (props.alignment) style.alignItems = props.alignment
  return style
})

const itemStyle = computed(() => (props.fill ? { flex: '1 1 auto', minWidth: 0 } : {}))
</script>

<style src="./style.css"></style>
