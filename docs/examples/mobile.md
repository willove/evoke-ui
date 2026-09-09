<script setup>
import MobileHome from '../../examples/ebui-example-mobile/src/pages/MobileHome.vue'
import mobileSource from '../../examples/ebui-example-mobile/src/pages/MobileHome.vue?raw'
</script>

# 移动端 H5 工作台

用 ebui 组件搭建移动端页面的**简单模式样板**：与桌面示例共用同一个包和构建链（单包兼容打包，无独立移动端构建分支、零额外运行时依赖），移动适配完全由页面级响应式样式完成。组件选型上只使用天然自适应宽度的组件（额度墙、进度、状态标签、分段器、步骤条），规避宽表格。常见组件的移动表达与演示壳规范见 [移动端适配](/mobile/) 板块。

<a class="bd-live-link" href="/examples/live/mobile">在全屏示例中心打开「移动端 H5」</a>

## 页面结构

| 区块 | 实现 |
| --- | --- |
| 首页 | 快捷数据 2×2、简单模式开关、本月用量（CreditsProgress）、报销审批进度（Steps）、快速登记自适应表单、待办/订单列表 |
| 订单 | 关键词搜索 + 状态筛选（Segmented）+ 订单卡片（金额 / 状态 / 物流进度 / 查看详情） |
| 消息 | 类型筛选（全部/审批/系统）、未读红点、点按已读、一键全部已读 |
| 我的 | 个人资料卡、本月概要（Progress）、功能菜单（我的报销单/消息设置/账号安全）、退出登录 |
| 底部标签栏 | 四页签均为真实页面，sticky 置底 + 安全区适配，「消息」带未读数角标 |

## 关键实现说明

**移动布局壳**。页面根容器 `max-width: 420px` 居中 + `min-height: 100dvh` 弹性列布局：真机 375px 全宽显示，桌面浏览器与文档站预览则呈现为居中手机列。底部标签栏用 `position: sticky; bottom: 0` 置底，并通过 `env(safe-area-inset-bottom)` 适配全面屏安全区。

**简单模式**。开关切换 `simpleMode`，用 `v-if` 隐藏用量与审批进度卡片——移动端「信息降噪」的常见做法，核心数据与待办始终保留。

**组件选型原则**。只选天然自适应宽度的组件：CreditsProgress（栅格根数按容器宽度自适应）、Progress、Steps（align-center）、Segmented（block）、StatusTag；DataTable 等宽表格组件在移动场景改用「卡片列表」表达。

## 本地运行

```bash
pnpm --filter @wil-works/ebui-example-mobile dev   # http://localhost:8628（已开 --host，手机可局域网访问）
```

## 接入真实业务

- 页面即「简单模式」：核心数据 + 待办处理；完整后台仍由桌面端承担，两端共用同一套接口与组件库；
- 需要原生壳时，本页面可直接嵌入 WebView（无路由依赖、离线字体已内置）；
- 移动端专属组件已提供：PullRefresh（下拉刷新）/ LoadMore（上拉加载）/ ActionSheet（动作面板）/ Tabbar（底部标签栏），见 [移动端适配](/mobile/) 各页与组件文档。

## 弹层与底部标签栏的层级规则

移动端弹层分两类，处理方式不同：

- **模态底部面板**（如 Select / DatePicker 的底部弹出选择）：**完整覆盖**底部标签栏——遮罩将标签栏一并屏蔽，避免面板打开时标签栏仍可点击造成状态混乱；面板自身通过 `env(safe-area-inset-bottom)` 适配全面屏安全区；
- **非模态浮层**（如 Toast 轻提示）：不遮挡标签栏，但应**自行避让**——出现位置需在标签栏之上预留空间，避免被遮挡或视觉重叠。
