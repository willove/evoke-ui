<template>
  <button
    v-if="supported"
    type="button"
    class="eb-chat-speak"
    :class="{ 'is-speaking': speaking }"
    :title="label"
    :aria-label="label"
    :aria-pressed="speaking"
    @click="toggle"
  >
    <!-- 图标名受内置集约束：volume-up 不在集内，用 volume -->
    <eb-icon :name="speaking ? 'pause' : 'volume'" :size="14" />
  </button>
</template>

<script setup>
import { computed } from "vue";
import EbIcon from "../icon/index.vue"
import { useSpeech } from "../../composables/useSpeech";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** 要朗读的文本 */
  text: { type: String, required: false, default: "" },
  /** BCP-47，缺省跟随浏览器 */
  lang: { type: String, required: false, default: "" },
  rate: { type: Number, required: false, default: 1 }
});
const emit = defineEmits(["start", "stop", "end"]);
const { supported, speaking, speak, stop } = useSpeech({
  lang: props.lang || void 0,
  rate: props.rate,
  onEnd: () => emit("end")
});
const label = computed(() => (speaking.value ? labels.speech.stopSpeak : labels.speech.speak));

function toggle() {
  if (speaking.value) {
    stop();
    emit("stop");
    return;
  }
  if (!String(props.text || "").trim()) return;
  if (speak(props.text)) emit("start", props.text);
}
</script>

<style scoped>
.eb-chat-speak {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--eb-radius-md);
  background: transparent;
  color: var(--eb-text-color-secondary);
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-speak:hover {
  background: var(--eb-fill-color);
  color: var(--eb-text-color-primary);
}

.eb-chat-speak.is-speaking {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

.eb-chat-speak:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
