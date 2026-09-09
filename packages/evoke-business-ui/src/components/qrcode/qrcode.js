/**
 * 纯 JS QR Code 编码器 — byte 模式 / EC 级别 M / 版本 1-10 自动选择
 *
 * 无外部依赖、顶层不访问 DOM（Electron / SSR 安全）。
 * 实现 ISO/IEC 18004 核心子集：
 * - 容量表、对齐图案坐标、格式/版本信息 BCH、Reed-Solomon (GF 2^8, 0x11D)
 * - 8 种掩码全量试算，标准 4 条惩罚规则取最优
 */

// ─── GF(256) 域 ───
const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(function initGaloisField() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

function gmul(a, b) {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]
}

/** RS 生成多项式（降幂排列，poly[0] 为最高次项，恒为 1） */
function rsGeneratorPoly(degree) {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gmul(poly[j], EXP[i])
    }
    poly = next
  }
  return poly
}

/** 对数据码字计算 ecLen 个纠错码字 */
function rsComputeEc(data, ecLen) {
  const gen = rsGeneratorPoly(ecLen)
  const res = new Array(ecLen).fill(0)
  for (const byte of data) {
    const factor = byte ^ res[0]
    res.shift()
    res.push(0)
    if (factor !== 0) {
      for (let i = 0; i < ecLen; i++) res[i] ^= gmul(gen[i + 1], factor)
    }
  }
  return res
}

// ─── 版本容量表（EC 级别 M，byte 模式）───
// 每项：{ dataCodewords, blocks: [{ count, totalPerBlock, dataPerBlock }] }
const VERSION_TABLE = [
  { dataCodewords: 16, blocks: [{ count: 1, totalPerBlock: 26, dataPerBlock: 16 }] },
  { dataCodewords: 28, blocks: [{ count: 1, totalPerBlock: 44, dataPerBlock: 28 }] },
  { dataCodewords: 44, blocks: [{ count: 1, totalPerBlock: 70, dataPerBlock: 44 }] },
  { dataCodewords: 64, blocks: [{ count: 2, totalPerBlock: 50, dataPerBlock: 32 }] },
  { dataCodewords: 86, blocks: [{ count: 2, totalPerBlock: 67, dataPerBlock: 43 }] },
  { dataCodewords: 108, blocks: [{ count: 4, totalPerBlock: 43, dataPerBlock: 27 }] },
  { dataCodewords: 124, blocks: [{ count: 4, totalPerBlock: 49, dataPerBlock: 31 }] },
  { dataCodewords: 154, blocks: [{ count: 2, totalPerBlock: 60, dataPerBlock: 38 }, { count: 2, totalPerBlock: 61, dataPerBlock: 39 }] },
  { dataCodewords: 182, blocks: [{ count: 3, totalPerBlock: 58, dataPerBlock: 36 }, { count: 2, totalPerBlock: 59, dataPerBlock: 37 }] },
  { dataCodewords: 216, blocks: [{ count: 4, totalPerBlock: 69, dataPerBlock: 43 }, { count: 1, totalPerBlock: 70, dataPerBlock: 44 }] },
]

const ALIGNMENT_PATTERNS = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

const MAX_VERSION = VERSION_TABLE.length
export const QRCODE_MAX_BYTES = VERSION_TABLE[MAX_VERSION - 1].dataCodewords - 2 // 预留模式+计数头

function utf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(str))
  const out = []
  for (let i = 0; i < str.length; i++) {
    let c = str.codePointAt(i)
    if (c > 0xffff) i++
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return out
}

// ─── 数据段编码（byte 模式）───
function buildDataCodewords(bytes, version) {
  const cap = VERSION_TABLE[version - 1].dataCodewords
  const bits = []
  const put = (num, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((num >>> i) & 1)
  }
  put(0b0100, 4) // byte 模式
  put(bytes.length, version < 10 ? 8 : 16) // 字符计数
  for (const b of bytes) put(b, 8)
  // 终止符（最多 4 个 0）
  for (let i = 0; i < 4 && bits.length % 8 !== 0; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)
  const codewords = []
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]
    codewords.push(b)
  }
  // 补齐填充 0xEC 0x11 交替
  const pads = [0xec, 0x11]
  let pi = 0
  while (codewords.length < cap) codewords.push(pads[pi++ % 2])
  return codewords
}

/** 分块计算纠错码字并按标准交错规则合并 */
function interleave(version, dataCodewords) {
  const spec = VERSION_TABLE[version - 1]
  const blocks = []
  let offset = 0
  for (const g of spec.blocks) {
    for (let i = 0; i < g.count; i++) {
      const data = dataCodewords.slice(offset, offset + g.dataPerBlock)
      offset += g.dataPerBlock
      blocks.push({ data, ec: rsComputeEc(data, g.totalPerBlock - g.dataPerBlock) })
    }
  }
  const maxData = Math.max(...blocks.map((b) => b.data.length))
  const maxEc = Math.max(...blocks.map((b) => b.ec.length))
  const out = []
  for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.data.length) out.push(b.data[i])
  for (let i = 0; i < maxEc; i++) for (const b of blocks) if (i < b.ec.length) out.push(b.ec[i])
  return out
}

// ─── 矩阵构建 ───
function createMatrix(size) {
  return Array.from({ length: size }, () => new Array(size).fill(null))
}

function placeFinder(m, row, col) {
  const n = m.length
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r
      const cc = col + c
      if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue
      const dark =
        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
        (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      m[rr][cc] = !!dark
    }
  }
}

function placeAlignment(m, centers) {
  const n = m.length
  for (const r of centers) {
    for (const c of centers) {
      // 与三个定位图案重叠的跳过
      if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          m[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
        }
      }
    }
  }
}

function placeTiming(m) {
  const n = m.length
  for (let i = 8; i < n - 8; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0
    if (m[i][6] === null) m[i][6] = i % 2 === 0
  }
}

function placeDarkModule(m) {
  const n = m.length
  m[n - 8][8] = true
}

// 格式信息：EC 级别 M = 00，BCH(15,5) 生成 0x537，异或掩码 0x5412
function formatBits(maskId) {
  const data = (0 << 3) | maskId // level M
  let rem = data << 10
  const g = 0x537
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) rem ^= g << (i - 10)
  }
  return ((data << 10) | rem) ^ 0x5412
}

function placeFormat(m, maskId) {
  const n = m.length
  const bits = formatBits(maskId)
  const bit = (i) => ((bits >> i) & 1) === 1
  // 第一份拷贝（围绕左上定位图案）
  for (let i = 0; i <= 5; i++) m[8][i] = bit(i)
  m[8][7] = bit(6)
  m[8][8] = bit(7)
  m[7][8] = bit(8)
  for (let i = 9; i < 15; i++) m[14 - i][8] = bit(i)
  // 第二份拷贝（右上 + 左下），注意 (n-8, 8) 是恒暗模块不可占用
  for (let i = 0; i <= 5; i++) m[8][n - 1 - i] = bit(i)
  m[8][n - 7] = bit(6)
  m[8][n - 8] = bit(7)
  for (let i = 8; i < 15; i++) m[n - 1 - (i - 8)][8] = bit(i)
}

// 版本信息（v≥7）：BCH(18,6)，生成 0x1F25
function versionBits(v) {
  let rem = v << 12
  const g = 0x1f25
  for (let i = 17; i >= 12; i--) {
    if ((rem >>> i) & 1) rem ^= g << (i - 12)
  }
  return (v << 12) | rem
}

function placeVersion(m, version) {
  if (version < 7) return
  const n = m.length
  const bits = versionBits(version)
  for (let i = 0; i < 18; i++) {
    const dark = ((bits >> i) & 1) === 1
    const a = Math.floor(i / 3)
    const b = (i % 3) + n - 8 - 3
    // 右上 3x6
    m[a][b] = dark
    // 左下 6x3
    m[b][a] = dark
  }
}

const MASK_FNS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

/** 数据码字按之字形布点（避开功能模块与 col 6） */
function placeData(m, codewords, maskId) {
  const n = m.length
  const fnModules = buildFunctionMap(m, n)
  let bitIdx = 0
  let upward = true
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (let i = 0; i < n; i++) {
      const row = upward ? n - 1 - i : i
      for (let c of [col, col - 1]) {
        if (fnModules[row][c]) continue
        let dark = false
        const byte = Math.floor(bitIdx / 8)
        if (byte < codewords.length) {
          dark = ((codewords[byte] >>> (7 - (bitIdx % 8))) & 1) === 1
        }
        if (MASK_FNS[maskId](row, c)) dark = !dark
        m[row][c] = dark
        bitIdx++
      }
    }
    upward = !upward
  }
}

function buildFunctionMap(m, n) {
  const map = Array.from({ length: n }, () => new Array(n).fill(false))
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c] !== null) map[r][c] = true
  return map
}

/** 标准惩罚规则打分（越小越好） */
function penalty(m) {
  const n = m.length
  let score = 0
  // N1: 行/列连续同色 ≥5
  for (let axis = 0; axis < 2; axis++) {
    for (let i = 0; i < n; i++) {
      let run = 1
      for (let j = 1; j < n; j++) {
        const cur = axis === 0 ? m[i][j] : m[j][i]
        const prev = axis === 0 ? m[i][j - 1] : m[j - 1][i]
        if (cur === prev) run++
        else {
          if (run >= 5) score += 3 + (run - 5)
          run = 1
        }
      }
      if (run >= 5) score += 3 + (run - 5)
    }
  }
  // N2: 2x2 同色块
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = m[r][c]
      if (m[r][c + 1] === v && m[r + 1][c] === v && m[r + 1][c + 1] === v) score += 3
    }
  }
  // N3: 定位图案比例特征 1011101 + 4 亮
  const pat = [true, false, true, true, true, false, true]
  const light = [false, false, false, false]
  const matchAt = (get) => {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= n - 11; j++) {
        let okP = true
        let okR = true
        for (let k = 0; k < 7; k++) if (get(i, j + k) !== pat[k]) okP = false
        for (let k = 0; k < 4; k++) if (get(i, j + 7 + k) !== light[k]) okR = false
        if (okP && okR) score += 40
        let okP2 = true
        let okL = true
        for (let k = 0; k < 7; k++) if (get(i, j + 4 + k) !== pat[k]) okP2 = false
        for (let k = 0; k < 4; k++) if (get(i, j + k) !== light[k]) okL = false
        if (okP2 && okL) score += 40
      }
    }
  }
  matchAt((i, j) => m[i][j])
  matchAt((i, j) => m[j][i])
  // N4: 暗色占比偏离 50%
  let darkCount = 0
  for (const row of m) for (const v of row) if (v) darkCount++
  const total = n * n
  score += Math.floor(Math.abs((darkCount * 100) / total - 50) / 5) * 10
  return score
}

function buildMatrixForMask(version, codewords, maskId) {
  const size = 17 + 4 * version
  const m = createMatrix(size)
  const centers = ALIGNMENT_PATTERNS[version - 1]
  placeFinder(m, 0, 0)
  placeFinder(m, size - 7, 0)
  placeFinder(m, 0, size - 7)
  placeAlignment(m, centers)
  placeTiming(m)
  placeDarkModule(m)
  placeVersion(m, version)
  // 格式区先占位（placeFormat 会覆写）
  placeFormat(m, maskId)
  placeData(m, codewords, maskId)
  placeFormat(m, maskId)
  return m
}

/**
 * 编码入口：字符串 → 模块矩阵
 * @param {string} text
 * @param {{ maskId?: number }} [options] 指定掩码（0-7）跳过自动择优（测试/高级用途）
 * @returns {{ matrix: boolean[][], version: number, size: number, maskId: number }}
 */
export function encodeQR(text, options = {}) {
  const bytes = utf8Bytes(String(text ?? ''))
  let version = 0
  for (let v = 1; v <= MAX_VERSION; v++) {
    const cap = VERSION_TABLE[v - 1].dataCodewords
    const maxBytes = v < 10 ? cap - 2 : cap - 3
    if (bytes.length <= maxBytes) {
      version = v
      break
    }
  }
  if (!version) {
    throw new Error(
      `[EvQrcode] 内容过长：byte/M 级别下最多 ${QRCODE_MAX_BYTES} 字节（含中文按 UTF-8 计），当前 ${bytes.length} 字节`,
    )
  }
  const dataCodewords = buildDataCodewords(bytes, version)
  const codewords = interleave(version, dataCodewords)
  const forced = Number.isInteger(options.maskId) && options.maskId >= 0 && options.maskId <= 7
    ? options.maskId
    : null
  if (forced !== null) {
    return {
      matrix: buildMatrixForMask(version, codewords, forced),
      version,
      size: 17 + 4 * version,
      maskId: forced,
    }
  }
  let best = null
  let bestScore = Infinity
  let bestMask = 0
  for (let mask = 0; mask < 8; mask++) {
    const m = buildMatrixForMask(version, codewords, mask)
    const s = penalty(m)
    if (s < bestScore) {
      bestScore = s
      best = m
      bestMask = mask
    }
  }
  return { matrix: best, version, size: best.length, maskId: bestMask }
}
