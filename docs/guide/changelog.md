# 更新记录

evoke-business-ui 的版本演进，最新在上。完整的变更明细（含行为变化与升级注意事项）
见仓库根目录 CHANGELOG，或 [GitHub Releases](https://github.com/willove/evoke-ui/releases)。

<EbTimeline>
  <EbTimelineItem
    v-for="r in releases"
    :key="r.version"
    :timestamp="r.date"
    :type="r.latest ? 'primary' : undefined"
  >
    <h4 class="cl-title">{{ r.version }} · {{ r.title }}</h4>
    <ul class="cl-list">
      <li v-for="b in r.bullets" :key="b">{{ b }}</li>
    </ul>
  </EbTimelineItem>
</EbTimeline>

<script setup>
const releases = [
  {
    version: 'v0.7.0',
    date: '2026-09-16',
    title: 'EbOtpInput 验证码输入框 + EbTablePage 表格页',
    latest: true,
    bullets: [
      '新增 EbOtpInput：方框式逐位输入自动前进，任意框粘贴整段验证码自动分配，masked 掩码与 number/text 双类型，iOS one-time-code 自动填充',
      '新增 EbTablePage 表格页：页头 / 查询区 / 工具栏 / 表格分页四区一体，request 数据代理驱动分页排序筛选与查询重置联动',
      'EbDataTable 新增 fit 高度自适应：撑满剩余空间、表格内部滚动，与 virtual 组合承载万级满屏表格',
      'utils / composables / directives / 命令式 API 全量迁移 TypeScript，公共类型（MessageOptions / TableData 等）随 d.ts 分发',
    ],
  },
  {
    version: 'v0.6.0',
    date: '2026-09-15',
    title: '类型声明、按需导出与键盘可达性收口',
    bullets: [
      '153 个组件 + 4 个命令式 API 全量 d.ts 类型（vue-tsc 产物），主入口与子路径导入均有编辑器补全',
      '按需子路径导出：import EbButton from .../button 只解析该组件与其依赖，不触达其余组件',
      '运行时依赖全量外置，主入口从 2.4MB 降至 72KB（gzip 17KB），消除双份 dayjs/highlight.js',
      '键盘与读屏收口：menu/tabs/select/table 方向键导航 + combobox/listbox 语义 + focus trap 圈闭六例回归',
      'rate / radio / tag 默认色跟随明暗主题；组件文档 112/112 全覆盖',
    ],
  },
  {
    version: 'v0.5.0',
    date: '2026-09-13',
    title: '磨砂参数化与稳定性',
    bullets: [
      '磨砂组件新增 saturate / tint 参数，与 blur 一致按组件独立调节质感',
      '磨砂开关支持 global:false 局部作用域，多个局部演示互不干扰',
      '弹层滚动锁定升级：经典滚动条环境下，弹层打开时固定顶栏与横幅不再横跳',
      '修复通知（EbNotify）同列堆叠在特定渲染场景下偏移失效的问题',
    ],
  },
  {
    version: 'v0.4.1',
    date: '2026-09-13',
    title: 'README 开发中警示',
    bullets: ['README 头部加「开发迭代中，请勿用于生产环境」警示，无代码变化'],
  },
  {
    version: 'v0.4.0',
    date: '2026-09-12',
    title: '图表配色接入主题体系',
    bullets: [
      '主题工具新增 setSeriesPalette / clearSeriesPalette：整体切换图表数据系列配色，图表即时重绘',
      'EbConfigProvider 新增 series prop（≤8 色数组），支持持久化联动',
      '图表模板同时支持 <ev-chart> / <eb-chart> 双注册名',
    ],
  },
  {
    version: 'v0.3.2',
    date: '2026-09-11',
    title: '交互细节修复',
    bullets: [
      '修复 Tooltip 箭头亚像素渲染下的菱形残角，与暗色模式气泡白底白字不可读的问题',
      'card / dialog / drawer / section-card 新增 blur 磨砂强度 prop',
      'Card 悬浮反馈降噪：边框不再用强调色、移除位移动效',
    ],
  },
  {
    version: 'v0.3.1',
    date: '2026-09-11',
    title: 'README 更名同步',
    bullets: ['随 0.3.0 更名的 README 修正（仅文档，无代码变化）'],
  },
  {
    version: 'v0.3.0',
    date: '2026-09-11',
    title: '全线更名 eb-*（破坏性）',
    bullets: [
      '组件名、类名、令牌、事件与持久化键整体 Ev* → Eb* / ev-* → eb-*',
      '图表改为依赖独立包 @wil-works/evoke-charts，对外以 EbChart 提供，与业务主题、暗色、运行时换肤自动联动',
      '主题切换移至顶栏；输入涟漪升级为实体色层',
    ],
  },
  {
    version: 'v0.2.0',
    date: '2026-09-11',
    title: '主题动态配置体系',
    bullets: ['主题动态配置、预设与持久化，暗色感知梯度与语义色'],
  },
]
</script>

<style scoped>
.cl-title {
  margin: 0 0 4px;
  font-size: 14.5px;
  font-weight: 600;
}
.cl-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13.5px;
  color: var(--eb-text-color-regular);
}
.cl-list li {
  margin: 3px 0;
}
</style>
