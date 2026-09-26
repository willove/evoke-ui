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

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `layout` | Object | `null` | 布局树（v-model：本组件是唯一的写树处） |
| `defaultLayout` | Object | `null` | 默认布局（重置用；挂载读盘失败时的降级目标） |
| `persistKey` | String | `''` | 非空即 localStorage 读写在挂载/变更时发生 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:layout` | tree | 树变更（含损坏自愈后的清理树） |
| `reset` | —— | `resetLayout()` 被调用 |
| `layout-corrupted` | string[] | 坏 prop / 坏 JSON / 半坏树，已降级到默认布局 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| `titlebar` | —— | 顶带（chrome：产品名/文档名/窗口控制位） |
| `documents` | —— | 文档标签位 |
| `toolbar` | —— | 工具区（放 EtRibbonBar） |
| `panel` | `{ panel, dock }` | 停靠面板内容，按 panel.id 映射 |
| 默认 | —— | 中列画布 |
| `left` / `right` / `bottom` | —— | dock 之外的面板级 UI（一般留空） |
| `statusbar` | —— | 底带 |

## 行为

- 持久化：挂载 `loadLayout` 读回；变更 `saveLayout`，写前 `layoutEquals` 比对，无变更不写，异常静默。
- 损坏降级：一律降级到 `defaultLayout` 渲染（不白屏）；修好的树覆写存储，损坏只提示一次。
- 空 `defaultLayout` 也合法：空树 = 只有画布的工作台（仍可交互、可重置）。
- 全屏：树里 `maximized` 非空 → 对应停靠整幅、其它区域让位（纯 CSS grid 重排）。
- 关闭 = 隐藏（`hidden` 是显式状态：重置布局 / 显示面板都找得回来）。
- 暴露 `resetLayout()` / `saveNow()` / `getLayout()`。

## 令牌与门禁

- chrome 各带高度走 `--et-chrome-*`，区域用 grid 轨道，`rail` 列 auto = 停靠声明宽。
- 布局树契约（dock/panel/序列化/损坏降级）是 `runtime/layout` 纯函数面，详见[工作台布局](workbench.md)。
- M2 出口：1280×800 与 1920×1080 下无页面级横向溢出。
