<template>
  <button
    v-if="supported"
    type="button"
    class="eb-chat-voice"
    :class="{ 'is-listening': listening }"
    :title="label"
    :aria-label="label"
    :aria-pressed="listening"
    @click="toggle"
  >
    <eb-icon name="mic" :size="16" />
    <span v-if="listening" class="eb-chat-voice__pulse" aria-hidden="true" />
  </button>
</template>

<script setup>
import { computed } from "vue";
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { useSpeechInput } from "../../composables/useSpeechInput";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** BCP-47，如 zh-CN；缺省跟随浏览器 */
  lang: { type: String, required: false, default: "" },
  /** 连续识别；false 时说完一句自动停 */
  continuous: { type: Boolean, required: false, default: false },
  /** 临时结果是否也交出来（宿主通常用它覆盖填充输入框） */
  emitInterim: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["interim", "result", "error", "start", "end"]);
const { supported, listening, error, toggle: rawToggle } = useSpeechInput({
  lang: props.lang || void 0,
  continuous: props.continuous,
  interimResults: props.emitInterim,
  onInterim: (text) => emit("interim", text),
  onFinal: (text) => emit("result", text),
  onError: (code) => emit("error", code),
  onEnd: () => emit("end")
});
const label = computed(() => (listening.value ? labels.speech.stopListening : labels.speech.startListening));

function toggle() {
  const before = listening.value;
  rawToggle();
  if (!before) emit("start");
}
</script>

<style scoped>
.eb-chat-voice {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--eb-radius-md);
  background: transparent;
  color: var(--eb-text-color-secondary);
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-voice:hover {
  background: var(--eb-fill-color);
  color: var(--eb-color-primary);
}

.eb-chat-voice.is-listening {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

/* 录音中外圈脉动：麦克风是「正在采集」的状态，静止图标不足以说明 */
.eb-chat-voice__pulse {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid var(--eb-color-primary);
  animation: eb-chat-voice-pulse 1.4s ease-out infinite;
}

@keyframes eb-chat-voice-pulse {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.35); }
}

.eb-chat-voice:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .eb-chat-voice__pulse {
    animation: none;
    opacity: 0.6;
  }
}
</style>
