<template>
  <div class="ev-audio">
    <span class="ev-audio__badge">
      <EvIcon name="music" :size="18" />
    </span>
    <div class="ev-audio__body">
      <div class="ev-audio__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <audio v-if="src" controls preload="metadata" :src="src" class="ev-audio__player" />
      <slot v-else />
    </div>
  </div>
</template>

<script setup>
/**
 * EvAudio — 音频卡片（节目/播客/语音介绍）
 * 标题行 + 原生播放控件；src 缺省时可用插槽承载自定义播放器
 */
import EvIcon from '../icon/index.vue'

defineProps({
  /** 音频地址 */
  src: { type: String, default: '' },
  title: { type: String, default: '' },
})
</script>

<style src="./style.css"></style>
