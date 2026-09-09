# 知识库示例

面向「知识内容整理、知识图谱、问答库」的场景基础 case：AppLayout 骨架内三个模块 —— 知识文档（目录树 + 文章列表）、问答库（检索 + 展开式问答卡）、知识图谱（固定布局关系图 + 节点关联详情）。

## 运行

```bash
# 在 monorepo 根目录
pnpm --filter @wil-works/ebui-example-knowledge dev
# http://localhost:8627
```

## 覆盖组件

| 组件 | 用途 |
| --- | --- |
| AppLayout / Menu | 后台骨架与三模块导航 |
| Tree | 知识目录树（搜索过滤、选中筛选、默认展开） |
| DataTable + CellStack + StatusTag | 文章列表（标签双行标识、浏览量、发布状态） |
| Segmented + Input | 问答分类切换与关键词检索 |
| DetailDescriptions | 图谱节点属性回显 |
| SVG 关系图 | 固定布局知识图谱（原生 SVG + 绝对定位节点，节点可点选联动） |

## 业务模块

| 菜单 | 模块 | 交互 |
| --- | --- | --- |
| 知识文档 | `modules/DocsCenter.vue` | 目录树筛选（选中/再选取消）、关键词搜索、浏览量排行 |
| 问答库 | `modules/FaqBank.vue` | 分类 + 关键词双维检索、问答展开/收起、有帮助 +1 |
| 知识图谱 | `modules/KnowledgeGraph.vue` | 节点点选联动邻居高亮、仅一级切换、关联跳转、相关文档 |

## 结构

```
src/
  App.vue            # 独立运行外壳（标题栏 + 暗色切换）
  pages/
    KnowledgeConsole.vue # 控制台（自包含，可被文档站源码级引入预览）
    mock.js              # 目录树 / 文章 / 问答 / 图谱节点与边
    modules/
      DocsCenter.vue     # 知识文档（目录树 + 文章列表）
      FaqBank.vue        # 问答库（检索 + 展开式问答）
      KnowledgeGraph.vue # 知识图谱（关系图 + 节点详情）
```

## 与文档站的关系

`pages/KnowledgeConsole.vue` 被 `evoke-business-ui-docs/examples/knowledge.md` 与全屏子站点 `/examples/live/knowledge` 直接 import 作为在线预览。
