# ThemeToggle 主题切换

`EwThemeToggle` 是明暗主题切换按钮，内部基于 `useTheme`：点击切换 `html.dark` 类驱动全库令牌重映射，
日/月图标随状态变化。主题偏好写入 localStorage（key `ew-theme`），首次访问跟随系统。

## 基础用法

<DemoBlock title="在导航栏中使用" description="点击切换本站主题，注意页面所有组件与文档界面同步换肤。">

<div style="display:flex; align-items:center; gap:16px;">
  <EwThemeToggle />
  <EwThemeToggle variant="soft" />
  <EwThemeToggle round />
</div>

```vue
<EwNavbar logo-text="Nimbus" :items="navItems">
  <template #actions>
    <EwThemeToggle />
  </template>
</EwNavbar>
```

</DemoBlock>

::: info 底层 API
需要自定义切换逻辑时直接使用组合式 API：

```js
import { useTheme } from '@wil-works/evoke-ui'
const { isDark, toggleTheme, setTheme } = useTheme()
setTheme(true)  // 显式切暗色
```
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| variant | 按钮变体（同 EwIconButton） | `'ghost' \| 'soft' \| 'outline' \| 'primary' \| 'dark'` | `'ghost'` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |
| round | 正圆形态 | boolean | `false` |
