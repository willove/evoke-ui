<template>
  <div class="eb-chat-web-preview">
    <div class="eb-chat-web-preview__head">
      <eb-icon name="global" :size="13" class="eb-chat-web-preview__icon" />
      <span class="eb-chat-web-preview__title">{{ title || src || labels.preview.title }}</span>
      <button
        v-if="canSwitch"
        type="button"
        class="eb-chat-web-preview__act"
        :title="mode === 'frame' ? labels.preview.useScreenshot : labels.preview.useFrame"
        @click="mode = mode === 'frame' ? 'shot' : 'frame'"
      >
        {{ mode === 'frame' ? labels.preview.screenshot : labels.preview.live }}
      </button>
      <a
        v-if="src"
        class="eb-chat-web-preview__act"
        :href="src"
        target="_blank"
        rel="noopener noreferrer"
        :title="labels.preview.openExternal"
      >
        <eb-icon name="top-right" :size="13" />
      </a>
    </div>

    <div class="eb-chat-web-preview__body" :style="{ height: bodyHeight }">
      <iframe
        v-if="mode === 'frame'"
        class="eb-chat-web-preview__frame"
        :title="title || labels.preview.title"
        :src="src"
        :sandbox="sandboxAttr"
        :allow="allow || undefined"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <img
        v-else
        class="eb-chat-web-preview__shot"
        :src="screenshot"
        :alt="screenshotAlt || labels.preview.title"
        loading="lazy"
        referrerpolicy="no-referrer"
      >
    </div>

    <p v-if="mode === 'shot'" class="eb-chat-web-preview__note">{{ labels.preview.fallbackNote }}</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { buildSandboxAttr, warnIfDangerous } from "./sandboxBootstrap";
import { useChatLabels } from "./labels";
const labels = useChatLabels();
const props = defineProps({
  /** 预览地址 */
  src: { type: String, required: false, default: "" },
  /** 静态截图地址；给了就能在目标站禁嵌时回退 */
  screenshot: { type: String, required: false, default: "" },
  /**
   * 目标站是否允许被嵌入。
   * 跨域下脚本无法可靠区分「禁嵌的空白页」与「真的空白内容」，所以这个判断
   * 只能由宿主在服务端 HEAD 拿到（X-Frame-Options / CSP frame-ancestors）。
   * true → 直接用 iframe；false → 直接用截图；null（缺省）→ 先试 iframe
   */
  embeddable: { type: Boolean, required: false, default: null },
  title: { type: String, required: false, default: "" },
  screenshotAlt: { type: String, required: false, default: "" },
  height: { type: [String, Number], required: false, default: 320 },
  extraSandbox: { type: Array, required: false, default: () => [] },
  allow: { type: String, required: false, default: "" }
});
const manualMode = ref("");
// 宿主判过不能嵌且有截图，就直接用截图；否则先试 iframe
const autoMode = computed(() => (props.embeddable === false && props.screenshot ? "shot" : "frame"));
const mode = computed({
  get: () => manualMode.value || autoMode.value,
  set: (value) => {
    manualMode.value = value;
  },
});
/** 两种素材都在时才给切换：只有截图就没得切，只有 iframe 也没得切 */
const canSwitch = computed(() => !!props.src && !!props.screenshot);
const sandboxAttr = computed(() => buildSandboxAttr(props.extraSandbox));
const bodyHeight = computed(() => (typeof props.height === "number" ? `${props.height}px` : props.height));

if (props.extraSandbox?.length) {
  warnIfDangerous(props.extraSandbox);
}
// 宿主换了目标（或改判了可嵌性）就回到自动判定，不把上一条的手动选择带过去
watch(
  () => [props.src, props.embeddable],
  () => {
    manualMode.value = "";
  }
);
</script>

<style scoped>

.eb-chat-web-preview {
  margin-top: var(--eb-space-2);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  overflow: hidden;
  background: var(--eb-fill-color-light);
}

.eb-chat-web-preview__head {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  padding: 4px var(--eb-space-2);
  background: var(--eb-fill-color);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  font-size: var(--eb-font-size-xs);
}

.eb-chat-web-preview__icon {
  flex-shrink: 0;
  color: var(--eb-text-color-placeholder);
}

.eb-chat-web-preview__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--eb-text-color-primary);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.eb-chat-web-preview__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 1px 6px;
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-color-primary);
  font-size: inherit;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
}

.eb-chat-web-preview__act:hover {
  background: var(--eb-color-primary-light-9);
}

.eb-chat-web-preview__act:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-web-preview__body {
  position: relative;
  background: var(--eb-bg-color-overlay);
}

.eb-chat-web-preview__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

.eb-chat-web-preview__shot {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.eb-chat-web-preview__note {
  margin: 0;
  padding: var(--eb-space-1) var(--eb-space-3);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  background: var(--eb-fill-color);
  border-top: 1px solid var(--eb-border-color-lighter);
}
</style>
