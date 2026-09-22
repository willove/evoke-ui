import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ChatStackTrace from '../src/components/chatbot/ChatStackTrace.vue'
import ChatTestResults from '../src/components/chatbot/ChatTestResults.vue'
import { parseStackTrace, formatFrameLocation, shortenPath } from '../src/components/chatbot/stackTrace'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 N：测试结果与 stack trace
 *
 * 两张都是纯数据渲染。stack 解析要认三种形态并分清应用帧与依赖帧——
 * 依赖帧对定位业务问题没用，默认折叠。
 */

const STACK = [
  'Error: boom',
  '    at doThing (http://app.example/main.js:10:5)',
  '    at Object.next (node_modules/lib/index.js:3:1)',
  '    at http://app.example/other.js:20:7',
  '    at process (node:internal/process/task_queues:95:5)',
].join('\n')

describe('parseStackTrace', () => {
  it('三种形态都认', () => {
    const v8 = parseStackTrace(STACK).frames
    expect(v8[0]).toMatchObject({ fn: 'doThing', file: 'http://app.example/main.js', line: 10, column: 5 })
    // 无函数名的 V8 形态
    expect(v8[2]).toMatchObject({ fn: '', file: 'http://app.example/other.js', line: 20, column: 7 })
    // Firefox 形态
    const ff = parseStackTrace('fn@http://x/y.js:1:2').frames
    expect(ff[0]).toMatchObject({ fn: 'fn', file: 'http://x/y.js', line: 1, column: 2 })
    // Node 形态
    const node = parseStackTrace('    at fn (/path/file.js:1:2)').frames
    expect(node[0]).toMatchObject({ fn: 'fn', file: '/path/file.js', line: 1, column: 2 })
  })

  it('依赖帧与匿名帧被归到另一侧', () => {
    const { appFrames, dependencyFrames } = parseStackTrace(STACK)
    expect(appFrames.map((f) => f.fn)).toEqual(['doThing', ''])
    expect(dependencyFrames).toHaveLength(2)
    expect(dependencyFrames.map((f) => f.file)).toEqual([
      'node_modules/lib/index.js',
      'node:internal/process/task_queues',
    ])
  })

  it('vendor / webpack / anonymous 也算依赖', () => {
    const { dependencyFrames } = parseStackTrace(
      ['at a (/vendor/x.js:1:1)', 'at b (webpack:///src/y.js:1:1)', 'at <anonymous>:1:1'].join('\n'),
    )
    expect(dependencyFrames).toHaveLength(3)
  })

  it('已解析的 frames 原样接受，缺失字段补齐', () => {
    const { frames } = parseStackTrace([{ fn: 'x', file: 'a.js', line: 1 }, { file: 'node_modules/b.js' }])
    expect(frames[0]).toMatchObject({ fn: 'x', line: 1, column: null, isDependency: false })
    expect(frames[1].isDependency).toBe(true)
  })

  it('非 stack 行被忽略；空输入安全', () => {
    const mixed = ['Error: boom', 'some log line', STACK.split('\n')[1]].join('\n')
    expect(parseStackTrace(mixed).frames).toHaveLength(1)
    expect(parseStackTrace('').frames).toEqual([])
    expect(parseStackTrace(null).frames).toEqual([])
    expect(parseStackTrace(undefined).frames).toEqual([])
  })

  it('位置格式化：缺列号省略、缺行号只给文件', () => {
    expect(formatFrameLocation({ file: 'a.js', line: 3, column: 4 })).toBe('a.js:3:4')
    expect(formatFrameLocation({ file: 'a.js', line: 3 })).toBe('a.js:3')
    expect(formatFrameLocation({ file: 'a.js' })).toBe('a.js')
    expect(formatFrameLocation(null)).toBe('')
  })

  it('长路径从左侧截断，保留尾部（文件名与行号才是定位靠的）', () => {
    const long = 'http://very.long.example/some/deep/path/to/file.js'
    const out = shortenPath(long, 20)
    expect(out.startsWith('…')).toBe(true)
    expect(out.endsWith('file.js')).toBe(true)
    expect(out).toHaveLength(20)
    expect(shortenPath('a.js', 20)).toBe('a.js')
  })
})

describe('ChatStackTrace', () => {
  it('应用帧直接列出，依赖帧折叠成一行并可展开', async () => {
    const w = mount(ChatStackTrace, { props: { stack: STACK } })
    expect(w.findAll('.eb-chat-stack__list:not(.eb-chat-stack__list--dep) .eb-chat-stack__row')).toHaveLength(2)
    const depBtn = w.find('.eb-chat-stack__more--dep')
    expect(depBtn.text()).toBe(chatLabels.stack.dependencies(2))
    expect(depBtn.attributes('aria-expanded')).toBe('false')
    await depBtn.trigger('click')
    expect(w.findAll('.eb-chat-stack__list--dep .eb-chat-stack__row')).toHaveLength(2)
    expect(w.find('.eb-chat-stack__more--dep').text()).toBe(chatLabels.stack.hideDependencies)
  })

  it('collapseDependencies=false 时依赖帧平铺', () => {
    const w = mount(ChatStackTrace, { props: { stack: STACK, collapseDependencies: false } })
    expect(w.find('.eb-chat-stack__more--dep').exists()).toBe(false)
    expect(w.findAll('.eb-chat-stack__list--dep .eb-chat-stack__row')).toHaveLength(2)
  })

  it('maxAppFrames 截断并给「还有 N 帧」翻页', async () => {
    const many = ['Error', ...Array.from({ length: 6 }, (_, i) => `    at f${i} (http://a/${i}.js:1:1)`)].join('\n')
    const w = mount(ChatStackTrace, { props: { stack: many, maxAppFrames: 3 } })
    expect(w.findAll('.eb-chat-stack__list:not(.eb-chat-stack__list--dep) .eb-chat-stack__row')).toHaveLength(3)
    const more = w.find('.eb-chat-stack__more:not(.eb-chat-stack__more--dep)')
    expect(more.text()).toBe(chatLabels.stack.moreFrames(3))
    await more.trigger('click')
    expect(w.findAll('.eb-chat-stack__list:not(.eb-chat-stack__list--dep) .eb-chat-stack__row')).toHaveLength(6)
    expect(w.find('.eb-chat-stack__more:not(.eb-chat-stack__more--dep)').exists()).toBe(false)
  })

  it('点帧抛 frame-click，带解析好的字段', async () => {
    const w = mount(ChatStackTrace, { props: { stack: STACK } })
    await w.findAll('.eb-chat-stack__row')[0].trigger('click')
    expect(w.emitted('frame-click')[0][0]).toMatchObject({ fn: 'doThing', file: 'http://app.example/main.js', line: 10 })
  })

  it('换一段 stack 会收回展开态（不把上一条的状态串过来）', async () => {
    const many = ['Error', ...Array.from({ length: 6 }, (_, i) => `    at f${i} (http://a/${i}.js:1:1)`)].join('\n')
    const w = mount(ChatStackTrace, { props: { stack: many, maxAppFrames: 2 } })
    await w.find('.eb-chat-stack__more:not(.eb-chat-stack__more--dep)').trigger('click')
    expect(w.findAll('.eb-chat-stack__list:not(.eb-chat-stack__list--dep) .eb-chat-stack__row')).toHaveLength(6)
    await w.setProps({ stack: STACK })
    await nextTick()
    expect(w.findAll('.eb-chat-stack__list:not(.eb-chat-stack__list--dep) .eb-chat-stack__row')).toHaveLength(2)
  })

  it('没有可解析的帧就不渲染', () => {
    expect(mount(ChatStackTrace, { props: { stack: 'Error: boom' } }).find('.eb-chat-stack').exists()).toBe(false)
  })
})

describe('ChatTestResults', () => {
  const RESULTS = {
    summary: { passed: 12, failed: 2, skipped: 1, duration: 3420 },
    cases: [
      { name: 'a 用例', suite: 'su', status: 'passed', duration: 2 },
      { name: 'b 用例', status: 'failed', duration: 12, message: '期望 2 实际 1', stack: STACK },
      { name: 'c 用例', status: 'skipped' },
    ],
  }

  it('汇总条用宿主给的 summary，并列失败项', () => {
    const w = mount(ChatTestResults, { props: { results: RESULTS } })
    expect(w.find('.eb-chat-test-results__stat.is-passed').text()).toBe(chatLabels.tests.passed(12))
    expect(w.find('.eb-chat-test-results__stat.is-failed').text()).toBe(chatLabels.tests.failed(2))
    expect(w.find('.eb-chat-test-results__stat.is-skipped').text()).toBe(chatLabels.tests.skipped(1))
    expect(w.find('.eb-chat-test-results__duration').text()).toBe('3.42s')
    expect(w.findAll('.eb-chat-test-results__case')).toHaveLength(3)
  })

  it('失败项默认展开报错与 stack（组合 ChatStackTrace）', () => {
    const w = mount(ChatTestResults, { props: { results: RESULTS, expandStacks: true } })
    const failed = w.find('.eb-chat-test-results__case.is-failed')
    expect(failed.find('.eb-chat-test-results__message').text()).toBe('期望 2 实际 1')
    expect(failed.findComponent(ChatStackTrace).exists()).toBe(true)
    // 通过项没有详情
    expect(w.find('.eb-chat-test-results__case.is-passed .eb-chat-test-results__detail').exists()).toBe(false)
  })

  it('「只看失败」过滤掉通过与跳过项', async () => {
    const w = mount(ChatTestResults, { props: { results: RESULTS } })
    const toggle = w.find('.eb-chat-test-results__toggle')
    expect(toggle.text()).toBe(chatLabels.tests.onlyFailed)
    await toggle.trigger('click')
    expect(w.findAll('.eb-chat-test-results__case')).toHaveLength(1)
    expect(w.find('.eb-chat-test-results__case').classes()).toContain('is-failed')
    expect(w.find('.eb-chat-test-results__toggle').text()).toBe(chatLabels.tests.hidePassed)
  })

  it('无失败项时不出现过滤按钮', () => {
    const w = mount(ChatTestResults, { props: { cases: [{ name: 'a', status: 'passed' }] } })
    expect(w.find('.eb-chat-test-results__toggle').exists()).toBe(false)
  })

  it('status 归一：pass/ok 算通过，skip/todo 算跳过，其余算失败', () => {
    const w = mount(ChatTestResults, {
      props: {
        cases: [
          { name: 'a', status: 'pass' },
          { name: 'b', status: 'ok' },
          { name: 'c', status: 'skip' },
          { name: 'd', status: 'todo' },
          { name: 'e', status: 'weird' },
          { name: 'f' },
        ],
      },
    })
    expect(w.findAll('.eb-chat-test-results__case.is-passed')).toHaveLength(2)
    expect(w.findAll('.eb-chat-test-results__case.is-skipped')).toHaveLength(3)
    expect(w.findAll('.eb-chat-test-results__case.is-failed')).toHaveLength(1)
    // 没给状态的按跳过处理：既不宣称通过也不宣称失败
    expect(w.findAll('.eb-chat-test-results__case.is-skipped .eb-chat-test-results__name').map((n) => n.text())).toEqual(['c', 'd', 'f'])
  })

  it('未给 summary 时按 cases 数出来，耗时累加', () => {
    const w = mount(ChatTestResults, {
      props: { cases: [{ name: 'a', status: 'passed', duration: 100 }, { name: 'b', status: 'failed', duration: 900 }] },
    })
    expect(w.find('.eb-chat-test-results__stat.is-passed').text()).toBe(chatLabels.tests.passed(1))
    expect(w.find('.eb-chat-test-results__duration').text()).toBe('1.00s')
  })

  it('点用例抛 case-click；帧点击带上所属用例', async () => {
    const w = mount(ChatTestResults, { props: { results: RESULTS, expandStacks: true } })
    const failed = w.find('.eb-chat-test-results__case.is-failed')
    await failed.find('.eb-chat-test-results__head').trigger('click')
    expect(w.emitted('case-click')[0][0].name).toBe('b 用例')
    // 关掉后详情消失
    expect(w.find('.eb-chat-test-results__case.is-failed .eb-chat-test-results__detail').exists()).toBe(false)
  })

  it('空结果不渲染', () => {
    expect(mount(ChatTestResults, { props: { results: {} } }).find('.eb-chat-test-results').exists()).toBe(false)
    expect(mount(ChatTestResults, { props: { cases: [] } }).find('.eb-chat-test-results').exists()).toBe(false)
  })
})
