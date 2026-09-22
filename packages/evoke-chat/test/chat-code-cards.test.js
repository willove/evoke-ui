import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import ChatDiff from '../src/components/chatbot/ChatDiff.vue'
import ChatTerminal from '../src/components/chatbot/ChatTerminal.vue'
import ChatFileTree from '../src/components/chatbot/ChatFileTree.vue'
import ChatMessage from '../src/components/chatbot/ChatMessage.vue'
import { parseDiff } from '../src/components/chatbot/diff'
import { ansiToHtml, stripAnsi } from '../src/components/chatbot/ansi'
import { chatLabels } from '../src/components/chatbot/labels'

/**
 * 批 G：代码 agent 三卡——diff / 终端 / 文件树
 *
 * 三者都零新依赖：diff 是纯解析 + CSS，终端自己解最小 ANSI，文件树是嵌套列表。
 */

const SINGLE = [
  'diff --git a/src/a.ts b/src/a.ts',
  'index 111..222 100644',
  '--- a/src/a.ts',
  '+++ b/src/a.ts',
  '@@ -1,3 +1,4 @@ export const',
  ' const a = 1',
  '-const b = 2',
  '+const b = 3',
  '+const c = 4',
  ' export default a',
].join('\n')

describe('parseDiff', () => {
  it('单文件单 hunk：行分类、增删计数、行号正确', () => {
    const { files, additions, deletions } = parseDiff(SINGLE)
    expect(files).toHaveLength(1)
    expect(files[0].path).toBe('src/a.ts')
    expect(files[0].additions).toBe(2)
    expect(files[0].deletions).toBe(1)
    expect([additions, deletions]).toEqual([2, 1])

    const types = files[0].lines.map((l) => l.type)
    expect(types).toContain('hunk')
    expect(types.filter((t) => t === 'add')).toHaveLength(2)
    expect(types.filter((t) => t === 'del')).toHaveLength(1)
    expect(types.filter((t) => t === 'context')).toHaveLength(2)
    // hunk 头声明从 1 开始：上下文占 old/new 各一行并递增
    const ctx = files[0].lines.filter((l) => l.type === 'context')
    expect(ctx[0]).toMatchObject({ oldNo: 1, newNo: 1 })
    expect(ctx[1]).toMatchObject({ oldNo: 3, newNo: 4 })
  })

  it('多文件各自归组；a/ b/ 前缀剥掉', () => {
    const two = `${SINGLE}\ndiff --git a/x/y.md b/x/y.md\n--- a/x/y.md\n+++ b/x/y.md\n@@ -0,0 +1 @@\n+新文件\n`
    const { files } = parseDiff(two)
    expect(files).toHaveLength(2)
    expect(files[1].path).toBe('x/y.md')
    expect(files[1].additions).toBe(1)
  })

  it('新增文件的 /dev/null 不当作路径', () => {
    const created = 'diff --git a/new.txt b/new.txt\n--- /dev/null\n+++ b/new.txt\n@@ -0,0 +1 @@\n+hi'
    const { files } = parseDiff(created)
    expect(files[0].oldPath).toBe('')
    expect(files[0].path).toBe('new.txt')
  })

  it('没有 diff 头的裸 hunk 也接受', () => {
    const { files } = parseDiff('@@ -1 +1 @@\n-a\n+b')
    expect(files).toHaveLength(1)
    expect(files[0].additions).toBe(1)
  })

  it('反斜杠标记按 note 处理，不计入增删', () => {
    const { files, additions, deletions } = parseDiff('@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+b')
    expect(files[0].lines.some((l) => l.type === 'note')).toBe(true)
    expect([additions, deletions]).toEqual([1, 1])
  })

  it('空输入不炸', () => {
    expect(parseDiff('').files).toEqual([])
    expect(parseDiff(null).files).toEqual([])
  })
})

describe('ansi', () => {
  it('无 SGR 时只做转义', () => {
    expect(ansiToHtml('<b>hi</b>')).toBe('&lt;b&gt;hi&lt;/b&gt;')
  })

  it('前景色与重置映射到类名', () => {
    const html = ansiToHtml('\u001b[31m红\u001b[0m常')
    expect(html).toContain('<span class="is-fg-red">红</span>')
    expect(html).toContain('常')
  })

  it('加粗开与关', () => {
    expect(ansiToHtml('\u001b[1m粗\u001b[22m常')).toContain('<span class="is-bold">粗</span>')
  })

  it('换色时替换而不是叠加', () => {
    const html = ansiToHtml('\u001b[31mA\u001b[32mB')
    expect(html).toContain('is-fg-red')
    expect(html).toContain('is-fg-green')
    // 后一段不该同时带红与绿
    expect(html).not.toMatch(/is-fg-red is-fg-green/)
  })

  it('未知码忽略，不产出无法识别的样式', () => {
    expect(ansiToHtml('\u001b[4m下划线\u001b[0m')).toBe('下划线')
  })

  it('注入探针：文本里的标签被转义，只有解析器自己造的 span 进 HTML', () => {
    const html = ansiToHtml('\u001b[31m<script>alert(1)</script>\u001b[0m')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html.match(/<span/g)).toHaveLength(1)
  })

  it('stripAnsi 去掉全部序列', () => {
    expect(stripAnsi('\u001b[31m红\u001b[0m常')).toBe('红常')
  })
})

describe('ChatDiff', () => {
  it('头部给路径与增删统计，行按类型着色', () => {
    const w = mount(ChatDiff, { props: { diff: SINGLE } })
    expect(w.find('.eb-chat-diff__path').text()).toBe('src/a.ts')
    expect(w.find('.eb-chat-diff__add').text()).toBe('+2')
    expect(w.find('.eb-chat-diff__del').text()).toBe('−1')
    expect(w.findAll('.eb-chat-diff__line.is-add')).toHaveLength(2)
    expect(w.findAll('.eb-chat-diff__line.is-del')).toHaveLength(1)
    expect(w.find('.eb-chat-diff__line.is-hunk').text()).toContain('export const')
    // 组标签含统计，读屏能听出规模
    expect(w.attributes('aria-label')).toContain('新增 2 行')
  })

  it('行号栅格在，且不参与文本选择（避免复制带上行号）', () => {
    const w = mount(ChatDiff, { props: { diff: SINGLE } })
    const gutter = w.find('.eb-chat-diff__gutter')
    expect(gutter.attributes('aria-hidden')).toBe('true')
  })

  it('折叠切换带 aria-expanded 与 toggle 事件', async () => {
    const w = mount(ChatDiff, { props: { diff: SINGLE } })
    const btn = w.find('.eb-chat-diff__toggle')
    expect(btn.attributes('aria-expanded')).toBe('true')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(w.emitted('toggle')[0]).toEqual([0, false])
  })

  it('复制的是原始 diff 文本而非渲染结果', async () => {
    const w = mount(ChatDiff, { props: { diff: SINGLE } })
    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      await w.find('.eb-chat-diff__copy').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(writeText).toHaveBeenCalledWith(SINGLE)
      expect(w.emitted('copy')[0][0]).toBe(SINGLE)
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }
  })

  it('空 diff 不渲染容器', () => {
    expect(mount(ChatDiff, { props: { diff: '' } }).find('.eb-chat-diff').exists()).toBe(false)
  })
})

describe('ChatTerminal', () => {
  it('头部给命令与退出码；ANSI 输出上色', () => {
    const w = mount(ChatTerminal, {
      props: { command: 'npm test', output: '\u001b[32mPASS\u001b[0m 3 passed', exitCode: 0 },
    })
    expect(w.find('.eb-chat-terminal__cmd').text()).toBe('npm test')
    expect(w.find('.eb-chat-terminal__status').text()).toBe('exit 0')
    expect(w.find('.eb-chat-terminal__out .is-fg-green').text()).toBe('PASS')
  })

  it('running 显示光标，error 给状态类', async () => {
    const run = mount(ChatTerminal, { props: { command: 'sleep', output: '', status: 'running' } })
    expect(run.find('.eb-chat-terminal__caret').exists()).toBe(true)
    expect(run.find('.eb-chat-terminal__empty').text()).toBe(chatLabels.terminal.empty)
    const err = mount(ChatTerminal, { props: { command: 'x', output: 'boom', status: 'error', exitCode: 1 } })
    expect(err.classes()).toContain('is-error')
    expect(err.find('.eb-chat-terminal__status').text()).toBe('exit 1')
  })

  it('长输出只渲染尾部，给省略数与展开入口', async () => {
    const output = Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n')
    const w = mount(ChatTerminal, { props: { command: 'log', output } })
    expect(w.text()).toContain('line 59')
    expect(w.text()).not.toContain('line 0\n')
    expect(w.find('.eb-chat-terminal__omitted').text()).toContain(chatLabels.terminal.truncated(20))
    await w.find('.eb-chat-terminal__more').trigger('click')
    expect(w.text()).toContain('line 0')
    expect(w.find('.eb-chat-terminal__omitted').exists()).toBe(false)
  })

  it('tailLines=0 表示不限行', () => {
    const output = Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n')
    const w = mount(ChatTerminal, { props: { command: 'log', output, tailLines: 0 } })
    expect(w.find('.eb-chat-terminal__omitted').exists()).toBe(false)
    expect(w.text()).toContain('line 0')
  })

  it('复制出去的是纯文本（不带 ANSI 序列）', async () => {
    const w = mount(ChatTerminal, { props: { command: 'x', output: '\u001b[31mred\u001b[0m' } })
    const desc = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    try {
      await w.find('.eb-chat-terminal__act').trigger('click')
      await new Promise((r) => setTimeout(r, 0))
      expect(writeText).toHaveBeenCalledWith('red')
    } finally {
      if (desc) Object.defineProperty(navigator, 'clipboard', desc)
      else delete navigator.clipboard
    }
  })

  it('无输出时不显示复制钮', () => {
    const w = mount(ChatTerminal, { props: { command: 'x', output: '' } })
    expect(w.find('.eb-chat-terminal__act').exists()).toBe(false)
  })
})

describe('ChatFileTree', () => {
  const FILES = [
    { path: 'src/components/a.vue', status: 'modified', additions: 3, deletions: 1 },
    { path: 'src/utils/b.ts', status: 'added', additions: 10 },
    { path: 'README.md', status: 'deleted', deletions: 5 },
  ]

  it('扁平路径建成嵌套树，目录在前、名称升序', () => {
    const w = mount(ChatFileTree, { props: { files: FILES } })
    const dirRows = w.findAll('.eb-chat-file-node__row.is-dir').map((n) => n.text())
    expect(dirRows[0]).toContain('src')
    // README.md 与 src 同层，目录排前
    const topRows = w.findAll('.eb-chat-file-tree__list > li > .eb-chat-file-node__row').map((n) => n.text())
    expect(topRows[0]).toContain('src')
    expect(topRows[1]).toContain('README.md')
  })

  it('目录默认展开，折叠后子项隐藏', async () => {
    const w = mount(ChatFileTree, { props: { files: FILES } })
    const src = w.findAll('.eb-chat-file-node__row.is-dir')[0]
    expect(src.attributes('aria-expanded')).toBe('true')
    expect(w.text()).toContain('a.vue')
    await src.trigger('click')
    expect(src.attributes('aria-expanded')).toBe('false')
    expect(w.text()).not.toContain('a.vue')
    expect(w.emitted('toggle')[0][0]).toBe('src')
  })

  it('状态徽标与增删行数', () => {
    const w = mount(ChatFileTree, { props: { files: FILES } })
    expect(w.find('.eb-chat-file-node__status.is-modified').text()).toBe(chatLabels.fileTree.modified)
    expect(w.find('.eb-chat-file-node__status.is-added').text()).toBe(chatLabels.fileTree.added)
    expect(w.find('.eb-chat-file-node__status.is-deleted').text()).toBe(chatLabels.fileTree.deleted)
    expect(w.text()).toContain('+3')
    expect(w.text()).toContain('−1')
  })

  it('点文件抛 (file, path)', async () => {
    const w = mount(ChatFileTree, { props: { files: FILES } })
    const readme = w.findAll('.eb-chat-file-node__row.is-file').find((n) => n.text().includes('README'))
    await readme.trigger('click')
    const evt = w.emitted('select')
    expect(evt[0][0].status).toBe('deleted')
    expect(evt[0][1]).toBe('README.md')
  })

  it('defaultExpandAll=false 时初始收起', () => {
    const w = mount(ChatFileTree, { props: { files: FILES, defaultExpandAll: false } })
    expect(w.findAll('.eb-chat-file-node__row.is-dir')[0].attributes('aria-expanded')).toBe('false')
    expect(w.text()).not.toContain('a.vue')
  })

  it('空列表不渲染容器', () => {
    expect(mount(ChatFileTree, { props: { files: [] } }).find('.eb-chat-file-tree').exists()).toBe(false)
  })
})

describe('ChatMessage 文件树接线', () => {
  it('渲染在产物之后，事件带 message', async () => {
    const w = mount(ChatMessage, {
      props: {
        message: {
          id: 'a1', role: 'assistant', status: 'done', content: '改完了',
          artifacts: [{ id: 'f1', title: 'x.md', content: 'x' }],
          fileTree: [{ path: 'src/a.ts', status: 'modified', additions: 1 }],
        },
      },
    })
    const html = w.find('.eb-chat-message__content').html()
    expect(html.indexOf('eb-chat-artifacts')).toBeLessThan(html.indexOf('eb-chat-file-tree'))
    await w.find('.eb-chat-file-node__row.is-file').trigger('click')
    expect(w.emitted('file-select')[0][2].id).toBe('a1')
  })
})

describe('工具卡结果区插槽透传', () => {
  const MSG = {
    id: 'a1', role: 'assistant', status: 'done', content: '跑完了',
    toolCalls: [{ id: 't1', name: 'run_tests', status: 'done', args: { cwd: '/x' }, result: '\u001b[32mPASS\u001b[0m' }],
  }

  it('ChatMessage#tool-result 能接住 ChatToolCall 的结果区', () => {
    const w = mount(ChatMessage, {
      props: { message: MSG },
      slots: {
        'tool-result': (p) => h('div', { class: 'my-out' }, `自定义结果：${p.toolCall.name}`),
      },
    })
    expect(w.find('.my-out').text()).toBe('自定义结果：run_tests')
    // 上面这条同时有 args：结果区被接管，参数区仍走默认 pre，所以还剩一个
    expect(w.findAll('.eb-chat-tool-call__pre')).toHaveLength(1)

    // 只有 result 的调用：接管后不该再有默认 pre
    const onlyResult = mount(ChatMessage, {
      props: { message: { ...MSG, toolCalls: [{ id: 't2', name: 'digest', status: 'done', result: 'ok' }] } },
      slots: { 'tool-result': () => h('div', { class: 'my-out2' }, '接管') },
    })
    expect(onlyResult.find('.eb-chat-tool-call__pre').exists()).toBe(false)
    expect(onlyResult.find('.my-out2').exists()).toBe(true)
  })

  it('ChatMessage#tool-args 同理接管参数区', () => {
    const w = mount(ChatMessage, {
      props: { message: MSG },
      slots: { 'tool-args': (p) => h('div', { class: 'my-args' }, JSON.stringify(p.toolCall.args)) },
    })
    expect(w.find('.my-args').text()).toBe('{"cwd":"/x"}')
  })

  it('不传插槽时工具卡仍是默认渲染（回归钉）', () => {
    const w = mount(ChatMessage, { props: { message: MSG } })
    expect(w.findAll('.eb-chat-tool-call__pre').length).toBeGreaterThan(0)
  })
})
