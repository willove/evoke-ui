<template>
  <button
    class="eb-float-button eb-float-button"
    :class="[`eb-float-button--${shape}`, `eb-float-button--${type}`]"
    type="button"
    :style="{ width: size + 'px', height: size + 'px' }"
    @click="handleClick"
  >
    <eb-badge v-if="badgeValue !== null" :value="badgeValue" :max="badgeMax">
      <span class="eb-float-button__inner">
        <slot>
          <eb-icon v-if="icon" :name="icon" :size="18" />
        </slot>
      </span>
    </eb-badge>
    <span v-else class="eb-float-button__inner">
      <slot>
        <eb-icon v-if="icon" :name="icon" :size="18" />
      </slot>
    </span>
    <span v-if="tooltip" class="eb-float-button__tooltip">{{ tooltip }}</span>
  </button>
</template>

<script setup>
/**
 * EbFloatButton — 悬浮操作按钮（返回顶部 / 客服 / 快捷入口）
 * 定位由业务方容器控制，或用 FloatButtonGroup 的 position 统一布置
 */
import EbIcon from '../icon/index.vue'
import EbBadge from '../badge/index.vue'

defineOptions({ name: 'EbFloatButton' })

const props = defineProps({
  /** 图标名（默认插槽优先） */
  icon: { type: String, default: '' },
  /** 形态：circle / square */
  shape: { type: String, default: 'circle' },
  /** 语义色：default / primary / danger */
  type: { type: String, default: 'default' },
  /** 尺寸（px） */
  size: { type: Number, default: 44 },
  /** 悬停提示文案 */
  tooltip: { type: String, default: '' },
  /** 徽标数值（null 不显示） */
  badgeValue: { type: Number, default: null },
  badgeMax: { type: Number, default: 99 },
})

const emit = defineEmits(['click'])

function handleClick(e) {
  emit('click', e)
}
</script>

<style src="./style.css"></style>
