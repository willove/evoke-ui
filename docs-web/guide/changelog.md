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
    tag: 'v0.10.0',
    date: '2026-09-16',
    title: 'OtpInput 验证码输入框 + 存量源码 TypeScript 化',
    bullets: [
      '新增 EvOtpInput：方框式逐位输入自动前进，任意框粘贴整段验证码自动分配，masked 掩码与 number/text 双类型，iOS one-time-code 自动填充',
      'utils / composables / directives 全量迁移 TypeScript（11 个模块），strict 模式零错误',
      '构建产物保持纯 JS，消费端无感；EvOtpInput d.ts 类型随包分发',
    ],
  },
  {
    tag: 'v0.9.0',
    date: '2026-09-15',
    title: '类型声明与按需子路径导出',
    bullets: [
      '61 个组件全量 d.ts 类型（vue-tsc 产物，props 带 JSDoc 悬浮提示），composables / directives / install 均有类型',
      '按需子路径导出：import EvButton from .../button 只解析该组件与其依赖，不触达其余组件',
      'exports 主入口补 types 条件、新增 ./* 通配双通道，sideEffects 声明 css 保证 JS 全量 tree-shaking',
    ],
  },
  {
    tag: 'v0.8.0',
    date: '2026-09-14',
    title: 'EvBento 图文组合分区 + ComparisonTable 双形态',
    bullets: [
      '新增 EvBento 图文组合分区：span 跨列 / rows 跨行 / dense 回填，tone 卡面与整卡链接，布局断点跟随父容器宽度',
      'ComparisonTable 升级为双形态：列头支持产品图、配色点、徽标、一句话与价格，groups 分组陈列，单元格支持多行文本',
      '默认改为无边框现代形态（无斑马纹、无悬浮变色，高亮列始终清晰），bordered 保留网格边框可选',
    ],
  },
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
      '本站首页「一个官网的诞生」与企业官网案例的「数据链路」即本版能力的实战',
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
