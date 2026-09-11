# 组合式函数

与组件配套的组合式函数（Composables），均从包根导出。通用逻辑不再需要复制粘贴：

```js
import { useClipboard, useDarkMode, usePermission } from '@wil-works/evoke-business-ui'
```

## useClipboard — 剪贴板

`copy(text)` 返回 Promise，`copied` 为 300ms 复位成功标记，可直接驱动按钮反馈：

<DemoBlock>
  <div style="display: flex; gap: 12px; align-items: center;">
    <eb-input v-model="text" style="width: 280px;"></eb-input>
    <eb-button type="primary" :icon="copied ? 'check-line' : undefined" @click="copy(text)">{{ copied ? '已复制' : '复制' }}</eb-button>
  </div>
</DemoBlock>

## useDarkMode — 暗色模式

读写 `html.dark`，全库令牌即时切换；配合 [主题定制](/guide/theming) 使用：

<DemoBlock>
  <eb-button :icon="isDark ? 'sun-line' : 'moon-line'" @click="toggleDark()">{{ isDark ? '切换亮色' : '切换暗色' }}</eb-button>
</DemoBlock>

## useFullscreen — 全屏

控制整个页面或指定元素进入全屏。注意：进入全屏的元素**必须自带背景色**，否则会透出浏览器全屏态的黑底：

<DemoBlock>
  <eb-border-beam style="display: inline-block;" :active="isFullscreen">
    <div ref="panelRef" class="eb-fs-demo-panel">
      看板面板（点击按钮进入全屏演示）
    </div>
  </eb-border-beam>
  <div style="margin-top: 12px;">
    <eb-button @click="toggle()">{{ isFullscreen ? '退出全屏' : '面板全屏' }}</eb-button>
  </div>
</DemoBlock>

<style>
.eb-fs-demo-panel {
  padding: 16px 24px;
  font-size: 13px;
  background: var(--eb-bg-color);
  color: var(--eb-text-color-primary);
}
/* 全屏态铺满居中，避免内容缩在左上角 */
.eb-fs-demo-panel:fullscreen {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
</style>

## usePermission — 权限判定

`has('user:delete')` / `hasAny([...])` / `hasAll([...])`；权限来源为 ConfigProvider 的 `permissions` 或 `setPermissions()` 全局码表：

<DemoBlock>
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <eb-button @click="setPermissions(['order:view', 'order:export'])">切到只读角色</eb-button>
    <eb-button @click="setPermissions(['order:view', 'order:export', 'order:delete'])">切到管理员</eb-button>
    <eb-tag :type="has('order:delete') ? 'success' : 'info'">order:delete：{{ has('order:delete') ? '有权限' : '无权限' }}</eb-tag>
    <eb-tag :type="hasAll(['order:view', 'order:export']) ? 'success' : 'info'">view+export：{{ hasAll(['order:view', 'order:export']) ? '满足' : '不满足' }}</eb-tag>
  </div>
</DemoBlock>

## 全部清单

| 函数 | 返回 | 说明 |
| --- | --- | --- |
| useClipboard | `{ copied, copy }` | 剪贴板复制 |
| useDarkMode | `{ isDark, toggleDark, setDark }` | 暗色模式 |
| useFullscreen | `{ isFullscreen, enter, exit, toggle }` | 全屏控制 |
| usePermission | `{ permissions, has, hasAny, hasAll }` | 权限判定 |
| useTable | 表格状态与动作 | 分页/排序/筛选/加载，见 [企业级实践](/guide/enterprise) |
| useZIndex | `{ zIndex, next, current }` | 弹层层级递增 |
| useClickOutside | `(el, handler)` | 点击外部检测 |
| useFocusTrap | 焦点圈定 | Dialog/Drawer 内部使用 |
| useLockScroll | 锁定滚动 | 弹层打开时防滚动穿透 |
| useFloating | 定位引擎 | floating-ui 封装，Popper 家族基座 |
| useTeleport | 挂载点解析 | `to` 属性容错 |
| useSafeArea | `{ top, bottom, left, right }` | 全面屏安全区 insets（响应式），见 [移动端适配](/mobile/layout) |
| ensureViewportFit | 补写 meta | 页面 viewport 缺 `viewport-fit=cover` 时自动补上（缺失时 env() 恒为 0） |
| useFormItem | `{ form, formItem, size, disabled }` | 表单契约（输入类组件内部） |
| useConfigProvider | `{ size, locale, namespace, platform }` | 全局配置消费 |
| useLocale / usePlatform | 语言包 / 平台形态 | 国际化与移动端适配 |

<script setup>
import { ref } from 'vue'
import { useClipboard, useDarkMode, useFullscreen, usePermission, setPermissions } from '@wil-works/evoke-business-ui'

const text = ref('https://evoke-ui.example.com/help/12345')
const { copied, copy } = useClipboard()
const { isDark, toggleDark } = useDarkMode()
const panelRef = ref(null)
const { isFullscreen, toggle } = useFullscreen(panelRef)
const { has, hasAll } = usePermission()
</script>
