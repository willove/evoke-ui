<template>
  <eb-app-layout
    title="自研 RAG 后端（cumulus）"
    :collapsed="collapsed"
    @update:collapsed="collapsed = $event"
    :is-dark="isDark"
    @toggle="toggleDark"
    active-menu="rag"
    active-title="自研后端"
  >
    <template #menu>
      <eb-menu-item index="rag" @click="activeMenu = 'rag'">
        <eb-icon name="robot" />
        <span>自研后端</span>
      </eb-menu-item>
    </template>

    <div class="rag-note">
      <b>这一页演示什么</b>：不用 OpenAI/Anthropic adapter，直接吃**自研后端的事件流**。
      后端跑 <code>cumulus serve</code>，流端点是 <code>POST /v1/qa/stream</code>（SSE）。
      关键映射在 <code>src/cumulus-transport.js</code>——一份可复制的胶水。
      <ul>
        <li>阶段进度走 <code>appendProgress</code>（时间线，<b>不拼进 think 文本</b>）</li>
        <li>思考与正文走**两个 API**：<code>appendThinkContent</code> / <code>appendContent</code></li>
        <li>检索命中可切成工具调用卡（<code>filesAsToolCards</code>），入参分片流式</li>
        <li>答案收尾补行内引用锚点 <code>anchorSource</code>，点上标联动来源面板</li>
        <li><code>keepProgressLog</code> 开着：答案出来后仍可回看"它查了什么"</li>
      </ul>
      <div class="rag-note__backend">
        后端地址：<code>{{ backend }}</code>
        <eb-button size="small" @click="probe">探活</eb-button>
        <span v-if="probeResult" class="rag-note__probe">{{ probeResult }}</span>
        <span v-if="lastCommitted" class="rag-note__probe">提交视图：{{ lastCommitted }}</span>
      </div>
    </div>

    <eb-ai-console
      :engine="engine"
      :welcome="{ title: '问一个知识库里的问题', highlight: '知识库', subtitle: '答案会带引用与阶段轨迹；过程是流式出来的' }"
      :examples="EXAMPLES"
      :status="{ phase: 'idle' }"
      :status-stoppable="engine.loading.value"
      :transport="transport"
      stoppable
      @stop="onStop"
      :chat-height="420"
      :model="model"
      :context="contextUsage"
      style="max-width: 880px; margin: 0 auto"
    >
      <!-- 来源面板：引用与关联文档分两栏（关联**不混进引用**） -->
      <template #sources>
        <eb-chat-sources
          :items="sources"
          @item-click="onSourceClick"
        />
        <div v-if="related.length" class="rag-related">
          <div class="rag-related__title">关联文档（取回但未引用）</div>
          <div v-for="r in related" :key="r.sourceId" class="rag-related__item">
            <span>{{ r.title }}</span>
            <em>{{ r.why }}</em>
          </div>
        </div>
      </template>
    </eb-ai-console>
  </eb-app-layout>
</template>

<script setup>
/**
 * 自研 RAG 后端接入示例（cumulus）。
 *
 * 存在的理由：createChatTransport 的文档说"自研后端可传实现
 * createState/buildRequest/headersOf/frameToEvents/finalize 的对象"，但仓库里
 * 只有 openai/anthropic 两个 adapter。**一个活例子比文档更能防误用**——尤其
 * RAG 后端的事件流形状（阶段进度 + 逐文件检索 + 行内引用 + 收尾提交视图）
 * 与 chat 协议差别不小。
 *
 * 跑法：
 *   1. 起后端：cumulus serve -synth llm -listen 127.0.0.1:8485
 *   2. 起本示例：pnpm dev（Vite 代理 /v1 到后端，或直接填后端地址）
 */
import { computed, ref } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import { useChatEngine } from '@wil-works/evoke-chat'
import { createCumulusTransport } from '../cumulus-transport.js'

const { isDark, toggleDark } = useDarkMode()
const collapsed = ref(false)
const activeMenu = ref('rag')
const backend = ref(import.meta.env.VITE_CUMULUS_URL || 'http://127.0.0.1:8485')
const sources = ref([])
const related = ref([])
const probeResult = ref('')
const lastCommitted = ref('')

const EXAMPLES = [
  { title: '专利法', desc: '问一个知识库里有的问题' },
]

// keepProgressLog：答案出来后仍保留阶段轨迹（事后审计"它查了什么"）
const engine = useChatEngine({ onSend: null, keepProgressLog: true })

const transport = createCumulusTransport({
  engine,
  baseURL: backend.value,
  onCitations: (refs) => {
    sources.value = refs
  },
  onRelated: (items) => {
    related.value = items
  },
  onDone: (d) => {
    // 提交视图（corpus/config/strategy/阈值）就带在 d.committed 里，
    // 运行卡要显示"这答案针对哪一版给的"时从这儿取
    lastCommitted.value = d?.committed || ''
  },
  onError: (e) => {
    probeResult.value = String(e.message || e)
  },
})

// 停止：EbAiConsole 的 @stop 调 transport.cancel()（transport 自带 AbortController）

const contextUsage = computed(() => {
  const last = engine.messages.value[engine.messages.value.length - 1]
  const u = last?.usage
  if (!u) return null
  return { used: (u.promptTokens || 0) + (u.completionTokens || 0), capacity: 32000 }
})

const model = computed(() => 'cumulus · qa')

async function probe() {
  try {
    const r = await fetch(backend.value.replace(/\/$/, '') + '/v1/health')
    probeResult.value = r.ok ? `后端可达（HTTP ${r.status}）` : `HTTP ${r.status}`
  } catch (e) {
    probeResult.value = '后端不可达：' + String(e.message || e)
  }
}

function onStop() {
  // 用户点停止：中止 fetch（AbortError → engine.cancelMessage，不是 error）
  transport.cancel()
}

function onSourceClick(item) {
  probeResult.value = item?.url || ''
}
</script>

<style scoped>
.rag-note {
  max-width: 880px;
  margin: 0 auto 12px;
  padding: 12px 14px;
  border: 1px solid var(--eb-border-color-light);
  border-radius: 8px;
  background: var(--eb-bg-color);
  font-size: 13px;
  line-height: 1.7;
}
.rag-note ul {
  margin: 6px 0;
  padding-left: 18px;
  color: var(--eb-text-color-secondary, #666);
}
.rag-note code {
  background: rgba(127, 127, 127, .12);
  border-radius: 4px;
  padding: 0 4px;
}
.rag-note__backend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.rag-note__probe {
  color: var(--eb-color-primary, #2f6feb);
}
.rag-related {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--eb-border-color-light);
  font-size: 12px;
}
.rag-related__title {
  color: var(--eb-text-color-secondary, #666);
  margin-bottom: 4px;
}
.rag-related__item {
  display: flex;
  gap: 8px;
  padding: 2px 0;
}
.rag-related__item em {
  color: var(--eb-text-color-secondary, #888);
  font-style: normal;
}
</style>