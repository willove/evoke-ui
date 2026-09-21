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
import EbButton from './components/button/index.vue'
import EbButtonGroup from './components/button/group.vue'
import EbIcon from './components/icon/index.vue'
import EbConfigProvider from './components/config-provider/index.vue'
import EbInput from './components/input/index.vue'
import EbTextarea from './components/textarea/index.vue'
import EbTag from './components/tag/index.vue'
import EbSpin from './components/spin/index.vue'
import EbAlert from './components/alert/index.vue'
import EbDivider from './components/divider/index.vue'
import EbSkeleton from './components/skeleton/index.vue'
import EbSkeletonItem from './components/skeleton/item.vue'
import EbSkeletonButton from './components/skeleton/skeleton-button.vue'
import EbSkeletonAvatar from './components/skeleton/skeleton-avatar.vue'
import EbSkeletonInput from './components/skeleton/skeleton-input.vue'
import EbSkeletonImage from './components/skeleton/skeleton-image.vue'
import EbRadio from './components/radio/index.vue'
import EbRadioGroup from './components/radio/group.vue'
import EbRadioButton from './components/radio/button.vue'
import EbCheckbox from './components/checkbox/index.vue'
import EbCheckboxGroup from './components/checkbox/group.vue'
import EbCheckboxButton from './components/checkbox/button.vue'
import EbSwitch from './components/switch-comp/index.vue'
import EbInputNumber from './components/input-number/index.vue'
import EbOtpInput from './components/otp-input/index.vue'
import EbForm from './components/form/index.vue'
import EbFormItem from './components/form/item.vue'
import EbDialog from './components/dialog/index.vue'
// 浮层与选择器
import EbPopper from './components/popper/index.vue'
import EbTooltip from './components/tooltip/index.vue'
import EbPopover from './components/popover/index.vue'
import EbPopconfirm from './components/popconfirm/index.vue'
import EbSelect from './components/select/index.vue'
import EbOption from './components/select/option.vue'
import EbOptionGroup from './components/select/option-group.vue'
import EbDropdown from './components/dropdown/index.vue'
import EbDropdownMenu from './components/dropdown/menu.vue'
import EbDropdownItem from './components/dropdown/item.vue'
import EbContextMenu from './components/context-menu/index.vue'
import EbTabs from './components/tabs/index.vue'
import EbTabPane from './components/tabs/pane.vue'
import EbDrawer from './components/drawer/index.vue'
import EbPagination from './components/pagination/index.vue'
import EbAvatar from './components/avatar/index.vue'
import EbAvatarGroup from './components/avatar/group.vue'
import EbBadge from './components/badge/index.vue'
import EbProgress from './components/progress/index.vue'
import EbEmpty from './components/empty/index.vue'
import EbImageViewer from './components/image-viewer/index.vue'
// 数据组件（表格 / 树 / 日期时间 / 级联）
import EbTable from './components/table/index.vue'
import EbTableColumn from './components/table/column.vue'
import EbTree from './components/tree/index.vue'
import EbTreeSelect from './components/tree-select/index.vue'
import EbDatePicker from './components/date-picker/index.vue'
import EbTimePicker from './components/time-picker/index.vue'
import EbTimeSelect from './components/time-select/index.vue'
import EbCascader from './components/cascader/index.vue'
// 其余通用组件
import EbBreadcrumb from './components/breadcrumb/index.vue'
import EbBreadcrumbItem from './components/breadcrumb/item.vue'
import EbLink from './components/link/index.vue'
import EbText from './components/text/index.vue'
import EbCollapse from './components/collapse/index.vue'
import EbCollapseItem from './components/collapse/item.vue'
import EbDescriptions from './components/descriptions/index.vue'
import EbDescriptionsItem from './components/descriptions/item.vue'
import EbSteps from './components/steps/index.vue'
import EbStep from './components/steps/item.vue'
import EbCard from './components/card/index.vue'
import EbImage from './components/image/index.vue'
import EbBacktop from './components/backtop/index.vue'
import EbAffix from './components/affix/index.vue'
import EbRate from './components/rate/index.vue'
import EbSlider from './components/slider/index.vue'
import EbColorPicker from './components/color-picker/index.vue'
import EbColorPickerPanel from './components/color-picker/panel.vue'
import EbMenu from './components/menu/index.vue'
import EbMenuItem from './components/menu/item.vue'
import EbSubMenu from './components/menu/sub-menu.vue'
import EbMenuItemGroup from './components/menu/item-group.vue'
import EbTimeline from './components/timeline/index.vue'
import EbTimelineItem from './components/timeline/item.vue'
import EbResult from './components/result/index.vue'
import EbWatermark from './components/watermark/index.vue'
import EbEmptyState from './components/empty-state/index.vue'
import EbSegmented from './components/segmented/index.vue'
import EbContainer from './components/container/index.vue'
import EbHeader from './components/header/index.vue'
import EbAside from './components/aside/index.vue'
import EbMain from './components/main/index.vue'
import EbFooter from './components/footer/index.vue'
import EbRow from './components/row/index.vue'
import EbCol from './components/col/index.vue'
import EbSpace from './components/space/index.vue'
import EbScrollbar from './components/scrollbar/index.vue'
import EbStack from './components/stack/index.vue'
import EbSplitter from './components/splitter/index.vue'
import EbSplitterPanel from './components/splitter/panel.vue'
import EbUpload from './components/upload/index.vue'
import EbCalendar from './components/calendar/index.vue'
import EbBorderBeam from './components/border-beam/index.vue'
import EbCreditsProgress from './components/credits-progress/index.vue'
import EbGanttProgress from './components/gantt-progress/index.vue'
import EbJsonViewer from './components/json-viewer/index.vue'
import EbAppLayout from './components/app-layout/index.vue'
import EbAppToolbar from './components/app-toolbar/index.vue'
import EbPageHeader from './components/page-header/index.vue'
import EbSectionCard from './components/section-card/index.vue'
import EbStatCard from './components/stat-card/index.vue'
import EbStatRow from './components/stat-row/index.vue'
import EbTransfer from './components/transfer/index.vue'
import EbCarousel from './components/carousel/index.vue'
import EbCarouselItem from './components/carousel/item.vue'
import EbCascaderPanel from './components/cascader-panel/index.vue'
import EbCommandPalette from './components/command-palette/index.vue'
// Chatbot 家族
import EbChatbot from './components/chatbot/Chatbot.vue'
import EbChatList from './components/chatbot/ChatList.vue'
import EbChatMessage from './components/chatbot/ChatMessage.vue'
import EbChatSender from './components/chatbot/ChatSender.vue'
import EbChatContent from './components/chatbot/ChatContent.vue'
import EbChatMarkdown from './components/chatbot/ChatMarkdown.vue'
import EbChatThinking from './components/chatbot/ChatThinking.vue'
import EbChatLoading from './components/chatbot/ChatLoading.vue'
import EbChatActionbar from './components/chatbot/ChatActionbar.vue'
import EbChatAttachments from './components/chatbot/ChatAttachments.vue'
import EbChatSuggestion from './components/chatbot/ChatSuggestion.vue'
import EbChatFeedback from './components/chatbot/ChatFeedback.vue'
import EbChatMessageEdit from './components/chatbot/ChatMessageEdit.vue'
import EbChatSources from './components/chatbot/ChatSources.vue'
import EbChatToolCall from './components/chatbot/ChatToolCall.vue'
import EbChatThreads from './components/chatbot/ChatThreads.vue'
import EbChatWidget from './components/chatbot/ChatWidget.vue'
import EbChatPlan from './components/chatbot/ChatPlan.vue'
import EbChatConfirmation from './components/chatbot/ChatConfirmation.vue'
import EbChatArtifact from './components/chatbot/ChatArtifact.vue'
import EbChatDiff from './components/chatbot/ChatDiff.vue'
import EbChatTerminal from './components/chatbot/ChatTerminal.vue'
import EbChatFileTree from './components/chatbot/ChatFileTree.vue'
import EbChatShare from './components/chatbot/ChatShare.vue'
import EbChatSpeak from './components/chatbot/ChatSpeak.vue'
import EbChatVoiceInput from './components/chatbot/ChatVoiceInput.vue'
import EbChatQueue from './components/chatbot/ChatQueue.vue'
import EbChatCommandMenu from './components/chatbot/ChatCommandMenu.vue'
import EbChatUsage from './components/chatbot/ChatUsage.vue'
import EbChatTestResults from './components/chatbot/ChatTestResults.vue'
import EbChatStackTrace from './components/chatbot/ChatStackTrace.vue'
export { useChatEngine } from './components/chatbot/useChatEngine'
export { useChatSessions } from './components/chatbot/useChatSessions'
export { useTriggerMenu } from './composables/useTriggerMenu'
// 对话正文渲染的配置面：协议白名单 / 主题色 / 追加高亮语言
export {
  configureChatMarkdown,
  getChatMarkdownConfig,
  renderChatMarkdown,
  registerHighlightLanguage,
} from './components/chatbot/chatMarkdown'
export { chatLabels } from './components/chatbot/labels'
// 业务组件
import EbStatusTag from './components/status-tag/index.vue'
import EbCellStack from './components/cell-stack/index.vue'
import EbDetailDescriptions from './components/detail-descriptions/index.vue'
import EbSearchFilter from './components/search-filter/index.vue'
import EbDataTable from './components/data-table/index.vue'
import EbTablePage from './components/table-page/index.vue'
import EbImportExportPanel from './components/import-export-panel/index.vue'
import EbAuditTimeline from './components/audit-timeline/index.vue'
import EbColumnSettings from './components/column-settings/index.vue'
// 增强组件（虚拟滚动 / 联想 / 引导 / 二维码等）
import EbVirtualList from './components/virtual-list/index.vue'
// EbListy 为 EbVirtualList 的别名注册
import EbAutoComplete from './components/auto-complete/index.vue'
import EbTour from './components/tour/index.vue'
import EbQrcode from './components/qrcode/index.vue'
import EbMention from './components/mention/index.vue'
import EbStatistic from './components/statistic/index.vue'
import EbCountdown from './components/countdown/index.vue'
import EbAiPromptBox from './components/ai-prompt-box/index.vue'
import EbAiConsole from './components/ai-console/index.vue'
import EbFloatButton from './components/float-button/index.vue'
import EbFloatButtonGroup from './components/float-button/group.vue'
import EbComment from './components/comment/index.vue'
import EbAuth from './components/auth/index.vue'
import { encodeQR, QRCODE_MAX_BYTES } from './components/qrcode/qrcode'
// 排版与锚点
import EbTitle from './components/typography/title.vue'
import EbParagraph from './components/typography/paragraph.vue'
import EbAnchor from './components/anchor/index.vue'
import EbAnchorLink from './components/anchor/link.vue'

// ─── Mobile 移动组件 ───
import EbPullRefresh from './components/pull-refresh/index.vue'
import EbLoadMore from './components/load-more/index.vue'
import EbActionSheet from './components/action-sheet/index.vue'
import EbTabbar from './components/tabbar/index.vue'
import EbTabbarItem from './components/tabbar/item.vue'
import EbNavBar from './components/nav-bar/index.vue'

// ─── 图表（独立包 @wil-works/evoke-charts，以 EbChart 别名提供） ───
import { EvChart } from '@wil-works/evoke-charts'

// ─── Command APIs ───
import { EbMessage } from './components/message'
import { EbMsgbox } from './components/msgbox'
import { EbNotify } from './components/notify'
import { EbLoading, createLoadingDirective } from './components/loading'

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
  generateColorRamp,
  generatePrimaryRamp,
  setPrimaryColor,
  setSemanticColors,
  setSeriesPalette,
  clearSeriesPalette,
  getSeriesPalette,
  resetTheme,
  getPrimaryColor,
  saveThemeConfig,
  loadThemeConfig,
  clearThemeConfig,
  EB_THEME_PRESETS,
  setDensity,
  getDensity,
  setRipple,
  getRipple,
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
  EbButton,
  EbButtonGroup,
  EbIcon,
  EbConfigProvider,
  // 表单与基础
  EbInput,
  EbTextarea,
  EbTag,
  EbSpin,
  EbAlert,
  EbDivider,
  EbSkeleton,
  EbSkeletonItem,
  EbSkeletonButton,
  EbSkeletonAvatar,
  EbSkeletonInput,
  EbSkeletonImage,
  EbRadio,
  EbRadioGroup,
  EbRadioButton,
  EbCheckbox,
  EbCheckboxGroup,
  EbCheckboxButton,
  EbSwitch,
  EbInputNumber,
  EbOtpInput,
  EbForm,
  EbFormItem,
  EbDialog,
  // 浮层与选择器
  EbPopper,
  EbTooltip,
  EbPopover,
  EbPopconfirm,
  EbSelect,
  EbOption,
  EbOptionGroup,
  EbDropdown,
  EbDropdownMenu,
  EbDropdownItem,
  EbContextMenu,
  EbTabs,
  EbTabPane,
  EbDrawer,
  EbPagination,
  EbAvatar,
  EbAvatarGroup,
  EbBadge,
  EbProgress,
  EbEmpty,
  EbImageViewer,
  // 数据组件
  EbTable,
  EbTableColumn,
  EbTree,
  EbTreeSelect,
  EbDatePicker,
  EbTimePicker,
  EbTimeSelect,
  EbCascader,
  // 通用组件
  EbBreadcrumb,
  EbBreadcrumbItem,
  EbLink,
  EbText,
  EbCollapse,
  EbCollapseItem,
  EbDescriptions,
  EbDescriptionsItem,
  EbSteps,
  EbStep,
  EbCard,
  EbImage,
  EbBacktop,
  EbAffix,
  EbRate,
  EbSlider,
  EbColorPicker,
  EbColorPickerPanel,
  EbMenu,
  EbMenuItem,
  EbSubMenu,
  EbMenuItemGroup,
  EbTimeline,
  EbTimelineItem,
  EbResult,
  EbWatermark,
  EbEmptyState,
  EbSegmented,
  EbContainer,
  EbHeader,
  EbAside,
  EbMain,
  EbFooter,
  EbRow,
  EbCol,
  EbSpace,
  EbScrollbar,
  EbStack,
  EbSplitter,
  EbSplitterPanel,
  EbUpload,
  EbCalendar,
  EbBorderBeam,
  EbCreditsProgress,
  EbGanttProgress,
  EbJsonViewer,
  EbAppLayout,
  EbAppToolbar,
  EbPageHeader,
  EbSectionCard,
  EbStatCard,
  EbStatRow,
  EbTransfer,
  EbCarousel,
  EbCarouselItem,
  EbCascaderPanel,
  EbCommandPalette,
  EbChatbot,
  EbChatList,
  EbChatMessage,
  EbChatSender,
  EbChatContent,
  EbChatMarkdown,
  EbChatThinking,
  EbChatLoading,
  EbChatActionbar,
  EbChatAttachments,
  EbChatSuggestion,
  EbChatFeedback,
  EbChatMessageEdit,
  EbChatSources,
  EbChatToolCall,
  EbChatThreads,
  EbChatWidget,
  EbChatPlan,
  EbChatConfirmation,
  EbChatArtifact,
  EbChatDiff,
  EbChatTerminal,
  EbChatFileTree,
  EbChatShare,
  EbChatSpeak,
  EbChatVoiceInput,
  EbChatQueue,
  EbChatCommandMenu,
  EbChatUsage,
  EbChatTestResults,
  EbChatStackTrace,
  EbStatusTag,
  EbCellStack,
  EbDetailDescriptions,
  EbSearchFilter,
  EbDataTable,
  EbTablePage,
  EbImportExportPanel,
  EbAuditTimeline,
  EbColumnSettings,
  // 增强组件
  EbVirtualList,
  EbListy: EbVirtualList,
  EbStatistic,
  EbCountdown,
  EbAiPromptBox,
  EbAiConsole,
  EbAutoComplete,
  EbTour,
  EbQrcode,
  EbMention,
  EbFloatButton,
  EbFloatButtonGroup,
  EbComment,
  EbAuth,
  // 排版与锚点
  EbTitle,
  EbParagraph,
  EbAnchor,
  EbAnchorLink,
  // Components — Mobile 移动组件
  EbPullRefresh,
  EbLoadMore,
  EbActionSheet,
  EbTabbar,
  EbTabbarItem,
  EbNavBar,
  // 图表（evoke-charts 独立包，EvChart / EbChart 双注册名）
  EvChart: EvChart,
  EbChart: EvChart,
}

// ─── Vue Plugin Install ───
function install(app, _options = {}) {
  // options.motion 签名保留：本库动效全走 CSS，无运行时开关
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
  // 命令式 API（provide + globalProperties 双轨注册）
  app.provide('$message', EbMessage)
  app.provide('$notify', EbNotify)
  app.provide('$msgbox', EbMsgbox)
  app.provide('$alert', EbMsgbox.alert)
  app.provide('$confirm', EbMsgbox.confirm)
  app.provide('$prompt', EbMsgbox.prompt)
  app.provide('$loading', EbLoading.service)

  app.config.globalProperties.$message = EbMessage
  app.config.globalProperties.$notify = EbNotify
  app.config.globalProperties.$msgbox = EbMsgbox
  app.config.globalProperties.$alert = EbMsgbox.alert
  app.config.globalProperties.$confirm = EbMsgbox.confirm
  app.config.globalProperties.$prompt = EbMsgbox.prompt
  app.config.globalProperties.$loading = EbLoading.service

  // 指令：v-loading / v-permission / v-copy / v-infinite-scroll
  app.directive('loading', createLoadingDirective())
  app.directive('permission', createPermissionDirective())
  app.directive('copy', createCopyDirective())
  app.directive('infinite-scroll', createInfiniteScrollDirective())
}

// ─── Exports ───
export {
  // 基础
  EbButton,
  EbButtonGroup,
  EbIcon,
  EbConfigProvider,
  // 表单与基础
  EbInput,
  EbTextarea,
  EbTag,
  EbSpin,
  EbAlert,
  EbDivider,
  EbSkeleton,
  EbSkeletonItem,
  EbSkeletonButton,
  EbSkeletonAvatar,
  EbSkeletonInput,
  EbSkeletonImage,
  EbRadio,
  EbRadioGroup,
  EbRadioButton,
  EbCheckbox,
  EbCheckboxGroup,
  EbCheckboxButton,
  EbSwitch,
  EbInputNumber,
  EbOtpInput,
  EbForm,
  EbFormItem,
  EbDialog,
  // 浮层与选择器
  EbPopper,
  EbTooltip,
  EbPopover,
  EbPopconfirm,
  EbSelect,
  EbOption,
  EbOptionGroup,
  EbDropdown,
  EbDropdownMenu,
  EbDropdownItem,
  EbContextMenu,
  EbTabs,
  EbTabPane,
  EbDrawer,
  EbPagination,
  EbAvatar,
  EbAvatarGroup,
  EbBadge,
  EbProgress,
  EbEmpty,
  EbImageViewer,
  // 数据组件
  EbTable,
  EbTableColumn,
  EbTree,
  EbTreeSelect,
  EbDatePicker,
  EbTimePicker,
  EbTimeSelect,
  EbCascader,
  // 通用组件（导航 / 展示）
  EbBreadcrumb,
  EbBreadcrumbItem,
  EbLink,
  EbText,
  EbCollapse,
  EbCollapseItem,
  EbDescriptions,
  EbDescriptionsItem,
  EbSteps,
  EbStep,
  // 卡片 / 图片 / 评分 / 滑块 / 取色器
  EbCard,
  EbImage,
  EbBacktop,
  EbAffix,
  EbRate,
  EbSlider,
  EbColorPicker,
  EbColorPickerPanel,
  // 菜单 / 时间线 / 结果 / 水印
  EbMenu,
  EbMenuItem,
  EbSubMenu,
  EbMenuItemGroup,
  EbTimeline,
  EbTimelineItem,
  EbResult,
  EbWatermark,
  EbEmptyState,
  EbSegmented,
  // 布局
  EbContainer,
  EbHeader,
  EbAside,
  EbMain,
  EbFooter,
  EbRow,
  EbCol,
  EbSpace,
  EbScrollbar,
  EbStack,
  // 分栏 / 上传 / 日历
  EbSplitter,
  EbSplitterPanel,
  EbUpload,
  EbCalendar,
  // 装饰与展示
  EbBorderBeam,
  EbCreditsProgress,
  EbGanttProgress,
  EbJsonViewer,
  // 应用框架
  EbAppLayout,
  EbAppToolbar,
  EbPageHeader,
  EbSectionCard,
  EbStatCard,
  EbStatRow,
  // 穿梭框 / 轮播 / 级联面板
  EbTransfer,
  EbCarousel,
  EbCarouselItem,
  EbCascaderPanel,
  // 命令面板
  EbCommandPalette,
  // Chatbot 家族
  EbChatbot,
  EbChatList,
  EbChatMessage,
  EbChatSender,
  EbChatContent,
  EbChatMarkdown,
  EbChatThinking,
  EbChatLoading,
  EbChatActionbar,
  EbChatAttachments,
  EbChatSuggestion,
  EbChatFeedback,
  EbChatMessageEdit,
  EbChatSources,
  EbChatToolCall,
  EbChatThreads,
  EbChatWidget,
  EbChatPlan,
  EbChatConfirmation,
  EbChatArtifact,
  EbChatDiff,
  EbChatTerminal,
  EbChatFileTree,
  EbChatShare,
  EbChatSpeak,
  EbChatVoiceInput,
  EbChatQueue,
  EbChatCommandMenu,
  EbChatUsage,
  EbChatTestResults,
  EbChatStackTrace,
  // 业务组件
  EbStatusTag,
  EbCellStack,
  EbDetailDescriptions,
  EbSearchFilter,
  EbDataTable,
  EbTablePage,
  EbImportExportPanel,
  EbAuditTimeline,
  EbColumnSettings,
  // 增强组件
  EbVirtualList,
  EbVirtualList as EbListy,
  EbStatistic,
  EbCountdown,
  EbAiPromptBox,
  EbAiConsole,
  EbAutoComplete,
  EbTour,
  EbQrcode,
  EbMention,
  EbFloatButton,
  EbFloatButtonGroup,
  EbComment,
  EbAuth,
  // 排版与锚点
  EbTitle,
  EbParagraph,
  EbAnchor,
  EbAnchorLink,
  // Components — Mobile 移动组件
  EbPullRefresh,
  EbLoadMore,
  EbActionSheet,
  EbTabbar,
  EbTabbarItem,
  EbNavBar,
  // 图表（evoke-charts 独立包别名）
  EvChart as EbChart,
  // Command APIs
  EbMessage,
  EbMsgbox,
  EbNotify,
  EbLoading,
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
  generateColorRamp,
  generatePrimaryRamp,
  setPrimaryColor,
  setSemanticColors,
  setSeriesPalette,
  clearSeriesPalette,
  getSeriesPalette,
  resetTheme,
  getPrimaryColor,
  saveThemeConfig,
  loadThemeConfig,
  clearThemeConfig,
  EB_THEME_PRESETS,
  setDensity,
  getDensity,
  setRipple,
  getRipple,
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
