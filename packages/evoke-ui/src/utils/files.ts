/**
 * 文件投递校验（AI 输入台用）
 *
 * 与 @wil-works/evoke-business-ui 的 utils/files 同实现：两包没有共享模块，
 * 各留一份。改一处要同步另一处——ai-prompt-box 的跨包 API 奇偶守卫会拦名单漂移，
 * 但拦不到这里的实现漂移，故改动请两边一起过。
 *
 * 浏览器对 input[accept] 只是建议：拖拽与粘贴两条路径不经过它，
 * 类型与体积必须在 JS 侧自己校验，否则宿主拿到的是任意类型的 File。
 */

/** accept 支持 `.ext`、`mime/*`、`mime/type`（逗号分隔）；空 accept 视为不限 */
export function matchesAccept(
  file: File | { name?: string; type?: string } | null | undefined,
  accept?: string,
): boolean {
  if (!accept) return true
  if (typeof file?.name !== 'string') return false
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  return String(accept)
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule)
      if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
      return type === rule
    })
}

export type AttachmentRejectReason = 'empty' | 'type' | 'size' | 'limit'

/** 返回 null 表示通过，否则给出去原因（宿主据此决定提示文案） */
export function validateAttachment(
  file: File | null | undefined,
  options: { accept?: string; maxFileSize?: number } = {},
): AttachmentRejectReason | null {
  const { accept = '', maxFileSize = 0 } = options
  if (!file) return 'empty'
  if (accept && !matchesAccept(file, accept)) return 'type'
  if (maxFileSize > 0 && file.size > maxFileSize) return 'size'
  return null
}

/** 从粘贴/拖拽事件里取出文件列表（只取 file 项，纯文本照常进输入框） */
export function filesFromDataTransfer(data?: DataTransfer | null): File[] {
  const out: File[] = []
  const items = data?.items
  if (items?.length) {
    for (const item of Array.from(items)) {
      if (item.kind !== 'file') continue
      const file = item.getAsFile()
      if (file) out.push(file)
    }
    return out
  }
  return data?.files ? Array.from(data.files) : []
}
