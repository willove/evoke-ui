<template>
  <eb-timeline class="eb-audit-timeline" mode="left">
    <eb-timeline-item
      v-for="(item, i) in items"
      :key="item.id ?? i"
      :timestamp="formatTime(item.createdAt)"
      placement="start"
      :color="avatarColor(operatorName(item))"
      variant="filled"
    >
      <div class="eb-audit-timeline__item">
        <div class="eb-audit-timeline__item-head">
          <span class="eb-audit-timeline__operator" :style="{ color: avatarColor(operatorName(item)) }">
            {{ operatorName(item) }}
          </span>
          <span class="eb-audit-timeline__action">{{ item.action }}</span>
          <button
            v-if="expandable && item.diff?.length"
            type="button"
            class="eb-audit-timeline__toggle"
            :aria-expanded="isExpanded(item, i)"
            @click="toggleExpand(item, i)"
          >
            {{ isExpanded(item, i) ? '收起变更' : `展开变更 (${item.diff.length})` }}
            <eb-icon name="arrow-down" :size="12" :class="{ 'is-flipped': isExpanded(item, i) }" />
          </button>
        </div>
        <div v-if="item.detail" class="eb-audit-timeline__detail">{{ item.detail }}</div>

        <!-- diff 明细（展开时） -->
        <div v-if="expandable && item.diff?.length && isExpanded(item, i)" class="eb-audit-timeline__diff">
          <div v-for="d in item.diff" :key="d.field" class="eb-audit-timeline__diff-row">
            <span class="eb-audit-timeline__diff-field">{{ d.field }}</span>
            <span
              v-if="d.before !== undefined && d.before !== ''"
              class="eb-audit-timeline__diff-before"
            >{{ formatDiffValue(d.before) }}</span>
            <span v-else class="eb-audit-timeline__diff-before is-empty">（空）</span>
            <eb-icon name="arrow-right" :size="12" />
            <span class="eb-audit-timeline__diff-after">{{ formatDiffValue(d.after) }}</span>
          </div>
        </div>
      </div>
    </eb-timeline-item>
  </eb-timeline>
</template>

<script setup>
/**
 * EbAuditTimeline — 审计时间线（业务封装）
 * items = [{ id?, operator | user, action, createdAt, detail?, diff?: [{ field, before, after }] }]；
 * 节点色按操作者名稳定取色（avatarColor）；diff 可展开（expandedItems 受控 / 内部非受控）
 */
import { ref, computed } from 'vue'
import EbIcon from '../icon/index.vue'
import EbTimeline from '../timeline/index.vue'
import EbTimelineItem from '../timeline/item.vue'
import { avatarColor } from '../../utils/avatarColor'

const props = defineProps({
  items: { type: Array, default: () => [] },
  /** 允许展开 diff */
  expandable: { type: Boolean, default: true },
  /** 受控展开项（item.id；未传则内部维护） */
  expandedItems: { type: Array, default: undefined },
  formatTime: { type: Function, default: (t) => String(t ?? '') },
  formatDiffValue: { type: Function, default: (v) => String(v) },
})

const emit = defineEmits(['update:expandedItems', 'expand-change'])

const innerExpanded = ref([])

const expandedKeys = computed(() => (props.expandedItems ? props.expandedItems : innerExpanded.value))

function keyOf(item, i) {
  return item.id ?? i
}

function operatorName(item) {
  return item.operator ?? item.user ?? '系统'
}

function isExpanded(item, i) {
  return expandedKeys.value.includes(keyOf(item, i))
}

function toggleExpand(item, i) {
  const key = keyOf(item, i)
  const next = expandedKeys.value.includes(key)
    ? expandedKeys.value.filter((k) => k !== key)
    : [...expandedKeys.value, key]
  if (props.expandedItems) emit('update:expandedItems', next)
  else innerExpanded.value = next
  emit('expand-change', next)
}
</script>

<style src="./style.css"></style>
