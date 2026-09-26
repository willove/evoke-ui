# EtThemeBridge · 主题 → 画布桥

把主题令牌解析成画布调色板的零 DOM 桥接件：不占布局、不吃事件、无色值。

```vue
<et-theme-bridge />
<et-theme-bridge :palette="palette" target="html" />
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `palette` | Object | `CANVAS_PALETTE` | 画布角色 → 主题侧令牌名登记表；产品可整体替换以追加角色 |
| `target` | String \| Object | `'html'` | 写入与订阅目标：`'html'` / CSS 选择器 / Element 实例 |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | —— | 无（render 返回 null） |

## 行为

- 按登记表把每个画布角色对到主题侧已有令牌名，运行期读实际值写成 `--ot-<role>`；本件与契约同源，一个颜色字面量都没有（G1 红线）。
- 联动：`observeThemeChanges` 盯 `:root` 的 `class` / `style` / `data-theme` / `data-density`，变化即重跑解析与落值；写值自身触发订阅，按签名去重，不会自激。
- `target` / `palette` 变更重建订阅（旧订阅先退，不叠观察器）；解析不到目标静默不桥接。
- 空值角色不写 `--ot-*`（不静默注入错色），由画布侧自己兜底。
- 画布侧消费方 = 产品层 CSS（网格线 / 选区 / 表头 / 活动格规则引用 `--ot-*`）。

## 令牌与门禁

- 登记表 `CANVAS_PALETTE` 与落值前缀 `--ot-` 见[主题与画布桥](/guide/theme#登记表)。
- G1：框架层不认识色值，只认识令牌名；换品牌色/暗色都不用改本件。
- 订阅必须可退订，禁观察器泄漏（卸载时 `unsubscribe`）。
