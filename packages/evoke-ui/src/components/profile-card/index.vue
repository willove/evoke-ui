<template>
  <div :class="['ev-profile-card', { 'is-plain': plain, 'is-glass': glass === true, 'no-glass': glass === false }]" :style="glassVars">
    <EvAvatar :src="avatar" :name="name" :size="avatarSize" class="ev-profile-card__avatar" />
    <h3 class="ev-profile-card__name">
      <slot name="name">{{ name }}</slot>
    </h3>
    <p v-if="role || $slots.role" class="ev-profile-card__role">
      <slot name="role">{{ role }}</slot>
    </p>
    <p v-if="bio || $slots.bio" class="ev-profile-card__bio">
      <slot name="bio">{{ bio }}</slot>
    </p>
    <div v-if="$slots.stats" class="ev-profile-card__stats">
      <slot name="stats" />
    </div>
    <div v-if="$slots.social" class="ev-profile-card__social">
      <slot name="social" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvProfileCard — 个人名片（团队页/关于页/个人站）
 * 头像 + 姓名 + 角色 + 简介 + 可选数据行与社交链接行
 */
import EvAvatar from '../avatar/index.vue'

import { useGlassVars } from '../../composables/useGlassVars'
const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  /** 磨砂饱和度（倍数），内联覆盖 --ev-glass-saturate；缺省跟随令牌 */
  saturate: { type: [Number, String], default: undefined },
  /** 磨砂底色浓度（%），内联覆盖 --ev-glass-bg；缺省跟随令牌 */
  tint: { type: [Number, String], default: undefined },
  name: { type: String, default: '' },
  role: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  /** 头像尺寸（px 或 EvAvatar 预设） */
  avatarSize: { type: [String, Number], default: 72 },
  /** 朴素形态（无卡片底，用于深色/粉彩卡内） */
  plain: { type: Boolean, default: false },
})

const glassVars = useGlassVars(props)
</script>

<style src="./style.css"></style>
