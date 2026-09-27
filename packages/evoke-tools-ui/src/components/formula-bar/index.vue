<template>
  <div
    class="et-formulabar"
    :class="{ 'is-expanded': expanded, 'is-readonly': readonly }"
    role="group"
    :aria-label="label"
    @keydown="onWrapperKeydown"
  >
    <!--
      EtFormulaBar — 公式栏（office 层 · 辅助栏）

      办公形态的「输入带」：左边是引用位（名称框），中间是编辑区，右边是动作位。
      三处都可以换成产品自己的控件（槽优先），本组件只管**形态与键盘契约**：
        · 高度 = --et-chrome-auxbar-height（chrome 预算不变量，不换行不撑高）；
        · Enter 提交、Esc 收敛、Shift+Enter 放行（多行编辑器用）、IME 组字期间不拦；
        · 展开（expandable）是显式用户操作，展开态高度交给内容（产品/布局树自理占位）。
      办公语义（单元格 / 工作表）不在本组件里：引用怎么格式化、编辑什么内容，都由产品给。
    -->
    <!-- 引用位：默认只读回显；产品要可编辑名称框就把 slot 填上 -->
    <div class="et-formulabar__reference">
      <slot name="reference">
        <span class="et-formulabar__reference-text">{{ reference }}</span>
      </slot>
    </div>

    <!-- 编辑区：默认单行输入；产品可放富编辑器（公式高亮 / 自动补全） -->
    <div class="et-formulabar__editor">
      <slot>
        <input
          ref="editorRef"
          class="et-formulabar__input"
          type="text"
          :value="modelValue"
          :readonly="readonly"
          :placeholder="placeholder"
          :aria-label="editorLabel"
          spellcheck="false"
          autocomplete="off"
          @input="onInput"
        >
      </slot>
    </div>

    <!-- 动作位：fx / 确认 / 取消 / 展开——由产品按需填 -->
    <div class="et-formulabar__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * EtFormulaBar — 公式栏（office 层）
 *
 * Props
 *   modelValue  编辑区内容（v-model；缺省输入框用它）
 *   reference   引用回显（如 "B7" / "A1:C3"；格式由产品定）
 *   label       区域可访问名（默认「公式栏」）
 *   editorLabel 编辑区可访问名（默认「编辑区」）
 *   readonly    只读（视觉弱化 + 不允许提交）
 *   placeholder 占位文案
 *   expandable  允许展开（配合 v-model:expanded）
 *   expanded    展开态（v-model:expanded）；展开后高度由内容决定
 *
 * Emits
 *   update:modelValue / update:expanded
 *   submit(value)   Enter（非组字、非 Shift+Enter、非只读）
 *   cancel(reason)  Esc（'escape'）——产品据此还原编辑
 *
 * 契约：键盘只在**没有落在交互控件里**时由外壳兜底（输入框内的事件照旧冒泡上来，
 * 由同一处理器判定），保证产品塞自己的编辑器时行为一致。
 */
import { ref, watch } from 'vue'
import { isImeComposing } from '@wil-works/evoke-business-ui'

defineOptions({ name: 'EtFormulaBar' })

const props = defineProps({
  /** 编辑区内容（v-model） */
  modelValue: { type: String, default: '' },
  /** 引用回显（B7 / A1:C3，格式由产品定） */
  reference: { type: String, default: '' },
  /** 区域可访问名 */
  label: { type: String, default: '公式栏' },
  /** 编辑区可访问名 */
  editorLabel: { type: String, default: '编辑区' },
  /** 只读：视觉弱化且不允许提交 */
  readonly: { type: Boolean, default: false },
  /** 占位文案 */
  placeholder: { type: String, default: '' },
  /** 允许展开（配合 v-model:expanded） */
  expandable: { type: Boolean, default: false },
  /** 展开态；展开后高度由内容决定 */
  expanded: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:expanded',
  /** Enter 提交；载荷 = 眼下的编辑值（不依赖父级是否已回写 v-model），组字期间不触发 */
  'submit',
  /** 收起编辑；载荷 = 触发路径（'escape' = 按 Esc） */
  'cancel',
])

const editorRef = ref(null)
/** 编辑草稿：submit 发"眼下的值"，不依赖父级是否已经回写 v-model */
const draft = ref(props.modelValue)
watch(() => props.modelValue, (v) => { draft.value = v })

function onInput(e) {
  draft.value = e.target.value
  emit('update:modelValue', e.target.value)
}

/** Esc 随时收敛；Enter 只在可提交时提交（组字中与 Shift 组合一律放行） */
function onWrapperKeydown(e) {
  if (isImeComposing(e)) return
  if (e.key === 'Escape') {
    emit('cancel', 'escape')
    return
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    if (props.readonly) return
    e.preventDefault()
    emit('submit', draft.value)
  }
}

/** 供产品/测试取编辑区焦点（产品槽自填时返回 null） */
function focusEditor() {
  editorRef.value?.focus()
}

defineExpose({ focusEditor })
</script>

<style src="./style.css"></style>
