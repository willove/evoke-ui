# BorderBeam 边框流光

装饰性流光边框：conic-gradient 光带沿边框旋转，纯 CSS 动画零 JS 开销。用于告警卡片、重点提示、大屏聚焦等场景；`@media (prefers-reduced-motion)` 下自动退化为静态光带。

## 基础用法

`active` 控制流光开关，光带颜色默认取主题色：

<DemoBlock>
  <div style="display: flex; gap: 24px; flex-wrap: wrap;">
    <ev-border-beam :radius="8" :padding="0">
      <div style="width: 220px; padding: 20px;">
        <div style="font-weight: 600; margin-bottom: 6px;">重点工单</div>
        <div style="font-size: 12px; color: var(--ev-text-color-secondary);">SLA 剩余 15 分钟，即将超时</div>
      </div>
    </ev-border-beam>
    <ev-border-beam :active="false">
      <div style="width: 220px; padding: 20px;">
        <div style="font-weight: 600; margin-bottom: 6px;">已停用流光</div>
        <div style="font-size: 12px; color: var(--ev-text-color-secondary);">active=false 只留淡边</div>
      </div>
    </ev-border-beam>
  </div>
</DemoBlock>

## 自定义颜色与速度

`color` / `color-to` 定义光带起止色，`duration` 控制一圈秒数：

<DemoBlock>
  <div style="display: flex; gap: 24px; flex-wrap: wrap;">
    <ev-border-beam color="#F5222D" color-to="#FF7A45" :duration="3">
      <div style="width: 200px; padding: 16px; font-size: 13px;">告警（红橙 3s）</div>
    </ev-border-beam>
    <ev-border-beam color="#52C41A" :duration="8">
      <div style="width: 200px; padding: 16px; font-size: 13px;">运行中（绿色 8s）</div>
    </ev-border-beam>
    <ev-border-beam color="var(--ev-color-ext-violet)" color-to="var(--ev-color-ext-cyan)" :duration="5">
      <div style="width: 200px; padding: 16px; font-size: 13px;">大屏氛围（紫青 5s）</div>
    </ev-border-beam>
  </div>
</DemoBlock>

## 光带粗细与内边距

`size` 控制光带厚度，`padding` 让流光框与内容留出间隙：

<DemoBlock>
  <ev-border-beam :size="4" :padding="12" :radius="12" background="var(--ev-fill-color-light)">
    <div style="padding: 16px 24px;">
      <div style="font-weight: 600;">年度总结报告</div>
      <div style="font-size: 12px; color: var(--ev-text-color-secondary); margin-top: 4px;">size=4 / padding=12 / 加背景底</div>
    </div>
  </ev-border-beam>
</DemoBlock>

## BorderBeam API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| active | Boolean | `true` | 流光开关；关闭时保留一圈淡边占位 |
| color | String | 主题色 | 光带起始色 |
| color-to | String | `color` 的透明渐隐 | 光带结束色 |
| size | Number | `2` | 光带厚度（px） |
| radius | Number | `8` | 圆角（px），建议与卡片圆角一致 |
| duration | Number | `6` | 一圈时长（秒） |
| delay | Number | `0` | 动画延迟（秒） |
| padding | Number | `0` | 内容与流光框的内边距（px） |
| background | String | `'transparent'` | 组件背景 |

### Slots

| 名称 | 说明 |
| --- | --- |
| default | 卡片内容 |

::: tip 实现说明
流光通过 CSS `@property` 注册 `--ev-bb-angle` 角度变量并驱动 `conic-gradient` 旋转，配合 `mask-composite: exclude` 挖空中心只留边框带。依赖 Chrome 85+ / Electron，低版本浏览器中动画静止但边框正常显示。
:::
