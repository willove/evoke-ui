# 键盘优先

键位解析、roving tabindex、组字守卫与浮层焦点契约，全部走 L0 纯函数。

## 键位表

规范串形如 `mod+b`：`mod` 在 macOS 是 ⌘，在 Windows/Linux 是 Ctrl。

```js
import {
  normalizeCombo,
  formatCombo,
  comboFromEvent,
  comboMatchesEvent,
} from '@wil-works/evoke-tools-ui/runtime'

normalizeCombo('Cmd+Shift+Z') // 'mod+shift+z'，键名或主键数量错即抛
formatCombo('mod+shift+z', 'mac') // '⌘⇧Z'
formatCombo('mod+shift+z', 'win') // 'Ctrl+Shift+Z'
comboFromEvent(event) // KeyboardEvent → 规范串
comboMatchesEvent('mod+k', event, platform) // 物理修饰键集合完全相等才命中
```

多按一个修饰键不算命中。合法单键是 a-z / 0-9 / f1-f12，命名键与同义词表在 `runtime/keys`（`cmd` / `meta` / `super` 等都归并到 `mod`）。

## roving tabindex

整组只占一个 Tab 位，方向键在组内移动激活项，焦点跟随激活项：

```js
import { rovingTabindex, nextRovingIndex } from '@wil-works/evoke-tools-ui/runtime'

rovingTabindex(index, activeIndex) // 激活项取 0，其余取 -1
nextRovingIndex(current, count, 'ArrowRight', 'horizontal') // 'both' 支持两向漫游
```

`EtTabStrip`、`EtDocumentTabs`、`EtPanelGroup` 的 tab 条都走这条路径；Home / End 落首尾，禁用条目的跳过由调用方在 `onMove` 里做（参见 [EtTabStrip](/components/tab-strip)）。

## 组字守卫

所有 window / document 级 keydown 先过 `isImeComposing(e)`：候选词上屏不是应用命令。roving 漫游、Enter/Esc 提交路径同样先判。这条纪律的出处是上一代 28 处缺陷，G5 门禁把它做成构建期硬检查。

## 浮层焦点三处一致

EtDialog / EtBackstage / EtCommandPalette 共用 `runtime/focus/trap`，同一个 Tab 在三处行为相同：

| 函数 | 职责 |
| --- | --- |
| `getFocusableElements(root)` | 按 tab 序取可聚焦元素，滤掉 disabled / hidden / tabindex=-1 |
| `nextFocusableInTrap(els, current, dir)` | Tab 循环：末位继续回首位，Shift+Tab 反向 |
| `resolveFocusReturnTarget(container, trigger)` | 关闭后归还触发器；触发器已卸载则落容器内第一个 |

Esc 收敛三处一致；打开后焦点落面板内第一个可聚焦元素。第四处是轻量形态 EtScreenTip：hover + focus 双触发、同屏单例，不抢焦点。

## 键位表展示

```vue
<et-shortcut-panel :registry="registry" />
<et-shortcut-hint keys="mod+s" label="保存" />
```

`EtShortcutPanel` 从命令表生成，不手写列表，冲突直接展示在面板里；`EtShortcutHint` 是内联单键位，`keys` 与 `label` 都为空时整体不渲染。

## 相关页

- [命令驱动](commands.md)：`keys` 字段与登记期冲突检测。
- [EtShortcutPanel](/components/shortcut-panel) / [EtKeyHint](/components/key-hint) / [EtDialog](/components/dialog) / [EtBackstage](/components/backstage) / [EtScreenTip](/components/screen-tip)
