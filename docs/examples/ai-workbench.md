<script setup>
import AiWorkbench from '../../examples/ebui-example-ai/src/pages/AiWorkbench.vue'
import aiSource from '../../examples/ebui-example-ai/src/pages/AiWorkbench.vue?raw'
</script>

# AI 运营助手工作台

面向「运营问答、报告与文案」的 AI 助手场景：[AiConsole](/chat/ai-console) 工作台嵌入
AppLayout 后台骨架，演示大模型调用的完整接线——场景路由、深度思考流、联网检索引用、
模型切换、停止生成。transport 为 mock 实现（无真实网络），换成你的 fetch / SSE 即是生产形态。

<a class="bd-live-link" href="/examples/live/ai-workbench">在全屏示例中心打开「AI 运营助手」</a>

## 在线预览

预览即 `examples/ebui-example-ai` 工程的真实页面：侧边菜单可切换，输入台可发消息（mock 流式回复），深度思考 / 联网检索会真实改变回复形态，生成中可点停止。

<DocExample :code="aiSource">
  <AiWorkbench />
</DocExample>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| AppLayout / Menu | 后台骨架与导航（演示聚焦智能助手，其余模块占位） |
| **AiConsole** | 工作台编排：欢迎标题（高亮渐变词）+ 示例问题 + 输入台 + 会话流 |
| AiPromptBox（内嵌） | 模型 pill / 场景 chips / 深度思考与联网检索开关 / 额度胶囊 / 停止钮 |
| ChatList / ChatMessage（内嵌） | 会话流：markdown 渲染、思考过程折叠、重新生成 |
| useChatEngine | 受控引擎：页面持有实例，transport 直接驱动流式回写 |

## 关键实现说明

**transport 注入（核心模式）**。页面创建受控引擎 `useChatEngine({ onSend: transport })` 并传给
AiConsole；transport 里拿 `context`（`{ scene, capabilities, model }`）路由行为：

- 按场景选回复模板（诊断 / 报告 / 文案 / 数据解读四套）；
- 「深度思考」开启时先 `appendThinkContent` 流思考段，再 `stopThinking` 转正文；
- 「联网检索」开启时正文前插入资料引用（引用块渲染）——先弹**审批面板**接管输入区（Enter 允许一次 /
  Esc 拒绝），批准后跑两只工具卡演示运行过程：一只用 `appendToolCallResult` 流式出结果（自动展开 +
  光标 + 贴底），一只直接完成，组标题从「正在执行 2 个步骤」结算到「执行了 2 个步骤（用时 X）」；
  拒绝则基于已有上下文作答并写明未授权；批准后再补一次**澄清提问**（对比口径，Enter 前进 / Esc 取消），
  选中的口径写进回答前缀——两次接管串在一条链上，演示「审批优先于提问」；
- 全程 `setInterval` 打字模拟流，**transport 返回 Promise 直到流结束**——提前 resolve 会让
  `loading` 立刻回落、停止钮不出现；真实接入换成 fetch/SSE 读取循环即可。

**停止生成**。组件侧 `stoppable` 让发送钮在 loading 中变停止钮；页面在 `@stop` 里清掉计时器，
再调 `cancelMessage` 把消息置为 `cancelled`：已流出的正文原地保留，底部补一行「已停止生成」灰标。
中断不是失败态——`setMessageError` 会把半截回答换成红色错误块，只留给真出错。真实接入把
「清计时器」换成 `controller.abort()` 即可。

**附件上下文**。transport 收到 attachments 后在正文前加一句「已读取 N 个附件」，真实场景
在此处把文件上传 / 解析为多模态输入。

## 本地运行

```bash
pnpm --filter @wil-works/ebui-example-ai dev   # http://localhost:8629
```

```text
examples/ebui-example-ai/
  src/
    App.vue
    main.js
    pages/
      AiWorkbench.vue   # 本页预览的源码（骨架 + 受控引擎 + transport + 停止处理）
    mock.js             # 场景回复模板 / 深度思考段 / 检索引用（纯字符串，无网络）
```

## 接入真实业务

- `transport` 换成真实调用：`fetch` 你的对话接口或直连 SSE，`context` 里的场景 / 能力 /
  模型拼进系统提示词或做请求路由；
- 停止生成改用 `AbortController`：`transport` 里创建并暴露给 `@stop` 中止；
- 额度胶囊接配额接口（`quota` prop 受控），点击 `quota-click` 跳转充值页；
- 场景与能力词汇表按业务自定义——组件不认识具体词汇，只负责形态与上下文交付。
