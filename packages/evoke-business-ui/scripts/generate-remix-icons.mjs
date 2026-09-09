/**
 * 从 Remix Icon（devDependency）生成内置 SVG 图标集静态数据 + 分类元数据
 *
 * 用法: node scripts/generate-remix-icons.mjs
 * 输出:
 *   src/components/icon/remix-svg-paths.js  — 图标 path 数据（提交进库，运行时零依赖）
 *   src/components/icon/remix-meta.js       — 名称 → { category, remix } 元数据（文档/图标选择器用）
 *
 * 键名为 kebab-case 语义命名（如 arrow-right、caret-top），
 * 值为 Remix Icon 对应形状（线性格用 -line，面性格用 -fill）。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_ROOT = resolve(__dirname, '../node_modules/remixicon/icons')

// 组件语义名 → [Remix 分类目录, Remix 图标文件名]
const MAPPING = {
  // ─── 箭头 / 方向 ───
  'arrow-down': ['Arrows', 'arrow-down-s-line'],
  'arrow-left': ['Arrows', 'arrow-left-s-line'],
  'arrow-right': ['Arrows', 'arrow-right-s-line'],
  back: ['Arrows', 'arrow-left-line'],
  'bottom-left': ['Arrows', 'arrow-left-down-line'],
  'bottom-right': ['Arrows', 'arrow-right-down-line'],
  'caret-right': ['Arrows', 'arrow-right-s-fill'],
  'caret-top': ['Arrows', 'arrow-up-s-fill'],
  'd-arrow-left': ['Arrows', 'arrow-left-double-line'],
  'd-arrow-right': ['Arrows', 'arrow-right-double-line'],
  'arrow-up': ['Arrows', 'arrow-up-s-line'],
  empty: ['Business', 'inbox-line'],
  expand: ['System', 'menu-unfold-line'],
  fold: ['System', 'menu-fold-line'],
  left: ['Arrows', 'arrow-left-s-line'],
  right: ['Arrows', 'arrow-right-s-line'],
  'switch': ['Arrows', 'arrow-left-right-line'],
  'top-left': ['Arrows', 'arrow-left-up-line'],
  'top-right': ['Arrows', 'arrow-right-up-line'],
  // ─── 状态 / 反馈 ───
  alert: ['System', 'alert-line'],
  checked: ['System', 'checkbox-circle-fill'],
  'circle-check-filled': ['System', 'checkbox-circle-fill'],
  'circle-close': ['System', 'close-circle-line'],
  'circle-close-filled': ['System', 'close-circle-fill'],
  danger: ['System', 'error-warning-line'],
  dashboard: ['System', 'dashboard-line'],
  error: ['System', 'close-circle-line'],
  fail: ['System', 'close-circle-fill'],
  'info-filled': ['System', 'information-fill'],
  select: ['System', 'check-line'],
  'success-filled': ['System', 'checkbox-circle-fill'],
  success: ['System', 'checkbox-circle-line'],
  'warning-filled': ['System', 'alert-fill'],
  warning: ['System', 'alert-line'],
  // ─── 操作 ───
  brush: ['Design', 'brush-3-line'],
  close: ['System', 'close-line'],
  confirm: ['System', 'check-line'],
  copy: ['Document', 'file-copy-line'],
  'copy-document': ['Document', 'file-copy-line'],
  delete: ['System', 'delete-bin-line'],
  download: ['System', 'download-2-line'],
  edit: ['Design', 'edit-line'],
  export: ['System', 'export-line'],
  filter: ['System', 'filter-3-line'],
  fullscreen: ['Media', 'fullscreen-line'],
  home: ['Buildings', 'home-5-line'],
  import: ['System', 'import-line'],
  indent: ['Editor', 'indent-increase'],
  'refresh-right': ['System', 'refresh-line'],
  remove: ['System', 'indeterminate-circle-line'],
  reset: ['Device', 'restart-line'],
  search: ['System', 'search-line'],
  'zoom-in': ['System', 'zoom-in-line'],
  'zoom-out': ['System', 'zoom-out-line'],
  percentage: ['Finance', 'percent-line'],
  plus: ['System', 'add-line'],
  minus: ['System', 'subtract-line'],
  check: ['System', 'check-line'],
  upload: ['System', 'upload-2-line'],
  'upload-filled': ['System', 'upload-cloud-fill'],
  pointer: ['Development', 'cursor-line'],
  // ─── 对象 / 文件 ───
  box: ['Others', 'box-3-line'],
  'copy': ['Document', 'file-copy-line'],
  document: ['Document', 'file-text-line'],
  'document-checked': ['Document', 'task-line'],
  file: ['Document', 'file-line'],
  folder: ['Document', 'folder-line'],
  'folder-open': ['Document', 'folder-open-line'],
  open: ['Document', 'folder-open-line'],
  link: ['Editor', 'link'],
  list: ['Editor', 'list-unordered'],
  loading: ['System', 'loader-4-line'],
  menu: ['System', 'menu-line'],
  message: ['Communication', 'message-3-line'],
  picture: ['Media', 'image-line'],
  image: ['Media', 'image-line'],
  tag: ['Finance', 'price-tag-3-line'],
  // ─── 时间 / 天气 ───
  calendar: ['Business', 'calendar-line'],
  clock: ['System', 'time-line'],
  moon: ['Weather', 'moon-line'],
  stopwatch: ['System', 'timer-line'],
  sunny: ['Weather', 'sun-line'],
  time: ['System', 'time-line'],
  // ─── 数据 / 状态图标 ───
  'data-line': ['Business', 'line-chart-line'],
  heatmap: ['Business', 'bubble-chart-line'],
  hide: ['System', 'eye-off-line'],
  view: ['System', 'eye-line'],
  info: ['System', 'information-line'],
  key: ['Others', 'key-2-line'],
  border: ['System', 'checkbox-blank-line'],
  // ─── 用户 / 设备 ───
  avatar: ['User & Faces', 'user-3-line'],
  user: ['User & Faces', 'user-3-line'],
  bottom: ['System', 'download-2-line'],
  mouse: ['Device', 'mouse-line'],
  more: ['System', 'more-line'],
  'more-filled': ['System', 'more-fill'],
  promotion: ['Business', 'send-plane-line'],
  setting: ['System', 'settings-line'],
  star: ['System', 'star-line'],
  start: ['Media', 'play-line'],
  stop: ['Media', 'stop-line'],
  'star-filled': ['System', 'star-fill'],
  switch: ['Arrows', 'arrow-left-right-line'],
  top: ['System', 'upload-2-line'],
  // ─── 状态别名 / 补充（文档与示例在用） ───
  bell: ['Media', 'notification-3-line'],
  notification: ['Media', 'notification-4-line'],
  'circle-check': ['System', 'checkbox-circle-line'],
  'check-circle': ['System', 'checkbox-circle-line'],
  'close-circle': ['System', 'close-circle-line'],
  'question-circle': ['System', 'question-line'],
  'time-circle': ['System', 'time-line'],
  'home-filled': ['Buildings', 'home-5-fill'],
  share: ['System', 'share-2-line'],
  refresh: ['System', 'refresh-line'],
  swap: ['Arrows', 'arrow-left-right-line'],
  'bottom-add': ['System', 'add-circle-line'],
  hourglass: ['System', 'hourglass-line'],
  up: ['Arrows', 'arrow-up-s-line'],
  down: ['Arrows', 'arrow-down-s-line'],
  // ─── 业务语义（示例工程在用） ───
  ai: ['User & Faces', 'robot-2-line'],
  api: ['Development', 'braces-line'],
  audit: ['System', 'shield-check-line'],
  bill: ['Finance', 'bank-card-line'],
  book: ['Document', 'book-2-line'],
  cloud: ['Business', 'cloud-line'],
  cluster: ['Editor', 'node-tree'],
  customer: ['User & Faces', 'user-5-line'],
  goods: ['Finance', 'shopping-bag-2-line'],
  income: ['Finance', 'money-cny-box-line'],
  level: ['Business', 'medal-line'],
  marketing: ['Business', 'megaphone-line'],
  orderedlist: ['Editor', 'list-ordered'],
  signout: ['System', 'logout-box-r-line'],
  tags: ['Finance', 'price-tag-3-line'],
  ticket: ['Finance', 'coupon-3-line'],
  turnover: ['Finance', 'funds-line'],
  workorder: ['Document', 'clipboard-line'],
  'safety-certificate-fill': ['System', 'shield-check-fill'],
  lock: ['Others', 'door-lock-line'],
  approval: ['Document', 'task-line'],
  bank: ['Finance', 'bank-card-2-line'],
  history: ['System', 'history-line'],
  // ─── 品牌彩色图标退役后的替代映射 ───
  platform: ['Device', 'macbook-line'],
  saler: ['User & Faces', 'user-4-line'],
  wallet: ['Finance', 'wallet-3-line'],
  'wallet-icon': ['Finance', 'wallet-3-line'],
  // ─── 文件类型图标（单色，多别名指向同一资源） ───
  'file-excel': ['Document', 'file-excel-2-line'],
  xlsx: ['Document', 'file-excel-2-line'],
  xls: ['Document', 'file-excel-2-line'],
  excel: ['Document', 'file-excel-2-line'],
  'type-xlsx': ['Document', 'file-excel-2-line'],
  'file-word': ['Document', 'file-word-2-line'],
  doc: ['Document', 'file-word-2-line'],
  docx: ['Document', 'file-word-2-line'],
  word: ['Document', 'file-word-2-line'],
  'type-docx': ['Document', 'file-word-2-line'],
  'file-ppt': ['Document', 'file-ppt-2-line'],
  ppt: ['Document', 'file-ppt-2-line'],
  pptx: ['Document', 'file-ppt-2-line'],
  'type-pptx': ['Document', 'file-ppt-2-line'],
  'file-pdf': ['Document', 'file-pdf-2-line'],
  pdf: ['Document', 'file-pdf-2-line'],
  'file-zip': ['Document', 'file-zip-line'],
  zip: ['Document', 'file-zip-line'],
  rar: ['Document', 'file-zip-line'],
  '7z': ['Document', 'file-zip-line'],
  'file-music': ['Document', 'file-music-line'],
  mp3: ['Document', 'file-music-line'],
  audio: ['Document', 'file-music-line'],
  'file-video': ['Document', 'file-video-line'],
  mp4: ['Document', 'file-video-line'],
  video: ['Document', 'file-video-line'],
  'file-code': ['Document', 'file-code-line'],
  json: ['Document', 'file-code-line'],
  'file-image': ['Document', 'file-image-line'],
  img: ['Document', 'file-image-line'],
  png: ['Document', 'file-image-line'],
  jpg: ['Document', 'file-image-line'],
  jpeg: ['Document', 'file-image-line'],
  gif: ['Document', 'file-image-line'],
  'file-text': ['Document', 'file-text-line'],
  txt: ['Document', 'file-text-line'],
  md: ['Document', 'file-text-line'],
  'type-md': ['Document', 'file-text-line'],
  // ─── Logo / 品牌（支付、社交、开发常用）───
  wechat: ['Logos', 'wechat-line'],
  'wechat-filled': ['Logos', 'wechat-fill'],
  'wechat-pay': ['Logos', 'wechat-pay-line'],
  'wechat-pay-filled': ['Logos', 'wechat-pay-fill'],
  alipay: ['Logos', 'alipay-line'],
  'alipay-filled': ['Logos', 'alipay-fill'],
  'mini-program': ['Logos', 'mini-program-line'],
  qq: ['Logos', 'qq-line'],
  dingding: ['Logos', 'dingding-line'],
  weibo: ['Logos', 'weibo-line'],
  zhihu: ['Logos', 'zhihu-line'],
  bilibili: ['Logos', 'bilibili-line'],
  douyin: ['Logos', 'tiktok-line'],
  taobao: ['Logos', 'taobao-line'],
  github: ['Logos', 'github-line'],
  gitee: ['Logos', 'gitee-line'],
  gitlab: ['Logos', 'gitlab-line'],
  google: ['Logos', 'google-line'],
  apple: ['Logos', 'apple-line'],
  android: ['Logos', 'android-line'],
  windows: ['Logos', 'windows-line'],
  chrome: ['Logos', 'chrome-line'],
  firefox: ['Logos', 'firefox-line'],
  safari: ['Logos', 'safari-line'],
  edge: ['Logos', 'edge-line'],
  linkedin: ['Logos', 'linkedin-box-line'],
  twitter: ['Logos', 'twitter-x-line'],
  youtube: ['Logos', 'youtube-line'],
  facebook: ['Logos', 'facebook-line'],
  instagram: ['Logos', 'instagram-line'],
  telegram: ['Logos', 'telegram-line'],
  slack: ['Logos', 'slack-line'],
  paypal: ['Logos', 'paypal-line'],
  visa: ['Logos', 'visa-fill'],
  mastercard: ['Logos', 'mastercard-fill'],
  vue: ['Logos', 'vuejs-line'],
  react: ['Logos', 'reactjs-line'],
  nodejs: ['Logos', 'nodejs-line'],
  java: ['Logos', 'java-line'],
  openai: ['Logos', 'openai-line'],
  deepseek: ['Logos', 'deepseek-line'],
  // ─── 商务 ───
  'line-chart': ['Business', 'line-chart-line'],
  'bar-chart-h': ['Business', 'bar-chart-horizontal-line'],
  'donut-chart': ['Business', 'donut-chart-line'],
  'calendar-event': ['Business', 'calendar-event-line'],
  'calendar-check': ['Business', 'calendar-check-line'],
  briefcase: ['Business', 'briefcase-line'],
  archive: ['Business', 'archive-line'],
  inbox: ['Business', 'inbox-2-line'],
  'id-card': ['Business', 'id-card-line'],
  profile: ['Business', 'profile-line'],
  medal: ['Business', 'medal-line'],
  award: ['Business', 'award-line'],
  'customer-service': ['Business', 'customer-service-line'],
  links: ['Business', 'links-line'],
  global: ['Business', 'global-line'],
  'send-plane': ['Business', 'send-plane-line'],
  printer: ['Business', 'printer-line'],
  copyright: ['Business', 'copyright-line'],
  registered: ['Business', 'registered-line'],
  'verified-badge': ['Business', 'verified-badge-line'],
  honour: ['Business', 'honour-line'],
  'shake-hands': ['Business', 'shake-hands-line'],
  'at-sign': ['Business', 'at-line'],
  attachment: ['Business', 'attachment-line'],
  bookmark: ['Business', 'bookmark-line'],
  flag: ['Business', 'flag-line'],
  slideshow: ['Business', 'slideshow-line'],
  presentation: ['Business', 'presentation-line'],
  megaphone: ['Business', 'megaphone-line'],
  reply: ['Business', 'reply-line'],
  mail: ['Business', 'mail-line'],
  // ─── 财务 / 交易 ───
  'bank-card': ['Finance', 'bank-card-line'],
  'money-cny': ['Finance', 'money-cny-box-line'],
  'secure-payment': ['Finance', 'secure-payment-line'],
  'red-packet': ['Finance', 'red-packet-line'],
  coupon: ['Finance', 'coupon-line'],
  'discount-percent': ['Finance', 'discount-percent-line'],
  refund: ['Finance', 'refund-line'],
  'exchange-cny': ['Finance', 'exchange-cny-line'],
  funds: ['Finance', 'funds-line'],
  safe: ['Finance', 'safe-line'],
  'safe-box': ['Finance', 'safe-2-line'],
  coins: ['Finance', 'coins-line'],
  cash: ['Finance', 'cash-line'],
  gift: ['Finance', 'gift-line'],
  'price-tag': ['Finance', 'price-tag-line'],
  stock: ['Finance', 'stock-line'],
  'vip-crown': ['Finance', 'vip-crown-line'],
  'hand-coin': ['Finance', 'hand-coin-line'],
  'increase-decrease': ['Finance', 'increase-decrease-line'],
  '24-hours': ['Finance', '24-hours-line'],
  'shopping-cart': ['Finance', 'shopping-cart-line'],
  'shopping-bag': ['Finance', 'shopping-bag-line'],
  // ─── 开发 ───
  code: ['Development', 'code-line'],
  terminal: ['Development', 'terminal-box-line'],
  bug: ['Development', 'bug-line'],
  database: ['Device', 'database-line'],
  server: ['Device', 'server-line'],
  'git-branch': ['Development', 'git-branch-line'],
  'git-commit': ['Development', 'git-commit-line'],
  html5: ['Development', 'html5-line'],
  javascript: ['Development', 'javascript-line'],
  command: ['Development', 'command-line'],
  puzzle: ['Development', 'puzzle-line'],
  // ─── 设备 ───
  computer: ['Device', 'computer-line'],
  phone: ['Device', 'smartphone-line'],
  tablet: ['Device', 'tablet-line'],
  'hard-drive': ['Device', 'hard-drive-2-line'],
  usb: ['Device', 'usb-line'],
  wifi: ['Device', 'wifi-line'],
  'wifi-off': ['Device', 'wifi-off-line'],
  bluetooth: ['Device', 'bluetooth-line'],
  battery: ['Device', 'battery-line'],
  fingerprint: ['Device', 'fingerprint-line'],
  'qr-code': ['Device', 'qr-code-line'],
  scan: ['Device', 'scan-line'],
  barcode: ['Device', 'barcode-line'],
  router: ['Device', 'router-line'],
  cpu: ['Device', 'cpu-line'],
  keyboard: ['Device', 'keyboard-line'],
  shutdown: ['Device', 'shut-down-line'],
  // ─── 文档补充 ───
  'file-list': ['Document', 'file-list-line'],
  'file-add': ['Document', 'file-add-line'],
  'file-search': ['Document', 'file-search-line'],
  'file-settings': ['Document', 'file-settings-line'],
  'file-copy': ['Document', 'file-copy-line'],
  contract: ['Document', 'contract-line'],
  receipt: ['Document', 'receipt-line'],
  certificate: ['Document', 'certificate-line'],
  'book-open': ['Document', 'book-open-line'],
  newspaper: ['Document', 'newspaper-line'],
  task: ['Document', 'task-line'],
  'sticky-note': ['Document', 'sticky-note-line'],
  draft: ['Document', 'draft-line'],
  survey: ['Document', 'survey-line'],
  // ─── 媒体 ───
  play: ['Media', 'play-line'],
  pause: ['Media', 'pause-line'],
  volume: ['Media', 'volume-up-line'],
  mute: ['Media', 'volume-mute-line'],
  mic: ['Media', 'mic-line'],
  camera: ['Media', 'camera-line'],
  music: ['Media', 'music-2-line'],
  film: ['Media', 'film-line'],
  live: ['Media', 'live-line'],
  repeat: ['Media', 'repeat-line'],
  headphone: ['Media', 'headphone-line'],
  // ─── 沟通 ───
  chat: ['Communication', 'chat-3-line'],
  feedback: ['Communication', 'feedback-line'],
  'question-answer': ['Communication', 'question-answer-line'],
  // ─── 建筑 / 地图 / 出行 ───
  building: ['Buildings', 'building-2-line'],
  store: ['Buildings', 'store-2-line'],
  hospital: ['Buildings', 'hospital-line'],
  school: ['Buildings', 'school-line'],
  hotel: ['Buildings', 'hotel-line'],
  government: ['Buildings', 'government-line'],
  'map-pin': ['Map', 'map-pin-2-line'],
  navigation: ['Map', 'navigation-line'],
  compass: ['Map', 'compass-3-line'],
  rocket: ['Map', 'rocket-2-line'],
  car: ['Map', 'car-line'],
  truck: ['Map', 'truck-line'],
  flight: ['Map', 'plane-line'],
  train: ['Map', 'train-line'],
  earth: ['Map', 'earth-line'],
  // ─── 用户 / 组织 ───
  'user-add': ['User & Faces', 'user-add-line'],
  'user-settings': ['User & Faces', 'user-settings-line'],
  team: ['User & Faces', 'team-line'],
  contacts: ['User & Faces', 'contacts-line'],
  admin: ['User & Faces', 'admin-line'],
  robot: ['User & Faces', 'robot-2-line'],
  // ─── 健康 ───
  'heart-pulse': ['Health & Medical', 'heart-pulse-line'],
  'first-aid-kit': ['Health & Medical', 'first-aid-kit-line'],
  medicine: ['Health & Medical', 'capsule-line'],
  // ─── 补充分类：设计 / 编辑 / 天气 / 食饮等 ───
  // 设计
  palette: ['Design', 'palette-line'],
  'paint-brush': ['Design', 'paint-brush-line'],
  pencil: ['Design', 'pencil-line'],
  eraser: ['Design', 'eraser-line'],
  scissors: ['Design', 'scissors-line'],
  crop: ['Design', 'crop-line'],
  contrast: ['Design', 'contrast-line'],
  layout: ['Design', 'layout-line'],
  'layout-grid': ['Design', 'layout-grid-line'],
  magic: ['Design', 'magic-line'],
  ruler: ['Design', 'ruler-line'],
  'drag-drop': ['Design', 'drag-drop-line'],
  // 文本编辑
  bold: ['Editor', 'bold'],
  italic: ['Editor', 'italic'],
  underline: ['Editor', 'underline'],
  strikethrough: ['Editor', 'strikethrough-2'],
  heading: ['Editor', 'heading'],
  'list-unordered': ['Editor', 'list-unordered'],
  'list-check': ['Editor', 'list-check'],
  'quote-text': ['Editor', 'quote-text'],
  'font-size': ['Editor', 'font-size'],
  translate: ['Editor', 'translate-2'],
  hyperlink: ['Editor', 'link'],
  table: ['Editor', 'table-2'],
  // 天气
  rainy: ['Weather', 'rainy-line'],
  cloudy: ['Weather', 'cloudy-line'],
  snowy: ['Weather', 'snowy-line'],
  thunderstorms: ['Weather', 'thunderstorms-line'],
  mist: ['Weather', 'mist-line'],
  sun: ['Weather', 'sun-line'],
  windy: ['Weather', 'windy-line'],
  'temp-hot': ['Weather', 'temp-hot-line'],
  // 食饮
  cake: ['Food', 'cake-line'],
  cookie: ['Food', 'cookie-line'],
  cup: ['Food', 'cup-line'],
  drinks: ['Food', 'drinks-line'],
  restaurant: ['Food', 'restaurant-line'],
  bread: ['Food', 'bread-line'],
  // 游戏 / 运动
  basketball: ['Game & Sports', 'basketball-line'],
  football: ['Game & Sports', 'football-line'],
  game: ['Game & Sports', 'game-line'],
  dice: ['Game & Sports', 'dice-line'],
  target: ['Game & Sports', 'target-line'],
  'ping-pong': ['Game & Sports', 'ping-pong-line'],
  // 其他常用
  lightbulb: ['Others', 'lightbulb-line'],
  leaf: ['Others', 'leaf-line'],
  recycle: ['Others', 'recycle-line'],
  umbrella: ['Others', 'umbrella-line'],
  'graduation-cap': ['Others', 'graduation-cap-line'],
  accessibility: ['Others', 'accessibility-line'],
  // 健康补充
  thermometer: ['Health & Medical', 'thermometer-line'],
  microscope: ['Health & Medical', 'microscope-line'],
  syringe: ['Health & Medical', 'syringe-line'],
  'test-tube': ['Health & Medical', 'test-tube-line'],
  'mental-health': ['Health & Medical', 'mental-health-line'],
  stethoscope: ['Health & Medical', 'stethoscope-line'],
  brain: ['Health & Medical', 'brain-line'],
  // 沟通补充
  'chat-smile': ['Communication', 'chat-smile-line'],
  questionnaire: ['Communication', 'questionnaire-line'],
  discuss: ['Communication', 'discuss-line'],
  'video-chat': ['Communication', 'video-chat-line'],
  'speech-to-text': ['Communication', 'speech-to-text-line'],
  'text-to-speech': ['Communication', 'text-to-speech-line'],
  // 楼宇补充
  community: ['Buildings', 'community-line'],
  'home-office': ['Buildings', 'home-office-line'],
  'home-wifi': ['Buildings', 'home-wifi-line'],
  'ancient-gate': ['Buildings', 'ancient-gate-line'],
  // 地图补充
  pushpin: ['Map', 'pushpin-line'],
  route: ['Map', 'route-line'],
  suitcase: ['Map', 'suitcase-line'],
  'charging-pile': ['Map', 'charging-pile-line'],
  // 开发补充
  'git-fork': ['Development', 'git-fork-line'],
  'git-pull-request': ['Development', 'git-pull-request-line'],
  'code-box': ['Development', 'code-box-line'],
  // 用户补充
  'user-follow': ['User & Faces', 'user-follow-line'],
  'user-search': ['User & Faces', 'user-search-line'],
  emotion: ['User & Faces', 'emotion-line'],
}

function parseSvg(xml) {
  const viewBox = xml.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24'
  const paths = []
  for (const m of xml.matchAll(/<path\b([^>]*?)\/?>/g)) {
    const attrs = m[1]
    const d = attrs.match(/\bd="([^"]+)"/)?.[1]
    if (!d) continue
    const fillRule = attrs.match(/fill-rule="([^"]+)"/)?.[1]
    const fill = attrs.match(/\bfill="([^"]+)"/)?.[1]
    paths.push({
      d,
      ...(fillRule && fillRule !== 'nonzero' ? { fillRule } : {}),
      ...(fill && fill !== 'currentColor' ? { fill } : {}),
    })
  }
  return { viewBox, paths }
}

const out = {}
const meta = {}
const missing = []
for (const [name, [cat, file]] of Object.entries(MAPPING)) {
  const p = resolve(ICONS_ROOT, cat, `${file}.svg`)
  if (!existsSync(p)) {
    missing.push(`${name} -> ${cat}/${file}.svg`)
    continue
  }
  out[name] = parseSvg(readFileSync(p, 'utf-8'))
  meta[name] = { category: cat, remix: file }
}
if (missing.length) {
  console.error(`[gen:remix] 以下图标在 remixicon 包中不存在:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

const version = JSON.parse(readFileSync(resolve(ICONS_ROOT, '../package.json'), 'utf-8')).version
const srcDir = resolve(__dirname, '../src/components/icon')

writeFileSync(
  resolve(srcDir, 'remix-svg-paths.js'),
  `/**
 * 内置 SVG 图标集（${Object.keys(out).length} 个，静态快照数据）
 * 图标形状源自 Remix Icon v${version}（https://remixicon.com/，Remix Icon License v1.0，免费商用）
 * 由 scripts/generate-remix-icons.mjs 生成，键名为 evoke-ui 兼容命名（含历史别名），请勿手动修改；
 * 需增删图标时在脚本 MAPPING 中登记后重新执行生成
 */

export const remixSvgPaths = ` + JSON.stringify(out, null, 1) + '\n'
)

writeFileSync(
  resolve(srcDir, 'remix-meta.js'),
  `/**
 * 内置 SVG 图标集元数据（分类与 Remix 原名，供文档与图标选择器消费）
 * 由 scripts/generate-remix-icons.mjs 生成，请勿手动修改
 */

export const REMIX_ICON_VERSION = '${version}'

export const REMIX_ICON_META = ` + JSON.stringify(meta, null, 1) + '\n'
)

// ─── 全量图标库（Remix 原生命名，line + fill 全风格，按需加载不进主包） ───
const full = {}
let fullMissingViewBox = 0
function walkFull(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, f.name)
    if (f.isDirectory()) {
      walkFull(p)
      continue
    }
    if (!f.name.endsWith('.svg')) continue
    const name = f.name.replace(/\.svg$/, '')
    const xml = readFileSync(p, 'utf-8')
    const viewBox = xml.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24'
    const paths = []
    for (const m of xml.matchAll(/<path\b([^>]*?)\/?>/g)) {
      const attrs = m[1]
      const d = attrs.match(/\bd="([^"]+)"/)?.[1]
      if (!d) continue
      const fillRule = attrs.match(/fill-rule="([^"]+)"/)?.[1]
      paths.push({ d, ...(fillRule && fillRule !== 'nonzero' ? { fillRule } : {}) })
    }
    if (viewBox !== '0 0 24 24') fullMissingViewBox++
    // 紧凑格式：单 path 无特殊 fill-rule 时直接存 d 字符串（解析端补默认 viewBox）
    full[name] =
      paths.length === 1 && !paths[0].fillRule ? paths[0].d : { paths }
  }
}
readdirSync(ICONS_ROOT).forEach((cat) => {
  const p = resolve(ICONS_ROOT, cat)
  if (statSync(p).isDirectory()) walkFull(p)
})

writeFileSync(
  resolve(srcDir, 'remix-full-paths.js'),
  `/**
 * Remix Icon 全量图标库（${Object.keys(full).length} 个，Remix 原生命名，含 line/fill 全风格）
 * 形状源自 Remix Icon v${version}（https://remixicon.com/，Remix Icon License v1.0，免费商用）
 * 由 scripts/generate-remix-icons.mjs 生成，请勿手动修改。
 *
 * 体积约 1.5MB，不随主包加载；通过 '@wil-works/evoke-business-ui/full-icons'
 * 的 loadFullIcons() 注册后，所有 Remix 原生名称即可经 ev-icon 直接使用。
 * 数据格式：值为单个 path 的 d 字符串（默认 viewBox 0 0 24 24），
 * 或 { paths: [{ d, fillRule? }] }（多段 / 带挖洞规则）。
 */

export const remixFullPaths = ` + JSON.stringify(full) + '\n'
)

console.log(
  `[gen:remix] 核心集 ${Object.keys(out).length} 个 + 全量库 ${Object.keys(full).length} 个` +
    (fullMissingViewBox ? `（注意：${fullMissingViewBox} 个非 24 viewBox）` : '')
)
