import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCodeBlock from '../src/components/code-block/index.vue'
import { highlightCode, detectLanguage } from '../src/components/code-block/highlight'

describe('highlightCode / 内置轻量高亮', () => {
  it('shell：命令名 / 参数 / 字符串 / 注释分词', () => {
    const html = highlightCode('brew install --cask cumubase # setup', 'shell')
    expect(html).toContain('tok-cmd">brew<')
    expect(html).toContain('tok-flag">--cask<')
    expect(html).toContain('tok-comment"># setup<')
    expect(html).not.toContain('tok-cmd">install<')
  })

  it('shell：auto 识别 + 管道后回到命令位 + 转义原文', () => {
    const html = highlightCode('cat a.json | jq .name')
    expect(html).toContain('tok-cmd">cat<')
    expect(html).toContain('tok-cmd">jq<')
    expect(html).not.toContain('tok-cmd">a.json<')
    const escaped = highlightCode('echo "<b>&</b>"', 'shell')
    expect(escaped).toContain('&lt;b&gt;')
    expect(escaped).not.toContain('<b>')
  })

  it('js：关键字 / 字符串 / 函数调用', () => {
    const html = highlightCode("const site = createSite('cumubase')", 'js')
    expect(html).toContain('tok-keyword">const<')
    expect(html).toContain('tok-fn">createSite<')
    expect(html).toContain("tok-string\">'cumubase'<")
  })

  it('json：键值分词 + auto 识别', () => {
    const html = highlightCode('{"name": "cumubase", "port": 3000}')
    expect(html).toContain('tok-key">"name"<')
    expect(html).toContain('tok-string">"cumubase"<')
    expect(html).toContain('tok-number">3000<')
  })

  it('detectLanguage 自动识别', () => {
    expect(detectLanguage('{"a": 1}')).toBe('json')
    expect(detectLanguage('const x = 1')).toBe('js')
    expect(detectLanguage('npm run build')).toBe('shell')
  })

  it('未知语言按纯文本仅转义', () => {
    expect(highlightCode('1 < 2', 'brainfuck')).toBe('1 &lt; 2')
    expect(highlightCode('', 'shell')).toBe('')
  })
})

describe('EvCodeBlock / 高亮渲染与复制', () => {
  it('code 属性渲染 token span（v-html）', () => {
    const wrapper = mount(EvCodeBlock, { props: { code: 'npm run build' } })
    const code = wrapper.find('.ev-code-block__code')
    expect(code.find('span.tok-cmd').exists()).toBe(true)
    expect(code.text()).toBe('npm run build')
  })

  it('language 属性透传高亮器', () => {
    const wrapper = mount(EvCodeBlock, { props: { code: '{"a": 1}', language: 'json' } })
    expect(wrapper.find('.tok-key').exists()).toBe(true)
  })

  it('默认插槽整体覆写渲染内容', () => {
    const wrapper = mount(EvCodeBlock, {
      props: { code: 'npm run build' },
      slots: { default: '<b class="raw">custom</b>' },
    })
    expect(wrapper.find('.raw').exists()).toBe(true)
    expect(wrapper.find('.tok-cmd').exists()).toBe(false)
  })

  it('窗框结构：窗口控制点 + 标题栏 + 复制钮', () => {
    const wrapper = mount(EvCodeBlock, { props: { code: 'ls', title: 'Terminal', showCopyText: true } })
    expect(wrapper.findAll('.ev-code-block__light')).toHaveLength(3)
    expect(wrapper.find('.ev-code-block__title').text()).toBe('Terminal')
    expect(wrapper.find('.ev-code-block__copy-text').exists()).toBe(true)
  })
})
