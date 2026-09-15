# 案例：AI 产品首屏

AI 产品的官网首屏越来越不只是「介绍」——用户进门就想试。本案例用 [EvAiPromptBox](/components/ai-prompt-box)
做首屏主交互：展示体标题 + 渐变高亮 + 大输入台 + **就地作答**面板，发送即见流式回答，
标准的首屏「即问即答」形态。品牌沿用积云数合（演示文案）。

**用到的组件**：[EvNavbar](/components/navbar) · [EvButton](/components/button) · [EvAiPromptBox](/components/ai-prompt-box)

<script setup>
import CaseStage from '../.vitepress/theme/CaseStage.vue'
import AiFirstScreen from '../.vitepress/theme/case-sites/AiFirstScreen.vue'
</script>

<CaseStage url="ai.cumubase.cn" live-url="/cases/live/ai-landing">
  <AiFirstScreen />
</CaseStage>

## 搭建要点

- **输入台就是主角**：首屏不再放「注册按钮 + 产品截图」，而是一个能直接用的 AI 输入台——
  访客在营销页就完成第一次调用，转化路径最短。
- **标题只用一处渐变**：`--ev-gradient-hero` + `background-clip: text` 给高亮词，其余保持
  墨色展示体；整页渐变超过一处就会显闹。
- **场景预设替用户写好提示词**：`scenes` 一键切语境（文案 / 解读 / 翻译 / 代码），
  示例问题点击直发，冷启动零思考成本。
- **就地作答，不要跳页**：回答面板贴在输入台下方，`white-space: pre-wrap` + 打字光标模拟
  流式；面板头展示本次调用的「场景 · 能力 · 模型」元信息，让用户看见上下文真的生效了。
- **生成可停**：`stoppable` 让发送钮在流式期间变停止钮，演示里清计时器即可，
  生产环境换 `AbortController`。

## 关键代码

首屏骨架：标题 + 输入台 + 示例 + 作答面板，事件一处收口：

```vue
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
```

`send` 载荷就是完整调用上下文——真实接入时把它交给你的模型服务，流式片段写进
`answer` 即可复现本页的打字效果：

```js
function send(payload) {
  // payload = { text, scene, capabilities, model, attachments }
  answerMeta.value = formatContext(payload)   // 「场景 · 能力 · 模型」展示给用户看
  const stream = myModelApi.stream(payload)   // fetch / SSE
  for await (const chunk of stream) answer.value += chunk
}
```

## 接入真实产品

- `MOCK_REPLIES` 换成模型服务返回流；场景键映射为 system prompt 或路由到不同模型；
- 额度 `quota` 接配额接口，`quota-click` 跳转套餐页；
- 登录态下可加历史会话入口（输入台下方），跳转完整工作台（business-ui 的 `AiConsole`
  是它的对话工作台形态，两库 API 同面）。
