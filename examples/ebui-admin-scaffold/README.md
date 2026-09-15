# Evoke Admin Scaffold — 中后台脚手架母版

基于 `@wil-works/evoke-business-ui` 的中后台管理系统母版：复制本目录、替换 `src/pages` 与业务字典，即可获得一个框架能力完整的管理系统，避免从空白页面起步。

## 内置能力

- **5 种布局模式，实时切换**：`sidebar` 经典侧边栏 / `double-sidebar` 双栏侧边栏 / `top-nav` 顶部导航 / `mixed` 混合布局（顶栏一级 + 侧栏二级）/ `mixed-double` 混合双栏（顶栏一级 + 图标栏 + 二级面板）
- **明暗主题**：View Transitions 整页渐变，跟随系统记忆
- **中英双语**：界面文案实时切换（含组件库内文案，经 ConfigProvider 注入）
- **多标签页**：路由自动登记、可关闭、关闭激活页自动跳邻居
- **全局搜索**：`Ctrl / ⌘ + K` 命令面板，检索全部页面与快捷操作
- **主题定制**：预设主色 + 自定义色，整条色阶运行时生成、明暗自适应、图表跟随重绘
- **Toast 消息通知**：统一 `notify()` 出口（基于 EbNotify），顶栏铃铛含历史记录中心
- **Monorepo 工程**：pnpm workspace，组件库源码级联调（改动即时 HMR）

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:8630
```

## 复制为你的项目（母版用法）

1. 复制本目录，重命名 `package.json` 的 `name`；
2. 替换 `src/pages/*.vue` 为你的业务页面，在 `src/routes.js` 登记；
3. 菜单/面包屑/标签页文案改 `src/locales/zh-CN.js` 与 `en-US.js`（同名键）；
4. mock 请求在 `src/pages/*.vue` 的 `request` 函数，替换为真实接口即可；
5. 品牌：`src/settings.js` 的主色预设经 `EB_THEME_PRESETS` 全局生效。

页面骨架优先使用 `EbTablePage`（查询区 + 工具栏 + 表格 + 分页 + 数据代理一体）与
`useTable`，配合组件库 150+ 组件可覆盖 80% 的中后台重复开发。

## 结构

```
src/
  main.js            # 入口：router + provide('router') + 组件库安装
  routes.js          # 菜单树与路由同源（单一事实源）
  settings.js        # 全局设置（布局/主题/语言/通知，持久化 + provide/inject）
  locales/           # 中英字典（键名两份同名）
  layouts/
    AdminLayout.vue  # 五模式应用壳 + 多标签页 + 命令面板
    TopActions.vue   # 顶栏动作区（搜索/通知/语言/明暗/主题）
    SettingsDrawer.vue # 偏好设置抽屉
  pages/             # 业务页面（复制后替换的对象）
```
