# EtIcon · 图标机制

三层命名 + 解析兜底 + 领域别名注册 API：未命中不渲染空白。

## 三层命名

| 层 | 形态 | 谁能写 | 例子 |
| --- | --- | --- | --- |
| ① 形状层 | Remix 原生名 | 只有 business-ui 生成脚本 | `arrow-down-s-line` |
| ② 组件语义层 | kebab-case 语义名 | business-ui 的 `MAPPING` | `arrow-down`、`search`、`more` |
| ③ 领域语义层 | 形态自有的命令图标名 | 形态包（产品层） | `cell-bold`、`merge-cells` |

模板里禁止出现 ① 原生名（跨层引用 = 锚死在具体图标库上）；工具框架只认 ②，③ 由产品层声明成别名映射在装配时注册。领域别名表是单一来源，放形态包，禁止在模板里散落字符串。

运行期注册的自定义图标走 `custom:` 前缀（如 `custom:fluent-bold`），直通注册表，不做别名与兜底判定。

## 最小示例

```vue
<et-icon name="search" :size="16" />
<et-icon name="cell-bold" :size="20" />   <!-- ③ 层：已登记别名时合法 -->
<et-icon name="custom:fluent-bold" :size="24" />
```

```js
import { registerDomainIcons } from '@wil-works/evoke-tools-ui/icons'

// 装配时一次：领域名 → 组件语义名
registerDomainIcons({
  'cell-bold': 'bold',
  'merge-cells': 'table',
  'freeze-panes': 'stop',
})
```

## EtIcon props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | String \| Object | `undefined` | 第 ② 层语义名、第 ③ 层领域名，或 SFC 组件对象（直通） |
| `size` | String \| Number | `16` | 尺寸档（14 / 16 / 20 / 24 / 28） |
| `color` | String | `undefined` | 颜色；缺省继承 currentColor |

其余属性经 `v-bind="$attrs"` 下传底座 `EbIcon`。

## 解析顺序

```text
领域别名（③→②）→ builtin 同步命中 → builtin 未命中走注册表异步自愈（加载全量库再重试）
→ 仍未命中共性兜底（question-circle + dev warn）
```

顺序反了会把「只在全量库里的图标」误判为悬空名，所以异步自愈排在兜底之前。

## 纯函数 API

| 导出 | 签名 | 用途 |
| --- | --- | --- |
| `FALLBACK_ICON_NAME` | `'question-circle'` | 显式兜底名 |
| `registerDomainIcons` | `(map) => number` | 登记领域别名表，同名以最后一次为准 |
| `getDomainAlias` | `(name) => string \| null` | 查别名解析结果 |
| `hasDomainAlias` | `(name) => boolean` | 是否已登记 |
| `clearDomainIcons` | `() => void` | 清空别名（测试与形态包卸载） |
| `listDomainAliases` | `() => object` | 别名表快照 |
| `resolveIconName` | `(name) => string` | ③ → ② 折叠；`custom:` 原样返回 |
| `isCustomIconName` | `(name) => boolean` | 是否 `custom:` 前缀 |
| `isDanglingIconName` | `(name, registry) => boolean` | 悬空名判定（G2 门用） |
| `findDanglingIconNames` | `(names, registry) => string[]` | 全量校验入口，空数组 = 通过 |
| `pickFallbackIconName` | `(name) => string` | 运行期兜底选择 |

`registry` 是 `{ hasName(n) }` 形式的存在性判定器。

## 尺寸与用法

| 档 | 值 | 用途 |
| --- | --- | --- |
| `xs` | 14 | 状态栏、密集列表行内 |
| `sm` | 16 | 默认：菜单项、面板标题、小钮 |
| `md` | 20 | 次级工具区按钮、对话框标题 |
| `lg` | 24 | 工具区大钮的图标行 |
| `xl` | 28 | 特大（空态、backstage 入口） |

同一容器内尺寸档 ≤2；默认 line 风格，fill 仅用于激活/选中；图标与文字的间距用 `--et-icon-gap-*`，禁 emoji 与 SVG 混排。

## 令牌与门禁

- G2：所有出现在模板/命令表里的图标名必须在注册表存在，悬空名 = 构建失败。
- G4：图标按钮必须 `aria-label`（`title` 不算）。
- 图形资产（形状库 / 色板 / 品牌图标 / 空态插画）不进图标体系，但参与令牌门禁（禁裸色值）。
- 内置集规模与图标数量口径见 business-ui 图标文档；本页不重复其图标表。
