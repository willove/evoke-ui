/**
 * 文件投递校验（chatbot 与各 AI 输入台共用）
 *
 * 浏览器对 input[accept] 只是建议：拖拽与粘贴两条路径不经过它，
 * 所以类型与体积必须在 JS 侧自己校验，否则宿主拿到的是任意类型的 File。
 */

/**
 * accept 匹配：支持 `.ext`、`mime/*`、`mime/type` 三种写法（逗号分隔）。
 * 空 accept 视为不限。
 */
export function matchesAccept(file: File | { name?: string; type?: string } | null | undefined, accept?: string): boolean {
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

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** 从粘贴/拖拽事件里取出文件列表（粘贴只取 file 项，纯文本照常进输入框） */
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
