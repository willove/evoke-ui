# 项目协作控制台示例

面向「项目规划 / 进度计划管理 / 资源用量统计」的企业协作场景基础 case：完整后台骨架内三个真实模块 —— 项目总览（组合进度统计）、进度计划（甘特式里程碑 + 任务分解）、团队用量（配额额度墙 + 成员消耗明细）。

## 运行

```bash
# 在 monorepo 根目录
pnpm --filter @wil-works/ebui-example-project dev
# http://localhost:8625
```

## 覆盖组件

| 组件 | 用途 |
| --- | --- |
| AppLayout / Menu | 后台骨架与三模块导航 |
| StatCard / Row / Col | 项目组合 KPI（进行中 / 到期里程碑 / 成员 / 平均进度） |
| DataTable + Progress + StatusTag + CellStack | 项目列表、任务分解、成员用量 |
| **GanttProgress** | 里程碑阶段柱（completed / active / pending 三态 + 连接线 + 脉冲） |
| **CreditsProgress** | 席位 / 存储 / API / 构建时长四类配额额度墙（刷新周期 + 超额转红） |
| Segmented | 进度计划模块内的项目切换器 |
| Popconfirm / Message | 席位释放确认与操作反馈 |

## 业务模块

| 菜单 | 模块 | 交互 |
| --- | --- | --- |
| 项目总览 | `modules/ProjectsOverview.vue` | KPI 统计、项目进度条、临近交付预警、跳转进度计划 |
| 进度计划 | `modules/SprintPlan.vue` | 项目切换（Segmented）、里程碑阶段柱、任务标记完成 |
| 团队用量 | `modules/TeamUsage.vue` | 四类资源额度墙、成员 Credits 消耗、席位激活/释放 |

## 结构

```
src/
  App.vue            # 独立运行外壳（标题栏 + 暗色切换）
  pages/
    ProjectConsole.vue   # 控制台（自包含，可被文档站源码级引入预览）
    mock.js              # 项目 / 阶段 / 任务 / 配额 / 成员模拟数据
    modules/             # 三个业务模块页
```

## 与文档站的关系

`pages/ProjectConsole.vue` 被 `evoke-business-ui-docs/examples/project.md` 与全屏子站点 `/examples/live/project` 直接 import 作为在线预览，文档页同时展示完整源码。
