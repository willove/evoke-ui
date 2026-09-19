import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvMarkdown from '../src/components/markdown/index.vue'
import EvMarkdownEditor from '../src/components/markdown-editor/index.vue'
import { parseMarkdown } from '../src/components/markdown/markdown'

describe('parseMarkdown / 内置解析器', () => {
  it('标题分级', () => {
    const html = parseMarkdown('# 一\n## 二\n### 三')
    expect(html).toContain('<h1 class="ev-md__h">一</h1>')
    expect(html).toContain('<h2 class="ev-md__h">二</h2>')
    expect(html).toContain('<h3 class="ev-md__h">三</h3>')
  })

  it('段落 + 行内格式（加粗/斜体/删除线/行内代码/链接）', () => {
    const html = parseMarkdown('**加粗** 和 *斜体* 与 ~~删除~~ 及 `code` 与 [链接](https://a.com)')
    expect(html).toContain('<strong>加粗</strong>')
    expect(html).toContain('<em>斜体</em>')
    expect(html).toContain('<del>删除</del>')
    expect(html).toContain('<code class="ev-md__code-inline">code</code>')
    expect(html).toContain('<a class="ev-md__link" href="https://a.com"')
  })

  it('列表（无序/有序/缩进嵌套）', () => {
    const html = parseMarkdown('- a\n- b\n  - b1\n1. x\n2. y')
    expect(html).toContain('<ul class="ev-md__list"><li>a</li><li>b')
    expect(html).toContain('<ul class="ev-md__list"><li>b1</li></ul>')
    expect(html).toContain('<ol class="ev-md__list"><li>x</li><li>y</li></ol>')
    expect((html.match(/<li>/g) || []).length).toBe(5)
  })

  it('引用（支持内嵌格式）', () => {
    const html = parseMarkdown('> **重点**提示')
    expect(html).toContain('<blockquote class="ev-md__quote">')
    expect(html).toContain('<strong>重点</strong>')
  })

  it('表格含对齐', () => {
    const html = parseMarkdown('| 左 | 中 | 右 |\n| --- | :-: | --: |\n| a | b | c |')
    expect(html).toContain('<table class="ev-md__table">')
    expect(html).toContain('style="text-align:center"')
    expect(html).toContain('style="text-align:right"')
    expect(html).toContain('<td>a</td>')
  })

  it('代码围栏走语法高亮', () => {
    const html = parseMarkdown('```js\nconst a = 1\n```')
    expect(html).toContain('tok-keyword">const<')
    expect(html).toContain('ev-md__pre')
  })

  it('HTML 注入被转义', () => {
    const html = parseMarkdown('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img')
  })

  it('javascript: 链接被阻断为 #', () => {
    const html = parseMarkdown('[x](javascript:alert(1))')
    expect(html).toContain('href="#"')
  })

  it('属性位引号注入被转义（alt 逃逸不出属性）', () => {
    const html = parseMarkdown('![a" onerror="alert(1)](https://x.png)')
    const box = document.createElement('div')
    box.innerHTML = html
    const img = box.querySelector('img')
    expect(img.getAttribute('onerror')).toBeNull()
    expect(img.getAttribute('alt')).toBe('a" onerror="alert(1)')
  })

  it('图片', () => {
    const html = parseMarkdown('![logo](/img.png)')
    expect(html).toContain('<img class="ev-md__img" src="/img.png" alt="logo" />')
  })

  it('分隔线', () => {
    expect(parseMarkdown('---')).toContain('<hr class="ev-md__hr" />')
  })
})

describe('EvMarkdown 组件', () => {
  it('content 渲染为富文本结构', () => {
    const w = mount(EvMarkdown, { props: { content: '# 标题\n正文' } })
    expect(w.find('.ev-markdown h1').text()).toBe('标题')
    expect(w.find('.ev-markdown .ev-md__p').text()).toBe('正文')
  })
})

describe('EvMarkdownEditor / 编辑器', () => {
  const mountEditor = (props = {}) => mount(EvMarkdownEditor, { props: { modelValue: '', ...props } })

  it('v-model 输入同步', async () => {
    const w = mountEditor()
    await w.find('textarea').setValue('# hi')
    expect(w.emitted('update:modelValue')[0][0]).toBe('# hi')
  })

  it('split 双栏实时预览', async () => {
    const w = mountEditor({ modelValue: '**bold**' })
    expect(w.find('.ev-md-editor__preview strong').exists()).toBe(true)
  })

  it('toggle 模式切换编辑/预览', async () => {
    const w = mountEditor({ modelValue: 'x', preview: 'toggle' })
    // jsdom 的 getComputedStyle 不回显 textarea 的内联 display，改断言内联样式
    const inputStyle = () => w.find('.ev-md-editor__input').attributes('style') ?? ''
    expect(inputStyle()).not.toContain('display: none')
    expect(w.find('.ev-md-editor__preview').attributes('style')).toContain('display: none')
    await w.findAll('.ev-md-editor__tab')[1].trigger('click')
    expect(inputStyle()).toContain('display: none')
    expect(w.find('.ev-md-editor__preview').attributes('style')).not.toContain('display: none')
  })

  it('工具栏加粗：包裹选区', async () => {
    const w = mountEditor({ modelValue: 'hello' })
    const ta = w.find('textarea').element
    ta.selectionStart = 0
    ta.selectionEnd = 5
    await w.findAll('.ev-md-editor__btn')[0].trigger('click')
    expect(w.emitted('update:modelValue')[0][0]).toBe('**hello**')
  })

  it('行前缀切换：无序列表覆盖多行', async () => {
    const w = mountEditor({ modelValue: 'a\nb' })
    const ta = w.find('textarea').element
    ta.selectionStart = 0
    ta.selectionEnd = 3
    const ulBtn = w
      .findAll('.ev-md-editor__btn')
      .find((b) => b.attributes('aria-label') === '无序列表')
    await ulBtn.trigger('click')
    expect(w.emitted('update:modelValue')[0][0]).toBe('- a\n- b')
  })

  it('disabled 时不响应工具栏', async () => {
    const w = mountEditor({ modelValue: 'x', disabled: true })
    await w.findAll('.ev-md-editor__btn')[0].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
