# 主题定制器

运行时动态定制 business-ui 的主题色与样式：主色、语义色、密度、磨砂全部实时生效，
无需刷新页面。下面的 Playground 即改即见，底部同步生成等效的声明式配置代码。

<ThemeCustomizer />

## 命令式 API

运行中动态换色（不经过 ConfigProvider）直接调用工具函数，同样全库生效、图表自动重绘：

```js
import {
  setPrimaryColor,      // 换主色（7 档梯度 + rgb，暗色自适应）
  setSemanticColors,    // 语义色部分更新
  resetTheme,           // 移除注入令牌，回到样式表默认
  getPrimaryColor,      // 当前运行时主色
  saveThemeConfig,      // 持久化 { primary, semantic }
  loadThemeConfig,
  clearThemeConfig,
  EV_THEME_PRESETS,     // 预设色板
} from '@wil-works/evoke-business-ui'

setPrimaryColor('#0fa968')
setSemanticColors({ danger: '#e64980' })
```

暗色模式下梯度自动反向派生（light 档向深底混合），且 `html.dark` 切换时已注入的
主题会跟随重注入——详见[主题与暗色模式](/guide/theming)。
