<template>
  <div
    :class="['ev-exec-card', { 'is-glass': glass === true, 'no-glass': glass === false }]"
    :style="{ '--ev-exec-portrait-h': `${portraitHeight}px` }"
  >
    <div class="ev-exec-card__stage">
      <img
        v-if="image"
        :src="image"
        :alt="name"
        class="ev-exec-card__portrait"
        loading="lazy"
      />
      <!-- 缺省人物剪影（透明底，可直接替换为半身透明 PNG） -->
      <svg
        v-else
        class="ev-exec-card__portrait"
        viewBox="0 0 240 200"
        role="img"
        :aria-label="name"
      >
        <circle cx="120" cy="86" r="44" fill="currentColor" opacity="0.35" />
        <path
          d="M40 200c0-44 36-72 80-72s80 28 80 72"
          fill="currentColor"
          opacity="0.35"
        />
      </svg>
    </div>
    <div class="ev-exec-card__body">
      <h3 class="ev-exec-card__name">
        <slot name="name">{{ name }}</slot>
      </h3>
      <p v-if="role || $slots.role" class="ev-exec-card__role">
        <slot name="role">{{ role }}</slot>
      </p>
      <p v-if="description || $slots.default" class="ev-exec-card__description">
        <slot>{{ description }}</slot>
      </p>
      <div v-if="$slots.actions" class="ev-exec-card__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EvExecCard — 高管/团队介绍卡
 * 为「透明背景半身人物图」设计：人物图锚定在渐变舞台底边，像从卡片里走出来；
 * 未传 image 时渲染内置人物剪影占位。展示型 title 用强字距展示体。
 * props：name / role / description / image / portraitHeight（舞台高度，px）
 */
defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  name: { type: String, default: '' },
  /** 职务/头衔（展示型小标签排版） */
  role: { type: String, default: '' },
  description: { type: String, default: '' },
  /** 人物半身图（建议透明背景 PNG，人物居中、底部裁切） */
  image: { type: String, default: '' },
  /** 人物舞台高度（px） */
  portraitHeight: { type: Number, default: 190 },
})
</script>

<style src="./style.css"></style>
