<script setup>
import KnowledgeConsole from '../../examples/ebui-example-knowledge/src/pages/KnowledgeConsole.vue'
import knowledgeSource from '../../examples/ebui-example-knowledge/src/pages/KnowledgeConsole.vue?raw'
</script>

# 知识库

面向「知识内容整理、知识图谱、问答库」的协作办公场景：AppLayout 骨架内三个模块 —— 知识文档（目录树导航 + 文章列表）、问答库（分类 + 关键词双维检索的展开式问答卡）、知识图谱（固定布局关系图 + 节点关联详情与文档联动）。

<a class="bd-live-link" href="/examples/live/knowledge">在全屏示例中心打开「知识库」</a>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| AppLayout / Menu | 后台骨架与三模块导航 |
| Tree | 知识目录树：`filter-node-method` + `filter()` 搜索、选中筛选文章（再点取消） |
| DataTable + CellStack + StatusTag | 文章列表（标题 + 标签双行单元格、浏览量右对齐、发布状态） |
| Segmented + Input | 问答分类切换与关键词检索的组合筛选 |
| DetailDescriptions | 图谱节点属性（节点类型 / 关联节点数 / 挂载文档数） |
| SVG 关系图 | 固定布局知识图谱（原生 SVG 连线 + 绝对定位节点按钮），点选联动邻居高亮 |

## 关键实现说明

**目录树与列表联动**。树节点选中时聚合该层级（含子级）下的全部文章；再点一次同一节点取消筛选回到全量——两级语义靠一个可空 `categoryId` 实现。

**问答卡的自管理展开**。问答展开状态用 reactive Set 维护（`toggle(id)` 增删），配合 `v-show` 做无动画瞬时展开；「有帮助 +1」直接变更 mock 计数，演示乐观更新。

**零依赖知识图谱**。节点坐标（百分比）与边关系均为静态数据，SVG `viewBox 0 0 100 100` + `preserveAspectRatio="none"` 平铺到容器；点选节点后邻居边与节点高亮、其余降透明度，右侧面板展示节点属性、关联知识（可跳转）与相关文档（标题 / 分类包含节点名即关联）。

## 本地运行

```bash
pnpm --filter @wil-works/ebui-example-knowledge dev   # http://localhost:8627
```

```text
examples/ebui-example-knowledge/
  src/
    App.vue
    pages/
      KnowledgeConsole.vue   # 本页预览的源码（骨架 + 三模块挂载）
      mock.js                # 目录树 / 文章 / 问答 / 图谱节点与边
      modules/
        DocsCenter.vue       # 知识文档（目录树 + 文章列表）
        FaqBank.vue          # 问答库（检索 + 展开式问答）
        KnowledgeGraph.vue   # 知识图谱（关系图 + 节点详情）
```

## 接入真实业务

- 目录树与文章列表分别对接「知识分类」与「知识条目」接口，树节点选中即带分类参数查询；
- 图谱数据换为图数据库（如 Neo4j）的关联查询结果；节点坐标可由力导向布局预计算后固化；
- 问答库接「问题 + 最佳答案」数据源，点赞 / 采纳走真实反馈接口。
