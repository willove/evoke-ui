# Icon 图标

<script setup>
import { h } from 'vue'
import { registerIcons } from '@wil-works/evoke-business-ui'

const LogoMark = () =>
  h('svg', { viewBox: '0 0 24 24', width: '1em', height: '1em' }, [
    h('path', { d: 'M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z', fill: 'currentColor' }),
  ])

registerIcons({ 'logo-mark': LogoMark })
</script>

语义图标组件。图标体系基于 [Remix Icon](https://remixicon.com/)（Remix Icon License v1.0，可免费商用）静态内置，共 **433 个单色图标**，键名为 kebab-case 语义命名，运行时零依赖。覆盖方向/状态/操作/数据展示、商务与财务（支付、购物、图表）、Logo 品牌（微信/支付宝/钉钉/GitHub 等）、开发、设备、媒体、地图出行等常用类目。

解析优先级：**custom（运行时注册）→ 内置 SVG（Remix 单色，含文件类型别名）→ 完整图标库**。SVG 填充使用 currentColor，颜色自动跟随上下文文字色，可用 `color` 覆盖；`size` 控制大小，渲染在行内 `i` 元素上。

## 基础用法

`size` 控制大小（数字按 px，也可传 '1em' 等字符串）。图标填充使用 `currentColor`：**不传 `color` 时自动继承父级文字颜色**——下面的铃铛放在主色文字里就呈现主色，「通知」是图标 + 文字同色的常见用法。

<DemoBlock>
  <eb-icon name="search" style="margin-right: 20px;" />
  <eb-icon name="plus" style="margin-right: 20px;" />
  <eb-icon name="edit" style="margin-right: 20px;" />
  <eb-icon name="delete" style="margin-right: 20px;" />
  <eb-icon name="bell" style="margin-right: 20px; color: var(--eb-color-primary);" />
  <span style="color: var(--eb-color-primary); display: inline-flex; align-items: center; gap: 4px;">
    <eb-icon name="bell" />通知
  </span>
</DemoBlock>

## 支付与品牌 Logo

内置常用支付渠道、社交平台与开发品牌 Logo（Logos 类目），适合收银台、渠道配置、OAuth 登录等场景：

<DemoBlock>
  <eb-space wrap :size="16">
    <eb-icon name="wechat" :size="22" />
    <eb-icon name="wechat-pay" :size="22" />
    <eb-icon name="wechat-pay-filled" :size="22" />
    <eb-icon name="alipay" :size="22" />
    <eb-icon name="mini-program" :size="22" />
    <eb-icon name="visa" :size="22" />
    <eb-icon name="mastercard" :size="22" />
    <eb-icon name="paypal" :size="22" />
    <eb-icon name="dingding" :size="22" />
    <eb-icon name="qq" :size="22" />
    <eb-icon name="weibo" :size="22" />
    <eb-icon name="bilibili" :size="22" />
    <eb-icon name="github" :size="22" />
    <eb-icon name="gitee" :size="22" />
  </eb-space>
</DemoBlock>

## 商务与财务

收银、账单、图表、组织人事等 B 端高频图标：

<DemoBlock>
  <eb-space wrap :size="16">
    <eb-icon name="shopping-cart" :size="20" />
    <eb-icon name="secure-payment" :size="20" />
    <eb-icon name="bank-card" :size="20" />
    <eb-icon name="money-cny" :size="20" />
    <eb-icon name="red-packet" :size="20" />
    <eb-icon name="coupon" :size="20" />
    <eb-icon name="refund" :size="20" />
    <eb-icon name="line-chart" :size="20" />
    <eb-icon name="briefcase" :size="20" />
    <eb-icon name="id-card" :size="20" />
    <eb-icon name="medal" :size="20" />
    <eb-icon name="customer-service" :size="20" />
    <eb-icon name="task" :size="20" />
    <eb-icon name="team" :size="20" />
    <eb-icon name="database" :size="20" />
    <eb-icon name="map-pin" :size="20" />
  </eb-space>
</DemoBlock>

## 完整图标库（加载全部 Remix 3229 个）

除核心内置图标外，Remix Icon 全量 3229 个图标（line/fill 全风格、原生命名，如 `checkbox-multiple-line`）以独立产物按需提供，**不占主包体积**：

```js
// 方式一：异步自愈 —— 什么都不用做
// eb-icon 同步未命中时自动按需加载完整库并补渲染（负缓存防重复加载）

// 方式二：显式预载（推荐在应用启动后台执行，或图标选择器打开时调用）
import { loadFullIcons } from '@wil-works/evoke-business-ui/full-icons'

loadFullIcons() // 幂等；完成后全部 Remix 原生名称可同步渲染
```

加载后即可枚举与检索：`getIconNames('full')` 返回全部原生命名；`getIconByNameAsync(name)` 异步安全获取。

<DemoBlock>
  <eb-space wrap>
    <eb-icon name="checkbox-multiple-line" :size="20" />
    <eb-icon name="checkbox-multiple-fill" :size="20" />
    <eb-icon name="stethoscope-line" :size="20" />
    <eb-icon name="rocket-2-fill" :size="20" />
    <span style="font-size: 12px; color: var(--eb-text-color-secondary);">全量库原生命名示例（未预载时会自动按需加载）</span>
  </eb-space>
</DemoBlock>

## 尺寸与颜色

`color` 接受任意 CSS 颜色值，优先级高于上下文 currentColor；`name` 也可直接传图标组件对象。

<DemoBlock>
  <eb-icon name="search" :size="14" style="margin-right: 20px;" />
  <eb-icon name="search" :size="20" style="margin-right: 20px;" />
  <eb-icon name="search" :size="28" style="margin-right: 20px;" />
  <eb-icon name="edit" :size="24" :color="'#e6a23c'" style="margin-right: 20px;" />
  <eb-icon name="delete" :size="24" :color="'#f56c6c'" style="margin-right: 20px;" />
  <eb-icon name="plus" :size="24" :color="'#67c23a'" />
</DemoBlock>

## 图标总览

全部内置图标（433 个）按类目分组展示的完整清单已独立成页：**[图标总览](/components/icon-gallery)**——支持按语义名 / Remix 原名搜索、点击复制名称、一键加载 Remix 全量 3229 个图标。

## 图标命名规范

- 键名为 **kebab-case 语义命名**，与组件其他 API 的命名风格一致
- 面性格图标直接以 `-filled` 后缀提供（如 `star-filled`、`circle-close-filled`），与线性格同名成对
- 方向语义统一为 chevron 折线形（`arrow-right` / `caret-right`），适合下拉展开、面包屑等 UI 语义
- 需要新增图标时，在组件库 `scripts/generate-remix-icons.mjs` 的 `MAPPING` 中登记 Remix 名称后执行 `pnpm gen:icons` 重新生成

## 文件类型图标

常用文件类型为单色 Remix 图标族，多个扩展名别名指向同一图标资源：

| 入口名 | 别名（均指向同一图标） |
| --- | --- |
| `file-excel` | `xlsx` / `xls` / `excel` / `type-xlsx` |
| `file-word` | `doc` / `docx` / `word` / `type-docx` |
| `file-ppt` | `ppt` / `pptx` / `type-pptx` |
| `file-pdf` | `pdf` |
| `file-zip` | `zip` / `rar` / `7z` |
| `file-music` | `mp3` / `audio` |
| `file-video` | `mp4` / `video` |
| `file-code` | `json` |
| `file-image` | `img` / `png` / `jpg` / `jpeg` / `gif` |
| `file-text` | `txt` / `md` / `type-md` |

<DemoBlock>
  <eb-space wrap>
    <eb-icon name="file-excel" :size="22" />
    <eb-icon name="xlsx" :size="22" />
    <eb-icon name="file-word" :size="22" />
    <eb-icon name="docx" :size="22" />
    <eb-icon name="file-ppt" :size="22" />
    <eb-icon name="pptx" :size="22" />
    <eb-icon name="file-pdf" :size="22" />
    <eb-icon name="file-zip" :size="22" />
    <eb-icon name="file-code" :size="22" />
    <eb-icon name="file-image" :size="22" />
  </eb-space>
</DemoBlock>

## 自定义图标注册

通过 `registerIcons({ name: Component })`（从组件库入口导出）注册自定义图标：无前缀使用时优先级最高，可覆盖内置 SVG 的同名图标；使用 `custom:xxx` 前缀可显式指定自定义图标，避免与内置图标名冲突。配套 `getIconNames('custom' | 'remix' | 'all')` 可查询已注册的图标名（`'remix'` 为内置 SVG 图标集）。

<DemoBlock>
  <eb-space size="large">
    <span style="display: inline-flex; align-items: center; gap: 6px; color: var(--eb-color-primary);"><eb-icon name="logo-mark" :size="18" /> 无前缀使用 logo-mark</span>
    <span style="display: inline-flex; align-items: center; gap: 6px;"><eb-icon name="custom:logo-mark" :size="18" /> custom:logo-mark</span>
  </eb-space>
</DemoBlock>

## API

<ApiTable title="Icon Props" :rows="[
  { name: 'name', desc: '图标名称（kebab-case）或图标组件；支持 custom: 前缀显式指定自定义图标', type: 'string | Component', default: '—' },
  { name: 'icon', desc: '同 name，兼容 icon=Plus 旧写法的回退来源，name 优先', type: 'string | Component', default: '—' },
  { name: 'size', desc: '图标大小，数字按 px', type: 'string | number', default: '16' },
  { name: 'color', desc: '图标颜色，默认继承上下文 currentColor', type: 'string', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: 'name 未解析到图标时的兜底内容', type: '—', default: '—' },
]" />

<ApiTable title="getIconNames(library)" :rows="[
  { name: 'custom', desc: '运行时注册的自定义图标名（带 custom: 前缀）', type: 'string[]', default: '—' },
  { name: 'remix', desc: '内置 SVG 图标名（Remix 形状，kebab-case 命名，含文件类型别名）', type: 'string[]', default: '—' },
  { name: 'all', desc: '以上全部（扁平去重）', type: 'string[]', default: '—' },
]" />

此外，组件库导出 `REMIX_ICON_META`（图标名 → `{ category, remix }` 分类元数据）与 `REMIX_ICON_VERSION`（Remix Icon 版本号），可用于构建图标选择器。
