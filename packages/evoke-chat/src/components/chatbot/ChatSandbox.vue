<template>
  <div class="eb-chat-sandbox" :class="{ 'is-error': !!lastError }">
    <div class="eb-chat-sandbox__head">
      <span class="eb-chat-sandbox__dot" aria-hidden="true" />
      <span class="eb-chat-sandbox__title">{{ title || labels.sandbox.title }}</span>
      <span class="eb-chat-sandbox__mode">{{ modeLabel }}</span>
      <button
        v-if="consoleEntries.length"
        type="button"
        class="eb-chat-sandbox__act"
        :aria-expanded="String(showConsole)"
        @click="showConsole = !showConsole"
      >
        {{ showConsole ? labels.sandbox.hideConsole : labels.sandbox.console(consoleEntries.length) }}
      </button>
      <button type="button" class="eb-chat-sandbox__act" @click="reload">
        {{ labels.sandbox.reload }}
      </button>
    </div>

    <iframe
      ref="frameRef"
      class="eb-chat-sandbox__frame"
      :title="title || labels.sandbox.title"
      :srcdoc="srcdoc || undefined"
      :src="srcdoc ? undefined : src || undefined"
      :sandbox="sandboxAttr"
      :allow="allow || undefined"
      :style="{ height: frameHeight }"
      referrerpolicy="no-referrer"
      @load="emit('ready')"
    />

    <p v-if="lastError" class="eb-chat-sandbox__error">{{ lastError }}</p>

    <ol v-show="showConsole && consoleEntries.length" class="eb-chat-sandbox__console">
      <li v-for="(entry, i) in consoleEntries" :key="i" :class="`is-${entry.level}`">
        <span class="eb-chat-sandbox__level">{{ entry.level }}</span>
        <span>{{ entry.args.join(' ') }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { buildSandboxAttr, warnIfDangerous, withBootstrap } from "./sandboxBootstrap";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** 要跑的一段 HTML（含脚本） */
  html: { type: String, required: false, default: "" },
  /** 或者给一个后端沙箱地址（与 html 二选一，html 优先） */
  src: { type: String, required: false, default: "" },
  title: { type: String, required: false, default: "" },
  height: { type: [String, Number], required: false, default: 260 },
  /** 由内容上报的高度自动撑开（内容抖会带着卡片跳，默认关） */
  autoHeight: { type: Boolean, required: false, default: false },
  /** 追加的 sandbox 旗标；allow-same-origin 会被忽略并告警 */
  extraSandbox: { type: Array, required: false, default: () => [] },
  /** iframe 的 allow（权限策略），原样透传让宿主自己收紧 */
  allow: { type: String, required: false, default: "" },
  /** 注入 console/错误桥；关掉则一条消息都不收 */
  bootConsole: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["console", "error", "ready", "resize"]);

const frameRef = ref(null);
const showConsole = ref(false);
const consoleEntries = ref([]);
const lastError = ref("");
const reportedHeight = ref(0);
const bootKey = ref(0);

const srcdoc = computed(() => (props.html ? withBootstrap(props.html, props.bootConsole) : ""));
const sandboxAttr = computed(() => buildSandboxAttr(props.extraSandbox));
const modeLabel = computed(() => (srcdoc.value ? labels.sandbox.modeHtml : labels.sandbox.modeUrl));
const frameHeight = computed(() => {
  if (props.autoHeight && reportedHeight.value) return `${reportedHeight.value}px`;
  return typeof props.height === "number" ? `${props.height}px` : props.height;
});

if (props.extraSandbox?.length) {
  warnIfDangerous(props.extraSandbox);
}

const LEVEL_CAP = 50;

function onMessage(event) {
  // 只认自己这个 iframe 发来的：不校验的话任意页面都能往宿主的回调里灌消息
  const frame = frameRef.value;
  if (!frame || event.source !== frame.contentWindow) return;
  const data = event.data;
  if (!data || data.__ebSandbox !== 1) return;
  if (data.type === "console") {
    const entry = { level: data.payload?.level || "log", args: data.payload?.args || [] };
    consoleEntries.value = [...consoleEntries.value, entry].slice(-LEVEL_CAP);
    emit("console", entry);
    return;
  }
  if (data.type === "error") {
    lastError.value = data.payload?.message || labels.sandbox.unknownError;
    emit("error", data.payload || {});
    return;
  }
  if (data.type === "resize") {
    reportedHeight.value = Number(data.payload?.height) || 0;
    emit("resize", reportedHeight.value);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("message", onMessage);
}
onBeforeUnmount(() => {
  if (typeof window !== "undefined") window.removeEventListener("message", onMessage);
});

/** 换一段代码要重建：复用旧 frame 会留着上一段的状态（定时器、全局变量） */
watch(
  () => [props.html, props.src, props.extraSandbox],
  () => {
    bootKey.value += 1;
    consoleEntries.value = [];
    lastError.value = "";
    reportedHeight.value = 0;
  }
);
function reload() {
  consoleEntries.value = [];
  lastError.value = "";
  reportedHeight.value = 0;
  bootKey.value += 1;
  // srcdoc 相同不会触发重载，用 key 强制换一个 iframe
  const frame = frameRef.value;
  if (frame) frame.srcdoc = srcdoc.value;
}
</script>

<style scoped>

.eb-chat-sandbox {
  margin-top: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  overflow: hidden;
  background: var(--eb-fill-color-light);
}

.eb-chat-sandbox.is-error {
  border-color: var(--eb-color-danger-light-7);
}

.eb-chat-sandbox__head {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: 4px var(--eb-space-2);
  background: var(--eb-fill-color);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  font-size: var(--eb-font-size-xs);
}

.eb-chat-sandbox__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--eb-color-success);
  flex-shrink: 0;
}

.eb-chat-sandbox.is-error .eb-chat-sandbox__dot {
  background: var(--eb-color-danger);
}

.eb-chat-sandbox__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eb-text-color-primary);
}

.eb-chat-sandbox__mode {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
}

.eb-chat-sandbox__act {
  flex-shrink: 0;
  padding: 1px 6px;
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-color-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-sandbox__act:hover {
  background: var(--eb-color-primary-light-9);
}

.eb-chat-sandbox__act:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-sandbox__frame {
  display: block;
  width: 100%;
  border: none;
  background: #fff;
}

.eb-chat-sandbox__error {
  margin: 0;
  padding: var(--eb-space-1) var(--eb-space-3);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-color-danger);
  background: var(--eb-color-danger-light-9);
}

.eb-chat-sandbox__console {
  margin: 0;
  padding: var(--eb-space-1) var(--eb-space-3);
  list-style: none;
  max-height: 160px;
  overflow: auto;
  border-top: 1px solid var(--eb-border-color-lighter);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: var(--eb-font-size-xs);
  line-height: 1.6;
}

.eb-chat-sandbox__console li {
  display: flex;
  gap: var(--eb-space-2);
  color: var(--eb-text-color-regular);
}

.eb-chat-sandbox__console li.is-warn {
  color: var(--eb-color-warning);
}

.eb-chat-sandbox__console li.is-error {
  color: var(--eb-color-danger);
}

.eb-chat-sandbox__level {
  flex-shrink: 0;
  width: 34px;
  color: var(--eb-text-color-placeholder);
  text-transform: uppercase;
}
</style>
