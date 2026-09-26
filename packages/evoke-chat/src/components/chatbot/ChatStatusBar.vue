<template>
  <div
    v-if="phase"
    class="eb-chat-status"
    :class="[`is-${phase}`, { 'is-stoppable': stoppable }]"
  >
    <span class="eb-chat-status__dot" aria-hidden="true" />
    <!-- live region 只包这句话：elapsed 每秒在跳，整块播报会变成噪音 -->
    <span class="eb-chat-status__live" role="status" aria-live="polite" aria-atomic="true">{{ text }}</span>
    <span v-if="showElapsed" class="eb-chat-status__elapsed" aria-hidden="true">{{ formattedElapsed }}</span>
    <span v-if="hintText" class="eb-chat-status__hint">{{ hintText }}</span>

    <button
      v-if="queuedCount"
      type="button"
      class="eb-chat-status__queue"
      :title="labels.status.viewQueue"
      @click="emit('view-queue')"
    >
      <eb-icon name="stack" :size="12" />
      <span>{{ queuedCount }}</span>
    </button>
    <button
      v-if="stoppable"
      type="button"
      class="eb-chat-status__stop"
      @click="emit('stop')"
    >
      {{ labels.status.stop }}
    </button>
  </div>
</template>

<script setup>
/**
 * EbChatStatusBar — 输入台上方的常驻状态条
 *
 * 「AI 现在在做什么」此前只能靠 aria-busy 猜：这个组件把它变成一句话 + 一个可点的动作。
 * 组件只做呈现：状态由宿主给（phase / label / tool / elapsed / hint / queue），
 * 空态（phase 缺省或 idle）**不渲染**——不占位、不留空条。
 *
 * 无障碍口径：
 *   - live region 只包「状态句」，elapsed 每秒在跳且被 aria-hidden，避免整块反复播报；
 *   - 状态不只靠颜色区分：形状与运动也不同（点 / 转环 / 静态环 / 危点）；
 *   - prefers-reduced-motion 下所有动效关闭。
 */
import { computed } from "vue"
import EbIcon from "@wil-works/evoke-business-ui/icon"
import { useChatLabels } from "./labels"

const labels = useChatLabels()
const props = defineProps({
  /**
   * { phase, label?, tool?, elapsed?, hint?, queue?, error? }
   * phase: thinking | running | approval | question | queued | retrying | compacting | error
   */
  status: { type: Object, required: false, default: null },
  /** 是否给「停止」钮（由宿主决定当前阶段能否中断） */
  stoppable: { type: Boolean, required: false, default: false }
})
const emit = defineEmits(["stop", "view-queue"])

const IDLE = ["", "idle", null, undefined]
const phase = computed(() => {
  const p = props.status?.phase
  return IDLE.includes(p) ? "" : p
})
const queuedCount = computed(() => Number(props.status?.queue) || 0)
/** 弱化补充信息：压缩了多少条、等谁回复之类，一行以内 */
const hintText = computed(() => props.status?.hint || "")

const text = computed(() => {
  const s = props.status || {}
  if (s.label) return s.label
  const tool = s.tool
  switch (phase.value) {
    case "thinking":
      return labels.status.thinking
    case "running":
      return tool ? labels.status.runningTool(tool) : labels.status.running
    case "approval":
      return labels.status.approval
    case "question":
      return labels.status.question
    case "queued":
      return labels.status.queued(queuedCount.value)
    case "retrying":
      return labels.status.retrying
    case "compacting":
      return labels.status.compacting
    case "error":
      return s.error || labels.status.error
    default:
      return s.label || ""
  }
})

/** elapsed 只在「真在跑」的阶段显示：待审批/排队显示耗时会让人误以为在推进 */
const RUNNING_PHASES = ["thinking", "running", "retrying", "compacting"]
const showElapsed = computed(() => RUNNING_PHASES.includes(phase.value) && Number(props.status?.elapsed) > 0)
const formattedElapsed = computed(() => {
  const ms = Number(props.status?.elapsed) || 0
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  return `${m}m ${Math.round(s - m * 60)}s`
})
</script>

<style scoped>
.eb-chat-status {
  display: flex;
  align-items: center;
  gap: var(--eb-space-2);
  min-height: 24px;
  padding: 2px var(--eb-space-3);
  color: var(--eb-text-color-secondary);
  font-size: var(--eb-font-size-xs);
}

/* 形状 + 运动区分状态，不只靠颜色（色相只在「需要你」和「出错」时出现） */
.eb-chat-status__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--eb-color-primary);
}

.eb-chat-status.is-thinking .eb-chat-status__dot,
.eb-chat-status.is-compacting .eb-chat-status__dot {
  animation: eb-chat-status-breathe 1s ease-in-out infinite alternate;
}

.eb-chat-status.is-running .eb-chat-status__dot,
.eb-chat-status.is-retrying .eb-chat-status__dot {
  width: 10px;
  height: 10px;
  background: transparent;
  border: 2px solid var(--eb-color-primary-light-5);
  border-top-color: var(--eb-color-primary);
  animation: eb-chat-status-spin 1.5s linear infinite;
}

.eb-chat-status.is-retrying .eb-chat-status__dot {
  border-style: dashed;
}

.eb-chat-status.is-approval .eb-chat-status__dot {
  background: transparent;
  border: 2px solid var(--eb-color-warning);
}

.eb-chat-status.is-question .eb-chat-status__dot {
  background: transparent;
  border: 2px solid var(--eb-color-primary);
}

.eb-chat-status.is-error .eb-chat-status__dot {
  background: var(--eb-color-danger);
}

.eb-chat-status__live {
  color: var(--eb-text-color-regular);
  font-weight: var(--eb-font-weight-medium);
}

.eb-chat-status__elapsed,
.eb-chat-status__hint {
  color: var(--eb-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.eb-chat-status__hint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eb-chat-status__queue,
.eb-chat-status__stop {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 0 var(--eb-space-2);
  height: 20px;
  border: 0;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  font-family: inherit;
  font-size: var(--eb-font-size-xs);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.eb-chat-status__queue {
  margin-left: auto;
}

.eb-chat-status__queue:hover,
.eb-chat-status__stop:hover {
  background: var(--eb-fill-color);
  color: var(--eb-color-primary);
}

.eb-chat-status__stop {
  color: var(--eb-text-color-regular);
}

.eb-chat-status__queue:focus-visible,
.eb-chat-status__stop:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

@keyframes eb-chat-status-breathe {
  from { opacity: 0.35; }
  to { opacity: 1; }
}

@keyframes eb-chat-status-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .eb-chat-status__dot {
    animation: none !important;
  }
}
</style>