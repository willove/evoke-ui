# EtWorkbench · 工作台布局运行时

工作台骨架门面：区域槽 + 面板树 + 持久化 + 损坏降级，是布局树唯一的写树处。


<script setup>
import { ref } from 'vue'
const wb = ref({
  docks: [
    { id: 'left', side: 'left', panels: [{ id: 'files', title: '文件', size: 160 }] },
    { id: 'bottom', side: 'bottom', panels: [{ id: 'log', title: '日志', size: 120 }] },
  ],
  maximized: null,
})
</script>

<DemoBlock>
  <div style="height: 300px; border: 1px solid var(--eb-border-color-lighter); border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
    <et-title-bar title="工作台演示" doc-title="报表.xlsx" />
    <et-workbench v-model:layout="wb" :default-layout="wb" persist-key="docs-workbench-page">
      <template #panel="{ panel }">
        <ul style="margin: 0; padding: var(--et-space-inline) var(--et-space-band-inline); list-style: none; font-size: var(--et-density-base-font);">
          <li v-for="n in 2" :key="n">{{ panel.title }} {{ n }}</li>
        </ul>
      </template>
      <main style="height: 100%; display: flex; align-items: center; justify-content: center; color: var(--eb-text-color-secondary);">画布</main>
      <template #statusbar>
        <et-status-bar :items="[{ key: 'ready', label: '就绪' }]" zoom="100%" />
      </template>
    </et-workbench>
  </div>
</DemoBlock>

## API

<CompApi id="workbench" />

## 办公整页装配（v1.4）

五条带各就各位即可拼出办公整页，不需要额外写布局 CSS：

```vue
<et-workbench :layout="layout" :default-layout="DEFAULT" persist-key="app">
  <template #titlebar><et-title-bar title="季度报表" doc-title="报表.xlsx" /></template>
  <template #documents><et-document-tabs v-model="doc" :documents="docs" /></template>
  <template #toolbar>
    <et-ribbon-bar v-model="tab" :schema="schema" :registry="registry" />
    <et-formula-bar v-model="formula" :reference="reference" @submit="apply" />
  </template>

  <et-sheet-canvas-host label="工作表" @scroll="onScroll"><my-grid /></et-sheet-canvas-host>

  <template #tabbar><et-sheet-tabs v-model="sheet" :tabs="sheets" /></template>
  <template #statusbar><et-status-bar :items="items" zoom="100%" /></template>
</et-workbench>
```

带高全部走令牌：标题栏 32 / 工具区（tab 26 + 组行 72）/ 公式栏 26 / 页签 26 / 状态栏 24。

## 行为

- 持久化：挂载 `loadLayout` 读回；变更 `saveLayout`，写前 `layoutEquals` 比对，无变更不写，异常静默。
- 损坏降级：一律降级到 `defaultLayout` 渲染（不白屏）；修好的树覆写存储，损坏只提示一次。
- 空 `defaultLayout` 也合法：空树 = 只有画布的工作台（仍可交互、可重置）。
- **只有画布的初始布局**：传 `createLayoutTree({ docks: [] })`（显式空树，合法形态），之后可用
  `addDock` 运行时长出停靠——办公单画布页就这一档。
- **首次打开不被默认布局顶掉**：没有持久化档时不发生"恢复"，传入的 `layout` 原样生效；
  有档（含坏档降级）才走读回路径。
- 全屏：树里 `maximized` 非空 → 对应停靠整幅、其它区域让位（纯 CSS grid 重排）。
- 关闭 = 隐藏（`hidden` 是显式状态：重置布局 / 显示面板都找得回来）。
- 暴露 `resetLayout()` / `saveNow()` / `getLayout()`。

## 令牌与门禁

- chrome 各带高度走 `--et-chrome-*`，区域用 grid 轨道，`rail` 列 auto = 停靠声明宽。
- 布局树契约（dock/panel/序列化/损坏降级）是 `runtime/layout` 纯函数面，详见[工作台布局](workbench.md)。
- M2 出口：1280×800 与 1920×1080 下无页面级横向溢出。
