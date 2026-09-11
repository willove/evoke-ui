<template>
  <div class="eb-json-viewer">
    <div v-if="toolbar" class="eb-json-viewer__toolbar">
      <span class="eb-json-viewer__type">{{ rootTypeLabel }}</span>
      <button v-if="copyable" type="button" class="eb-json-viewer__btn" @click="copy">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <div class="eb-json-viewer__content">
      <JsonNode :data="data" :depth="0" :default-depth="expandedDepth" key-path="root" />
    </div>
  </div>
</template>

<script setup>
/**
 * EbJsonViewer — JSON 查看器
 * 递归函数组件渲染节点；展开/折叠 caret、长字符串截断展开、工具条类型标注 + 复制
 */
import { ref, computed, defineComponent, h } from 'vue'

const props = defineProps({
  data: { type: null, default: undefined },
  toolbar: { type: Boolean, default: true },
  copyable: { type: Boolean, default: true },
  expandedDepth: { type: Number, default: 2 },
})

const copied = ref(false)

const rootTypeLabel = computed(() => {
  const d = props.data
  if (d === null) return 'null'
  if (Array.isArray(d)) return `array(${d.length})`
  if (typeof d === 'object') return `object(${Object.keys(d).length})`
  return typeof d
})

async function copy() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.data, null, 2))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  } catch {
    /* clipboard 不可用时静默 */
  }
}

const VALUE_COLOR = {
  string: 'var(--jv-string)',
  number: 'var(--jv-number)',
  boolean: 'var(--jv-boolean)',
  null: 'var(--jv-null)',
}

function bracketsText(isArray) {
  return isArray ? ['[', ']'] : ['{', '}']
}

const JsonNode = defineComponent({
  name: 'EbJsonNode',
  props: {
    data: { type: null, required: true },
    keyName: { type: String, default: '' },
    depth: { type: Number, required: true },
    defaultDepth: { type: Number, required: true },
    isArrayItem: { type: Boolean, default: false },
  },
  setup(nodeProps) {
    const isExpandable = (v) => v !== null && typeof v === 'object'
    const initialExpanded = nodeProps.depth < nodeProps.defaultDepth
    const expanded = ref(initialExpanded)

    const toggle = (e) => {
      e.stopPropagation()
      expanded.value = !expanded.value
    }

    return () => {
      const { data, keyName, depth, defaultDepth, isArrayItem } = nodeProps
      // 标量 / null
      if (!isExpandable(data)) {
        const type = data === null ? 'null' : typeof data
        let valueNode
        if (type === 'string') {
          const text = String(data)
          const truncated = text.length > 120 && !expanded.value
          valueNode = h('span', { class: 'eb-json-viewer__value' }, [
            h(
              'span',
              { style: { color: VALUE_COLOR[type] } },
              JSON.stringify(truncated ? `${text.slice(0, 120)}…` : text),
            ),
            text.length > 120
              ? h(
                  'button',
                  {
                    class: 'eb-json-viewer__toggle-inline',
                    onClick: () => {
                      expanded.value = !expanded.value
                    },
                  },
                  expanded.value ? '收起' : `展开 ${text.length} 字符`,
                )
              : null,
          ])
        } else {
          valueNode = h(
            'span',
            {
              class: 'eb-json-viewer__value',
              style: { color: VALUE_COLOR[type] },
            },
            type === 'null' ? 'null' : String(data),
          )
        }
        return h('div', { class: 'eb-json-viewer__line' }, [
          keyName ? h('span', { class: 'eb-json-viewer__key' }, `${keyName}: `) : null,
          valueNode,
        ])
      }

      // 对象 / 数组
      const isArray = Array.isArray(data)
      const entries = isArray ? data.map((v) => [null, v]) : Object.entries(data)
      const [openB, closeB] = bracketsText(isArray)
      const count = entries.length

      const caret = h('span', {
        class: ['eb-json-viewer__caret', { 'is-open': expanded.value }],
        onClick: toggle,
      })

      const preview =
        !expanded.value && count > 0
          ? h('span', { class: 'eb-json-viewer__preview' }, `${openB}${count} 项${closeB}`)
          : null

      const head = h('div', { class: 'eb-json-viewer__line eb-json-viewer__line--head', onClick: toggle }, [
        caret,
        keyName ? h('span', { class: 'eb-json-viewer__key' }, `${keyName}: `) : null,
        h('span', { class: 'eb-json-viewer__bracket' }, openB),
        preview,
        !expanded.value ? h('span', { class: 'eb-json-viewer__bracket' }, closeB) : null,
      ])

      const children = expanded.value
        ? h('div', { class: 'eb-json-viewer__children' }, [
            ...entries.map(([k, v], i) =>
              h(JsonNode, {
                key: k ?? String(i),
                data: v,
                keyName: k,
                depth: depth + 1,
                defaultDepth,
                isArrayItem: isArray,
              }),
            ),
            h('div', { class: 'eb-json-viewer__line' }, [
              h('span', { class: 'eb-json-viewer__bracket' }, `${closeB}${isArrayItem ? ',' : ''}`),
            ]),
          ])
        : null

      return h('div', { class: 'eb-json-viewer__node' }, [head, children])
    }
  },
})
</script>

<style src="./style.css"></style>
