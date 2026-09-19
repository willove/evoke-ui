/**
 * useTable — 列表页数据流（分页 + 筛选 + 请求状态 + 竞态保护）
 *
 * const {
 *   data, total, loading, error,
 *   params, pagination,
 *   search, refresh, reset, run,
 * } = useTable(fetchUsers, { defaultParams: { status: 1 } })
 *
 * 约定：fetch(params) 返回 { list, total } 或数组；
 *      params 含分页时 fetch 收到 { ...filters, page, pageSize }
 * - search(filters)：合并筛选并回到第 1 页
 * - refresh()：以当前参数重跑（增删改后调用）
 * - reset()：恢复 defaultParams 并回到第 1 页
 * - 过期响应自动丢弃（快速翻页/连续搜索不串数据）
 */
import { reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { inBrowser } from '../utils/dom'

/** 服务端返回形态：数组或 { list | items | rows, total } 包装 */
export type TableData<T> = T[] | { list?: T[]; items?: T[]; rows?: T[]; total?: number }

export type TableFetcher<T> = (params: Record<string, unknown>) => Promise<TableData<T>> | TableData<T>

export interface UseTableOptions<T> {
  defaultParams?: Record<string, unknown>
  immediate?: boolean
  pagination?: boolean
  defaultPagination?: { page?: number; pageSize?: number }
  onSuccess?: (list: T[], query: Record<string, unknown>) => void
  onError?: (e: unknown) => void
  /** 数据预处理（可选）：(result, params) => { list, total } */
  transform?: (result: unknown, params: Record<string, unknown>) => { list?: T[]; total?: number }
}

export interface TablePaginationState {
  page: number
  pageSize: number
}

export function useTable<T = Record<string, unknown>>(
  fetchFn: TableFetcher<T>,
  options: UseTableOptions<T> = {},
) {
  const {
    defaultParams = {},
    immediate = true,
    pagination: paginationOption = true,
    defaultPagination = {},
    onSuccess,
    onError,
    transform,
  } = options

  const withPagination = !!paginationOption

  const params = reactive({ ...defaultParams }) as Record<string, unknown>
  const pagination = reactive<TablePaginationState>({
    page: defaultPagination.page ?? 1,
    pageSize: defaultPagination.pageSize ?? 20,
  })

  const data = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)
  const error = ref<unknown>(null)

  let runSeq = 0

  async function run(overrides: Record<string, unknown> = {}): Promise<void> {
    if (typeof fetchFn !== 'function') return
    const seq = ++runSeq
    const query: Record<string, unknown> = withPagination
      ? { ...params, ...overrides, page: pagination.page, pageSize: pagination.pageSize }
      : { ...params, ...overrides }
    loading.value = true
    error.value = null
    try {
      const result = await fetchFn(query)
      if (seq !== runSeq) return // 过期响应丢弃
      let list: T[] = []
      let totalCount = 0
      if (transform) {
        const shaped = transform(result, query)
        list = shaped.list ?? []
        totalCount = shaped.total ?? list.length
      } else if (Array.isArray(result)) {
        list = result
        totalCount = result.length
      } else if (result && typeof result === 'object') {
        list = result.list ?? result.items ?? result.rows ?? []
        totalCount = result.total ?? list.length
      }
      data.value = list
      total.value = totalCount
      onSuccess?.(list, query)
    } catch (e) {
      if (seq !== runSeq) return
      error.value = e
      onError?.(e)
    } finally {
      if (seq === runSeq) loading.value = false
    }
  }

  /** 变更筛选并回到第 1 页 */
  function search(filters: Record<string, unknown> = {}): Promise<void> {
    Object.assign(params, filters)
    if (withPagination) pagination.page = 1
    return run()
  }

  /** 以当前参数重跑 */
  function refresh(): Promise<void> {
    return run()
  }

  /** 恢复初始筛选 + 回到第 1 页 */
  function reset(): Promise<void> {
    for (const key of Object.keys(params)) {
      if (!(key in defaultParams)) delete params[key]
    }
    Object.assign(params, defaultParams)
    if (withPagination) pagination.page = 1
    return run()
  }

  function setPagination(patch: { page?: number; pageSize?: number } = {}): void {
    if (!withPagination) return
    if (patch.page != null) pagination.page = patch.page
    if (patch.pageSize != null) {
      pagination.pageSize = patch.pageSize
      // 单独改页容量回到第 1 页；与 page 同传时保留显式页码
      if (patch.page == null) pagination.page = 1
    }
  }

  // 翻页/改页容量后自动重查
  if (withPagination) {
    watch(
      () => ({ page: pagination.page, pageSize: pagination.pageSize }),
      () => run(),
    )
  }

  // 首查（immediate 默认开；SSR 环境由业务方自行调用 run）
  if (immediate && inBrowser()) run()

  return {
    data,
    total,
    loading,
    error,
    params,
    pagination,
    hasPagination: withPagination,
    search,
    refresh,
    reset,
    run,
    setPagination,
  }
}
