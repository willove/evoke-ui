<template>
  <div class="eb-comment eb-comment">
    <div v-if="avatar || $slots.avatar" class="eb-comment__avatar">
      <slot name="avatar">
        <eb-avatar :src="avatar" :size="32" />
      </slot>
    </div>
    <div class="eb-comment__main">
      <div class="eb-comment__meta">
        <span v-if="author || $slots.author" class="eb-comment__author">
          <slot name="author">{{ author }}</slot>
        </span>
        <span v-if="datetime || $slots.datetime" class="eb-comment__datetime">
          <slot name="datetime">{{ datetime }}</slot>
        </span>
      </div>
      <div class="eb-comment__content">
        <slot />
      </div>
      <div v-if="$slots.actions" class="eb-comment__actions">
        <slot name="actions" />
      </div>
      <div v-if="$slots.replies" class="eb-comment__replies">
        <slot name="replies" />
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbComment — 评论（审批意见 / 工单回复）
 * 嵌套回复：replies 插槽内继续放 EbComment 即可形成缩进层级
 */
import EbAvatar from '../avatar/index.vue'

defineOptions({ name: 'EbComment' })

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
