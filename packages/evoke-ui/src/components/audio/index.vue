<template>
  <div class="ew-audio">
    <span class="ew-audio__badge">
      <EwIcon name="music" :size="18" />
    </span>
    <div class="ew-audio__body">
      <div class="ew-audio__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <audio v-if="src" controls preload="metadata" :src="src" class="ew-audio__player" />
      <slot v-else />
    </div>
  </div>
</template>

<script setup>
/**
 * EwAudio — 音频卡片（节目/播客/语音介绍）
 * 标题行 + 原生播放控件；src 缺省时可用插槽承载自定义播放器
 */
import EwIcon from '../icon/index.vue'

defineProps({
  /** 音频地址 */
  src: { type: String, default: '' },
  title: { type: String, default: '' },
})
</script>

<style src="./style.css"></style>
