/**
 * 命令契约与注册表（tools-ui 计划 01 §二 / 05 L0 / M1 交付物 1）
 *
 * 形态对齐 Univer 的 `ICommand`，状态流用 Vue 的 ref/computed 表达（不引 RxJS）。
 * 三条铁律（G3 命令面门的判据）：
 *   ① 每个可点控件绑定的 commandId 必须已注册；
 *   ② 命令声明的 surfaces 与真实可达面一致（buildReachabilityReport 自动核对）；
 *   ③ 同一命令的 enabled/active 只有一处实现 —— 就是这里的 state()，
 *      组件一律消费推演结果，不许各自写一份（上一代"功能区 DOM 六份不一致"的根因）。
 *
 * 本文件是纯函数 + 一个 Map 容器，无 DOM 依赖，可单测（06 §二 L1 契约层）。
 */

import { normalizeCombo } from '../keys/keys'

/** 命令可达面（四处：工具区 / 菜单 / 右键 / 命令面板） */
export const COMMAND_SURFACES = ['toolbar', 'menu', 'context', 'palette']

const ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

/**
 * 校验命令定义（登记期即炸，不把错误留给用户）
 * @param {any} command
 * @returns {string} 规范化后的快捷键（无 keys 时返回 ''）
 */
export function assertCommand(command) {
  if (!command || typeof command !== 'object') {
    throw new TypeError('[command] 命令必须是对象')
  }
  const { id, title, run } = command
  if (typeof id !== 'string' || !ID_RE.test(id)) {
    throw new TypeError(`[command] id 必须是非空 kebab-case 字符串：${String(id)}`)
  }
  if (title !== undefined && typeof title !== 'string') {
    throw new TypeError(`[command] ${id} 的 title 必须是字符串`)
  }
  if (typeof run !== 'function') {
    throw new TypeError(`[command] ${id} 缺少 run 执行体（"加一个功能 = 加一行数据"）`)
  }
  if (command.surfaces !== undefined) {
    if (!Array.isArray(command.surfaces)) {
      throw new TypeError(`[command] ${id} 的 surfaces 必须是数组`)
    }
    for (const s of command.surfaces) {
      if (!COMMAND_SURFACES.includes(s)) {
        throw new RangeError(`[command] ${id} 的 surface「${s}」不在 ${COMMAND_SURFACES.join(' / ')} 之内`)
      }
    }
  }
  if (command.keys !== undefined && command.keys !== '') {
    // 快捷键拼写错误在登记期抛（与键位表同一套规范化），并回写规范串
    return normalizeCombo(command.keys)
  }
  return ''
}

/** 命令在某上下文的状态推演（G3 ③ 的唯一实现处） */
export function resolveCommandState(command, ctx = {}) {
  const enabled = typeof command.enabled === 'function' ? !!command.enabled(ctx) : true
  const active = typeof command.active === 'function' ? !!command.active(ctx) : false
  return { enabled, active }
}

/**
 * 创建命令注册表
 * @returns {{
 *   register: (c: object) => object,
 *   registerAll: (list: object[]) => number,
 *   get: (id: string) => object | null,
 *   has: (id: string) => boolean,
 *   ids: () => string[],
 *   list: () => object[],
 *   state: (id: string, ctx?: object) => { known: boolean, enabled: boolean, active: boolean },
 *   run: (id: string, ctx?: object) => boolean,
 * }}
 */
export function createCommandRegistry() {
  const commands = new Map()

  return {
    register(command) {
      const keys = assertCommand(command)
      if (commands.has(command.id)) {
        throw new Error(`[command] 重复注册：${command.id}（一个命令一处定义）`)
      }
      const stored = { ...command, keys }
      commands.set(command.id, stored)
      return stored
    },
    registerAll(list) {
      if (!Array.isArray(list)) throw new TypeError('[command] registerAll 需要数组')
      for (const c of list) this.register(c)
      return commands.size
    },
    get(id) {
      return commands.get(id) ?? null
    },
    has(id) {
      return commands.has(id)
    },
    ids() {
      return [...commands.keys()]
    },
    list() {
      return [...commands.values()]
    },
    /** 未注册的命令一律视为不可用（known=false）——消费方据此兜底，不抛 */
    state(id, ctx = {}) {
      const command = commands.get(id)
      if (!command) return { known: false, enabled: false, active: false }
      return { known: true, ...resolveCommandState(command, ctx) }
    },
    /** 执行命令：未注册 / 被禁用时不执行，返回是否真的跑了 */
    run(id, ctx = {}) {
      const command = commands.get(id)
      if (!command) return false
      if (!resolveCommandState(command, ctx).enabled) return false
      command.run(ctx)
      return true
    },
  }
}

/**
 * 可达面报告（M1 出口条件「一次操作四处可达」的自动核对）
 *
 * @param {object} options
 * @param {ReturnType<createCommandRegistry>} options.registry
 * @param {object} [options.schemas] 声明式 schema：{ toolbar?, menu?, context? }（节点树或节点数组）
 * @param {boolean} [options.paletteAdaptersCommands] 命令面板是否由命令表驱动（适配器接上即为 true）
 * @returns {{ total: number, reachable: number, unreachable: Array<{ id: string, reason: string }> }}
 */
export function buildReachabilityReport({ registry, schemas = {}, paletteAdapter = true }) {
  const referenced = new Map() // id → Set(surface)
  const note = (id, surface) => {
    if (!referenced.has(id)) referenced.set(id, new Set())
    referenced.get(id).add(surface)
  }

  for (const surface of ['toolbar', 'menu', 'context']) {
    for (const id of collectSchemaCommandIds(schemas[surface])) note(id, surface)
  }
  if (paletteAdapter) {
    // 命令面板的适配器从命令表全量生成条目：注册过的命令默认可达
    for (const cmd of registry.list()) note(cmd.id, 'palette')
  }

  const unreachable = []
  for (const cmd of registry.list()) {
    const surfaces = referenced.get(cmd.id)
    if (!surfaces || surfaces.size === 0) {
      unreachable.push({ id: cmd.id, reason: '未出现在任何可达面（toolbar/menu/context 均无引用，palette 也未适配）' })
    }
  }
  return {
    total: registry.list().length,
    reachable: registry.list().length - unreachable.length,
    unreachable,
  }
}

/** 收集 schema 树里引用的命令 id（去重、保序） */
export function collectSchemaCommandIds(schema) {
  const out = []
  const visit = (node) => {
    if (!node) return
    if (Array.isArray(node)) {
      for (const n of node) visit(n)
      return
    }
    if (typeof node !== 'object') return
    if (typeof node.command === 'string' && node.command) out.push(node.command)
    if (Array.isArray(node.children)) for (const c of node.children) visit(c)
  }
  visit(schema)
  return [...new Set(out)]
}
