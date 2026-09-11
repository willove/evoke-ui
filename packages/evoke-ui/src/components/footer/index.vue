<template>
  <footer :class="['ev-footer', { 'is-soft': soft, 'is-glass': glass === true, 'no-glass': glass === false }]">
    <div class="ev-container">
      <div v-if="columns.length || $slots.default" class="ev-footer__main">
        <div class="ev-footer__brand">
          <slot name="brand">
            <div v-if="logoText" class="ev-footer__logo">{{ logoText }}</div>
            <p v-if="slogan" class="ev-footer__slogan">{{ slogan }}</p>
            <div v-if="$slots.social" class="ev-footer__social">
              <slot name="social" />
            </div>
          </slot>
        </div>
        <slot>
          <nav v-for="col in columns" :key="col.title" class="ev-footer__col" :aria-label="col.title">
            <h4 class="ev-footer__col-title">{{ col.title }}</h4>
            <component
              :is="link.href ? 'a' : 'span'"
              v-for="link in col.links"
              :key="link.label"
              :href="link.href"
              :target="link.target"
              class="ev-footer__link"
            >
              {{ link.label }}
            </component>
          </nav>
        </slot>
      </div>

      <div class="ev-footer__bottom">
        <span class="ev-footer__copyright">{{ copyright }}</span>
        <div v-if="$slots.legal" class="ev-footer__legal">
          <slot name="legal" />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
/**
 * EvFooter — 站点页脚
 * columns [{ title, links: [{ label, href, target }] }] 多栏链接 + 品牌区 + 底部版权条
 */
defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 链接栏 [{ title, links: [{ label, href, target }] }] */
  columns: { type: Array, default: () => [] },
  /** 品牌名（logo 槽缺省渲染） */
  logoText: { type: String, default: '' },
  /** 品牌语 */
  slogan: { type: String, default: '' },
  /** 版权文案 */
  copyright: { type: String, default: '' },
  /** 淡灰底形态 */
  soft: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
