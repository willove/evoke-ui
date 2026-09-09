# ConfigProvider 全局配置

为组件树提供全局默认配置：**尺寸（size）**、**运行时主题色（themeColor）**、**密度（density）**、**语言包（locale）**、**平台形态（platform）**、**权限码表（permissions）**。放在应用根组件外层，一次配置全局生效。

## 全局尺寸

`size` 作为所有组件的兜底尺寸：组件自身的 `size` 属性 > Form/FormItem 继承 > ConfigProvider 的 `size` > 默认值。输入类组件经 `useFormItem` 自动接入，Button 亦已接入：

<DemoBlock>
  <ev-config-provider :size="globalSize">
    <div style="display: flex; flex-direction: column; gap: 12px; width: 360px;">
      <div style="display: flex; gap: 8px;">
        <ev-button v-for="s in ['small', 'default', 'large']" :key="s" :type="globalSize === s ? 'primary' : 'default'" @click="globalSize = s">{{ s }}</ev-button>
      </div>
      <ev-input placeholder="继承全局 size 的输入框"></ev-input>
      <div style="display: flex; gap: 12px;">
        <ev-select placeholder="选择器"></ev-select>
        <ev-input-number :min="0" :max="100"></ev-input-number>
      </div>
      <div style="display: flex; gap: 12px;">
        <ev-button type="primary">主操作</ev-button>
        <ev-button>次操作</ev-button>
        <ev-button size="small" text>小字号按钮（显式 size 优先）</ev-button>
      </div>
    </div>
  </ev-config-provider>
</DemoBlock>

## 运行时主题色

`themeColor` 传入任意十六进制色，全库 7 档色阶与图表色板**自动重算**（sRGB 混合生成），无需刷新页面：

<DemoBlock>
  <ev-config-provider :theme-color="themeColor">
    <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
      <div style="display: flex; gap: 8px;">
        <button
          v-for="c in colors"
          :key="c"
          type="button"
          :style="{ width: '32px', height: '32px', borderRadius: '8px', background: c, border: themeColor === c ? '2px solid var(--ev-text-color-primary)' : '2px solid transparent', cursor: 'pointer' }"
          @click="themeColor = c"
        ></button>
      </div>
      <div style="display: flex; gap: 12px;">
        <ev-button type="primary">主色按钮</ev-button>
        <ev-input placeholder="聚焦看主色"></ev-input>
        <ev-switch v-model="on"></ev-switch>
      </div>
    </div>
  </ev-config-provider>
</DemoBlock>

## 全局密度

`density` 作用于 `html[data-ev-density]`，compact / loose 两档调整所有控件的默认高度与间距，适合信息密度差异明显的场景（监控大屏 vs 移动端）：

<DemoBlock>
  <ev-config-provider :density="density">
    <div style="display: flex; flex-direction: column; gap: 12px; width: 360px;">
      <div style="display: flex; gap: 8px;">
        <ev-button v-for="d in ['compact', 'default', 'loose']" :key="d" :type="density === d ? 'primary' : 'default'" @click="density = d">{{ d }}</ev-button>
      </div>
      <ev-input placeholder="密度切换看控件高度"></ev-input>
      <ev-button type="primary">提交</ev-button>
    </div>
  </ev-config-provider>
</DemoBlock>

## 权限码表下发

`permissions` 是 `v-permission` 指令 / `EvAuth` 组件 / `usePermission` 的判定来源。权限在登录后一次性传入，组件树内全部自动响应（切换按钮模拟不同角色的码表）：

<DemoBlock>
  <ev-config-provider :permissions="role === 'admin' ? ['order:view', 'order:delete', 'order:export'] : ['order:view']">
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; gap: 8px;">
        <ev-button :type="role === 'admin' ? 'primary' : 'default'" @click="role = 'admin'">管理员</ev-button>
        <ev-button :type="role === 'guest' ? 'primary' : 'default'" @click="role = 'guest'">普通用户</ev-button>
      </div>
      <div style="display: flex; gap: 12px;">
        <ev-button>查看订单（所有人可见）</ev-button>
        <ev-auth has="order:delete">
          <ev-button type="danger">删除订单（需 order:delete）</ev-button>
        </ev-auth>
        <ev-button v-permission="'order:export'">导出（指令控制）</ev-button>
      </div>
    </div>
  </ev-config-provider>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const globalSize = ref('default')
const themeColor = ref('#175DFF')
const colors = ['#175DFF', '#0FA968', '#F5222D', '#7B2FF2', '#111827']
const on = ref(true)
const density = ref('default')
const role = ref('admin')
</script>

## ConfigProvider API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| size | String | `'default'` | 全局组件尺寸 `small` / `default` / `large` |
| locale | Object | `zhCN` | 语言包对象，内建 `zhCN` / `en` / `ja` / `zhTW`（见 `locale/`） |
| namespace | String | `'ev'` | 类名前缀（保留扩展位） |
| zIndex | Number | `2000` | 弹层 z-index 基准（保留扩展位） |
| platform | String | `'auto'` | 容器环境 `auto` / `desktop` / `mobile`；移动端下 Select、DatePicker 呈底部弹出形态 |
| themeColor | String | — | 运行时主色（十六进制）；注入后 7 档色阶与图表色板自动跟随，卸载时恢复默认 |
| density | String | — | 全局密度 `compact` / `default` / `loose`，作用于 `html[data-ev-density]` |
| permissions | Array | — | 权限码表；`v-permission` / `EvAuth` / `usePermission` 的判定来源 |

### 编程式用法

脱离组件树也可直接调用主题工具（见 [工具类 · 主题与颜色](/utils/theme-color)）：

```js
import { setPrimaryColor, setDensity } from '@wil-works/evoke-business-ui'

setPrimaryColor('#0FA968') // 全库主色 + 色阶 + 图表色板即时重算
setDensity('compact')      // 全局密度
```

### 接入说明

- **size**：输入类组件（Input / Select / InputNumber / DatePicker / Cascader / Checkbox / Radio 等）经 `useFormItem` 自动继承；Button 已单独接入。组件显式传入的 `size` 始终优先。
- **themeColor / density**：作用于 `documentElement`（全局语义），同页多 Provider 时以最深挂载的为准。
- **permissions**：未提供时回退到 `setPermissions()` 设置的全局码表。
