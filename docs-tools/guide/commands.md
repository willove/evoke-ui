# 命令驱动

命令是工具界面的单一事实源：一个 id 一行数据，三个渲染面共用一份状态。

## 命令表

```js
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const registry = createCommandRegistry()
registry.registerAll([
  {
    id: 'copy',
    title: '复制',
    desc: '复制选区到剪贴板',
    icon: 'copy',
    keys: 'mod+c',
    group: '剪贴板',
    surfaces: ['toolbar', 'menu', 'context', 'palette'],
    enabled: (ctx) => !!ctx.hasSelection,
    active: (ctx) => !!ctx.format?.bold,
    run: (ctx) => {},
  },
])
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | kebab-case 或点号式（`<形态>.<域>.<动作>`，对齐消费方 04 §3 / Univer：`office.command.undo`、`sheets.view.zoom-in`，两式可混排）；重复注册即抛 |
| `title` | 否 | 可读名，进按钮 caption 与命令面板 |
| `desc` | 否 | 一行说明，进命令面板与 ScreenTip |
| `icon` | 否 | 第 ② 层语义名，交 EtIcon 解析与兜底 |
| `keys` | 否 | 规范组合键串，登记期校验拼写 |
| `enabled` | 否 | `(ctx) => boolean`，缺省 true |
| `active` | 否 | `(ctx) => boolean`，缺省 false |
| `surfaces` | 否 | 可达面声明，值见 `COMMAND_SURFACES` |
| `run` | 是 | 执行体，缺省登记即抛 |
| `group` | 否 | 命令面板与键位表的分组依据 |

`ctx` 是选区/焦点上下文（产品自定义形状），`enabled` / `active` 只从这里推演。

## 状态唯一来源

`registry.state(id, ctx)` 是唯一的推演出口，四个可达面都读它：

```js
const { known, enabled, active } = registry.state('copy', { hasSelection: true })
registry.run('copy', ctx) // 未注册或被禁用返回 false，不执行
```

未注册的 id 一律返回 `{ known: false, enabled: false, active: false }`，组件据此兜底渲染。G3 门禁组件本地推演 `enabled` / `active`。

## 四处可达

| 面 | 载体 | schema 形态 |
| --- | --- | --- |
| 工具区 | `EtRibbonBar` | tab → 组 → 条目 |
| 菜单 | 产品菜单 | 同一棵节点树 |
| 右键 | `EtContextMenu` | item / separator / submenu |
| 命令面板 | `EtCommandPalette` | 从命令表全量生成 |

可达性自动核对，每条命令至少落在一个面：

```js
import { buildReachabilityReport } from '@wil-works/evoke-tools-ui/runtime'

const report = buildReachabilityReport({
  registry,
  schemas: { toolbar: ribbonSchema, context: contextSchema },
})
report.unreachable // 空数组 = 每条命令可达
```

## 打补丁与剪枝

产品层在默认 schema 上按 key 路径合并，返回新树，输入不被修改：

```js
import { mergeSchema, pruneSchema } from '@wil-works/evoke-tools-ui/runtime'

const patched = mergeSchema(defaultSchema, [
  {
    key: 'home',
    type: 'tab',
    children: [{ key: 'i-copy', type: 'item', command: 'copy', remove: true }],
  },
])
const { schema, removed, dangling } = pruneSchema(patched, { registry })
```

同 key 递归合并、新 key 追加到层尾、`remove: true` 删子树。`pruneSchema` 剪掉空 tab/组，`dangling` 列出未注册的命令引用；`dropUnregistered: true` 时悬空条目一并剪掉。

## 键位冲突登记期检测

```js
import { detectKeyConflicts, buildShortcutTable } from '@wil-works/evoke-tools-ui/runtime'

detectKeyConflicts(registry) // [{ combo, ids }]，空数组 = 无冲突
buildShortcutTable(registry, 'mac') // 键位表，按 group 分组
```

同一个组合键绑两条命令是必现 bug，登记后就该红，不等用户按出来。拼写错误同理：`normalizeCombo` 对未知键名与主键数量直接抛。

## 相关页

- 消费方：[EtRibbonBar](/components/ribbon-bar) / [EtCommandPalette](/components/command-palette) / [EtContextMenu](/components/context-menu) / [EtShortcutPanel](/components/shortcut-panel)
- [键盘优先](keyboard.md)：键位解析与冲突的展示面。
- [工作台布局](workbench.md)：工具区槽位与布局树。
