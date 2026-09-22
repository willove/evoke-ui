<template>
  <div class="eb-chat-actionbar" role="group" :aria-label="labels.actionbar.group">
    <!-- 每颗按钮都挂库内 Tooltip（Teleport 到 body）：消息列表是滚动容器，
        纯 CSS 提示会被裁掉；原生 title 又慢又不好看 -->
    <eb-tooltip v-if="showCopy" :content="copied ? labels.actionbar.copied : labels.actionbar.copy" placement="top">
      <button 
        class="eb-chat-actionbar__btn"
        type="button"
        :aria-label="copied ? labels.actionbar.copied : labels.actionbar.copy"
        @click="handleCopy"
      >
        <eb-icon :name="copied ? 'check' : 'copy-document'" />
      </button>
    </eb-tooltip>
    <eb-tooltip v-if="showEdit && message?.role === 'user'" :content="labels.actionbar.edit" placement="top">
      <button 
        class="eb-chat-actionbar__btn"
        type="button"
        :aria-label="labels.actionbar.edit"
        @click="handleEdit"
      >
        <eb-icon name="edit" />
      </button>
    </eb-tooltip>
    <eb-tooltip v-if="showRegenerate && message?.role === 'assistant'" :content="labels.actionbar.regenerate" placement="top">
      <button 
        class="eb-chat-actionbar__btn"
        type="button"
        :aria-label="labels.actionbar.regenerate"
        @click="handleRegenerate"
      >
        <eb-icon name="refresh-right" />
      </button>
    </eb-tooltip>
    <eb-tooltip v-if="traceHref" :content="labels.actionbar.trace" placement="top">
      <a
        class="eb-chat-actionbar__btn"
        :href="traceHref"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="labels.actionbar.trace"
      >
        <eb-icon name="top-right" />
      </a>
    </eb-tooltip>
    <ChatSpeak
      v-if="showSpeech && message?.role === 'assistant' && message?.content"
      :text="String(message.content)"
    />
    <!-- 自定义动作：desc 是给悬浮提示用的长说明（label 太短讲不清），不给就退回 label -->
    <eb-tooltip
      v-for="action in actions"
      :key="action.key"
      :content="action.desc || action.label"
      placement="top"
    >
      <button 
        class="eb-chat-actionbar__btn"
        type="button"
        :aria-label="action.desc || action.label"
        @click="handleCustomAction(action)"
      >
        <eb-icon v-if="action.icon" :name="String(action.icon)" />
        <span v-else>{{ action.label }}</span>
      </button>
    </eb-tooltip>
  </div>
</template>

<script setup>
import EbIcon from "@wil-works/evoke-business-ui/icon"
import EbTooltip from "@wil-works/evoke-business-ui/tooltip"
import { computed, ref } from "vue";
import { copyToClipboard } from "./utils";
import ChatSpeak from "./ChatSpeak.vue";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  message: { type: null, required: false },
  actions: { type: Array, required: false, default: () => [] },
  showCopy: { type: Boolean, required: false, default: true },
  showRegenerate: { type: Boolean, required: false, default: true },
  /** 用户消息的「编辑并重发」；role 收敛在模板里 */
  showEdit: { type: Boolean, required: false, default: false },
  /** 助手消息的朗读钮；浏览器不支持 Web Speech 时不渲染 */
  showSpeech: { type: Boolean, required: false, default: false },
  /** 追踪链接模板，如 https://…/runs/{traceId}；message.traceUrl 优先 */
  traceUrl: { type: String, required: false, default: "" }
});
const emit = defineEmits(["copy", "regenerate", "edit", "action"]);

/** 消息直接给了全量地址就优先用它，否则按模板替换 {traceId}；都解析不出就不渲染 */
const traceHref = computed(() => {
  const direct = props.message?.traceUrl;
  if (direct) return String(direct);
  const id = props.message?.traceId;
  if (!id || !props.traceUrl) return "";
  return props.traceUrl.includes("{traceId}")
    ? props.traceUrl.replaceAll("{traceId}", encodeURIComponent(String(id)))
    : "";
});
const copied = ref(false);
async function handleCopy() {
  if (!props.message) return;
  try {
    await copyToClipboard(props.message.content);
    copied.value = true;
    emit("copy", props.message);
    setTimeout(() => {
      copied.value = false;
    }, 2e3);
  } catch {
  }
}
function handleEdit() {
  if (props.message) {
    emit("edit", props.message);
  }
}
function handleRegenerate() {
  if (props.message) {
    emit("regenerate", props.message);
  }
}
function handleCustomAction(action) {
  if (props.message) {
    emit("action", action.key, props.message);
  }
}

</script>

<style scoped>

.eb-chat-actionbar {
  display: flex;
  gap: var(--eb-space-1);
  margin-top: var(--eb-space-2);
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  will-change: opacity, transform;
  transition: opacity 0.15s var(--eb-ease-out), transform 0.15s var(--eb-ease-out);
}

.eb-chat-actionbar.is-visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* 键盘用户 Tab 进来必须看得见；触屏没有 hover，常显 */
.eb-chat-actionbar:focus-within {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

@media (hover: none) {
  .eb-chat-actionbar {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
}

.eb-chat-actionbar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--eb-radius-md);
  cursor: pointer;
  color: var(--eb-text-color-secondary);
  transition: background-color 0.15s var(--eb-ease-out), color 0.15s var(--eb-ease-out);
  padding: 0;
  font-size: 14px;
  will-change: background-color;
}

.eb-chat-actionbar__btn:hover {
  background: var(--eb-fill-color);
  color: var(--eb-text-color-primary);
}

.eb-chat-actionbar__btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
