/**
 * 通用常量
 */

/** 组件尺寸三档 */
export const SIZE_MAP = {
  small: 'small',
  default: 'default',
  large: 'large',
}

/** 尺寸对应控件高度（px） */
export const COMPONENT_SIZE = {
  small: 24,
  default: 32,
  large: 40,
}

/** 响应式断点 */
export const BREAKPOINTS = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 }

/** DatePicker 类型 */
export const DATE_PICKER_TYPES = [
  'year',
  'years',
  'month',
  'months',
  'date',
  'dates',
  'week',
  'datetime',
  'datetimerange',
  'daterange',
  'monthrange',
]

/** Message 类型 */
export const MESSAGE_TYPES = ['success', 'warning', 'info', 'error']

/** Tag 类型 */
export const TAG_TYPES = ['primary', 'success', 'info', 'warning', 'danger']

/** 弹窗对齐方式 */
export const DIALOG_ALIGNS = ['flex-start', 'center', 'flex-end']
