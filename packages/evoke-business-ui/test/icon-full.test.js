import { describe, it, expect } from 'vitest'
import {
  getIconByNameSync,
  getIconByName,
  registerFullIcons,
  isFullIconsLoaded,
  getIconNames,
} from '../src/components/icon/iconRegistry'
import { remixFullPaths } from '../src/components/icon/remix-full-paths'

describe('完整图标库（Remix 全量原生命名）', () => {
  it('全量数据规模（3000+，line/fill 全风格）', () => {
    expect(Object.keys(remixFullPaths).length).toBeGreaterThan(3000)
    expect(remixFullPaths['arrow-down-s-line']).toBeDefined()
    expect(remixFullPaths['close-circle-fill']).toBeDefined()
  })

  it('注册后原生命名经同步 API 解析，核心兼容名不受影响', () => {
    registerFullIcons(remixFullPaths)
    expect(isFullIconsLoaded()).toBe(true)
    expect(getIconByNameSync('checkbox-multiple-line')).toBeDefined()
    // 核心集历史兼容别名继续可用
    expect(getIconByNameSync('caret-right')).toBeDefined()
    expect(getIconByNameSync('CircleCheckFilled')).toBeDefined()
  })

  it('getIconNames("full") 返回全量键；all 计算包含全量', () => {
    expect(getIconNames('full').length).toBeGreaterThan(3000)
    expect(getIconNames('all').length).toBeGreaterThanOrEqual(getIconNames('full').length)
  })

  it('getIconByName 异步命中全量库图标', async () => {
    const comp = await getIconByName('zoom-in-line')
    expect(comp).toBeDefined()
  })

  it('已知不存在的名字经异步路径仍返回 undefined（负缓存不抛错）', async () => {
    expect(await getIconByName('definitely-not-a-real-icon-xyz')).toBeUndefined()
  })
})
