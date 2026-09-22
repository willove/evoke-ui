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
        :transport="transport"
        stoppable
        @stop="onStop"
        :chat-height="360"
        style="max-width: 860px; margin: 0 auto"
      />
    </div>
  </eb-app-layout>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import { useChatEngine } from '@wil-works/evoke-chat'
import { SCENES, CAPABILITIES, MODELS, EXAMPLES, buildReply } from '../mock.js'

const { isDark, toggleDark } = useDarkMode()
const collapsed = ref(false)
const activeMenu = ref('assistant')

const scene = ref('diagnose')
const activeCapabilities = ref([])
const model = ref('qwen-max')

/** 页面持有引擎（受控）：transport 里直接驱动它做流式回写 */
const engine = useChatEngine({ onSend: transport })

let timer = null

function transport(content, attachments, context) {
  const { think, body } = buildReply(content, context)
  const prefix = attachments.length
    ? `已读取 ${attachments.length} 个附件，将结合其内容作答。\n\n`
    : ''
  const msg = engine.createAssistantMessage()

  let thinkIndex = 0
  let bodyIndex = 0
  let phase = think ? 'think' : 'body'

  const STOPPED = '已停止生成'
  function tick() {
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
      clearInterval(timer)
      timer = null
      engine.completeMessage(msg.id)
    }
  }

  timer = setInterval(tick, 24)
}

/** 停止：清掉计时器，把当前助手消息标记为已中断 */
function onStop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  const current = engine.assistantMessage.value
  if (current) engine.setMessageError(current.id, '已停止生成')
}

onBeforeUnmount(() => timer && clearInterval(timer))
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
