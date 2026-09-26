# EtProvider · 全局提供者

工具框架的全局提供者：注入密度档位，并把密度写成根级属性。

```vue
<template>
  <et-provider :density="density">
    <app />
  </et-provider>
</template>

<script setup>
import { ref } from 'vue'
const density = ref('default')
</script>
```

写在应用根上：chrome 与画布是整页布局，只包一层 div 的话画布侧令牌拿不到档位。其余属性（locale / 主题 / zIndex 管理）透传到底座 `EbConfigProvider`。

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `density` | String | `'default'` | `compact` / `default` / `relaxed`，校验集外给出 dev 告警 |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | 默认 | 应用根内容 |

## 行为

- 挂载写 `<html data-density>`，卸载还原挂载前的外部值（外部已设置的不动）。
- 运行时切档 prop 即时跟随，不需要刷新页面。
- 嵌套 EtProvider 以最后挂载者为准（一个产品一个密度）。
- 同时 `provide(ET_DENSITY_KEY, ...)`；`useDensity()` 读档，未挂时回落 `'default'`。

## 令牌与门禁

- 密度度量全部走令牌，三档对照表见[设计规范](/guide/design#三档密度)。
- G7：布局属性禁字面量 px。
