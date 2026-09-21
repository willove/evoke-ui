# ChatWidget 浮动挂件

网页右下角常驻的助手入口：收起时只有一颗悬浮球，点开是面板。**窄屏自动换成底部抽屉**（`EbDrawer direction="btt"`），桌面端是自持的浮层（自带焦点圈闭与滚动锁）。

窗体形态的另外四种不需要新组件——全屏页、侧边抽屉、对话框内嵌、移动端抽屉，用 `EbAiConsole` 配 `EbDrawer` / `EbDialog` 组合即可，见下方「组合配方」。

<DemoBlock>
  <div style="height: 420px; position: relative; border: 1px dashed var(--eb-border-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--eb-text-color-placeholder); font-size: 13px;">
    右下角的悬浮球是真实挂件（演示区内；用 mobile-mode=panel 让窄视口下也保持浮层形态）
    <eb-chat-widget
      v-model="widgetOpen"
      title="智能助手"
      :append-to-body="false"
      mobile-mode="panel"
      placement="bottom-right"
      :width="340"
      :height="380"
      disclaimer="本助手输出由模型生成，仅供参考，请勿作为唯一决策依据。"
      style="position: absolute; right: 16px; bottom: 16px;"
    >
      <div style="display: flex; flex-direction: column; height: 100%; min-height: 0;">
        <eb-chatbot
          :model-value="widgetMsgs"
          :show-tip="false"
          height="100%"
          assistant-name="小 Ev"
          user-name="我"
          @send="onWidgetSend"
        />
      </div>
    </eb-chat-widget>
  </div>
</DemoBlock>

## 用法

`v-model` 管开合；内容完全由你放——常见就是一颗 `EbChatbot` 或 `EbAiConsole`：

```vue
<eb-chat-widget v-model="open" title="智能助手" :badge="unread" disclaimer="…">
  <eb-chatbot v-model="messages" height="100%" @send="onSend" />
</eb-chat-widget>
```

## 合规声明门

给了 `disclaimer` 就先显示同意页，同意后才渲染内容，并抛 `consent`（让你持久化）。`default-consented` 可直接跳过（比如已存过同意记录）。同意按钮可用 `#disclaimer-actions` 替换——**动作要自己接**，组件把 `accept` 作为 slot prop 交出：

```vue
<eb-chat-widget :disclaimer="text">
  <template #disclaimer-actions="{ accept }">
    <a href="/terms" target="_blank">查看条款</a>
    <eb-button type="primary" @click="accept">同意并开始</eb-button>
  </template>
</eb-chat-widget>
```

## 组合配方（其余窗体形态）

| 形态 | 怎么拼 |
|---|---|
| 全屏页 | 路由页直接放 `EbAiConsole` |
| 侧边抽屉 | `EbDrawer` + `EbAiConsole`（`direction="rtl"`） |
| 移动端抽屉 | `EbDrawer direction="btt"` + `EbAiConsole` |
| 对话框内嵌 | `EbDialog`（`fullscreen` 可全屏） + `EbAiConsole` |
| 右下角挂件 | 本组件 |

## API

<ApiTable title="ChatWidget Props" :rows="[
  { name: 'modelValue', desc: '展开态，配合 v-model', type: 'boolean', default: 'false' },
  { name: 'title', desc: '面板标题（可用 #title 插槽替换）', type: 'string', default: '—' },
  { name: 'icon', desc: 'launcher 图标名', type: 'string', default: 'customer-service' },
  { name: 'launcherTooltip', desc: 'launcher 悬浮提示；展开时自动换成「收起」', type: 'string', default: '—' },
  { name: 'badge', desc: 'launcher 角标，null 不显示', type: 'number', default: 'null' },
  { name: 'placement', desc: '贴边位置', type: 'bottom-right | bottom-left', default: 'bottom-right' },
  { name: 'width / height', desc: '桌面浮层尺寸', type: 'string | number', default: '380 / 560' },
  { name: 'mobileMode', desc: '窄屏形态：drawer 底部抽屉 / panel 仍用浮层', type: 'drawer | panel', default: 'drawer' },
  { name: 'drawerSize', desc: '移动端抽屉高度', type: 'string | number', default: '80%' },
  { name: 'disclaimer', desc: '合规声明文本；给了就先显示同意门', type: 'string', default: '—' },
  { name: 'defaultConsented', desc: '初始即视为已同意（例如已存过记录）', type: 'boolean', default: 'false' },
  { name: 'appendToBody', desc: '挂到 body 以脱离宿主 overflow / z-index 上下文；关掉则内联渲染，两个形态都跟随', type: 'boolean', default: 'true' },
]" />

<ApiTable title="ChatWidget Events" :rows="[
  { name: 'update:modelValue', desc: '开合意图（launcher 点击、关闭钮）', type: '(open: boolean) => void', default: '—' },
  { name: 'open / close', desc: '受控值真的翻转时触发（状态迁移，不是意图）', type: '() => void', default: '—' },
  { name: 'consent', desc: '同意声明门', type: '() => void', default: '—' },
]" />

<ApiTable title="ChatWidget Slots" :rows="[
  { name: 'default', desc: '面板内容（未同意声明时不渲染）', type: '—', default: '—' },
  { name: 'title', desc: '面板标题区', type: '—', default: 'title 文本' },
  { name: 'launcher', desc: '整块替换悬浮球；作用域 { open, toggle }', type: '—', default: 'EbFloatButton' },
  { name: 'disclaimer-actions', desc: '同意门按钮；作用域 { accept }，动作需自行接', type: '—', default: '同意并开始' },
]" />

## 两处刻意的取舍

- **点击面板外部不关闭**。聊天面板里常有需要选中复制的内容，误触关闭的代价比多按一次 Esc 大；Esc 与关闭钮都能关。
- **`open` / `close` 表示状态迁移而非意图**。受控方不接 `update:modelValue` 时面板不会展开——要「点了就开」就接 v-model。

<script setup>
import { ref } from 'vue'

// 开合必须由受控方接住：组件抛 update:modelValue，自己不持有展开态
const widgetOpen = ref(false)
const widgetMsgs = ref([
  { id: 'w-1', role: 'assistant', content: '你好，点右下角那颗球随时找我。', status: 'done' },
])

function onWidgetSend(text) {
  widgetMsgs.value = [
    ...widgetMsgs.value,
    { id: `w-u-${Date.now()}`, role: 'user', content: text, status: 'done' },
    { id: `w-a-${Date.now()}`, role: 'assistant', content: `已收到「${text}」。挂件里的内容完全由你决定。`, status: 'done' },
  ]
}
</script>
