# EtScrollArea · 滚动内容区

面板 / 工具区里「内容比容器大」的位的统一滚动外壳：只做 overflow 容器。

```vue
<et-scroll-area direction="vertical">
  <ul>
    <li v-for="line in lines" :key="line">{{ line }}</li>
  </ul>
</et-scroll-area>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `direction` | String | `'auto'` | `auto` 双轴；`vertical` 只纵滚（横轴锁死）；`horizontal` 只横滚 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | —— | 滚动内容 |

## Emits

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |

## 行为

- 方向声明：内容轴与容器轴不符时才滚，另一轴锁死（侧栏里横滚的面板会把整个工作台带歪）。
- 嵌套滚动不链控（`overscroll-behavior: contain`）：面板内容滚到底不带动外壳继续滚。
- 空内容保一行：`min-height` 取 `--et-size-row`，滚动区是列表位，塌成 0 会让空态与加载态之间闪跳。
- 不引入第二套滚动条样式：需要 `EbScrollbar` / `EbVirtualList` 时由消费方显式使用，框架不替产品选滚动条皮肤。

## 令牌与门禁

- `--et-size-row`（空内容保底行高）。
- M2 验收点「面板内容滚动不影响外壳」由本件的 contain 行为满足。
