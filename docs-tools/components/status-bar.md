# EtStatusBar · 状态栏

chrome 底带：可配置项 + 内置缩放工具位，高度钉死不换行。

```vue
<et-status-bar
  :items="[
    { key: 'ready', label: '就绪' },
    { key: 'selection', label: '选区', value: 'A1:B14', visible: true },
    { key: 'coedit', label: '协同', value: '3 人', onClick: (item) => openCoedit(item) },
  ]"
  zoom="100%"
  @item-click="onItemClick"
>
  <template #left>自定义左区</template>
  <template #right><span>100%</span></template>
</et-status-bar>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | Array | `[]` | 可配置项 `{ key, label, value?, visible?, onClick? }`；`visible === false` 不渲染 |
| `zoom` | Number \| String | `''` | 内置工具位缩放显示；`''` = 不渲染 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `item-click` | key | 条目点击 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| `left` | —— | 左区产品内容（在 items 之前） |
| `center` | —— | 中区 |
| `right` | —— | 右区；给了就不渲染内置缩放工具位 |

## 行为

- 条目是原生 `button` 包壳 + `aria-label` 组合可访问名（`label` + `value`），可键盘聚焦。
- 点击同时走 `item-click` 事件与数据里的 `onClick`；两种接法等价，别同时用（会调两次）。
- 坏条目（非对象）直接跳过不渲染；`visible` 缺省 true。
- 高度钉死 `--et-chrome-statusbar-height`，overflow 隐藏兜底，禁换行禁撑高：左区弹性压缩 + 条目省略号，放不下先切左区条目。
- `zoom` 数字原样显示，带 `%` 等形态由产品传字符串自决。

## 令牌与门禁

- `--et-chrome-statusbar-height`（24px）、`--et-statusbar-item-gap`（12px）。
- G7：chrome 预算不变量，装配出口「无页面级横向溢出」同源。
