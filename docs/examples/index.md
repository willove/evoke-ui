# 应用示例

组件文档讲的是「单个组件怎么用」，本分区讲的是「企业中后台里一组组件如何拼成完整业务场景」。每个示例都是 `examples/` 下的**独立可运行工程**，同时以两种方式集成在本站点内：**全屏示例中心**（子站点形态，微型顶栏切换，无需本地启动任何工程）与文档页内的**嵌入式实时预览**——两者渲染的都是示例工程里那份真实源码。

## 在全屏示例中心体验

子站点内页面顶端有一条微型导航：随时**返回文档站**、在四个示例间**互相切换**、切换暗色模式。点击任意入口即可进入：

- [工作台 Dashboard —— 后台骨架 + KPI + 图表](/examples/live/dashboard)
- [标准 CRUD 列表 —— 筛选 / 表格 / 导入导出 / 弹窗表单](/examples/live/crud-list)
- [分步表单 —— 三步向导 + 逐步校验 + 结果凭证](/examples/live/step-form)
- [详情页 —— 状态流转 + 详情描述 + 审计日志](/examples/live/detail)
- [项目协作 —— 进度计划 / 里程碑 / 团队用量](/examples/live/project)
- [报销审批 —— 双视角审批流 / 留痕追溯](/examples/live/approval)
- [知识库 —— 知识文档 / 问答库 / 知识图谱](/examples/live/knowledge)
- [AI 运营助手 —— 场景路由 / 深度思考 / 停止生成](/examples/live/ai-workbench)
- [移动端 H5 —— 手机工作台 / 简单模式](/examples/live/mobile)

## 场景路线图

企业级场景按「**案例参考 + 组件化**」双轨推进：案例沉淀场景布局与交互范式，通用能力反哺为专项组件。已覆盖与规划中的方向如下——有优先级诉求欢迎在仓库提出。

| 场景域 | 案例规划 | 组件化机会 | 状态 |
| --- | --- | --- | --- |
| 数据看板 | [工作台 Dashboard](/examples/dashboard) | StatCard、Chart（Canvas 自绘） | 已上线 |
| 项目管理 / 进度计划 | [项目协作控制台](/examples/project) | GanttProgress、CreditsProgress | 已上线 |
| 报销审批 / 资源申请 | [报销与审批中心](/examples/approval) | Steps 审批流 + AuditTimeline 留痕（现有组件组合） | 已上线 |
| 销售统计 / 客户管理 | 销售分析看板 + 客户 360 详情 | 雷达 / 漏斗联动、客户层级树 | 规划中 |
| 排班考勤 / 人员管理 | 排班表 + 考勤统计 | 日历排班组件、考勤周期选择器 | 规划中 |
| 知识整理 / 知识图谱 / 问答库 | [知识库（文档 / 问答 / 图谱）](/examples/knowledge) | 目录树联动、问答卡片、SVG 关系图 | 已上线 |
| AI 助手 / 对话工作台 | [AI 运营助手](/examples/ai-workbench) | AiConsole + AiPromptBox + useChatEngine（transport 注入） | 已上线 |

## 示例总览

| 示例 | 场景 | 核心组件 | 在线体验 |
| --- | --- | --- | --- |
| [工作台 Dashboard](/examples/dashboard) | 后台骨架、KPI 指标、趋势/占比图表、待办与公告 | AppLayout、Menu、PageHeader、StatCard、Chart、DataTable | [全屏打开](/examples/live/dashboard) |
| [标准 CRUD 列表](/examples/crud-list) | 筛选 + 表格 + 列设置 + 导入导出 + 弹窗表单全流程 | SearchFilter、DataTable、ColumnSettings、ImportExportPanel、Dialog、Form | [全屏打开](/examples/live/crud-list) |
| [分步表单](/examples/step-form) | 三步向导收集信息、逐步校验、确认复核、结果凭证页 | Steps、Form、FormItem、DetailDescriptions、Result、Alert | [全屏打开](/examples/live/step-form) |
| [详情页](/examples/detail) | 页头状态流转、配置式详情描述、多页签明细与审计日志 | PageHeader、DetailDescriptions、Tabs、DataTable、AuditTimeline、StatusTag | [全屏打开](/examples/live/detail) |
| [项目协作](/examples/project) | 进度计划管理、里程碑推进、资源用量统计 | GanttProgress、CreditsProgress、StatCard、Segmented、Progress | [全屏打开](/examples/live/project) |
| [报销审批](/examples/approval) | 双视角审批流：发起、跟踪、撤回、同意/驳回、留痕 | Steps、AuditTimeline、StatCard、Dialog、Form、Segmented | [全屏打开](/examples/live/approval) |
| [知识库](/examples/knowledge) | 知识文档、问答库、知识图谱 | Tree、DataTable、DetailDescriptions、SVG 关系图 | [全屏打开](/examples/live/knowledge) |
| [AI 运营助手](/examples/ai-workbench) | AI 工作台：场景路由、深度思考流、检索引用、模型切换、停止生成 | AiConsole、AiPromptBox、useChatEngine、AppLayout | [全屏打开](/examples/live/ai-workbench) |
| [移动端 H5](/examples/mobile) | 移动工作台：简单模式开关、待办处理、用量与审批进度 | CreditsProgress、Steps、Segmented、Progress、Switch | [全屏打开](/examples/live/mobile) |

## 三种使用方式

### 1. 全屏示例中心（推荐，零启动）

进入 [示例中心](/examples/live/dashboard) 后即是真实运行的企业页面：可点击、可筛选、可提交表单，顶栏可切换示例与暗色。适合快速评估组件库在完整业务场景中的表现。

### 2. 文档页内嵌预览

各示例文档页（左侧目录）在讲解场景要点的同时内嵌了可交互预览，「查看源码」展示的就是示例工程中页面组件的完整源码。

### 3. 本地运行工程（开发示例本身时用）

```bash
# 在 monorepo 根目录（任选一个示例）
pnpm example:ebui-dashboard   # http://localhost:8621
pnpm example:ebui-crud-list   # http://localhost:8622
pnpm example:ebui-step-form   # http://localhost:8623
pnpm example:ebui-detail      # http://localhost:8624
pnpm example:ebui-project     # http://localhost:8625
pnpm example:ebui-approval    # http://localhost:8626
pnpm example:ebui-knowledge   # http://localhost:8627
pnpm example:ebui-mobile      # http://localhost:8628
pnpm example:ebui-ai          # http://localhost:8629
```

示例工程通过 workspace 依赖 + vite alias **直接消费 `packages/evoke-business-ui` 源码**：改组件库源码，示例、全屏中心与文档站同时热更新，无需构建发包。日常体验无需运行它们，仅开发调试示例页面时使用。

## 工程结构约定

```text
examples/
  ebui-example-dashboard/     # 运营工作台
  ebui-example-crud-list/     # 标准 CRUD 列表
  ebui-example-step-form/     # 分步表单
  ebui-example-detail/        # 订单详情
    package.json              # workspace:* 依赖组件库
    vite.config.js            # 源码级 alias + 独立端口（开发示例时用）
    src/
      main.js                 # app.use(EvokeBusinessUI) 全局注册
      App.vue                 # 独立运行外壳（标题栏 + 暗色切换）
      pages/
        XxxPage.vue           # 场景页面（自包含，被文档站引入预览与全屏中心）
        mock.js               # 模拟数据（换成真实接口即可投产）
```

## 新增示例

1. 复制任一示例目录，改 `package.json` 的 `name` 与 `vite.config.js` 的端口；
2. 在 `evoke-business-ui-docs/.vitepress/theme/meta.js` 的 `EXAMPLES_NAV`（文档页导航）与 `LIVE_EXAMPLES`（子站点切换器）中登记；
3. 在 `evoke-business-ui-docs/examples/` 新建场景说明 md 页，并在 `examples/live/` 新建全屏页（一行 import + 组件标签），用 `<DocExample>` / 微型顶栏分别承载两种形态。
