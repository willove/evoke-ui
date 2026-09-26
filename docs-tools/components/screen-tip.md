# EtScreenTip · 富提示

替代 `title` 的提示：名称 + 一行说明 + 快捷键后缀，hover/focus 双触发、同屏单例。

```vue
<et-screen-tip title="复制" desc="复制选区到剪贴板" combo="mod+c" placement="bottom">
  <et-tool-button size="small" icon="copy" label="复制" />
</et-screen-tip>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | String | 必填 | 提示名称，一行 |
| `desc` | String | `''` | 一行说明；空串不渲染该行 |
| `combo` | String | `''` | 规范组合键串；非空时标题行渲染 `EtKeyHint` |
| `placement` | String | `'bottom'` | 12 个 placement 值，与 `EbTooltip` 校验集一致 |
| `disabled` | Boolean | `false` | 关闭提示 |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | 默认 | 触发器（底座默认子内容即触发器） |
| Slots | `content` | 浮层内容；传了才替换默认正文 |

## 行为

- 延迟契约：首显 400ms / 热显 120ms / 自动隐藏 200ms；一次提示出现后 1 秒内再触发走热显档。
- 单例：模块级登记表，任一发起显示即收起其它实例。
- hover 走冒泡 `mouseover` / `mouseout` + `relatedTarget` 判进出；键盘走 `focusin` / `focusout`。
- Esc 与外部按下收起由底座全局监听负责。
- 暴露 `show()` / `hide()` / `update()`；`show()` 走单例 + 延迟契约，不是裸转发。
- `title` 缺失时 dev warn。

## 令牌与门禁

- `--et-screentip-delay-first` / `-hot` / `-hide` 三个令牌与 JS 侧常量同源（改令牌要同步常量）。
- G4：`title` 是必填 prop。
- 槽位语义：默认子内容是触发器，`content` 槽才是浮层内容；反了会把提示正文渲染进触发器。
