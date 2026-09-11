<template>
  <div class="ev-md-editor" :class="{ 'is-disabled': disabled }">
    <div v-if="toolbar" class="ev-md-editor__toolbar">
      <button
        v-for="act in actions"
        :key="act.name"
        type="button"
        class="ev-md-editor__btn"
        :title="act.title"
        :aria-label="act.title"
        :disabled="disabled"
        @click="act.run"
      >
        <ev-icon :name="act.icon" :size="15" />
      </button>
      <span class="ev-md-editor__spacer" />
      <div v-if="preview === 'toggle'" class="ev-md-editor__tabs">
        <button
          type="button"
          class="ev-md-editor__tab"
          :class="{ 'is-active': tab === 'edit' }"
          @click="tab = 'edit'"
        >
          编辑
        </button>
        <button
          type="button"
          class="ev-md-editor__tab"
          :class="{ 'is-active': tab === 'preview' }"
          @click="tab = 'preview'"
        >
          预览
        </button>
      </div>
    </div>
    <div class="ev-md-editor__panes" :class="{ 'is-single': isSingle }" :style="panesStyle">
      <textarea
        v-show="showInput"
        ref="inputRef"
        class="ev-md-editor__input"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @keydown="onKeydown"
      />
      <div v-show="showPreview" class="ev-md-editor__preview">
        <ev-markdown :content="modelValue" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EvMarkdownEditor — Markdown 编辑器
 * 工具栏（加粗/斜体/删除线/行内代码/标题/引用/列表/链接）+ 编辑预览双栏；
 * preview='split' 左右分栏实时预览，'toggle' 编辑/预览切换（Ctrl/⌘+B / I 快捷加粗斜体）。
 * 预览由 EvMarkdown 承载（零依赖解析 + 语法高亮），颜色走 --ev-* 语义令牌
 */
import { computed, nextTick, ref } from 'vue'
import EvIcon from '../icon/index.vue'
import EvMarkdown from '../markdown/index.vue'

const props = defineProps({
  /** Markdown 源文本（v-model） */
  modelValue: { type: String, default: '' },
  /** 占位文案 */
  placeholder: { type: String, default: '' },
  /** 编辑区高度（数字按 px） */
  height: { type: [String, Number], default: '320px' },
  /** 预览形态：'split' 双栏实时 | 'toggle' 编辑/预览切换 */
  preview: {
    type: String,
    default: 'split',
    validator: (v) => ['split', 'toggle'].includes(v),
  },
  /** 展示工具栏 */
  toolbar: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const inputRef = ref(null)
const tab = ref('edit')

const px = (v) => (typeof v === 'number' ? `${v}px` : v)
const panesStyle = computed(() => ({ height: px(props.height) }))
const isSingle = computed(() => props.preview === 'toggle')
const showInput = computed(() => props.preview === 'split' || tab.value === 'edit')
const showPreview = computed(() => props.preview === 'split' || tab.value === 'preview')

function emitUpdate(value) {
  emit('update:modelValue', value)
  emit('change', value)
}

function onInput(e) {
  emitUpdate(e.target.value)
}

/** 包裹选区（无选区时插入占位文本并选中） */
function surround(before, after, placeholder) {
  const el = inputRef.value
  if (!el || props.disabled) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const value = props.modelValue
  const body = value.slice(start, end) ? value.slice(start, end) : placeholder
  const next = value.slice(0, start) + before + body + after + value.slice(end)
  emitUpdate(next)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + before.length, start + before.length + body.length)
  })
}

/** 行前缀切换（标题/引用/列表）：已有前缀则移除，否则添加 */
function togglePrefix(prefix) {
  const el = inputRef.value
  if (!el || props.disabled) return
  const value = props.modelValue
  let start = el.selectionStart
  let end = el.selectionEnd
  while (start > 0 && value[start - 1] !== '\n') start -= 1
  while (end < value.length && value[end] !== '\n') end += 1
  const lines = value.slice(start, end).split('\n')
  const allPrefixed = lines.every((l) => l.startsWith(prefix))
  const block = lines
    .map((l) => (allPrefixed ? l.slice(prefix.length) : prefix + l))
    .join('\n')
  const next = value.slice(0, start) + block + value.slice(end)
  emitUpdate(next)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start, start + block.length)
  })
}

const actions = [
  { name: 'bold', icon: 'bold', title: '加粗', run: () => surround('**', '**', '加粗文本') },
  { name: 'italic', icon: 'italic', title: '斜体', run: () => surround('*', '*', '斜体文本') },
  {
    name: 'strikethrough',
    icon: 'strikethrough',
    title: '删除线',
    run: () => surround('~~', '~~', '删除文本'),
  },
  { name: 'code', icon: 'code', title: '行内代码', run: () => surround('`', '`', '代码') },
  { name: 'heading', icon: 'heading', title: '标题', run: () => togglePrefix('## ') },
  { name: 'quote', icon: 'quote', title: '引用', run: () => togglePrefix('> ') },
  {
    name: 'ul',
    icon: 'list-unordered',
    title: '无序列表',
    run: () => togglePrefix('- '),
  },
  {
    name: 'ol',
    icon: 'list-ordered',
    title: '有序列表',
    run: () => togglePrefix('1. '),
  },
  {
    name: 'link',
    icon: 'link',
    title: '链接',
    run: () => surround('[', '](https://)', '链接文字'),
  },
]

function onKeydown(e) {
  if (props.disabled) return
  const mod = e.metaKey ? true : e.ctrlKey
  if (!mod) return
  if (e.key === 'b') {
    e.preventDefault()
    surround('**', '**', '加粗文本')
  }
  if (e.key === 'i') {
    e.preventDefault()
    surround('*', '*', '斜体文本')
  }
}
</script>

<style src="./style.css"></style>
