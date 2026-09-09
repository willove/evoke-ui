# CreditsProgress 用量进度

额度条形进度：栅格细条墙按容器宽度自适应根数，配合刷新周期头与用量/剩余脚注，适合展示席位、Credits、存储、API 调用等配额型资源。超额自动转红，剩余不足 20% 高亮警示。默认无外围边框，干净融入页面；需要卡片质感时外层套 `ev-section-card` 即可。

## 基础用法

`used` / `total` 必填，细条墙按已用比例从左向右填充。

<DemoBlock>
  <div style="max-width: 480px;">
    <ev-credits-progress :used="640" :total="1000" />
  </div>
</DemoBlock>

## 卡片化包装

默认无边框，套一层 `ev-section-card` 即获得带标题的卡片形态。

<DemoBlock>
  <ev-section-card title="本月 Credits" style="max-width: 480px;">
    <ev-credits-progress :used="640" :total="1000" refresh-date="2026-10-01" />
  </ev-section-card>
</DemoBlock>

## 刷新周期

`refresh-date` 显示刷新时间头，`refresh-label` 自定义资源名（默认「套餐内 Credits」）。

<DemoBlock>
  <div style="max-width: 480px;">
    <ev-credits-progress :used="182" :total="500" refresh-date="2026-10-01 00:00" refresh-label="本月 API 调用额度" />
  </div>
</DemoBlock>

## 剩余警示与超额状态

剩余低于 20% 时剩余数字高亮警示；`used > total` 时整条栅格转红（超额）。

<DemoBlock>
  <div style="display: grid; gap: 20px; max-width: 480px;">
    <ev-credits-progress :used="940" :total="1000" refresh-date="2026-10-01" />
    <ev-credits-progress :used="1260" :total="1000" refresh-date="2026-10-01" />
  </div>
</DemoBlock>

## 尺寸与栅格密度

`size` 控制整体字号档位；`bar-width` / `gap` / `bar-height` 控制细条的宽度、间距与栅格总高（默认按容器宽度自适应根数，`max-bars` 封顶）。

<DemoBlock>
  <div style="display: grid; gap: 20px; max-width: 480px;">
    <ev-credits-progress :used="320" :total="800" size="small" />
    <ev-credits-progress :used="520" :total="800" bar-width="6" :gap="3" :bar-height="24" />
    <ev-credits-progress :used="700" :total="800" :max-bars="30" :bar-width="10" :gap="4" :bar-height="28" />
  </div>
</DemoBlock>

## 自定义颜色

`filled-color` / `empty-color` 覆盖填充与空置颜色，可做语义化配色（如成功色表示健康用量）。

<DemoBlock>
  <div style="max-width: 480px;">
    <ev-credits-progress :used="450" :total="900" filled-color="#22A45D" empty-color="#E1F4E8" />
  </div>
</DemoBlock>

## 项目落地：团队配额卡

与 Card / StatCard 组合成团队资源用量面板（完整用法见[项目协作示例](/examples/project)）。

<DemoBlock>
  <div style="display: grid; gap: 16px; max-width: 560px;">
    <ev-section-card title="AI Credits">
      <ev-credits-progress :used="7560" :total="10000" refresh-date="2026-10-01 00:00" size="small" />
    </ev-section-card>
    <ev-section-card title="存储空间">
      <ev-credits-progress :used="212" :total="500" refresh-label="存储容量（GB）" size="small" />
    </ev-section-card>
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'
</script>

## API

<ApiTable title="CreditsProgress Props" :rows="[
  { name: 'used', desc: '已使用额度', type: 'number', default: '必填' },
  { name: 'total', desc: '总额度', type: 'number', default: '必填' },
  { name: 'refreshDate', desc: '刷新时间文案，非空时显示头部', type: 'string', default: '空字符串' },
  { name: 'refreshLabel', desc: '头部资源名称', type: 'string', default: '套餐内 Credits' },
  { name: 'maxBars', desc: '细条根数上限', type: 'number', default: '200' },
  { name: 'size', desc: '尺寸档位', type: 'string', default: 'default' },
  { name: 'gap', desc: '细条间距（px）', type: 'number', default: '1.5' },
  { name: 'barWidth', desc: '单根细条宽度（px）', type: 'number', default: '3' },
  { name: 'barHeight', desc: '栅格总高（px），默认随字号', type: 'number', default: '0' },
  { name: 'filledColor', desc: '填充颜色', type: 'string', default: 'var(--ev-color-primary)' },
  { name: 'emptyColor', desc: '空置颜色', type: 'string', default: 'var(--ev-border-color-lighter)' },
]" />
