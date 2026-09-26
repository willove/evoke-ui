# EtDropdown · 工具界面下拉

底座 `EbDropdown` 的密度适配包装：props/events/slots 全透传，菜单走工具密度令牌。

```vue
<et-dropdown trigger="click" placement="bottom-end" @command="onCommand" @visible-change="onVisible">
  <template #trigger>
    <et-tool-button size="small" icon="more" label="更多" />
  </template>
  <template #dropdown>
    <eb-dropdown-menu>
      <eb-dropdown-item command="copy" icon="copy" label="复制" />
    </eb-dropdown-menu>
  </template>
</et-dropdown>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| 透传 | —— | —— | 本件不声明自己的 props，全部经 `v-bind="$attrs"` 下传 `EbDropdown` |

底座的 `trigger` / `placement` / `split-button` / `disabled` 等 prop 原样可用。

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `visible-change` | boolean | 浮层显隐 |
| `command` | any | 菜单项 `command` 值 |
| `click` | MouseEvent | 触发器点击 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 透传 | —— | `#trigger` = 触发内容，`#dropdown` = 浮层菜单（底座槽位语义：默认子内容会顶掉触发器，菜单必须放 `#dropdown`） |

## 行为

- 暴露 `open()` / `close()`（转发底座命令式方法）。
- 密度覆盖写在全局底座浮层类上：`EbDropdown` 的浮层经 `<Teleport to="body">` 渲染，popper 容器类固定、不接受外部注入，故 `--et-menu-*` 落在 `.eb-dropdown__popper`。加载了本库样式的工具界面即生效。

## 令牌与门禁

- `--et-menu-item-height` / `--et-menu-icon-gutter` 等菜单密度令牌。
- G1：只引用 `--et-*` / `--eb-*`，禁裸色值。
