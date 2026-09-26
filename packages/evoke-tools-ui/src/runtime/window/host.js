/**
 * 宿主与平台探测契约（tools-ui 计划 05 L4 / M3 交付物 1·验收：双宿主标题栏）
 *
 * EtTitleBar 的窗口控制位"Web 无 / 桌面壳有"、mac 左侧 traffic lights / Win 右侧
 * 三联钮——这是宿主×平台的二维矩阵，抽成纯函数后：
 *   · 组件只查表渲染，不写 if-else 散落；
 *   · 测试可在 jsdom 里断言全矩阵（不需要两台真机两个 Electron）。
 */

/** 宿主：web = 浏览器标签页；desktop = 桌面壳（Tauri/Electron） */
export const HOSTS = ['web', 'desktop']

/** 桌面壳下的控制位布局：macOS 左侧 traffic lights；Windows/Linux 右侧三联钮 */
export function windowControlPlacement(host, platform) {
  if (host !== 'desktop') return 'none' // Web 宿主：无窗口控制位（浏览器自己的 chrome 管）
  if (platform === 'mac') return 'left'
  if (platform === 'windows' || platform === 'linux') return 'right'
  return 'right' // 未知桌面平台按右侧保险值
}

/**
 * 平台探测：UA + navigator.userAgentData（Win 新 UA 策略下 platform 为空，
 * 必须看 UAHP 的 platform 字段；data-attr 优先——宿主可显式覆盖供测试用）。
 * @param {Navigator} [nav]
 * @param {string} [dataHostAttr] documentElement 的 data-host（'web'|'desktop'）
 */
export function detectPlatform(nav = typeof navigator !== 'undefined' ? navigator : {}, dataHostAttr) {
  const ua = nav.userAgent || ''
  const host = dataHostAttr === 'web' || dataHostAttr === 'desktop' ? dataHostAttr : /Tauri|Electron/i.test(ua) ? 'desktop' : 'web'
  // 平台探测：userAgentData（UAHP）优先——Win 冻结 UA 后 navigator.platform 为空，
  // 桌面壳与 Web 宿主都走同一条优先级（UAHP → UA 正则 → 保险值 windows）
  const flag = (nav.userAgentData || {}).platform || ''
  if (flag === 'macOS') return { host, platform: 'mac' }
  if (flag === 'Windows') return { host, platform: 'windows' }
  if (flag === 'Linux') return { host, platform: 'linux' }
  const platform = /Mac|iPhone|iPad/i.test(ua) ? 'mac' : /Linux/i.test(ua) ? 'linux' : 'windows'
  return { host, platform }
}

/** 标题栏窗口控制位声明（顺序 = 渲染顺序；Mac 左序 traffic lights） */
export const WINDOW_CONTROLS = {
  mac: ['close', 'minimize', 'maximize'],
  windows: ['minimize', 'maximize', 'close'],
  linux: ['minimize', 'maximize', 'close'],
}
