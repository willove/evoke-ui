<template>
  <div class="ev-comment ev-comment">
    <div v-if="avatar || $slots.avatar" class="ev-comment__avatar">
      <slot name="avatar">
        <ev-avatar :src="avatar" :size="32" />
      </slot>
    </div>
    <div class="ev-comment__main">
      <div class="ev-comment__meta">
        <span v-if="author || $slots.author" class="ev-comment__author">
          <slot name="author">{{ author }}</slot>
        </span>
        <span v-if="datetime || $slots.datetime" class="ev-comment__datetime">
          <slot name="datetime">{{ datetime }}</slot>
        </span>
      </div>
      <div class="ev-comment__content">
        <slot />
      </div>
      <div v-if="$slots.actions" class="ev-comment__actions">
        <slot name="actions" />
      </div>
      <div v-if="$slots.replies" class="ev-comment__replies">
        <slot name="replies" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EvComment — 评论（审批意见 / 工单回复）
 * 嵌套回复：replies 插槽内继续放 EvComment 即可形成缩进层级
 */
import EvAvatar from '../avatar/index.vue'

defineOptions({ name: 'EvComment' })

defineProps({
  /** 作者名 */
  author: { type: String, default: '' },
  /** 头像地址（avatar 插槽优先） */
  avatar: { type: String, default: '' },
  /** 时间描述 */
  datetime: { type: String, default: '' },
})
</script>

<style src="./style.css"></style>
