/**
 * @wil-works/evoke-business-ui
 * Evoke Business UI — 纯 JS Vue3 中后台组件库
 *
 * Usage:
 *   import { createApp } from 'vue'
 *   import EvokeBusinessUI from '@wil-works/evoke-business-ui'
 *   import '@wil-works/evoke-business-ui/styles'
 *
 *   const app = createApp(App)
 *   app.use(EvokeBusinessUI)
 */

// ══════ CSS — 设计变量 + 暗色模式 + 全局基础样式 ══════
import './styles/index.css'

// ─── Components ───
import EvButton from './components/button/index.vue'
import EvButtonGroup from './components/button/group.vue'
import EvIcon from './components/icon/index.vue'
import EvConfigProvider from './components/config-provider/index.vue'
import EvInput from './components/input/index.vue'
import EvTextarea from './components/textarea/index.vue'
import EvTag from './components/tag/index.vue'
import EvSpin from './components/spin/index.vue'
import EvAlert from './components/alert/index.vue'
import EvDivider from './components/divider/index.vue'
import EvSkeleton from './components/skeleton/index.vue'
import EvSkeletonItem from './components/skeleton/item.vue'
import EvSkeletonButton from './components/skeleton/skeleton-button.vue'
import EvSkeletonAvatar from './components/skeleton/skeleton-avatar.vue'
import EvSkeletonInput from './components/skeleton/skeleton-input.vue'
import EvSkeletonImage from './components/skeleton/skeleton-image.vue'
import EvRadio from './components/radio/index.vue'
import EvRadioGroup from './components/radio/group.vue'
import EvRadioButton from './components/radio/button.vue'
import EvCheckbox from './components/checkbox/index.vue'
import EvCheckboxGroup from './components/checkbox/group.vue'
import EvCheckboxButton from './components/checkbox/button.vue'
import EvSwitch from './components/switch-comp/index.vue'
import EvInputNumber from './components/input-number/index.vue'
import EvForm from './components/form/index.vue'
import EvFormItem from './components/form/item.vue'
import EvDialog from './components/dialog/index.vue'
// 浮层与选择器
import EvPopper from './components/popper/index.vue'
import EvTooltip from './components/tooltip/index.vue'
import EvPopover from './components/popover/index.vue'
import EvPopconfirm from './components/popconfirm/index.vue'
import EvSelect from './components/select/index.vue'
import EvOption from './components/select/option.vue'
import EvOptionGroup from './components/select/option-group.vue'
import EvDropdown from './components/dropdown/index.vue'
import EvDropdownMenu from './components/dropdown/menu.vue'
import EvDropdownItem from './components/dropdown/item.vue'
import EvTabs from './components/tabs/index.vue'
import EvTabPane from './components/tabs/pane.vue'
import EvDrawer from './components/drawer/index.vue'
import EvPagination from './components/pagination/index.vue'
import EvAvatar from './components/avatar/index.vue'
import EvAvatarGroup from './components/avatar/group.vue'
import EvBadge from './components/badge/index.vue'
import EvProgress from './components/progress/index.vue'
import EvEmpty from './components/empty/index.vue'
import EvImageViewer from './components/image-viewer/index.vue'
// 数据组件（表格 / 树 / 日期时间 / 级联）
import EvTable from './components/table/index.vue'
import EvTableColumn from './components/table/column.vue'
import EvTree from './components/tree/index.vue'
import EvTreeSelect from './components/tree-select/index.vue'
import EvDatePicker from './components/date-picker/index.vue'
import EvTimePicker from './components/time-picker/index.vue'
import EvTimeSelect from './components/time-select/index.vue'
import EvCascader from './components/cascader/index.vue'
// 其余通用组件
import EvBreadcrumb from './components/breadcrumb/index.vue'
import EvBreadcrumbItem from './components/breadcrumb/item.vue'
import EvLink from './components/link/index.vue'
import EvText from './components/text/index.vue'
import EvCollapse from './components/collapse/index.vue'
import EvCollapseItem from './components/collapse/item.vue'
import EvDescriptions from './components/descriptions/index.vue'
import EvDescriptionsItem from './components/descriptions/item.vue'
import EvSteps from './components/steps/index.vue'
import EvStep from './components/steps/item.vue'
import EvCard from './components/card/index.vue'
import EvImage from './components/image/index.vue'
import EvBacktop from './components/backtop/index.vue'
import EvAffix from './components/affix/index.vue'
import EvRate from './components/rate/index.vue'
import EvSlider from './components/slider/index.vue'
import EvColorPicker from './components/color-picker/index.vue'
import EvColorPickerPanel from './components/color-picker/panel.vue'
import EvMenu from './components/menu/index.vue'
import EvMenuItem from './components/menu/item.vue'
import EvSubMenu from './components/menu/sub-menu.vue'
import EvMenuItemGroup from './components/menu/item-group.vue'
import EvTimeline from './components/timeline/index.vue'
import EvTimelineItem from './components/timeline/item.vue'
import EvResult from './components/result/index.vue'
import EvWatermark from './components/watermark/index.vue'
import EvEmptyState from './components/empty-state/index.vue'
import EvSegmented from './components/segmented/index.vue'
import EvContainer from './components/container/index.vue'
import EvHeader from './components/header/index.vue'
import EvAside from './components/aside/index.vue'
import EvMain from './components/main/index.vue'
import EvFooter from './components/footer/index.vue'
import EvRow from './components/row/index.vue'
import EvCol from './components/col/index.vue'
import EvSpace from './components/space/index.vue'
import EvScrollbar from './components/scrollbar/index.vue'
import EvStack from './components/stack/index.vue'
import EvSplitter from './components/splitter/index.vue'
import EvSplitterPanel from './components/splitter/panel.vue'
import EvUpload from './components/upload/index.vue'
import EvCalendar from './components/calendar/index.vue'
import EvBorderBeam from './components/border-beam/index.vue'
import EvCreditsProgress from './components/credits-progress/index.vue'
import EvGanttProgress from './components/gantt-progress/index.vue'
import EvJsonViewer from './components/json-viewer/index.vue'
import EvAppLayout from './components/app-layout/index.vue'
import EvAppToolbar from './components/app-toolbar/index.vue'
import EvPageHeader from './components/page-header/index.vue'
import EvSectionCard from './components/section-card/index.vue'
import EvStatCard from './components/stat-card/index.vue'
import EvStatRow from './components/stat-row/index.vue'
import EvTransfer from './components/transfer/index.vue'
import EvCarousel from './components/carousel/index.vue'
import EvCarouselItem from './components/carousel/item.vue'
import EvCascaderPanel from './components/cascader-panel/index.vue'
import EvCommandPalette from './components/command-palette/index.vue'
import EvChart from './components/chart/index.vue'
// Chatbot 家族
import EvChatbot from './components/chatbot/Chatbot.vue'
import EvChatList from './components/chatbot/ChatList.vue'
import EvChatMessage from './components/chatbot/ChatMessage.vue'
import EvChatSender from './components/chatbot/ChatSender.vue'
import EvChatContent from './components/chatbot/ChatContent.vue'
import EvChatMarkdown from './components/chatbot/ChatMarkdown.vue'
import EvChatThinking from './components/chatbot/ChatThinking.vue'
import EvChatLoading from './components/chatbot/ChatLoading.vue'
import EvChatActionbar from './components/chatbot/ChatActionbar.vue'
import EvChatAttachments from './components/chatbot/ChatAttachments.vue'
export { useChatEngine } from './components/chatbot/useChatEngine'
// 业务组件
import EvStatusTag from './components/status-tag/index.vue'
import EvCellStack from './components/cell-stack/index.vue'
import EvDetailDescriptions from './components/detail-descriptions/index.vue'
import EvSearchFilter from './components/search-filter/index.vue'
import EvDataTable from './components/data-table/index.vue'
import EvImportExportPanel from './components/import-export-panel/index.vue'
import EvAuditTimeline from './components/audit-timeline/index.vue'
import EvColumnSettings from './components/column-settings/index.vue'
// 增强组件（虚拟滚动 / 联想 / 引导 / 二维码等）
import EvVirtualList from './components/virtual-list/index.vue'
// EvListy 为 EvVirtualList 的别名注册
import EvAutoComplete from './components/auto-complete/index.vue'
import EvTour from './components/tour/index.vue'
import EvQrcode from './components/qrcode/index.vue'
import EvMention from './components/mention/index.vue'
import EvStatistic from './components/statistic/index.vue'
import EvFloatButton from './components/float-button/index.vue'
import EvFloatButtonGroup from './components/float-button/group.vue'
import EvComment from './components/comment/index.vue'
import EvAuth from './components/auth/index.vue'
import { encodeQR, QRCODE_MAX_BYTES } from './components/qrcode/qrcode'
// 排版与锚点
import EvTitle from './components/typography/title.vue'
import EvParagraph from './components/typography/paragraph.vue'
import EvAnchor from './components/anchor/index.vue'
import EvAnchorLink from './components/anchor/link.vue'

// ─── Mobile 移动组件 ───
import EvPullRefresh from './components/pull-refresh/index.vue'
import EvLoadMore from './components/load-more/index.vue'
import EvActionSheet from './components/action-sheet/index.vue'
import EvTabbar from './components/tabbar/index.vue'
import EvTabbarItem from './components/tabbar/item.vue'
import EvNavBar from './components/nav-bar/index.vue'

// ─── Command APIs ───
import { EvMessage } from './components/message'
import { EvMsgbox } from './components/msgbox'
import { EvNotify } from './components/notify'
import { EvLoading, createLoadingDirective } from './components/loading'

// ─── Directives ───
import { createPermissionDirective } from './directives/permission'
import { createCopyDirective } from './directives/copy'
import { createInfiniteScrollDirective } from './directives/infinite-scroll'

// ─── Icon Registry ───
import {
  getIconByName,
  getIconByNameSync,
  registerIcons,
  getIconNames,
  registerFullIcons,
  loadFullIcons,
  isFullIconsLoaded,
} from './components/icon/iconRegistry'
import { REMIX_ICON_META, REMIX_ICON_VERSION } from './components/icon/remix-meta'

// ─── Composables ───
import { useDarkMode } from './composables/useDarkMode'
import { useFloating } from './composables/useFloating'
import { useClickOutside } from './composables/useClickOutside'
import { useFocusTrap } from './composables/useFocusTrap'
import { useLockScroll } from './composables/useLockScroll'
import { useFormItem } from './composables/useFormItem'
import { usePermission, setPermissions } from './composables/usePermission'
import { useTable } from './composables/useTable'
import { useClipboard } from './composables/useClipboard'
import { useFullscreen } from './composables/useFullscreen'
import { useSafeArea, ensureViewportFit } from './composables/useSafeArea'

// ─── Utils ───
import { avatarColor } from './utils/avatarColor'
import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  mixHex,
  generatePrimaryRamp,
  setPrimaryColor,
  setDensity,
  getDensity,
} from './utils/theme'
// ─── 格式化工具 ───
import {
  formatNumber,
  formatFileSize,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatPercent,
} from './utils/format'

// ─── Constants ───
import { BREAKPOINTS } from './constants'

// ─── Component Registry ───
const components = {
  // 基础
  EvButton,
  EvButtonGroup,
  EvIcon,
  EvConfigProvider,
  // 表单与基础
  EvInput,
  EvTextarea,
  EvTag,
  EvSpin,
  EvAlert,
  EvDivider,
  EvSkeleton,
  EvSkeletonItem,
  EvSkeletonButton,
  EvSkeletonAvatar,
  EvSkeletonInput,
  EvSkeletonImage,
  EvRadio,
  EvRadioGroup,
  EvRadioButton,
  EvCheckbox,
  EvCheckboxGroup,
  EvCheckboxButton,
  EvSwitch,
  EvInputNumber,
  EvForm,
  EvFormItem,
  EvDialog,
  // 浮层与选择器
  EvPopper,
  EvTooltip,
  EvPopover,
  EvPopconfirm,
  EvSelect,
  EvOption,
  EvOptionGroup,
  EvDropdown,
  EvDropdownMenu,
  EvDropdownItem,
  EvTabs,
  EvTabPane,
  EvDrawer,
  EvPagination,
  EvAvatar,
  EvAvatarGroup,
  EvBadge,
  EvProgress,
  EvEmpty,
  EvImageViewer,
  // 数据组件
  EvTable,
  EvTableColumn,
  EvTree,
  EvTreeSelect,
  EvDatePicker,
  EvTimePicker,
  EvTimeSelect,
  EvCascader,
  // 通用组件
  EvBreadcrumb,
  EvBreadcrumbItem,
  EvLink,
  EvText,
  EvCollapse,
  EvCollapseItem,
  EvDescriptions,
  EvDescriptionsItem,
  EvSteps,
  EvStep,
  EvCard,
  EvImage,
  EvBacktop,
  EvAffix,
  EvRate,
  EvSlider,
  EvColorPicker,
  EvColorPickerPanel,
  EvMenu,
  EvMenuItem,
  EvSubMenu,
  EvMenuItemGroup,
  EvTimeline,
  EvTimelineItem,
  EvResult,
  EvWatermark,
  EvEmptyState,
  EvSegmented,
  EvContainer,
  EvHeader,
  EvAside,
  EvMain,
  EvFooter,
  EvRow,
  EvCol,
  EvSpace,
  EvScrollbar,
  EvStack,
  EvSplitter,
  EvSplitterPanel,
  EvUpload,
  EvCalendar,
  EvBorderBeam,
  EvCreditsProgress,
  EvGanttProgress,
  EvJsonViewer,
  EvAppLayout,
  EvAppToolbar,
  EvPageHeader,
  EvSectionCard,
  EvStatCard,
  EvStatRow,
  EvTransfer,
  EvCarousel,
  EvCarouselItem,
  EvCascaderPanel,
  EvCommandPalette,
  EvChart,
  EvChatbot,
  EvChatList,
  EvChatMessage,
  EvChatSender,
  EvChatContent,
  EvChatMarkdown,
  EvChatThinking,
  EvChatLoading,
  EvChatActionbar,
  EvChatAttachments,
  EvStatusTag,
  EvCellStack,
  EvDetailDescriptions,
  EvSearchFilter,
  EvDataTable,
  EvImportExportPanel,
  EvAuditTimeline,
  EvColumnSettings,
  // 增强组件
  EvVirtualList,
  EvListy: EvVirtualList,
  EvStatistic,
  EvAutoComplete,
  EvTour,
  EvQrcode,
  EvMention,
  EvFloatButton,
  EvFloatButtonGroup,
  EvComment,
  EvAuth,
  // 排版与锚点
  EvTitle,
  EvParagraph,
  EvAnchor,
  EvAnchorLink,
  // Components — Mobile 移动组件
  EvPullRefresh,
  EvLoadMore,
  EvActionSheet,
  EvTabbar,
  EvTabbarItem,
  EvNavBar,
}

// ─── Vue Plugin Install ───
function install(app, _options = {}) {
  // options.motion 签名保留：本库动效全走 CSS，无运行时开关
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
  // 命令式 API（provide + globalProperties 双轨注册）
  app.provide('$message', EvMessage)
  app.provide('$notify', EvNotify)
  app.provide('$msgbox', EvMsgbox)
  app.provide('$alert', EvMsgbox.alert)
  app.provide('$confirm', EvMsgbox.confirm)
  app.provide('$prompt', EvMsgbox.prompt)
  app.provide('$loading', EvLoading.service)

  app.config.globalProperties.$message = EvMessage
  app.config.globalProperties.$notify = EvNotify
  app.config.globalProperties.$msgbox = EvMsgbox
  app.config.globalProperties.$alert = EvMsgbox.alert
  app.config.globalProperties.$confirm = EvMsgbox.confirm
  app.config.globalProperties.$prompt = EvMsgbox.prompt
  app.config.globalProperties.$loading = EvLoading.service

  // 指令：v-loading / v-permission / v-copy / v-infinite-scroll
  app.directive('loading', createLoadingDirective())
  app.directive('permission', createPermissionDirective())
  app.directive('copy', createCopyDirective())
  app.directive('infinite-scroll', createInfiniteScrollDirective())
}

// ─── Exports ───
export {
  // 基础
  EvButton,
  EvButtonGroup,
  EvIcon,
  EvConfigProvider,
  // 表单与基础
  EvInput,
  EvTextarea,
  EvTag,
  EvSpin,
  EvAlert,
  EvDivider,
  EvSkeleton,
  EvSkeletonItem,
  EvSkeletonButton,
  EvSkeletonAvatar,
  EvSkeletonInput,
  EvSkeletonImage,
  EvRadio,
  EvRadioGroup,
  EvRadioButton,
  EvCheckbox,
  EvCheckboxGroup,
  EvCheckboxButton,
  EvSwitch,
  EvInputNumber,
  EvForm,
  EvFormItem,
  EvDialog,
  // 浮层与选择器
  EvPopper,
  EvTooltip,
  EvPopover,
  EvPopconfirm,
  EvSelect,
  EvOption,
  EvOptionGroup,
  EvDropdown,
  EvDropdownMenu,
  EvDropdownItem,
  EvTabs,
  EvTabPane,
  EvDrawer,
  EvPagination,
  EvAvatar,
  EvAvatarGroup,
  EvBadge,
  EvProgress,
  EvEmpty,
  EvImageViewer,
  // 数据组件
  EvTable,
  EvTableColumn,
  EvTree,
  EvTreeSelect,
  EvDatePicker,
  EvTimePicker,
  EvTimeSelect,
  EvCascader,
  // 通用组件（导航 / 展示）
  EvBreadcrumb,
  EvBreadcrumbItem,
  EvLink,
  EvText,
  EvCollapse,
  EvCollapseItem,
  EvDescriptions,
  EvDescriptionsItem,
  EvSteps,
  EvStep,
  // 卡片 / 图片 / 评分 / 滑块 / 取色器
  EvCard,
  EvImage,
  EvBacktop,
  EvAffix,
  EvRate,
  EvSlider,
  EvColorPicker,
  EvColorPickerPanel,
  // 菜单 / 时间线 / 结果 / 水印
  EvMenu,
  EvMenuItem,
  EvSubMenu,
  EvMenuItemGroup,
  EvTimeline,
  EvTimelineItem,
  EvResult,
  EvWatermark,
  EvEmptyState,
  EvSegmented,
  // 布局
  EvContainer,
  EvHeader,
  EvAside,
  EvMain,
  EvFooter,
  EvRow,
  EvCol,
  EvSpace,
  EvScrollbar,
  EvStack,
  // 分栏 / 上传 / 日历
  EvSplitter,
  EvSplitterPanel,
  EvUpload,
  EvCalendar,
  // 装饰与展示
  EvBorderBeam,
  EvCreditsProgress,
  EvGanttProgress,
  EvJsonViewer,
  // 应用框架
  EvAppLayout,
  EvAppToolbar,
  EvPageHeader,
  EvSectionCard,
  EvStatCard,
  EvStatRow,
  // 穿梭框 / 轮播 / 级联面板
  EvTransfer,
  EvCarousel,
  EvCarouselItem,
  EvCascaderPanel,
  // 命令面板
  EvCommandPalette,
  // 图表
  EvChart,
  // Chatbot 家族
  EvChatbot,
  EvChatList,
  EvChatMessage,
  EvChatSender,
  EvChatContent,
  EvChatMarkdown,
  EvChatThinking,
  EvChatLoading,
  EvChatActionbar,
  EvChatAttachments,
  // 业务组件
  EvStatusTag,
  EvCellStack,
  EvDetailDescriptions,
  EvSearchFilter,
  EvDataTable,
  EvImportExportPanel,
  EvAuditTimeline,
  EvColumnSettings,
  // 增强组件
  EvVirtualList,
  EvVirtualList as EvListy,
  EvStatistic,
  EvAutoComplete,
  EvTour,
  EvQrcode,
  EvMention,
  EvFloatButton,
  EvFloatButtonGroup,
  EvComment,
  EvAuth,
  // 排版与锚点
  EvTitle,
  EvParagraph,
  EvAnchor,
  EvAnchorLink,
  // Components — Mobile 移动组件
  EvPullRefresh,
  EvLoadMore,
  EvActionSheet,
  EvTabbar,
  EvTabbarItem,
  EvNavBar,
  // Command APIs
  EvMessage,
  EvMsgbox,
  EvNotify,
  EvLoading,
  // Icon Registry
  getIconByName,
  getIconByNameSync,
  registerIcons,
  getIconNames,
  registerFullIcons,
  loadFullIcons,
  isFullIconsLoaded,
  REMIX_ICON_META,
  REMIX_ICON_VERSION,
  // Directives
  createLoadingDirective,
  createPermissionDirective,
  createCopyDirective,
  createInfiniteScrollDirective,
  // Composables
  useDarkMode,
  useFloating,
  useClickOutside,
  useFocusTrap,
  useLockScroll,
  useFormItem,
  usePermission,
  setPermissions,
  useTable,
  useClipboard,
  useFullscreen,
  // Composables — 移动端安全区
  useSafeArea,
  ensureViewportFit,
  // QRCode 底层编码器
  encodeQR,
  QRCODE_MAX_BYTES,
  // Utils
  avatarColor,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  mixHex,
  generatePrimaryRamp,
  setPrimaryColor,
  setDensity,
  getDensity,
  // 格式化工具
  formatNumber,
  formatFileSize,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatPercent,
  // Constants
  BREAKPOINTS,
  // Install
  install,
  components,
}

export default { install }
