<template>
  <div :class="['ew-pricing-card', { 'is-featured': featured }]">
    <span v-if="badge" class="ew-pricing-card__badge">
      <slot name="badge">{{ badge }}</slot>
    </span>

    <h3 class="ew-pricing-card__title">
      <slot name="title">{{ title }}</slot>
    </h3>
    <p v-if="description || $slots.description" class="ew-pricing-card__description">
      <slot name="description">{{ description }}</slot>
    </p>

    <div v-if="price" class="ew-pricing-card__price-row">
      <span class="ew-pricing-card__price">
        <slot name="price">{{ price }}</slot>
      </span>
      <del v-if="originalPrice" class="ew-pricing-card__original">{{ originalPrice }}</del>
    </div>
    <div v-if="offerNote || $slots.note" class="ew-pricing-card__note">
      <slot name="note">{{ offerNote }}</slot>
    </div>

    <ul v-if="features.length || $slots.features" class="ew-pricing-card__features">
      <slot name="features">
        <li v-for="item in features" :key="item" class="ew-pricing-card__feature">
          <EwIcon name="check" :size="16" class="ew-pricing-card__check" />
          <span>{{ item }}</span>
        </li>
      </slot>
    </ul>

    <div class="ew-pricing-card__footer">
      <slot name="action">
        <EwButton
          :variant="featured ? 'primary' : 'dark'"
          block
          :pill="pill"
          @click="emit('action')"
        >
          {{ actionText }}
        </EwButton>
      </slot>
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
/**
 * EwPricingCard — 定价卡（launchos 定价区语言）
 * featured 深色主推卡 + lime 徽章 + 划线原价 + 橙色促销注记 + 勾选特性列表
 */
import EwButton from '../button/index.vue'
import EwIcon from '../icon/index.vue'

defineProps({
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
</script>

<style src="./style.css"></style>
