/**
 * EtScreenTip 单例登记表（跨实例共享的模块状态）
 *
 * 为什么是独立模块而不是 <script setup> 顶层声明：<script setup> 的顶层代码编译后
 * 都在 setup() 函数体内，每个实例各执行一遍 —— 放在那里"同屏只开一个"会退化成
 * "每个实例自己管自己"，第二个提示弹出时第一个根本收不掉。
 */

/** 已发起显示（含 show-after 延时窗口内）的实例句柄：{ dismiss } */
const liveTips = new Set()

/** 最近一次显示请求的时间戳（热显判定） */
let lastRequestAt = 0

/** 登记本实例为"已发起显示" */
export function registerTip(handle) {
  liveTips.add(handle)
}

/** 收起除自己以外所有已发起显示的实例（单例：同屏只开一个提示） */
export function dismissOtherTips(self) {
  for (const other of liveTips) {
    if (other !== self) other.dismiss()
  }
}

/** 退登（淡出结束或卸载时调用） */
export function releaseTip(handle) {
  liveTips.delete(handle)
}

/** 当前是否处于热显窗口内（一次提示之后 window 毫秒内的再触发） */
export function withinHotWindow(window) {
  return Date.now() - lastRequestAt <= window
}

/** 记一次显示请求的时间戳 */
export function markTipRequest() {
  lastRequestAt = Date.now()
}

/**
 * 测试专用：清空登记表与热显时间戳。
 * 模块状态是单例的载体，但会让跨用例的首显 / 热显判定互相污染
 * （上一个用例的请求还在 1 秒热显窗口内，下一个用例的首显就变热显了）。
 */
export function resetTipRegistry() {
  liveTips.clear()
  lastRequestAt = 0
}
