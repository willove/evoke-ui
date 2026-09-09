/** Anchor provide/inject 共享 key（必须单例，link 侧 inject 依赖同一 Symbol） */
export const ANCHOR_KEY = Symbol('evAnchor')
