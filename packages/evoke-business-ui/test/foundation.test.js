import { describe, it, expect } from 'vitest'
import { nextZIndex, resetZIndex, currentZIndex } from '../src/utils/zIndex'
import { avatarColor } from '../src/utils/avatarColor'
import { BREAKPOINTS } from '../src/constants'
import { zhCN, en } from '../src/locale'

describe('zIndex 管理器', () => {
  it('计数器递增且互不重复', () => {
    resetZIndex(2000)
    expect(nextZIndex()).toBe(2001)
    expect(nextZIndex()).toBe(2002)
    expect(currentZIndex()).toBe(2002)
  })
})

describe('avatarColor', () => {
  it('同名生成稳定颜色', () => {
    expect(avatarColor('张三')).toBe(avatarColor('张三'))
    expect(avatarColor('张三')).not.toBe(avatarColor('李四'))
  })

  it('返回合法色值', () => {
    expect(avatarColor('test')).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('常量与 locale', () => {
  it('BREAKPOINTS 与 evoke-ui 一致', () => {
    expect(BREAKPOINTS).toEqual({ xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 })
  })

  it('locale 包含核心文案（eb 命名空间键路径）', () => {
    expect(zhCN.eb.select.placeholder).toBe('请选择')
    expect(zhCN.eb.pagination.total).toBe('共 {total} 条')
    expect(zhCN.eb.table.emptyText).toBe('暂无数据')
    expect(en.eb.select.placeholder).toBe('Select')
  })
})
