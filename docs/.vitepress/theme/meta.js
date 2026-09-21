/**
 * 组件目录 — 侧边栏 / 首页展示 / 站内搜索共用
 * 仅有 pages 的组件才出现在侧栏（其余后续补充文档后加入）
 */
export const CATEGORIES = [
  {
    name: '总览',
    key: 'overview',
    components: [
      { name: '组件总览', zh: 'Overview', path: '/components/overview' },
    ],
  },
  {
    name: '通用',
    key: 'general',
    components: [
      { name: 'ConfigProvider', zh: '全局配置', path: '/components/config-provider' },
      { name: 'Button', zh: '按钮', path: '/components/button' },
      { name: 'Icon', zh: '图标', path: '/components/icon' },
      { name: 'IconGallery', zh: '图标总览', path: '/components/icon-gallery' },
      { name: 'Tag', zh: '标签', path: '/components/tag' },
      { name: 'Text', zh: '文本', path: '/components/text' },
      { name: 'Typography', zh: '排版', path: '/components/typography' },
      { name: 'Link', zh: '链接', path: '/components/link' },
      { name: 'Card', zh: '卡片', path: '/components/card' },
      { name: 'SectionCard', zh: '区块卡片', path: '/components/section-card' },
    ],
  },
  {
    name: '布局',
    key: 'layout',
    components: [
      { name: 'Container', zh: '布局容器', path: '/components/container' },
      { name: 'AppLayout', zh: '应用框架', path: '/components/app-layout' },
      { name: 'AppToolbar', zh: '应用工具栏', path: '/components/app-toolbar' },
      { name: 'Header', zh: '顶栏', path: '/components/header' },
      { name: 'Aside', zh: '侧边栏', path: '/components/aside' },
      { name: 'Main', zh: '内容区', path: '/components/main' },
      { name: 'Footer', zh: '底栏', path: '/components/footer' },
      { name: 'Splitter', zh: '分隔面板', path: '/components/splitter' },
      { name: 'Row', zh: '栅格行', path: '/components/row' },
      { name: 'Col', zh: '栅格列', path: '/components/col' },
      { name: 'Space', zh: '间距', path: '/components/space' },
      { name: 'Divider', zh: '分割线', path: '/components/divider' },
      { name: 'Scrollbar', zh: '滚动条', path: '/components/scrollbar' },
    ],
  },
  {
    name: '数据录入',
    key: 'input',
    components: [
      { name: 'Input', zh: '输入框', path: '/components/input' },
      { name: 'Textarea', zh: '文本域', path: '/components/textarea' },
      { name: 'Mention', zh: '输入提及', path: '/components/mention' },
      { name: 'Select', zh: '选择器', path: '/components/select' },
      { name: 'TreeSelect', zh: '树形选择', path: '/components/tree-select' },
      { name: 'InputNumber', zh: '数字输入框', path: '/components/input-number' },
      { name: 'OtpInput', zh: '验证码输入框', path: '/components/otp-input' },
      { name: 'Radio', zh: '单选框', path: '/components/radio' },
      { name: 'Checkbox', zh: '多选框', path: '/components/checkbox' },
      { name: 'Switch', zh: '开关', path: '/components/switch' },
      { name: 'DatePicker', zh: '日期选择器', path: '/components/date-picker' },
      { name: 'TimePicker', zh: '时间选择器', path: '/components/time-picker' },
      { name: 'TimeSelect', zh: '时间选择', path: '/components/time-select' },
      { name: 'ColorPicker', zh: '颜色选择器', path: '/components/color-picker' },
      { name: 'Rate', zh: '评分', path: '/components/rate' },
      { name: 'Slider', zh: '滑块', path: '/components/slider' },
      { name: 'Upload', zh: '上传', path: '/components/upload' },
      { name: 'Form', zh: '表单', path: '/components/form' },
    ],
  },
  {
    name: '数据展示',
    key: 'display',
    components: [
      { name: 'Statistic', zh: '统计数值', path: '/components/statistic' },
      { name: 'Countdown', zh: '倒计时', path: '/components/countdown' },
      { name: 'StatCard', zh: '指标卡', path: '/components/stat-card' },
      { name: 'StatRow', zh: '指标卡行', path: '/components/stat-row' },
      { name: 'Table', zh: '表格', path: '/components/table' },
      { name: 'Descriptions', zh: '描述列表', path: '/components/descriptions' },
      { name: 'Timeline', zh: '时间轴', path: '/components/timeline' },
      { name: 'Steps', zh: '步骤条', path: '/components/steps' },
      { name: 'Badge', zh: '徽标', path: '/components/badge' },
      { name: 'Avatar', zh: '头像', path: '/components/avatar' },
      { name: 'Collapse', zh: '折叠面板', path: '/components/collapse' },
      { name: 'Empty', zh: '空状态', path: '/components/empty' },
      { name: 'Calendar', zh: '日历', path: '/components/calendar' },
      { name: 'Transfer', zh: '穿梭框', path: '/components/transfer' },
      { name: 'Carousel', zh: '走马灯', path: '/components/carousel' },
      { name: 'Segmented', zh: '分段控制', path: '/components/segmented' },
      { name: 'Tooltip', zh: '文字提示', path: '/components/tooltip' },
      { name: 'Popover', zh: '气泡卡片', path: '/components/popover' },
      { name: 'Popconfirm', zh: '气泡确认框', path: '/components/popconfirm' },
      { name: 'Image', zh: '图片', path: '/components/image' },
      { name: 'ImageViewer', zh: '图片预览', path: '/components/image-viewer' },
      { name: 'Result', zh: '结果页', path: '/components/result' },
      { name: 'Watermark', zh: '水印', path: '/components/watermark' },
      { name: 'Cascader', zh: '级联选择', path: '/components/cascader' },
      { name: 'CascaderPanel', zh: '级联面板', path: '/components/cascader-panel' },
      { name: 'Tree', zh: '树形控件', path: '/components/tree' },
      { name: 'JsonViewer', zh: 'JSON 查看器', path: '/components/json-viewer' },
    ],
  },
  {
    name: '反馈',
    key: 'feedback',
    components: [
      { name: 'Message', zh: '全局提示', path: '/components/message' },
      { name: 'Msgbox', zh: '消息弹窗', path: '/components/msgbox' },
      { name: 'Notify', zh: '通知提醒', path: '/components/notify' },
      { name: 'Loading', zh: '加载服务', path: '/components/loading' },
      { name: 'Dialog', zh: '对话框', path: '/components/dialog' },
      { name: 'Drawer', zh: '抽屉', path: '/components/drawer' },
      { name: 'Alert', zh: '警告提示', path: '/components/alert' },
      { name: 'Progress', zh: '进度条', path: '/components/progress' },
      { name: 'Skeleton', zh: '骨架屏', path: '/components/skeleton' },
      { name: 'Spin', zh: '加载中', path: '/components/spin' },
      { name: 'EmptyState', zh: '统一空态', path: '/components/empty-state' },
    ],
  },
  {
    name: '导航',
    key: 'navigation',
    components: [
      { name: 'Menu', zh: '导航菜单', path: '/components/menu' },
      { name: 'Tabs', zh: '标签页', path: '/components/tabs' },
      { name: 'Breadcrumb', zh: '面包屑', path: '/components/breadcrumb' },
      { name: 'Pagination', zh: '分页', path: '/components/pagination' },
      { name: 'Dropdown', zh: '下拉菜单', path: '/components/dropdown' },
      { name: 'ContextMenu', zh: '右键菜单', path: '/components/context-menu' },
      { name: 'Backtop', zh: '返回顶部', path: '/components/backtop' },
      { name: 'Affix', zh: '图钉', path: '/components/affix' },
      { name: 'Anchor', zh: '锚点', path: '/components/anchor' },
      { name: 'PageHeader', zh: '页头', path: '/components/page-header' },
      { name: 'CommandPalette', zh: '命令面板', path: '/components/command-palette' },
    ],
  },
  {
    name: '能力增强',
    key: 'enhanced',
    components: [
      { name: 'VirtualList', zh: '虚拟列表', path: '/components/virtual-list' },
      { name: 'List', zh: '列表（已废弃）', path: '/components/list' },
      { name: 'AutoComplete', zh: '输入联想', path: '/components/auto-complete' },
      { name: 'Tour', zh: '新手引导', path: '/components/tour' },
      { name: 'QRCode', zh: '二维码', path: '/components/qrcode' },
      { name: 'FloatButton', zh: '悬浮按钮', path: '/components/float-button' },
      { name: 'Comment', zh: '评论', path: '/components/comment' },
      { name: 'Stack', zh: '卡片堆叠', path: '/components/stack' },
      { name: 'Popper', zh: '浮层基础件', path: '/components/popper' },
      { name: 'Auth', zh: '权限', path: '/components/auth' },
      { name: 'BorderBeam', zh: '边框流光', path: '/components/border-beam' },
    ],
  },
  {
    name: '业务组件',
    key: 'business',
    components: [
      { name: 'SearchFilter', zh: '筛选表单', path: '/components/search-filter' },
      { name: 'DataTable', zh: '数据表格', path: '/components/data-table' },
      { name: 'TablePage', zh: '表格页', path: '/components/table-page' },
      { name: 'StatusTag', zh: '状态标签', path: '/components/status-tag' },
      { name: 'CreditsProgress', zh: '用量进度', path: '/components/credits-progress' },
      { name: 'GanttProgress', zh: '阶段进度', path: '/components/gantt-progress' },
      { name: 'CellStack', zh: '双行单元格', path: '/components/cell-stack' },
      { name: 'DetailDescriptions', zh: '详情描述', path: '/components/detail-descriptions' },
      { name: 'ImportExportPanel', zh: '导入导出面板', path: '/components/import-export-panel' },
      { name: 'AuditTimeline', zh: '审计时间线', path: '/components/audit-timeline' },
      { name: 'ColumnSettings', zh: '列设置', path: '/components/column-settings' },
      { name: 'Chatbot', zh: '对话窗口', path: '/components/chatbot' },
      { name: 'Chat 子组件', zh: '对话子组件', path: '/components/chat-subcomponents' },
      { name: 'Chat 三件套', zh: '计划/确认/产物', path: '/components/chat-agent' },
    ],
  },
  {
    name: 'AI',
    key: 'ai',
    components: [
      { name: 'ChatThreads', zh: '会话列表', path: '/components/chat-threads' },
      { name: 'ChatWidget', zh: '浮动挂件', path: '/components/chat-widget' },
      { name: 'AiPromptBox', zh: 'AI 输入台', path: '/components/ai-prompt-box' },
      { name: 'AiConsole', zh: 'AI 工作台', path: '/components/ai-console' },
    ],
  },
  {
    name: '工具',
    key: 'utils',
    components: [
      { name: 'Overview', zh: '工具总览', path: '/utils/' },
      { name: 'Format', zh: '格式化工具', path: '/utils/format' },
      { name: 'Theme & Color', zh: '主题与颜色', path: '/utils/theme-color' },
      { name: 'Hooks', zh: '组合式函数', path: '/utils/hooks' },
    ],
  },
]

/** 指南分区导航 — 侧栏在 /guide 路由下展示 */
export const GUIDE_NAV = [
  {
    name: '指南',
    key: 'guide',
    components: [
      { name: '快速开始', zh: '', path: '/guide/getting-started' },
      { name: '主题定制器', zh: '', path: '/guide/customizer' },
      { name: '主题与暗色模式', zh: '', path: '/guide/theming' },
      { name: '设计规范', zh: '', path: '/guide/design' },
      { name: '企业级能力', zh: '', path: '/guide/enterprise' },
      { name: '无障碍与对比度', zh: '', path: '/guide/accessibility' },
      { name: 'SSR 兼容性', zh: '', path: '/guide/ssr' },
      { name: '更新记录', zh: '', path: '/guide/changelog' },
    ],
  },
]

/** 图表分区导航 — 侧栏在 /chart 路由下展示（图表文档已独立成站，本站仅保留使用指引） */
export const CHART_NAV = [
  {
    name: '图表',
    key: 'chart',
    components: [
      { name: '使用指引', zh: '', path: '/chart' },
    ],
  },
]

/** 示例分区导航 — 侧栏在 /examples 路由下展示（对应 examples/ 下的独立示例工程） */
export const EXAMPLES_NAV = [
  {
    name: '应用示例',
    key: 'examples',
    components: [
      { name: '总览', zh: '', path: '/examples/' },
      { name: '全屏示例中心', zh: '', path: '/examples/live/dashboard' },
      { name: '工作台 Dashboard', zh: '', path: '/examples/dashboard' },
      { name: '标准 CRUD 列表', zh: '', path: '/examples/crud-list' },
      { name: '分步表单', zh: '', path: '/examples/step-form' },
      { name: '详情页', zh: '', path: '/examples/detail' },
      { name: '项目协作', zh: '', path: '/examples/project' },
      { name: '报销审批', zh: '', path: '/examples/approval' },
      { name: '知识库', zh: '', path: '/examples/knowledge' },
      { name: 'AI 运营助手', zh: '', path: '/examples/ai-workbench' },
      { name: '移动端 H5', zh: '', path: '/examples/mobile' },
    ],
  },
]

/** 移动端分区导航 — 侧栏在 /mobile 路由下展示（桌面组件的移动表达与容器规范） */
export const MOBILE_NAV = [
  {
    name: '移动端',
    key: 'mobile',
    components: [
      { name: '适配总览', zh: '', path: '/mobile/' },
      { name: '布局与导航壳', zh: '', path: '/mobile/layout' },
      { name: '数据展示', zh: '', path: '/mobile/data-display' },
      { name: '数据录入', zh: '', path: '/mobile/data-entry' },
      { name: '反馈与浮层', zh: '', path: '/mobile/feedback' },
      { name: '页面导航', zh: '', path: '/mobile/navigation' },
    ],
  },
  {
    name: '移动端组件 · 手势与加载',
    key: 'mobile-comp-gesture',
    components: [
      { name: 'PullRefresh', zh: '下拉刷新', path: '/mobile/components/pull-refresh' },
      { name: 'LoadMore', zh: '加载更多', path: '/mobile/components/load-more' },
    ],
  },
  {
    name: '移动端组件 · 浮层与导航',
    key: 'mobile-comp-overlay',
    components: [
      { name: 'ActionSheet', zh: '动作面板', path: '/mobile/components/action-sheet' },
      { name: 'NavBar', zh: '页头', path: '/mobile/components/nav-bar' },
      { name: 'Tabbar', zh: '底部标签栏', path: '/mobile/components/tabbar' },
    ],
  },
]

/** 扁平移动端页面清单（搜索用） */
export const ALL_MOBILE_PAGES = MOBILE_NAV.flatMap((c) =>
  c.components
    .filter((comp) => comp.path !== '/mobile/')
    .map((comp) => ({ ...comp, category: '移动端' })),
)

/** 示例子站点（/examples/live/*）— 微型顶栏切换用的清单 */
export const LIVE_EXAMPLES = [
  { key: 'dashboard', name: '工作台', path: '/examples/live/dashboard' },
  { key: 'crud-list', name: 'CRUD 列表', path: '/examples/live/crud-list' },
  { key: 'step-form', name: '分步表单', path: '/examples/live/step-form' },
  { key: 'detail', name: '详情页', path: '/examples/live/detail' },
  { key: 'project', name: '项目协作', path: '/examples/live/project' },
  { key: 'approval', name: '报销审批', path: '/examples/live/approval' },
  { key: 'knowledge', name: '知识库', path: '/examples/live/knowledge' },
  { key: 'ai-workbench', name: 'AI 运营助手', path: '/examples/live/ai-workbench' },
  { key: 'mobile', name: '移动端', path: '/examples/live/mobile' },
]

/** 扁平示例清单（搜索用） */
export const ALL_EXAMPLES = EXAMPLES_NAV.flatMap((c) =>
  c.components
    .filter((comp) => comp.path !== '/examples/')
    .map((comp) => ({ ...comp, category: '示例' })),
)

/** 扁平图表章节清单（搜索用） */
export const ALL_CHART_PAGES = CHART_NAV.flatMap((c) =>
  c.components.map((comp) => ({ ...comp, category: '图表' })),
)

/** 扁平组件清单 */
export const ALL_COMPONENTS = CATEGORIES.flatMap((c) =>
  c.components.map((comp) => ({ ...comp, category: c.name })),
)

/** 主题色与品牌 */
export const BRAND = {
  name: 'Evoke Business UI',
  primary: '#175DFF',
  version: '0.8.0',
}
