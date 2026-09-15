<script setup>
/**
 * AiFirstScreen — 案例「AI 产品首屏」：官网首屏的 AI 入口台
 * EvAiPromptBox 作为首屏主交互（即问即答式），演示营销站如何组合
 * 展示体排版 + 渐变高亮 + AI 输入台 + 就地作答面板。
 * 同一份源码用于案例舞台（CaseStage）与独立全屏窗口（传 sticky 吸顶导航）。
 */
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  /** 导航是否吸顶（独立窗口下开启） */
  sticky: { type: Boolean, default: false },
})

const nav = [
  { label: '能力', href: '#skills' },
  { label: '场景', href: '#scenes' },
  { label: '定价', href: '#' },
]

const scenes = [
  { key: 'write', label: '文案创作' },
  { key: 'analysis', label: '数据解读', icon: 'file-list' },
  { key: 'translate', label: '多语翻译' },
  { key: 'code', label: '代码生成' },
]

const capabilities = [
  { key: 'deep-think', label: '深度思考' },
  { key: 'web', label: '联网检索' },
]

const models = [
  { key: 'cumubase-pro', label: '积云 Pro' },
  { key: 'cumubase-lite', label: '积云 Lite' },
]

const sceneKey = ref('write')
const activeCapabilities = ref(['deep-think'])
const modelKey = ref('cumubase-pro')

const examples = [
  '写一段新品发布会的开场白，主题是「数据会说话」',
  '把这段话翻译成英文并发朋友圈语气：我们上线了智能周报',
  '解读：本周注册转化率 3.2%，环比 +0.4pct',
]

const answer = ref('')
const answering = ref(false)
const answerMeta = ref('')
let timer = null

const activeScene = computed(() => scenes.find((s) => s.key === sceneKey.value))

const MOCK_REPLIES = {
  write: '【开场白】各位晚上好。有人说数据是冰冷的，我们不同意——数据只是在等一个会说话的人。今晚，让它开口。\n\n接下来 20 分钟，请允许我们用 12 个真实客户的故事，讲清一件事：让数据安静地工作。',
  analysis: '【解读】注册转化率 3.2%、环比 +0.4pct，增长健康。拆开看：落地页到注册的提升贡献了 8 成，说明最近的文案改版有效；下一步建议把 A 组新落地页全量，同时盯住渠道质量防止虚涨。',
  translate: "【译文】Intelligent Weekly Report is live — your team's key numbers, written up automatically every Monday morning. No more copy-pasting spreadsheets.",
  code: '【示例】\nconst weekly = await cumubase.reports.weekly({ team: id })\nconsole.log(weekly.summary) // 周一早上自动生成的一页纸周报',
}

function useExample(text) {
  send({ text, scene: sceneKey.value, capabilities: [...activeCapabilities.value], model: modelKey.value, attachments: [] })
}

function send(payload) {
  if (answering.value) return
  answerMeta.value = [
    payload.scene && scenes.find((s) => s.key === payload.scene)?.label,
    payload.capabilities.length ? payload.capabilities.map((k) => (k === 'deep-think' ? '深度思考' : '联网检索')).join(' + ') : '',
    models.find((m) => m.key === payload.model)?.label,
  ].filter(Boolean).join(' · ')
  const body = MOCK_REPLIES[payload.scene] || '这是一段演示回复：接入你的模型服务后，这里就是真实的流式回答。'
  answer.value = ''
  answering.value = true
  let i = 0
  timer = setInterval(() => {
    answer.value += body.slice(i, i + 2)
    i += 2
    if (i >= body.length) {
      clearInterval(timer)
      timer = null
      answering.value = false
    }
  }, 28)
}

function stopAnswer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  answering.value = false
}

onBeforeUnmount(() => timer && clearInterval(timer))
</script>

<template>
  <div class="ai-landing">
    <EvNavbar :items="nav" :sticky="sticky" logo-text="积云数合 AI">
      <template #actions>
        <EvButton size="small" variant="soft">登录</EvButton>
        <EvButton size="small" pill icon-right="arrow-right" href="#">免费试用</EvButton>
      </template>
    </EvNavbar>

    <!-- 首屏：标题 + AI 输入台 + 就地作答 -->
    <section class="ai-landing__hero">
      <span class="ai-landing__badge">Cumubase AI · 全新上线</span>
      <h1 class="ai-landing__title">
        把 <span class="ai-landing__grad">大模型能力</span> 装进你的产品
      </h1>
      <p class="ai-landing__desc">一句话，完成文案、解读与翻译。下面这个输入台，就是接好模型的你。</p>

      <div class="ai-landing__box">
        <EvAiPromptBox
          v-model:scene="sceneKey"
          v-model:active-capabilities="activeCapabilities"
          v-model:model="modelKey"
          :scenes="scenes"
          :capabilities="capabilities"
          :models="models"
          :quota="{ label: '免费额度 100%', percent: 100 }"
          stoppable
          :loading="answering"
          @send="send"
          @stop="stopAnswer"
        />
      </div>

      <div class="ai-landing__examples">
        <button
          v-for="text in examples"
          :key="text"
          type="button"
          class="ai-landing__example"
          :disabled="answering"
          @click="useExample(text)"
        >
          {{ text }}
        </button>
      </div>

      <div v-if="answer || answering" class="ai-landing__answer">
        <div class="ai-landing__answer-head">
          <span>回答</span>
          <span class="ai-landing__answer-meta">{{ answerMeta }}</span>
        </div>
        <p class="ai-landing__answer-body">{{ answer }}<span v-if="answering" class="ai-landing__caret">▍</span></p>
        <div class="ai-landing__answer-foot">内容由 AI 生成，仅供参考</div>
      </div>
    </section>

    <!-- 能力带 -->
    <section id="skills" class="ai-landing__band">
      <div class="ai-landing__skill">
        <strong>即问即答</strong>
        <span>输入台发出去的是完整上下文，回来的是流式答案</span>
      </div>
      <div class="ai-landing__skill">
        <strong>场景预设</strong>
        <span>文案 / 解读 / 翻译 / 代码，一键把用户放进正确的语境</span>
      </div>
      <div class="ai-landing__skill">
        <strong>可控可停</strong>
        <span>能力开关与额度在你手里，生成随时可中断</span>
      </div>
    </section>

    <footer class="ai-landing__footer">积云数合 · 案例演示页，文案为演示内容</footer>
  </div>
</template>

<style scoped>
.ai-landing {
  min-height: 100vh;
  background: var(--ev-bg-page);
  display: flex;
  flex-direction: column;
}

/* ─── 首屏 ─── */
.ai-landing__hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 72px 24px 40px;
}

.ai-landing__badge {
  font-size: 13px;
  color: var(--ev-color-primary);
  background: var(--ev-color-primary-light-9);
  border: 1px solid var(--ev-color-primary-light-8);
  border-radius: var(--ev-radius-full);
  padding: 5px 14px;
}

.ai-landing__title {
  margin: 22px 0 0;
  font-size: 52px;
  font-weight: var(--ev-display-weight, 400);
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--ev-color-ink);
  text-wrap: balance;
}

.ai-landing__grad {
  background: var(--ev-gradient-hero);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.ai-landing__desc {
  margin: 14px 0 0;
  font-size: 17px;
  color: var(--ev-color-ink-secondary);
}

.ai-landing__box {
  width: min(720px, 100%);
  margin-top: 34px;
}

.ai-landing__examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(560px, 100%);
  margin-top: 26px;
}

.ai-landing__example {
  padding: 9px 14px;
  font-size: 13px;
  text-align: left;
  color: var(--ev-color-ink-secondary);
  background: none;
  border: none;
  border-radius: var(--ev-radius-md);
  cursor: pointer;
  transition: background-color var(--ev-duration-fast) var(--ev-ease-smooth, ease);
}

.ai-landing__example:hover:not(:disabled) {
  color: var(--ev-color-ink);
  background: var(--ev-bg-soft);
}

.ai-landing__example:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ─── 作答面板 ─── */
.ai-landing__answer {
  width: min(720px, 100%);
  margin-top: 22px;
  text-align: left;
  background: var(--ev-bg-container);
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-lg);
  box-shadow: var(--ev-shadow-1);
  padding: 16px 20px;
}

.ai-landing__answer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: var(--ev-color-ink);
}

.ai-landing__answer-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--ev-color-ink-muted);
}

.ai-landing__answer-body {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ev-color-ink-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-landing__caret {
  color: var(--ev-color-primary);
}

.ai-landing__answer-foot {
  margin-top: 12px;
  font-size: 12px;
  color: var(--ev-color-ink-muted);
}

/* ─── 能力带 ─── */
.ai-landing__band {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  width: min(880px, 100%);
  margin: 0 auto;
  padding: 28px 24px 36px;
}

.ai-landing__skill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.ai-landing__skill strong {
  font-size: 15px;
  font-weight: 600;
  color: var(--ev-color-ink);
}

.ai-landing__skill span {
  font-size: 13px;
  color: var(--ev-color-ink-secondary);
}

.ai-landing__footer {
  padding: 18px 24px;
  font-size: 12px;
  color: var(--ev-color-ink-muted);
  text-align: center;
  border-top: 1px solid var(--ev-border-color-light);
}

@media (max-width: 720px) {
  .ai-landing__title {
    font-size: 34px;
  }
  .ai-landing__band {
    grid-template-columns: 1fr;
  }
}
</style>
