<template>
  <div :class="['ev-pricing-card', { 'is-featured': featured, 'is-glass': glass === true, 'no-glass': glass === false }]" :style="glassVars">
    <span v-if="badge" class="ev-pricing-card__badge">
      <slot name="badge">{{ badge }}</slot>
    </span>

    <h3 class="ev-pricing-card__title">
      <slot name="title">{{ title }}</slot>
    </h3>
    <p v-if="description || $slots.description" class="ev-pricing-card__description">
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="price" class="ev-pricing-card__price-row">
      <span class="ev-pricing-card__price">
        <slot name="price">{{ price }}</slot>
      </span>
      <del v-if="originalPrice" class="ev-pricing-card__original">{{ originalPrice }}</del>
    </div>
    <div v-if="offerNote || $slots.note" class="ev-pricing-card__note">
      <slot name="note">{{ offerNote }}</slot>
    </div>

    <ul v-if="features.length || $slots.features" class="ev-pricing-card__features">
      <slot name="features">
        <li v-for="item in features" :key="item" class="ev-pricing-card__feature">
          <EvIcon name="check" :size="16" class="ev-pricing-card__check" />
          <span>{{ item }}</span>
        </li>
      </slot>
    </ul>

    <div class="ev-pricing-card__footer">
      <slot name="action">
        <EvButton
          :variant="featured ? 'primary' : 'dark'"
          block
          :pill="pill"
          @click="emit('action')"
        >
          {{ actionText }}
        </EvButton>
      </slot>
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvPricingCard — 定价卡（launchos 定价区语言）
 * featured 深色主推卡 + lime 徽章 + 划线原价 + 橙色促销注记 + 勾选特性列表
 */
import { computed } from 'vue'
import EvButton from '../button/index.vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  /** 价格文案（如「¥46」或「Free」） */
  price: { type: String, default: '' },
  /** 划线原价 */
  originalPrice: { type: String, default: '' },
  /** 橙色促销注记（如「macOS 27 Public Beta Offer」） */
  offerNote: { type: String, default: '' },
  /** 右上角徽章文案（如「SAVE 50%」） */
  badge: { type: String, default: '' },
  /** 特性列表 [string] */
  features: { type: Array, default: () => [] },
  /** 深色主推形态 */
  featured: { type: Boolean, default: false },
  actionText: { type: String, default: '' },
  /** 动作按钮胶囊形态 */
  pill: { type: Boolean, default: true },
})

const emit = defineEmits(['action'])

// 组件级磨砂强度：内联覆盖 --ev-glass-blur，缺省不产出内联样式（跟随令牌）
const glassVars = computed(() => {
  if (props.blur === undefined || props.blur === null || props.blur === '') return undefined
  return { '--ev-glass-blur': typeof props.blur === 'number' ? `${props.blur}px` : props.blur }
})
</script>

<style src="./style.css"></style>
