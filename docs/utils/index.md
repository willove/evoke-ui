# 工具类总览

除组件外，`@wil-works/evoke-business-ui` 还导出一组与组件零耦合的工具函数与组合式函数（Composables），可在任何 B 端项目中独立使用：

```js
import { formatNumber, setPrimaryColor, useClipboard } from '@wil-works/evoke-business-ui'
```

## 格式化工具

| 函数 | 用途 |
| --- | --- |
| `formatNumber` | 千分位 + 精度 |
| `formatFileSize` | 字节数 → KB/MB/GB |
| `formatDate` | 日期模板格式化（YYYY-MM-DD HH:mm:ss） |
| `formatRelativeTime` | 相对时间（3 分钟前 / 昨天 14:30） |
| `formatDuration` | 秒数 → mm:ss / HH:mm:ss |
| `formatPercent` | 小数 → 百分数 |

详见 [格式化工具](/utils/format)。

## 主题与颜色

| 函数 | 用途 |
| --- | --- |
| `normalizeHex` / `hexToRgb` / `rgbToHex` / `mixHex` | 颜色解析与混合 |
| `generatePrimaryRamp` | 由主色生成 7 档色阶 |
| `setPrimaryColor` | 运行时切换全库主色（色阶 + 图表色板自动重算） |
| `setDensity` / `getDensity` | 全局密度切换与读取 |
| `avatarColor` | 由字符串稳定映射头像底色 |

详见 [主题与颜色](/utils/theme-color)。

## 组合式函数（Composables）

| 函数 | 用途 |
| --- | --- |
| `useDarkMode` | 暗色模式开关（`{ isDark, toggleDark, setDark }`） |
| `useClipboard` | 剪贴板复制（`{ copied, copy }`） |
| `useFullscreen` | 全屏控制（`{ isFullscreen, enter, exit, toggle }`） |
| `usePermission` | 权限判定（`{ permissions, has, hasAny, hasAll }`） |
| `useTable` | 表格状态管理（分页/排序/筛选/加载） |
| `useConfigProvider` / `useFormItem` | 全局配置与表单契约（组件内部使用） |
| `useFloating` / `useClickOutside` / `useFocusTrap` / `useLockScroll` / `useTeleport` | 浮层基元 |
| `useZIndex` | 弹层 z-index 递增管理 |
| `useLocale` / `usePlatform` | 语言包与平台形态 |

详见 [组合式函数](/utils/hooks)。

## 基础 DOM 与事件

| 函数 | 用途 |
| --- | --- |
| `on` | 事件绑定（自动清理友好） |
| `stopEvent` / `isEnter` / `isEsc` | 事件工具 |
| `inBrowser` / `resolveTarget` / `contains` / `getOffset` | DOM 工具 |
| `storageGet` / `storageSet` | localStorage 安全读写（SSR/隐私模式不抛错） |
