<template>
  <figure class="ev-video">
    <div class="ev-video__frame" :style="frameStyle">
      <slot v-if="$slots.default" />
      <video
        v-else-if="src"
        controls
        preload="metadata"
        :poster="poster"
        :src="src"
        @play="emit('play')"
        @pause="emit('pause')"
      />
      <div v-else class="ev-video__placeholder">
        <EvIcon name="play-fill" :size="28" />
        <span>视频占位</span>
      </div>
    </div>
    <figcaption v-if="caption || $slots.caption" class="ev-video__caption">
      <slot name="caption">{{ caption }}</slot>
    </figcaption>
  </figure>
</template>

<script setup>
/**
 * EvVideo — 视频区块（响应式画幅 + 可选文案）
 * 默认渲染原生 video（src/poster）；也可以用默认插槽嵌入 iframe（视频平台分享代码）
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 视频地址 */
  src: { type: String, default: '' },
  /** 封面图 */
  poster: { type: String, default: '' },
  /** 画幅比例 */
  aspect: {
    type: String,
    default: '16:9',
    validator: (v) => ['16:9', '4:3', '1:1', '9:16'].includes(v),
  },
  caption: { type: String, default: '' },
})

const emit = defineEmits(['play', 'pause'])

const RATIO = { '16:9': '56.25%', '4:3': '75%', '1:1': '100%', '9:16': '177.78%' }

const frameStyle = computed(() => ({ paddingTop: RATIO[props.aspect] }))
</script>

<style src="./style.css"></style>
