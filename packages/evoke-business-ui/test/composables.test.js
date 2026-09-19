import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import {
  usePermission,
  setPermissions,
  useTable,
  useClipboard,
  createPermissionDirective,
} from '../src/index'

/**
 * B 端生态：权限（usePermission / v-permission / EbAuth）、useTable、useClipboard
 */

describe('usePermission', () => {
  beforeEach(() => {
    setPermissions(['sys:user:list', 'sys:user:delete', 'sys:*', 'report:read'])
  })

  it('精确匹配与通配', () => {
    const { has } = usePermission()
    expect(has('sys:user:list')).toBe(true)
    expect(has('sys:order:export')).toBe(true) // 命中 'sys:*'
    expect(has('sys:order:delete')).toBe(true)
    expect(has('other:thing')).toBe(false)
  })

  it('数组任一满足 + 自定义函数', () => {
    const { has } = usePermission()
    expect(has(['report:read', 'nope:x'])).toBe(true)
    expect(has(['nope:a', 'nope:b'])).toBe(false)
    expect(has((perms) => perms.length >= 4)).toBe(true)
    expect(has(null)).toBe(true)
  })

  it('hasAll 语义', () => {
    const { hasAll } = usePermission()
    expect(hasAll(['sys:user:list', 'report:read'])).toBe(true)
    expect(hasAll(['sys:user:list', 'nope:x'])).toBe(false)
  })

  it('setPermissions 热更新', () => {
    const { has } = usePermission()
    expect(has('a:b')).toBe(false)
    setPermissions(['a:b'])
    expect(has('a:b')).toBe(true)
  })
})

describe('v-permission 指令', () => {
  function mountWithPermission(permission, content = 'secret') {
    const Host = defineComponent({
      props: { permission: { type: null, default: null } },
      template: `<div><button v-permission="permission">{{ text }}</button></div>`,
      data: () => ({ text: content }),
    })
    return mount(Host, {
      props: { permission },
      global: {
        directives: { permission: createPermissionDirective() },
      },
    })
  }

  beforeEach(() => {
    setPermissions(['admin:write'])
  })

  it('有权限：元素保留', () => {
    const wrapper = mountWithPermission('admin:write')
    expect(wrapper.text()).toContain('secret')
  })

  it('无权限：默认移除元素', () => {
    const wrapper = mountWithPermission('admin:delete')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('无权限 disable 模式：保留并禁用', () => {
    setPermissions([])
    const wrapper = mountWithPermission({ has: 'admin:write', mode: 'disable' })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('is-permission-disabled')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('权限热更新（disable 模式实时恢复）', async () => {
    setPermissions([])
    const wrapper = mountWithPermission({ has: 'admin:write', mode: 'disable' })
    expect(wrapper.find('button').classes()).toContain('is-permission-disabled')
    setPermissions(['admin:write'])
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').classes()).not.toContain('is-permission-disabled')
  })
})

describe('useTable', () => {
  function makeFetch(results) {
    let call = 0
    return vi.fn(() => {
      const seq = call++
      return new Promise((resolve) => {
        setTimeout(() => resolve(results[Math.min(seq, results.length - 1)]), 10)
      })
    })
  }

  it('首查 + 分页数据流', async () => {
    const fetch = vi.fn(async ({ page, pageSize, keyword }) => ({
      list: [`row-${page}-1`, `row-${page}-2`],
      total: 42,
    }))
    const table = useTable(fetch, { defaultParams: { keyword: 'a' } })
    expect(table.loading.value).toBe(true)
    await new Promise((r) => setTimeout(r, 5))
    expect(fetch).toHaveBeenCalledWith({ keyword: 'a', page: 1, pageSize: 20 })
    expect(table.data.value).toEqual(['row-1-1', 'row-1-2'])
    expect(table.total.value).toBe(42)
    expect(table.loading.value).toBe(false)
  })

  it('search 回到第 1 页并合并筛选；reset 恢复默认', async () => {
    const fetch = vi.fn(async (q) => ({ list: [], total: 0 }))
    const table = useTable(fetch, { defaultParams: { status: 1 } })
    await new Promise((r) => setTimeout(r, 1))
    table.pagination.page = 3
    table.search({ keyword: 'x' })
    expect(table.pagination.page).toBe(1)
    expect(fetch).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'x', page: 1, status: 1 }))
    table.search({ extra: 1 })
    expect(table.params.keyword).toBe('x')
    table.reset()
    expect(table.params.keyword).toBeUndefined()
    expect(table.params.status).toBe(1)
  })

  it('竞态保护：过期响应被丢弃', async () => {
    let resolveA
    const fetch = vi.fn(
      (q) =>
        new Promise((resolve) => {
          if (q.page === 1) resolveA = resolve
          else resolve({ list: [`page${q.page}`], total: 1 })
        }),
    )
    const table = useTable(fetch, { immediate: false })
    const p1 = table.run() // 第 1 页，挂起
    table.pagination.page = 2 // 自动触发第 2 页请求并完成
    await new Promise((r) => setTimeout(r, 5))
    expect(table.data.value).toEqual(['page2'])
    resolveA({ list: ['stale'], total: 1 }) // 过期响应最后到达
    await p1
    await new Promise((r) => setTimeout(r, 5))
    expect(table.data.value).toEqual(['page2'])
  })

  it('请求异常进入 error', async () => {
    const fetch = vi.fn(async () => {
      throw new Error('boom')
    })
    const table = useTable(fetch, { immediate: false })
    await table.run()
    expect(table.error.value).toBeInstanceOf(Error)
    expect(table.loading.value).toBe(false)
  })

  it('setPagination：page+pageSize 同传保留页码；单改 pageSize 回第 1 页', async () => {
    const fetch = vi.fn(async (q) => ({ list: [], total: 0 }))
    const table = useTable(fetch, { immediate: false })
    table.setPagination({ page: 3, pageSize: 50 })
    expect(table.pagination.page).toBe(3)
    expect(table.pagination.pageSize).toBe(50)
    table.setPagination({ pageSize: 100 })
    expect(table.pagination.page).toBe(1)
    expect(table.pagination.pageSize).toBe(100)
  })
})

describe('useClipboard（jsdom execCommand 兜底）', () => {
  it('复制成功返回 true', async () => {
    // jsdom 未实现 execCommand，打桩验证兜底链路
    const original = document.execCommand
    document.execCommand = () => true
    const { copied, copy } = useClipboard()
    const ok = await copy('hello')
    expect(ok).toBe(true)
    expect(copied.value).toBe(true)
    document.execCommand = original
  })
})
