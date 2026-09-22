/**
 * @wil-works/evoke-chat
 * Evoke Chat — AI 对话与 Agent UI（对话窗口、消息体、卡片、工具调用、沙箱预览）
 *
 * 底座是 @wil-works/evoke-business-ui（peer）：基础组件（EbIcon / EbAvatar /
 * EbEmpty / EbVirtualList / EbFloatButton / EbDrawer / EbDialog）、设计令牌
 * （--eb-*）、EbConfigProvider 的语言与主题上下文都来自它。宿主必须同时安装两侧。
 *
 * Usage:
 *   import EvokeBusinessUI from '@wil-works/evoke-business-ui'
 *   import EvokeChat from '@wil-works/evoke-chat'
 *   import '@wil-works/evoke-business-ui/styles'
 *   import '@wil-works/evoke-chat/styles'
 *
 *   app.use(EvokeBusinessUI)
 *   app.use(EvokeChat)
 */

// ══════ CSS — 必须全局生效的部分（v-html 正文拿不到 scoped） ══════
import './styles/index.css'

// ══════ 对话窗口 ══════
import EbChatbot from './components/chatbot/Chatbot.vue'
import EbChatList from './components/chatbot/ChatList.vue'
import EbChatMessage from './components/chatbot/ChatMessage.vue'
import EbChatSender from './components/chatbot/ChatSender.vue'
import EbChatContent from './components/chatbot/ChatContent.vue'
import EbChatMarkdown from './components/chatbot/ChatMarkdown.vue'
import EbChatThinking from './components/chatbot/ChatThinking.vue'
import EbChatLoading from './components/chatbot/ChatLoading.vue'
import EbChatActionbar from './components/chatbot/ChatActionbar.vue'
import EbChatAttachments from './components/chatbot/ChatAttachments.vue'
import EbChatSuggestion from './components/chatbot/ChatSuggestion.vue'
import EbChatFeedback from './components/chatbot/ChatFeedback.vue'
import EbChatMessageEdit from './components/chatbot/ChatMessageEdit.vue'
import EbChatSources from './components/chatbot/ChatSources.vue'
import EbChatToolCall from './components/chatbot/ChatToolCall.vue'
import EbChatThreads from './components/chatbot/ChatThreads.vue'
import EbChatWidget from './components/chatbot/ChatWidget.vue'
// ══════ Agent 卡与过程 ══════
import EbChatPlan from './components/chatbot/ChatPlan.vue'
import EbChatConfirmation from './components/chatbot/ChatConfirmation.vue'
import EbChatArtifact from './components/chatbot/ChatArtifact.vue'
import EbChatDiff from './components/chatbot/ChatDiff.vue'
import EbChatTerminal from './components/chatbot/ChatTerminal.vue'
import EbChatFileTree from './components/chatbot/ChatFileTree.vue'
import EbChatTestResults from './components/chatbot/ChatTestResults.vue'
import EbChatStackTrace from './components/chatbot/ChatStackTrace.vue'
// ══════ 分享 / 语音 / 排队 / 触发菜单 / 计量 ══════
import EbChatShare from './components/chatbot/ChatShare.vue'
import EbChatSpeak from './components/chatbot/ChatSpeak.vue'
import EbChatVoiceInput from './components/chatbot/ChatVoiceInput.vue'
import EbChatQueue from './components/chatbot/ChatQueue.vue'
import EbChatCommandMenu from './components/chatbot/ChatCommandMenu.vue'
import EbChatUsage from './components/chatbot/ChatUsage.vue'
// ══════ 沙箱与预览 ══════
import EbChatSandbox from './components/chatbot/ChatSandbox.vue'
import EbChatWebPreview from './components/chatbot/ChatWebPreview.vue'
// ══════ 编排层 ══════
import EbAiPromptBox from './components/ai-prompt-box/index.vue'
import EbAiConsole from './components/ai-console/index.vue'

// ══════ 组合式 API ══════
export { useChatEngine } from './components/chatbot/useChatEngine'
export { useChatSessions } from './components/chatbot/useChatSessions'
export { useTriggerMenu } from './composables/useTriggerMenu'
export { useSpeech } from './composables/useSpeech'
export { useSpeechInput } from './composables/useSpeechInput'
// 对话正文渲染的配置面：协议白名单 / 主题色 / 追加高亮语言
export {
  configureChatMarkdown,
  getChatMarkdownConfig,
  renderChatMarkdown,
  registerHighlightLanguage,
} from './components/chatbot/chatMarkdown'
export { chatLabels, useChatLabels } from './components/chatbot/labels'

const components = {
  EbChatbot,
  EbChatList,
  EbChatMessage,
  EbChatSender,
  EbChatContent,
  EbChatMarkdown,
  EbChatThinking,
  EbChatLoading,
  EbChatActionbar,
  EbChatAttachments,
  EbChatSuggestion,
  EbChatFeedback,
  EbChatMessageEdit,
  EbChatSources,
  EbChatToolCall,
  EbChatThreads,
  EbChatWidget,
  EbChatPlan,
  EbChatConfirmation,
  EbChatArtifact,
  EbChatDiff,
  EbChatTerminal,
  EbChatFileTree,
  EbChatTestResults,
  EbChatStackTrace,
  EbChatShare,
  EbChatSpeak,
  EbChatVoiceInput,
  EbChatQueue,
  EbChatCommandMenu,
  EbChatUsage,
  EbChatSandbox,
  EbChatWebPreview,
  EbAiPromptBox,
  EbAiConsole,
}

// ─── Vue Plugin Install ───
function install(app, _options = {}) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}

export {
  // 对话窗口
  EbChatbot,
  EbChatList,
  EbChatMessage,
  EbChatSender,
  EbChatContent,
  EbChatMarkdown,
  EbChatThinking,
  EbChatLoading,
  EbChatActionbar,
  EbChatAttachments,
  EbChatSuggestion,
  EbChatFeedback,
  EbChatMessageEdit,
  EbChatSources,
  EbChatToolCall,
  EbChatThreads,
  EbChatWidget,
  // Agent 卡与过程
  EbChatPlan,
  EbChatConfirmation,
  EbChatArtifact,
  EbChatDiff,
  EbChatTerminal,
  EbChatFileTree,
  EbChatTestResults,
  EbChatStackTrace,
  // 分享 / 语音 / 排队 / 触发菜单 / 计量
  EbChatShare,
  EbChatSpeak,
  EbChatVoiceInput,
  EbChatQueue,
  EbChatCommandMenu,
  EbChatUsage,
  // 沙箱与预览
  EbChatSandbox,
  EbChatWebPreview,
  // 编排层
  EbAiPromptBox,
  EbAiConsole,
  components,
  install,
}

export default { install }
