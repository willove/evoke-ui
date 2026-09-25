<template>
  <eb-app-layout
    title="智能运营助手"
    :collapsed="collapsed"
    @update:collapsed="collapsed = $event"
    :is-dark="isDark"
    @toggle="toggleDark"
    active-menu="assistant"
    active-title="智能助手"
  >
    <template #menu>
      <eb-menu-item index="dashboard" @click="activeMenu = 'dashboard'">
        <eb-icon name="dashboard" />
        <span>数据概览</span>
      </eb-menu-item>
      <eb-menu-item index="assistant" @click="activeMenu = 'assistant'">
        <eb-icon name="robot" />
        <span>智能助手</span>
      </eb-menu-item>
      <eb-menu-item index="reports" @click="activeMenu = 'reports'">
        <eb-icon name="file-text" />
        <span>报告中心</span>
      </eb-menu-item>
    </template>

    <template #topbar-right>
      <div class="ai-topbar">
        <eb-tag type="primary" size="small" effect="light">Beta</eb-tag>
        <eb-avatar :size="28">运</eb-avatar>
      </div>
    </template>

    <!-- 其他菜单给占位，演示聚焦 AI 助手 -->
    <div v-if="activeMenu !== 'assistant'" class="ai-placeholder">
      <eb-empty description="演示聚焦「智能助手」，其余模块为占位" />
    </div>

    <div v-else class="ai-workbench">
      <eb-ai-console
        ref="consoleRef"
        :engine="engine"
        :welcome="{ title: '欢迎体验智能运营助手，今天要分析什么？', highlight: '智能运营助手', subtitle: '接入你的业务数据，让运营问题当场有答案' }"
        :examples="EXAMPLES"
        :scenes="SCENES"
        v-model:scene="scene"
        :capabilities="CAPABILITIES"
        v-model:active-capabilities="activeCapabilities"
        :models="MODELS"
        v-model:model="model"
        :quota="{ label: '本月额度剩余 82%', percent: 82 }"
        :context="contextUsage"
        :transport="transport"
        stoppable
        @stop="onStop"
        :approval="approval"
        @approval-respond="onApprovalRespond"
        :question="question"
        @question-respond="onQuestionRespond"
        :chat-height="360"
        style="max-width: 860px; margin: 0 auto"
      />
    </div>
  </eb-app-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import { useChatEngine } from '@wil-works/evoke-chat'
import { SCENES, CAPABILITIES, MODELS, EXAMPLES, buildReply } from '../mock.js'

const { isDark, toggleDark } = useDarkMode()
const collapsed = ref(false)
const activeMenu = ref('assistant')

const scene = ref('diagnose')
const activeCapabilities = ref([])
const model = ref('qwen-max')

/**
 * 上下文占用（演示口径：32k 窗口 + 固定提示词/工具预算 + 对话按 2.5 字符≈1token 估）
 * 真实接入换成模型返回的用量；组件只做占比与呈现。
 */
const contextUsage = computed(() => {
  const chars = engine.messages.value.reduce((n, m) => n + (m.content?.length || 0), 0)
  const system = 6200
  const tools = 4100
  const messages = Math.round(chars / 2.5)
  return { used: system + tools + messages, capacity: 32000, breakdown: { system, tools, messages } }
})

/** 页面持有引擎（受控）：transport 里直接驱动它做流式回写 */
const engine = useChatEngine({ onSend: transport })

let timer = null
let finishStream = null
/** 待审批请求：非空时 AiConsole 的输入台让位给审批面板 */
const approval = ref(null)
let approvalResolve = null

function askApproval(request) {
  approval.value = request
  return new Promise((resolve) => { approvalResolve = resolve })
}

/** 审批结论：允许一次才跑联网工具；拒绝就基于已有上下文作答 */
function onApprovalRespond(outcome) {
  if (approval.value) {
    approval.value = { ...approval.value, status: outcome === 'rejected' ? 'rejected' : 'approved' }
  }
  approvalResolve?.(outcome)
  approvalResolve = null
  // 「已响应」留一会儿再收起，用户能看见自己的决定生效了
  setTimeout(() => { approval.value = null }, 900)
}

/** 待回答请求：非空时（且无审批）输入台让位给提问面板 */
const question = ref(null)
let questionResolve = null

function askQuestion(request) {
  question.value = request
  return new Promise((resolve) => { questionResolve = resolve })
}

/** 提问结论：把选择写进回答前缀，看得见"答了有用" */
function onQuestionRespond(answer) {
  if (question.value) {
    question.value = { ...question.value, status: answer?.status || 'answered' }
  }
  questionResolve?.(answer)
  questionResolve = null
  setTimeout(() => { question.value = null }, 900)
}

async function transport(content, attachments, context) {
  // 联网检索是"越权动作"：先走审批接管（Enter 允许一次 / Esc 拒绝），批准了才跑工具
  const useWeb = Array.isArray(context?.capabilities) && context.capabilities.includes('web')
  const webAllowed = useWeb
    ? (await askApproval({
      id: `ap-${Date.now()}`,
      toolName: 'web_search',
      reason: '联网检索会访问外部网页并读取正文',
      detail: content,
    })) === 'allowed-once'
    : false

  const { think, body } = buildReply(content, context)
  // 批准之后补一次澄清：agent 干活前先问清口径（Enter 前进 / Esc 取消）
  let scopeNote = ''
  if (webAllowed) {
    const options = [
      { key: 'mom', label: '环比', recommended: true },
      { key: 'yoy', label: '同比' },
      { key: 'qoq', label: '按季度' },
    ]
    const answer = await askQuestion({
      id: `q-${Date.now()}`,
      items: [{ id: 'scope', question: '对比口径按哪个来？', options }],
    })
    const picked = answer?.answers?.[0]
    const hit = options.find((o) => picked?.selected?.includes(o.key))
    if (hit) scopeNote = `已按「${hit.label}」口径对比。\n\n`
  }
  const prefix = [
    attachments.length ? `已读取 ${attachments.length} 个附件，将结合其内容作答。\n\n` : '',
    useWeb && !webAllowed ? '未授权联网检索，本次仅基于已有上下文作答。\n\n' : '',
    scopeNote,
  ].join('')
  const msg = engine.createAssistantMessage()

  let thinkIndex = 0
  let bodyIndex = 0
  // 批准后先跑工具：一只流式出结果、一只已完成——顺带演示运行过程标题
  const SEARCH_OUTPUT = '检索到 3 条资料：\n1. 渠道结构变化（信息流 CPM +20%）\n2. 次周留存稳定 41%\n3. 同环比口径存在差异\n'
  let toolId = null
  let toolIndex = 0
  let phase = webAllowed ? 'tool' : (think ? 'think' : 'body')

  /**
   * 必须返回 Promise 直到流结束：引擎的 loading 挂到这一刻，生成中发送钮才会
   * 变停止钮（stoppable）。提前 resolve 会让 loading 立刻回落，停止钮不出现。
   */
  return new Promise((resolve) => {
    function finish() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      finishStream = null
      resolve()
    }

    function tick() {
      // ① 工具阶段：检索结果边跑边出（appendToolCallResult），收尾不传 result 以保留流出的输出
      if (phase === 'tool') {
        if (!toolId) {
          toolId = engine.startToolCall(msg.id, { name: 'web_search', label: '联网检索', args: { query: content } })
          const pageId = engine.startToolCall(msg.id, { name: 'fetch_page', label: '抓取正文', args: { url: 'https://example.com/report' } })
          // 嵌套子调用：抓取之后挂一个解析步，演示子调用树
          const parseId = engine.addSubToolCall(msg.id, pageId, { name: 'parse_html', label: '解析正文结构', args: { selector: 'article' } })
          engine.appendToolCallResult(msg.id, pageId, '正文读取完成，共 1.2k 字')
          engine.completeToolCall(msg.id, pageId)
          engine.appendToolCallResult(msg.id, parseId, '解析出 3 个小节')
          engine.completeToolCall(msg.id, parseId)
        }
        engine.appendToolCallResult(msg.id, toolId, SEARCH_OUTPUT.slice(toolIndex, toolIndex + 4))
        toolIndex += 4
        if (toolIndex >= SEARCH_OUTPUT.length) {
          engine.completeToolCall(msg.id, toolId)
          // 本轮改了哪些文件：收尾可见的汇总卡
          engine.setChanges(msg.id, {
            total: 6,
            added: 128,
            deleted: 26,
            files: [
              { path: 'src/pages/AiWorkbench.vue', display: 'AiWorkbench.vue', added: 88, deleted: 12 },
              { path: 'src/mock.js', display: 'mock.js', added: 18, deleted: 6 },
              { path: 'src/utils/format.js', display: 'utils/format.js', added: 12, deleted: 4 },
              { path: 'tests/workbench.spec.js', display: 'workbench.spec.js', added: 10, deleted: 4 },
              { path: 'public/logo.png', display: 'logo.png', binary: true },
              { path: 'README.md', display: 'README.md', added: 2 },
            ],
          })
          phase = think ? 'think' : 'body'
        }
        return
      }
      if (phase === 'think') {
        engine.appendThinkContent(msg.id, think.slice(thinkIndex, thinkIndex + 2))
        thinkIndex += 2
        if (thinkIndex >= think.length) {
          engine.stopThinking(msg.id)
          phase = 'body'
        }
        return
      }
      engine.appendContent(msg.id, (prefix + body).slice(bodyIndex, bodyIndex + 2))
      bodyIndex += 2
      if (bodyIndex >= prefix.length + body.length) {
        engine.completeMessage(msg.id)
        finish()
      }
    }

    finishStream = finish
    timer = setInterval(tick, 24)
  })
}

/**
 * 停止：清掉计时器并让 transport 的 Promise 收尾（不收则不落 loading），
 * 再把当前助手消息置为 cancelled——已流出的正文原地保留，底部补一行
 * 「已停止生成」灰标。中断不是失败态：setMessageError 会把半截回答整体换成红块。
 */
function onStop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  finishStream?.()
  const current = engine.assistantMessage.value
  if (current) engine.cancelMessage(current.id)
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  finishStream?.()
})
</script>

<style scoped>
.ai-topbar {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.ai-workbench {
  height: 100%;
  padding: 24px 16px 12px;
  box-sizing: border-box;
  overflow-y: auto;
}
.ai-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
