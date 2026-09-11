# 主题与暗色模式

组件库所有颜色、间距、字号均消费设计令牌，不写死样式值。改令牌即改主题。

> 隔离铁律：全库仅使用 `--eb-*` 单一令牌命名空间，不依赖、不引用任何第三方组件库命名（构建期由 `check-token-rule.mjs` 强制检查）。

## 主色

默认主色为天亮蓝 `#175DFF`，通过 `--eb-color-primary` 暴露，附带 5 档浅色与 1 档深色梯度：

```css
:root {
  --eb-color-primary:         #175DFF;
  --eb-color-primary-light-3: #5c89ff;
  --eb-color-primary-light-5: #8baeff;
  --eb-color-primary-light-7: #b9d2ff;
  --eb-color-primary-light-8: #d0e1ff;
  --eb-color-primary-light-9: #e8f0ff;
  --eb-color-primary-dark-2:  #124acc;
}
```

### 方式一：运行时换主色（推荐）

> 交互式预览见[主题定制器](/guide/customizer)：主色 / 语义色 / 密度 / 磨砂即改即见，并生成等效配置代码。

`setPrimaryColor` 一条语句注入全部 7 档梯度 + rgb 三元组，图表色板自动跟随重绘：

```js
import { setPrimaryColor } from '@wil-works/evoke-business-ui'

setPrimaryColor('#16a34a')   // 财务绿，其余梯度自动派生
```

**语义色同样可动态配置**——只更新传入的键，其余保持不变：

```js
import { setSemanticColors, EB_THEME_PRESETS } from '@wil-works/evoke-business-ui'

setSemanticColors({ success: '#16a34a', danger: '#dc2626' })
EB_THEME_PRESETS             // 常用预设色板 [{ name, value }]，可直接生成换色选项
```

**暗色自适应**：暗色模式下梯度自动反向派生（light 档向深底混合，与暗色手调梯度同向），
且运行时注入过主题后，`html.dark` 切换会跟随重注入，明暗来回切换不发灰。相关 API：

```js
import {
  resetTheme,        // 移除全部注入的内联令牌，回到样式表默认
  getPrimaryColor,   // 当前运行时主色（未注入返回 null）
  saveThemeConfig,   // 持久化：localStorage 存取 { primary, semantic }
  loadThemeConfig,
  clearThemeConfig,
} from '@wil-works/evoke-business-ui'
```

也可通过 `EbConfigProvider` 声明式配置（卸载时自动恢复默认）；`persist-theme` 开启后
主题跨刷新生效，存档优先于声明式 prop：

```vue
<eb-config-provider theme-color="#16a34a" :semantic="semantic" persist-theme>
  <router-view />
</eb-config-provider>
```

### 方式二：CSS 覆盖

在业务项目全局样式中覆盖梯度变量（hover / active / 浅底等状态色取自梯度档位，需要一并覆盖）：

```css
:root {
  --eb-color-primary: #16a34a;
  --eb-color-primary-light-3: #52ba78;
  /* ... 其余档位 */
}
```

梯度派生算法与默认主题一致（sRGB 线性插值：light-N = 向白混 N×10%，dark-2 = 向黑混 20%），需要自行生成时可用导出的 `generatePrimaryRamp(hex)`。

## 语义色与扩展分类色

四个功能色（success / warning / danger / info）各自带完整梯度与 `-rgb` 三元组；另有 8 个扩展分类色用于标签、徽标与图表多系列：

```css
--eb-color-ext-cyan / teal / violet / magenta / indigo / lime / amber / slate
/* 浅底档自动派生（color-mix）：--eb-color-ext-cyan-light 等 */
```

规范：`-light-3/5` 等浅档只作底色不作前景文字（对比度不足）。

## 设计令牌

`--eb-*` 设计层暴露动效、间距、字号、阴影、焦点环等基础令牌：

| 令牌 | 示例 | 用途 |
| --- | --- | --- |
| `--eb-ease-out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | 动效缓动 |
| `--eb-duration-base` | `0.2s` | 动效时长 |
| `--eb-space-1` ~ `--eb-space-12` | `4px` ~ `48px` | 间距梯度（4px 网格） |
| `--eb-font-size-xs` ~ `--eb-font-size-3xl` | `12px` ~ `40px` | 字号刻度 |
| `--eb-radius-xs` ~ `--eb-radius-full` | `2px` ~ `9999px` | 圆角刻度 |
| `--eb-shadow-1` ~ `--eb-shadow-5` | 分层阴影 | 浮层 / 卡片投影 |
| `--eb-focus-ring` | `0 0 0 2px ...` | 键盘焦点环 |

## 密度切换

数据应用密度三档，作用于控件高度与组件尺寸令牌：

```js
import { setDensity } from '@wil-works/evoke-business-ui'

setDensity('compact')   // compact | default | loose
```

或声明式：

```vue
<eb-config-provider density="compact">
  <router-view />
</eb-config-provider>
```

也可直接在 `html` 上设置 `data-eb-density="compact"`。

## 暗色模式

在 `<html>` 上切换 `dark` class 即可，全部令牌自动重映射，组件无需逐个处理：

```js
import { useDarkMode } from '@wil-works/evoke-business-ui'

const { isDark, toggleDark } = useDarkMode()
```

暗色下 `--eb-color-primary` 重映射为 `#4d8bff`，阴影与浅色梯度同步加深，保证对比度。图表监听暗色变更自动重绘。

## 图表跟随主题

图表分类色板在每次渲染时从 `--eb-color-*` / `--eb-color-ext-*` 令牌实时读取，因此换主色、切暗色、改扩展色后图表自动跟随，无需额外配置；`setPrimaryColor` / `useDarkMode` 触发的重绘由库内部完成。

## 样式覆盖

组件根节点均为 `eb-*` 双 class（语义化 class 与结构类共存），可按相同方式覆盖样式：

```css
.eb-button {
  border-radius: 999px;
}
```
