# 甘特图 gantt

项目规划的**时间语言**：每行一个任务，条形横跨起止日期，进度实心、剩余淡显。项目排期、交付里程碑、团队排班这类「谁在什么时候做什么」的一图定调。

## 何时使用

- 任务有明确的起止时间，且需要对照看**先后与并行**；
- 关心每个任务的完成进度（`progress`），或关键节点（里程碑）；
- 任务间有依赖关系（A 完成后 B 才能开始）需要显式表达。

## 示例

专属数据字段 `ganttData`（`{ name, start, end, progress?, milestone?, dependsOn?, color? }`）。日期接受 `YYYY-MM-DD` 等可解析格式；`ganttToday` 画今日线（不传不画）。

### 产品发布排期

规划场景的完整形态：四个阶段任务 + 完成进度 + 阶段依赖 + 今日线。悬浮任务行高亮整行，tooltip 给出起止与进度。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'gantt',
      title: '官网 2.0 发布排期',
      ganttToday: '2026-02-10',
      ganttData: [
        { name: '需求冻结', start: '2026-01-06', end: '2026-01-10', progress: 1, color: '#5D7092' },
        { name: '视觉设计', start: '2026-01-08', end: '2026-01-24', progress: 1 },
        { name: '前端开发', start: '2026-01-16', end: '2026-02-14', progress: 0.55, dependsOn: ['视觉设计'] },
        { name: '内容填充', start: '2026-02-02', end: '2026-02-18', progress: 0.2 },
        { name: '验收发布', start: '2026-02-24', end: '2026-02-28', dependsOn: ['前端开发', '内容填充'] },
        { name: '发布会', start: '2026-03-02', end: '2026-03-02', milestone: true, color: '#E8684A' },
      ],
    }"
    :height="320"
  />
</DemoBlock>

### 进度与叙事：季度交付回顾

甘特图也能讲故事：把回顾期切成几个阶段，完成段用进度说话，里程碑做章节停顿——一场季度汇报的时间轴主线就有了。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'gantt',
      title: 'Q3 交付回顾 · 三次迭代全部按期',
      ganttData: [
        { name: '迭代一 · 监控带', start: '2026-07-01', end: '2026-07-18', progress: 1 },
        { name: '迭代二 · 报表中心', start: '2026-07-21', end: '2026-08-15', progress: 1, dependsOn: ['迭代一 · 监控带'] },
        { name: '中期评审', start: '2026-08-15', end: '2026-08-15', milestone: true, color: '#F6BD16' },
        { name: '迭代三 · 移动适配', start: '2026-08-18', end: '2026-09-12', progress: 0.9, dependsOn: ['迭代二 · 报表中心'] },
        { name: '季度发布', start: '2026-09-15', end: '2026-09-15', milestone: true, color: '#E8684A' },
      ],
    }"
    :height="280"
  />
</DemoBlock>

## 配置要点

- `progress`（0–1）缺省按无进度渲染；条内左段实心为已完成，右段淡显为剩余；
- `milestone: true` 渲染菱形节点，起止相同时只取该日期点；
- `dependsOn: [任务名]` 画正交依赖箭头（前任务完成缘 → 后任务左缘）；
- 进度标签宽条内嵌右缘（按条底色取对比色）、窄条外挂底色胶囊，不与依赖线 /
  今日线打架；
- 左侧任务名列宽自适应最宽任务名（80–180px 夹取），超长自动省略。

## 相关

- [条形图](/chart/horizontal-bar) · [子弹图](/chart/bullet)
- [API 参考](/chart/api)
