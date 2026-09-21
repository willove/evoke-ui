<template>
  <div v-if="appFrames.length || dependencyFrames.length" class="eb-chat-stack">
    <ol v-if="appFrames.length" class="eb-chat-stack__list">
      <li v-for="(frame, i) in visibleAppFrames" :key="i" class="eb-chat-stack__frame">
        <button type="button" class="eb-chat-stack__row" :title="frame.raw" @click="emit('frame-click', frame)">
          <span v-if="frame.fn" class="eb-chat-stack__fn">{{ frame.fn }}</span>
          <span class="eb-chat-stack__loc">{{ shortenPath(locationOf(frame)) }}</span>
        </button>
      </li>
    </ol>

    <button
      v-if="hiddenAppCount"
      type="button"
      class="eb-chat-stack__more"
      @click="showAllApp = true"
    >
      {{ labels.stack.moreFrames(hiddenAppCount) }}
    </button>

    <template v-if="dependencyFrames.length">
      <button
        v-if="collapseDependencies"
        type="button"
        class="eb-chat-stack__more eb-chat-stack__more--dep"
        :aria-expanded="String(showDependencies)"
        @click="showDependencies = !showDependencies"
      >
        {{ showDependencies ? labels.stack.hideDependencies : labels.stack.dependencies(dependencyFrames.length) }}
      </button>
      <ol v-if="!collapseDependencies || showDependencies" class="eb-chat-stack__list eb-chat-stack__list--dep">
        <li v-for="(frame, i) in dependencyFrames" :key="i" class="eb-chat-stack__frame">
          <button type="button" class="eb-chat-stack__row" :title="frame.raw" @click="emit('frame-click', frame)">
            <span v-if="frame.fn" class="eb-chat-stack__fn">{{ frame.fn }}</span>
            <span class="eb-chat-stack__loc">{{ shortenPath(locationOf(frame)) }}</span>
          </button>
        </li>
      </ol>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { parseStackTrace, formatFrameLocation, shortenPath } from "./stackTrace";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** stack 字符串，或已解析好的 frames 数组 */
  stack: { type: [String, Array], required: false, default: "" },
  /** 折叠依赖帧（node_modules / vendor / anonymous）；关掉就平铺 */
  collapseDependencies: { type: Boolean, required: false, default: true },
  /** 应用帧最多显示几条，0 为不限 */
  maxAppFrames: { type: Number, required: false, default: 0 }
});
const emit = defineEmits(["frame-click"]);

const parsed = computed(() => parseStackTrace(props.stack));
const appFrames = computed(() => parsed.value.appFrames);
const dependencyFrames = computed(() => parsed.value.dependencyFrames);
const showAllApp = ref(false);
const showDependencies = ref(false);

// 换了一段 stack 就收回到默认折叠态，否则上一段的展开状态会串到这一条
watch(
  () => props.stack,
  () => {
    showAllApp.value = false;
    showDependencies.value = false;
  }
);

const visibleAppFrames = computed(() => {
  if (!props.maxAppFrames || showAllApp.value) return appFrames.value;
  return appFrames.value.slice(0, props.maxAppFrames);
});
const hiddenAppCount = computed(() =>
  props.maxAppFrames && !showAllApp.value ? Math.max(0, appFrames.value.length - props.maxAppFrames) : 0,
);

function locationOf(frame) {
  return formatFrameLocation(frame);
}
</script>

<style scoped>

.eb-chat-stack {
  margin-top: var(--eb-space-1);
  font-size: var(--eb-font-size-xs);
}

.eb-chat-stack__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.eb-chat-stack__row {
  display: flex;
  align-items: baseline;
  gap: var(--eb-space-2);
  width: 100%;
  padding: 1px var(--eb-space-2);
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  text-align: left;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  cursor: pointer;
}

.eb-chat-stack__row:hover {
  background: var(--eb-fill-color);
}

.eb-chat-stack__row:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: -2px;
}

.eb-chat-stack__fn {
  flex-shrink: 0;
  color: var(--eb-text-color-regular);
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eb-chat-stack__loc {
  min-width: 0;
  color: var(--eb-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: left;
}

.eb-chat-stack__list--dep .eb-chat-stack__fn,
.eb-chat-stack__list--dep .eb-chat-stack__loc {
  color: var(--eb-text-color-placeholder);
  opacity: 0.8;
}

.eb-chat-stack__more {
  margin-top: 2px;
  padding: 1px var(--eb-space-2);
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-color-primary);
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-stack__more:hover {
  background: var(--eb-color-primary-light-9);
}

.eb-chat-stack__more:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
