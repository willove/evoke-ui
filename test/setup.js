// Vitest 测试环境设置
// 为 jsdom 添加缺失的 API polyfill

// matchMedia polyfill - jsdom 不支持；usePlatform 依赖它初始化移动端状态
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  })
}
