/** 统一头像配色 — 基于 elements 设计系统主色调 */

const AVATAR_COLORS = [
  '#175DFF', // primary
  '#16a34a', // success
  '#d97706', // warning
  '#dc2626', // danger
  '#0891b2', // cyan accent
  '#64748b', // slate
]

/**
 * 根据名称字符串生成稳定的头像背景色
 * @param name 用户/成员名称
 * @returns 十六进制颜色值
 */
export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
