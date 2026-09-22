import { describe, it, expect } from 'vitest'
// 母本住在 @wil-works/evoke-chat（2026-09-22 随对话家族搬出底座包）；只读比对，不构成运行时耦合
import EbAiPromptBox from '../../evoke-chat/src/components/ai-prompt-box/index.vue'
import EvAiPromptBox from '../src/components/ai-prompt-box/index.vue'

/**
 * 跨包 AI 组件 API 奇偶守卫
 *
 * ai-prompt-box 在两个包里各有一份（Ev* 为官网视觉变体，Eb* 为母本，
 * 2026-09-22 母本随对话家族搬进 @wil-works/evoke-chat）。
 * 曾经 maxLength 只绑进 textarea 的修复单侧落在 evoke-ui，母本侧漏同步数月，
 * 靠人记不住。这里把「改一侧必须查另一侧」变成机器断言：
 * props 名单与 emits 名单必须一致，默认值不一致也要显式登记理由。
 */

const BASE = 'evoke-chat · EbAiPromptBox（母本）'
const FORK = 'evoke-ui · EvAiPromptBox（官网变体）'

/** script setup 编译后 props/emits 挂在默认导出上 */
function surfaceOf(comp) {
  return {
    props: Object.keys(comp.props || {}).sort(),
    emits: [...(comp.emits || [])].sort(),
  }
}

const base = surfaceOf(EbAiPromptBox)
const fork = surfaceOf(EvAiPromptBox)

describe('ai-prompt-box 跨包 API 奇偶', () => {
  it(`${BASE} 的 props 面完整`, () => {
    // 母本侧钉住关键能力，防止被悄悄删掉
    for (const key of ['modelValue', 'scenes', 'capabilities', 'models', 'quota', 'stoppable', 'maxLength', 'sendOnEnter']) {
      expect(base.props).toContain(key)
    }
  })

  it('两包 props 名单完全一致', () => {
    const onlyBase = base.props.filter((k) => !fork.props.includes(k))
    const onlyFork = fork.props.filter((k) => !base.props.includes(k))
    expect(onlyBase, `${FORK} 缺少 props: ${onlyBase.join(', ')}`).toEqual([])
    expect(onlyFork, `${FORK} 多出 props: ${onlyFork.join(', ')}`).toEqual([])
  })

  it('两包 emits 名单完全一致', () => {
    const onlyBase = base.emits.filter((k) => !fork.emits.includes(k))
    const onlyFork = fork.emits.filter((k) => !base.emits.includes(k))
    expect(onlyBase, `${FORK} 缺少事件: ${onlyBase.join(', ')}`).toEqual([])
    expect(onlyFork, `${FORK} 多出事件: ${onlyFork.join(', ')}`).toEqual([])
  })

  it('两包默认值一致（差异必须显式登记）', () => {
    // 已知且刻意保留的差异登记在此，附理由；新增差异一律视为漏同步
    const ALLOWED = {
      // 母本已 i18n：默认值改为 undefined，渲染期取语言包（zh-CN 下仍是同一句话）。
      // 官网变体还没有 locale 体系，暂留写死的默认值——它要补 i18n 时按母本改。
      placeholder: '母本走语言包（undefined=未传），变体尚无 locale',
    }
    const diffs = []
    for (const key of base.props) {
      const a = EbAiPromptBox.props[key]?.default
      const b = EvAiPromptBox.props[key]?.default
      if (typeof a === 'function' || typeof b === 'function') continue
      const same = JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
      if (!same && !(key in ALLOWED)) diffs.push(`${key}: ${BASE}=${JSON.stringify(a)} / ${FORK}=${JSON.stringify(b)}`)
    }
    expect(diffs, `默认值漂移：\n${diffs.join('\n')}`).toEqual([])
  })
})
