# 更新记录

evoke-ui 的版本演进，最新在上。完整的变更明细（含行为变化与升级注意事项）
见仓库根目录 CHANGELOG，或 [GitHub Releases](https://github.com/willove/evoke-ui/releases)。

<EvTimeline :items="releases">
  <template #description="{ item }">
    <ul class="cl-list">
      <li v-for="b in item.bullets" :key="b">{{ b }}</li>
    </ul>
  </template>
</EvTimeline>

<script setup>
const releases = [
  {
    tag: 'v0.7.1',
    date: '2026-09-13',
    title: 'Alert 溢出保护：胶囊单行省略',
    bullets: [
      '胶囊（pill）形态超长文案省略号截断，不再换行撑破胶囊',
      '常规形态根元素限宽 100%，消息位长词与 URL 就地断行，不撑破宿主容器',
      '滚动叙事指南文案清理',
    ],
  },
  {
    tag: 'v0.7.0',
    date: '2026-09-13',
    title: '滚动叙事：EvScrollScene 场景组件',
    bullets: [
      '新增 EvScrollScene 滚动场景：外层拉长、内层 sticky 钉住视口，滚动条就是时间轴，下滚前进、上滚回溯',
      '进度经插槽 { progress, reduced } 与 CSS 变量 --ev-scene-progress 双通道暴露，纯 CSS calc() 或 JS 刷帧均可消费',
      '新增 useScrollProgress 进度原语；EvSection 新增 snap 滚动吸附（proximity 温和轻吸，拒绝滚轮劫持）',
      'Slider 修复：初始值不在步长格点上时圆钮与导轨填充错位的问题',
      '本站首页「五步，搭出一个官网」与企业官网案例的「数据链路」即本版能力的实战',
    ],
  },
  {
    tag: 'v0.6.0',
    date: '2026-09-13',
    title: '新增 Slider 滑块 + 磨砂参数化',
    bullets: [
      '新增 Slider 滑块组件：连续数值选取，键盘方向键可调，导轨已走过部分着主色，三档尺寸与禁用态',
      '磨砂参数化：玻璃组件新增 saturate / tint 参数，与 blur 一致按组件独立调节，磨砂专题页实验室可实时试调',
      'ConfigProvider 磨砂开关支持 global:false 局部作用域，多个局部演示互不干扰',
      '弹层滚动锁定升级：经典滚动条环境下，弹层打开时固定顶栏与横幅不再横跳',
    ],
  },
  {
    tag: 'v0.5.0',
    date: '2026-09-13',
    title: '磨砂全家桶',
    bullets: [
      '磨砂质感扩至 14 个组件：卡片家族、Navbar、Footer、Section，到 Modal、ImagePreview、ActionSheet、Tabbar、Select 下拉',
      '玻璃配方现代化：顶缘 1px 高光 + 发丝描边，明暗主题各一档',
      '全部玻璃组件支持 blur 强度参数；不支持 backdrop-filter 的环境自动回落实底',
      '新增「磨砂玻璃」专题文档页',
    ],
  },
  {
    tag: 'v0.4.1',
    date: '2026-09-13',
    title: '首屏动效放软',
    bullets: [
      'EvHero 首屏入场与 v-reveal 滚动浮现改纯 CSS 实现，随页面绘制逐层浮现，观感更顺',
      '修复 v-reveal 方向变体（left / right / zoom / fade）失效的问题',
    ],
  },
  {
    tag: 'v0.4.0',
    date: '2026-09-12',
    title: '主题配置支持图表系列色板',
    bullets: [
      'ConfigProvider / useThemeConfig 新增 series（≤8 色数组），主题工具可整体切换图表数据系列配色',
    ],
  },
  {
    tag: 'v0.3.0',
    date: '2026-09-11',
    title: '生态命名空间对齐',
    bullets: [
      '生态定案 ev-* 令牌前缀；图表能力拆分为独立包 @wil-works/evoke-charts',
    ],
  },
  {
    tag: 'v0.2.0',
    date: '2026-09-11',
    title: '官网组件批次增强',
    bullets: [
      '面向官网与营销页场景的组件大波完善',
    ],
  },
]
</script>

<style scoped>
.cl-list {
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 13.5px;
  color: var(--ev-text-secondary);
}
.cl-list li {
  margin: 3px 0;
}
</style>
