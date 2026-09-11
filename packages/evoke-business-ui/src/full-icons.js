/**
 * 完整图标库入口（'@wil-works/evoke-business-ui/full-icons'）
 *
 * 引入 Remix Icon 全量 3229 个图标（原生命名，line/fill 全风格，Remix Icon License v1.0）。
 * 数据体积约 1.6MB，独立于此入口，不使用则不进消费端产物。
 *
 * 用法一（应用启动后台预载）:
 *   import { loadFullIcons } from '@wil-works/evoke-business-ui/full-icons'
 *   loadFullIcons() // 不阻塞启动，完成后全部图标可同步渲染
 *
 * 用法二（图标选择器打开时再加载）:
 *   await loadFullIcons()
 *
 * 加载后 eb-icon 直接使用 Remix 原生名称（如 name="checkbox-multiple-line"），
 * 也可通过 getIconNames('full') 枚举全部名称。
 */
import { registerFullIcons } from './components/icon/iconRegistry'
import { remixFullPaths } from './components/icon/remix-full-paths'

let loaded = false

/** 注册全量图标库（幂等，重复调用只注册一次）；返回注册的图标数量 */
export function loadFullIcons() {
  if (!loaded) {
    registerFullIcons(remixFullPaths)
    loaded = true
  }
  return Object.keys(remixFullPaths).length
}

export { remixFullPaths }
