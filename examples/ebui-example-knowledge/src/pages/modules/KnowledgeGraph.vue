<template>
  <div class="kg-page">
    <ev-page-header title="知识图谱" subtitle="知识节点的关联结构与跳转关系">
      <template #actions>
        <ev-segmented v-model="scope" :options="[{ label: '全部关联', value: 'all' }, { label: '仅一级', value: 'direct' }]" size="small" />
      </template>
    </ev-page-header>

    <ev-row :gutter="16" class="kg-block">
      <!-- 左：关系图（固定布局 SVG，节点可点选） -->
      <ev-col :xs="24" :lg="14">
        <ev-section-card title="关联结构" :padding="false" class="kg-graph-card">
          <div class="kg-graph">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <line
                v-for="e in visibleEdges"
                :key="e.from + e.to"
                :x1="nodeById(e.from).x"
                :y1="nodeById(e.from).y"
                :x2="nodeById(e.to).x"
                :y2="nodeById(e.to).y"
                :stroke="isNeighbor(e) ? '#175DFF' : '#C7D2E3'"
                :stroke-width="isNeighbor(e) ? 0.8 : 0.45"
                vector-effect="non-scaling-stroke"
              />
            </svg>
            <button
              v-for="n in visibleNodes"
              :key="n.id"
              type="button"
              class="kg-node"
              :class="[`kg-node--${n.group}`, { 'is-active': n.id === selectedId, 'is-dim': selectedId && !isNeighbor(n) && n.id !== selectedId }]"
              :style="{ left: n.x + '%', top: n.y + '%' }"
              @click="selectedId = n.id"
            >
              {{ n.label }}
            </button>
          </div>
          <div class="kg-legend">
            <span><i class="kg-legend__dot kg-legend__dot--core" />核心主题</span>
            <span><i class="kg-legend__dot kg-legend__dot--module" />功能模块</span>
            <span><i class="kg-legend__dot kg-legend__dot--topic" />知识专题</span>
          </div>
        </ev-section-card>
      </ev-col>

      <!-- 右：节点详情与关联列表 -->
      <ev-col :xs="24" :lg="10">
        <ev-section-card :padding="false" class="kg-detail-card">
          <template #header>
            <div class="kg-detail-title">
              <span>{{ selected.label }}</span>
              <ev-tag size="small" effect="plain">{{ groupLabel(selected.group) }}</ev-tag>
            </div>
          </template>
          <div class="kg-detail-body">
            <ev-detail-descriptions :column="1" :border="false" :data="selectedInfo" :items="infoItems" />
            <div class="kg-sub-title">关联知识（{{ neighbors.length }}）</div>
            <div class="kg-links">
              <a
                v-for="nb in neighbors"
                :key="nb.id"
                class="kg-link"
                @click="selectedId = nb.id"
              >
                <ev-icon name="arrow-right" :size="12" />
                {{ nb.label }}
              </a>
            </div>
            <div class="kg-sub-title">相关文档（{{ relatedDocs.length }}）</div>
            <div v-if="relatedDocs.length" class="kg-docs">
              <a v-for="doc in relatedDocs" :key="doc.id" class="kg-doc" @click="EvMessage.info(`示例：阅读「${doc.title}」`)">
                {{ doc.title }}
              </a>
            </div>
            <div v-else class="kg-nodoc">该节点暂无挂载文档</div>
          </div>
        </ev-section-card>
      </ev-col>
    </ev-row>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import { graphNodes, graphEdges, articles } from '../mock.js'

const scope = ref('all')
const selectedId = ref('dashboard')

const nodeById = (id) => graphNodes.find((n) => n.id === id)
const selected = computed(() => nodeById(selectedId.value) ?? graphNodes[0])

const GROUP_LABEL = { core: '核心主题', module: '功能模块', topic: '知识专题' }
const groupLabel = (g) => GROUP_LABEL[g] ?? g

const visibleNodes = computed(() =>
  scope.value === 'direct'
    ? graphNodes.filter((n) => n.id === selectedId.value || neighbors.value.some((nb) => nb.id === n.id) || n.group === 'core')
    : graphNodes,
)

const visibleEdges = computed(() =>
  graphEdges.filter((e) => visibleNodes.value.some((n) => n.id === e.from) && visibleNodes.value.some((n) => n.id === e.to)),
)

const neighbors = computed(() => {
  const ids = new Set()
  graphEdges.forEach((e) => {
    if (e.from === selectedId.value) ids.add(e.to)
    if (e.to === selectedId.value) ids.add(e.from)
  })
  return [...ids].map(nodeById)
})

function isNeighbor(edge) {
  return edge.from === selectedId.value || edge.to === selectedId.value
}

const selectedInfo = computed(() => ({
  label: selected.value.label,
  group: groupLabel(selected.value.group),
  links: neighbors.value.length,
  docs: relatedDocs.value.length,
}))

const infoItems = [
  { prop: 'group', label: '节点类型' },
  { prop: 'links', label: '关联节点' },
  { prop: 'docs', label: '挂载文档' },
]

/* 按节点名 / 父级分类挂载文档（演示：标题或分类含节点名即关联） */
const relatedDocs = computed(() =>
  articles.filter((a) => a.title.includes(selected.value.label) || a.category.includes(selected.value.label)),
)
</script>

<style scoped>
.kg-page {
  padding: 16px;
}
.kg-block {
  margin-top: 16px;
}
.kg-graph-card {
  min-height: 480px;
}
.kg-graph {
  position: relative;
  height: 400px;
  background:
    linear-gradient(var(--ev-border-color-extra-light, #f0f1f3) 1px, transparent 1px),
    linear-gradient(90deg, var(--ev-border-color-extra-light, #f0f1f3) 1px, transparent 1px);
  background-size: 25% 25%;
  overflow: hidden;
}
.kg-graph > svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.kg-node {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 4px 10px;
  font-size: var(--ev-font-size-xs, 12px);
  color: var(--ev-text-color-primary, #1f2329);
  background: var(--ev-bg-color, #fff);
  border: 1px solid var(--ev-border-color, #c8ccd2);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.kg-node:hover {
  border-color: var(--ev-color-primary, #175dff);
}
.kg-node--core {
  padding: 6px 14px;
  font-weight: var(--ev-font-weight-semibold, 600);
  color: #fff;
  background: var(--ev-color-primary, #175dff);
  border-color: var(--ev-color-primary, #175dff);
}
.kg-node.is-active {
  border-color: var(--ev-color-primary, #175dff);
  box-shadow: 0 0 0 3px rgba(23, 93, 255, 0.15);
}
.kg-node.is-dim {
  opacity: 0.4;
}
.kg-legend {
  display: flex;
  gap: 18px;
  padding: 10px 16px;
  font-size: var(--ev-font-size-xs, 12px);
  color: var(--ev-text-color-secondary, #8a9099);
  border-top: 1px solid var(--ev-border-color-extra-light, #f0f1f3);
}
.kg-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.kg-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.kg-legend__dot--core {
  background: var(--ev-color-primary, #175dff);
}
.kg-legend__dot--module {
  background: var(--ev-color-success, #22a45d);
}
.kg-legend__dot--topic {
  background: var(--ev-border-color, #c8ccd2);
}
.kg-detail-card {
  min-height: 480px;
}
.kg-detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-primary, #1f2329);
}
.kg-detail-body {
  padding: 16px;
}
.kg-sub-title {
  margin: 18px 0 10px;
  padding-left: 8px;
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-primary, #1f2329);
  border-left: 3px solid var(--ev-color-primary, #175dff);
}
.kg-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.kg-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--ev-text-color-regular, #4e545c);
  background: var(--ev-fill-color-light, #f5f6f8);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
}
.kg-link:hover {
  color: var(--ev-color-primary, #175dff);
  background: var(--ev-color-primary-light-9, rgba(23, 93, 255, 0.06));
}
.kg-docs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kg-doc {
  padding: 9px 12px;
  font-size: 13px;
  color: var(--ev-text-color-regular, #4e545c);
  background: var(--ev-fill-color-light, #f5f6f8);
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s;
}
.kg-doc:hover {
  color: var(--ev-color-primary, #175dff);
}
.kg-nodoc {
  font-size: 13px;
  color: var(--ev-text-color-secondary, #8a9099);
}
</style>
