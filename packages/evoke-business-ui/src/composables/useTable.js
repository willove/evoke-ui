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
import { inBrowser } from '../utils/dom'

export function useTable(fetchFn, options = {}) {
  const {
    defaultParams = {},
    immediate = true,
    pagination: paginationOption = true,
    defaultPagination = {},
    onSuccess,
    onError,
    /**
     * 数据预处理（可选）：(result, params) => { list, total }
     */
    transform,
  } = options

  const withPagination = !!paginationOption

  const params = reactive({ ...defaultParams })
  const pagination = reactive({
    page: defaultPagination.page ?? 1,
    pageSize: defaultPagination.pageSize ?? 20,
  })

  const data = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)

  let runSeq = 0

  async function run(overrides = {}) {
    if (typeof fetchFn !== 'function') return
    const seq = ++runSeq
    const query = withPagination
      ? { ...params, ...overrides, page: pagination.page, pageSize: pagination.pageSize }
      : { ...params, ...overrides }
    loading.value = true
    error.value = null
    try {
      const result = await fetchFn(query)
      if (seq !== runSeq) return // 过期响应丢弃
      let list = []
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
  function search(filters = {}) {
    Object.assign(params, filters)
    if (withPagination) pagination.page = 1
    return run()
  }

  /** 以当前参数重跑 */
  function refresh() {
    return run()
  }

  /** 恢复初始筛选 + 回到第 1 页 */
  function reset() {
    for (const key of Object.keys(params)) {
      if (!(key in defaultParams)) delete params[key]
    }
    Object.assign(params, defaultParams)
    if (withPagination) pagination.page = 1
    return run()
  }

  function setPagination(patch = {}) {
    if (!withPagination) return
    if (patch.page != null) pagination.page = patch.page
    if (patch.pageSize != null) {
      pagination.pageSize = patch.pageSize
      pagination.page = 1
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
