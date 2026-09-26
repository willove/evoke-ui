# EtBackstage · 全屏页骨架

全屏页（文件菜单那种）：左导航 + 内容区 + 返回/Esc，开关不引发画布尺寸跳动。

```vue
<et-backstage v-model="open" title="文件" :nav-width="220">
  <template #nav>
    <button type="button" @click="open = false">最近</button>
    <button type="button" @click="open = false">打开</button>
  </template>
  <p>最近文档（产品内容）</p>
</et-backstage>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | Boolean | `false` | 开关 |
| `title` | String | `''` | 标题（`aria-label` 取它，缺省「全屏页」） |
| `navWidth` | Number | `null` | 左导航宽（px）；null 走 CSS 令牌默认档 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | boolean | 开关回写（Esc 与返回钮都只发这个） |
| `opened` / `closed` | —— | 过渡结束（after-enter / after-leave） |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| `nav` | —— | 左导航内容 |
| 默认 | —— | 内容区（具体页由产品填） |

## 行为

- 不引发画布尺寸跳动的三条结构保证：Teleport 到 body 不参与文档流、挂载点只留零尺寸锚点、打开期间 `documentElement` 挂计数式锁滚动 class（`overflow: hidden` + 实测滚动条缺口补 `padding-right`——有滚动条才补、没有就是 0；不用 `scrollbar-gutter: stable`，它在无滚动条页面会凭空造槽位，实测抓过 5px 横跳）。
- 焦点陷阱 / Esc 收敛 / 焦点归还与 EtDialog、EtCommandPalette 共用 `useModalFocus`（同一套契约）。
- `role="dialog"` + `aria-modal="true"`，`tabindex="-1"`。
- 锁滚动计数在模块作用域：多实例叠加时只有最后一个个例摘 class。

## 令牌与门禁

- 左导航宽缺省走 `--eb-sidebar-width`。
- M3 验收：backstage 开关不引发画布尺寸跳动；焦点三处一致。
- 过渡名走常量绑定（G2 图标名提取器会把过渡名的字面属性当图标名）。
