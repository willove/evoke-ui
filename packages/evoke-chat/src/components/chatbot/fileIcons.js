/**
 * 附件类型识别：先按后缀，认不出退 MIME 大类，再认不出算通用文件。
 * 一次归类，两处投影：
 *   - `fileIconFor`  → 库内图标名（形状全部来自 Remix 图标集）
 *   - `fileIconToneFor` → 语义色调（danger/success/warning/info/primary），
 *     交给组件映射成 `--eb-*` 令牌；空串表示不染色（跟随正文色）
 */

/** 后缀 → 类型 */
const EXT_KINDS = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  rtf: 'word',
  odt: 'word',
  xls: 'excel',
  xlsx: 'excel',
  csv: 'excel',
  ods: 'excel',
  ppt: 'ppt',
  pptx: 'ppt',
  odp: 'ppt',
  zip: 'zip',
  rar: 'zip',
  '7z': 'zip',
  tar: 'zip',
  gz: 'zip',
  txt: 'text',
  md: 'text',
  log: 'text',
  js: 'code',
  mjs: 'code',
  cjs: 'code',
  ts: 'code',
  tsx: 'code',
  jsx: 'code',
  vue: 'code',
  json: 'code',
  html: 'code',
  css: 'code',
  scss: 'code',
  py: 'code',
  java: 'code',
  go: 'code',
  rs: 'code',
  sh: 'code',
  yml: 'code',
  yaml: 'code',
  xml: 'code',
  sql: 'code',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  svg: 'image',
  mp3: 'music',
  wav: 'music',
  flac: 'music',
  m4a: 'music',
  ogg: 'music',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  avi: 'video',
  mkv: 'video',
}

/** MIME 大类兜底（后缀认不出或没有后缀时） */
const MIME_KINDS = [
  [/^image\//, 'image'],
  [/^audio\//, 'music'],
  [/^video\//, 'video'],
  [/^text\//, 'text'],
  [/pdf/, 'pdf'],
  [/word|wordprocessing/, 'word'],
  [/excel|spreadsheet/, 'excel'],
  [/powerpoint|presentation/, 'ppt'],
  [/zip|compressed|tar|gzip/, 'zip'],
  [/json|javascript|typescript|xml/, 'code'],
]

/** 类型 → 库内图标名 */
const KIND_ICONS = {
  pdf: 'file-pdf',
  word: 'file-word',
  excel: 'file-excel',
  ppt: 'file-ppt',
  zip: 'file-zip',
  text: 'file-text',
  code: 'file-code',
  image: 'file-image',
  music: 'file-music',
  video: 'file-video',
  file: 'document',
}

/** 类型 → 语义色调（空串=不染色）。取法按文件管理器的习惯，全部走 --eb-* 语义令牌 */
const KIND_TONES = {
  pdf: 'danger',
  word: 'primary',
  excel: 'success',
  ppt: 'warning',
  zip: 'info',
  text: 'info',
  code: 'primary',
  image: 'success',
  music: 'primary',
  video: 'danger',
  file: '',
}

/** 归类：'pdf' | 'word' | 'excel' | 'ppt' | 'zip' | 'text' | 'code' | 'image' | 'music' | 'video' | 'file' */
export function fileKindFor(file) {
  const name = String(file?.name || '')
  const dot = name.lastIndexOf('.')
  if (dot > -1) {
    const ext = name.slice(dot + 1).toLowerCase()
    if (EXT_KINDS[ext]) return EXT_KINDS[ext]
  }
  const mime = String(file?.type || '').toLowerCase()
  for (const [re, kind] of MIME_KINDS) {
    if (re.test(mime)) return kind
  }
  return 'file'
}

/** 取附件图标名（库内图标语义名） */
export function fileIconFor(file) {
  return KIND_ICONS[fileKindFor(file)] || KIND_ICONS.file
}

/** 取附件图标的语义色调（'' 表示不染色，跟随正文） */
export function fileIconToneFor(file) {
  return KIND_TONES[fileKindFor(file)] || ''
}
