/** 会员管理示例 — 模拟数据与字典（模块级单例内存库，支持增删改，模拟服务端延迟） */

export const MEMBER_STATUS = [
  { value: 'active', label: '已启用', type: 'success' },
  { value: 'pending', label: '待审核', type: 'warning' },
  { value: 'disabled', label: '已禁用', type: 'info' },
]

export const MEMBER_LEVEL = [
  { value: 'basic', label: '普通会员' },
  { value: 'gold', label: '黄金会员' },
  { value: 'platinum', label: '铂金会员' },
]

export const LEVEL_LABEL = Object.fromEntries(MEMBER_LEVEL.map((l) => [l.value, l.label]))
export const DEPTS = ['销售部', '客户成功部', '渠道部', '电商事业部']

const FIRST = ['王', '李', '张', '刘', '陈', '杨', '赵', '周', '吴', '郑', '孙', '钱']
const GIVEN = ['雨轩', '思远', '梦琪', '浩然', '欣怡', '子墨', '静姝', '天佑', '若曦', '宇航', '佳琪', '博文']
const OWNERS = ['林晓', '沈从文', '高翔', '宋佳']

function pad(n) {
  return String(n).padStart(2, '0')
}

function dateStr(base, offsetDays) {
  const d = new Date(base - offsetDays * 86400000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(10 + (offsetDays % 12))}:${pad((offsetDays * 7) % 60)}`
}

function makeMember(i) {
  const now = Date.now()
  const statuses = ['active', 'active', 'active', 'pending', 'disabled']
  const levels = ['basic', 'basic', 'gold', 'gold', 'platinum']
  const name = FIRST[i % FIRST.length] + GIVEN[(i * 5) % GIVEN.length]
  return {
    id: 10000 + i,
    name,
    phone: `138${pad((i * 7) % 100)}${pad((i * 13) % 100)}${pad((i * 3) % 100)}${i % 10}${(i + 3) % 10}`,
    email: `member${10000 + i}@example.com`,
    level: levels[i % levels.length],
    status: statuses[i % statuses.length],
    owner: OWNERS[i % OWNERS.length],
    dept: DEPTS[(i >> 1) % DEPTS.length],
    balance: Math.round(((i * 977) % 90000) / 10) * 10,
    createdAt: dateStr(now, i * 3 + 2),
    lastLoginAt: dateStr(now, i % 15),
  }
}

/** 内存库（模块级单例，整个会话内增删改保持一致） */
const db = Array.from({ length: 44 }, (_, i) => makeMember(i))
let nextId = 20000

/** 分页查询：按条件过滤 + 切片，约 300ms 延迟 */
export function fetchMembers({ keyword = '', level = '', status = '', page = 1, pageSize = 10 } = {}) {
  const filtered = db.filter((m) => {
    const hitKeyword =
      !keyword || m.name.includes(keyword) || m.email.includes(keyword) || m.phone.includes(keyword)
    const hitLevel = !level || m.level === level
    const hitStatus = !status || m.status === status
    return hitKeyword && hitLevel && hitStatus
  })
  const start = (page - 1) * pageSize
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ list: filtered.slice(start, start + pageSize), total: filtered.length })
    }, 300)
  })
}

export function createMember(data) {
  const member = {
    ...makeMember(Math.floor(Math.random() * 44)),
    ...data,
    id: ++nextId,
    createdAt: dateStr(Date.now(), 0),
    lastLoginAt: '-',
  }
  db.unshift(member)
  return member
}

export function updateMember(id, patch) {
  const idx = db.findIndex((m) => m.id === id)
  if (idx > -1) db[idx] = { ...db[idx], ...patch }
  return db[idx]
}

export function removeMembers(ids) {
  const idSet = new Set(ids)
  let count = 0
  for (let i = db.length - 1; i >= 0; i--) {
    if (idSet.has(db[i].id)) {
      db.splice(i, 1)
      count++
    }
  }
  return count
}

/** 模拟批量导入：生成 count 条新会员 */
export function importMembers(count = 3) {
  for (let i = 0; i < count; i++) createMember({ name: `导入会员 ${String(nextId - 19999).padStart(3, '0')}` })
  return count
}
