# 主题与暗色模式

组件库所有颜色、间距、字号均消费设计令牌，不写死样式值。改令牌即改主题。

> 隔离铁律：全库仅使用 `--ev-*` 单一令牌命名空间，不依赖、不引用任何第三方组件库命名（构建期由 `check-token-rule.mjs` 强制检查）。

## 主色

默认主色为天亮蓝 `#175DFF`，通过 `--ev-color-primary` 暴露，附带 5 档浅色与 1 档深色梯度：

```css
:root {
  --ev-color-primary:         #175DFF;
  --ev-color-primary-light-3: #5c89ff;
  --ev-color-primary-light-5: #8baeff;
  --ev-color-primary-light-7: #b9d2ff;
  --ev-color-primary-light-8: #d0e1ff;
  --ev-color-primary-light-9: #e8f0ff;
  --ev-color-primary-dark-2:  #124acc;
}
```

### 方式一：运行时换主色（推荐）

`setPrimaryColor` 一条语句注入全部 7 档梯度 + rgb 三元组，图表色板自动跟随重绘：

```js
import { setPrimaryColor } from '@wil-works/evoke-business-ui'

setPrimaryColor('#16a34a')   // 财务绿，其余梯度自动派生
```

也可通过 `EvConfigProvider` 声明式配置（卸载时自动恢复默认）：

```vue
<ev-config-provider theme-color="#16a34a">
  <router-view />
</ev-config-provider>
```

### 方式二：CSS 覆盖

在业务项目全局样式中覆盖梯度变量（hover / active / 浅底等状态色取自梯度档位，需要一并覆盖）：

```css
:root {
  --ev-color-primary: #16a34a;
  --ev-color-primary-light-3: #52ba78;
  /* ... 其余档位 */
}
```

梯度派生算法与默认主题一致（sRGB 线性插值：light-N = 向白混 N×10%，dark-2 = 向黑混 20%），需要自行生成时可用导出的 `generatePrimaryRamp(hex)`。

## 语义色与扩展分类色

四个功能色（success / warning / danger / info）各自带完整梯度与 `-rgb` 三元组；另有 8 个扩展分类色用于标签、徽标与图表多系列：

```css
--ev-color-ext-cyan / teal / violet / magenta / indigo / lime / amber / slate
/* 浅底档自动派生（color-mix）：--ev-color-ext-cyan-light 等 */
```

规范：`-light-3/5` 等浅档只作底色不作前景文字（对比度不足）。

## 设计令牌

`--ev-*` 设计层暴露动效、间距、字号、阴影、焦点环等基础令牌：

| 令牌 | 示例 | 用途 |
| --- | --- | --- |
| `--ev-ease-out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | 动效缓动 |
| `--ev-duration-base` | `0.2s` | 动效时长 |
| `--ev-space-1` ~ `--ev-space-12` | `4px` ~ `48px` | 间距梯度（4px 网格） |
| `--ev-font-size-xs` ~ `--ev-font-size-3xl` | `12px` ~ `40px` | 字号刻度 |
| `--ev-radius-xs` ~ `--ev-radius-full` | `2px` ~ `9999px` | 圆角刻度 |
| `--ev-shadow-1` ~ `--ev-shadow-5` | 分层阴影 | 浮层 / 卡片投影 |
| `--ev-focus-ring` | `0 0 0 2px ...` | 键盘焦点环 |

## 密度切换

数据应用密度三档，作用于控件高度与组件尺寸令牌：

```js
import { setDensity } from '@wil-works/evoke-business-ui'

setDensity('compact')   // compact | default | loose
```

或声明式：

```vue
<ev-config-provider density="compact">
  <router-view />
</ev-config-provider>
```

也可直接在 `html` 上设置 `data-ev-density="compact"`。

## 暗色模式

在 `<html>` 上切换 `dark` class 即可，全部令牌自动重映射，组件无需逐个处理：

```js
import { useDarkMode } from '@wil-works/evoke-business-ui'

const { isDark, toggleDark } = useDarkMode()
```

暗色下 `--ev-color-primary` 重映射为 `#4d8bff`，阴影与浅色梯度同步加深，保证对比度。图表监听暗色变更自动重绘。

## 图表跟随主题

图表分类色板在每次渲染时从 `--ev-color-*` / `--ev-color-ext-*` 令牌实时读取，因此换主色、切暗色、改扩展色后图表自动跟随，无需额外配置；`setPrimaryColor` / `useDarkMode` 触发的重绘由库内部完成。

## 样式覆盖

组件根节点均为 `ev-*` 双 class（语义化 class 与结构类共存），可按相同方式覆盖样式：

```css
.ev-button {
  border-radius: 999px;
}
```
