# 主题配色

图表默认跟随宿主主题：渲染时从 `--ev-*` 令牌取色，换主色、切暗色、换肤都自动重绘。需要锁死视觉时用内置色系——`options.palette` 填一个色系 id，整图系列色立即固定：之后宿主改样式变量、换主色都不再影响这张图；明暗两套色值由色系自带，随暗色模式换挡。

## 一键试色

点按钮即切色系，「跟随主题」恢复默认的令牌取色。五个系列正好看到色系前五槽的搭配。

<script setup>
import { ref, computed } from 'vue'
import { CHART_PALETTES } from '@wil-works/evoke-charts'

const activeId = ref('')
const current = computed(() => CHART_PALETTES.find((p) => p.id === activeId.value))
const options = computed(() => ({
  type: 'bar',
  title: '各渠道季度销售额',
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  series: [
    { name: '线上商城', data: [320, 402, 361, 490] },
    { name: '线下门店', data: [280, 302, 346, 331] },
    { name: '社群团购', data: [120, 132, 101, 134] },
    { name: '分销渠道', data: [98, 156, 122, 168] },
    { name: '直播带货', data: [60, 90, 140, 180] },
  ],
  legend: { show: true },
  ...(current.value ? { palette: current.value.id } : {}),
}))
</script>

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
      <ev-button :variant="activeId === '' ? 'primary' : 'soft'" @click="activeId = ''">跟随主题</ev-button>
      <ev-button v-for="p in CHART_PALETTES" :key="p.id" :variant="activeId === p.id ? 'primary' : 'soft'" @click="activeId = p.id">{{ p.name }}</ev-button>
    </div>
    <p style="margin: 0; font-size: 13px; color: var(--vp-c-text-2);">
      {{ current ? `「${current.name}」${current.scene}` : '当前跟随主题：系列色实时读取令牌，随宿主换肤与暗色自动变化。' }}
    </p>
  </div>
  <ev-chart :options="options" :height="300" style="margin-top: 14px;" />
</DemoBlock>

选中色系后这张图的配色就固定了——去[主题接入](/guide/theme)里换主色试试，选了色系的图不会跟着变。

## 色系总览

七套色系按叙事场景选：科技产品选极光，消费营销选落日，人文报告选莫兰迪，健康环保选林间，金融年报选墨蓝，活动大屏选糖果。

<div style="display: flex; flex-direction: column; gap: 12px; margin: 14px 0;">
  <div v-for="p in CHART_PALETTES" :key="p.id" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
    <code style="min-width: 132px;">{{ p.name }} · {{ p.id }}</code>
    <span style="display: inline-flex; gap: 4px;">
      <span v-for="(c, i) in p.light" :key="i" :style="{ width: '18px', height: '18px', borderRadius: '4px', background: c, display: 'inline-block' }" />
    </span>
    <span style="font-size: 12px; color: var(--vp-c-text-2);">{{ p.scene }}</span>
  </div>
</div>

## 优先级与固定边界

- 取色优先级：`theme.colors`（手工数组，最高）> `palette`（内置色系，固定）> 令牌跟随（默认）；
- `palette` 固定的是**数据系列色**：网格线、轴文字、标题等结构色仍随宿主明暗，保证任何背景下可读；个别元素要钉死可用 `theme` 显式覆写；
- 每套色系自带浅 / 暗两组（暗色同色相提亮），换挡由图表内部完成，不依赖宿主变量；
- 用 [AI 生成](/guide/ai)时，需求里写明「固定配色 / 不随主题变化」即会带上色系选项。

## API

<ApiTable title="主题配色" :rows="[
  { name: 'palette', desc: '内置色系 id，整图固定该色系的系列色（classic / aurora / sunset / morandi / forest / ink / candy）；生效后不再读取 --ev-color-* 令牌，与 theme.colors 同设时以 theme.colors 为准', type: 'string', default: '—' },
  { name: 'CHART_PALETTES', desc: '色系注册表：[{ id, name, scene, light[8], dark[8] }]，宿主可据此生成换色菜单', type: 'Palette[]', default: '—' },
  { name: 'resolveChartPalette', desc: '按 id 与明暗态取 8 槽色值：resolveChartPalette(id, isDark)，未知 id 返回 null', type: '(id, isDark) => string[] | null', default: '—' },
]" />

## 相关

- [主题接入](/guide/theme)（默认的令牌跟随与暗色）
- [设计规范](/guide/design)（色板验收规则）
- [AI 生成](/guide/ai)（数据与需求直接出图）
