import { readFileSync } from 'node:fs'
import { parse, compileScript } from '@vue/compiler-sfc'

const src = readFileSync('/Users/willove/wil-works/practice-list/@wil-works/packages/evoke-ui/src/components/chatbot/ChatMessage.vue', 'utf-8')
const { descriptor } = parse(src, { filename: 'ChatMessage.vue' })
const compiled = compileScript(descriptor, { id: 'x' })
const c = compiled.content
console.log('sig match:', /setup\(__props[^)]*\)\s*\{\n/.test(c))
console.log('lastIdx:', c.lastIndexOf('\n}\n})'))
console.log('props match:', /\n  props: (\{[\s\S]*?\n  \}),\n  emits:/.test(c))
console.log('emits match:', /emits: (\[[^\]]*\])/.test(c))
const i = c.indexOf('setup(')
console.log('around setup:', JSON.stringify(c.slice(i - 20, i + 80)))
console.log('tail:', JSON.stringify(c.slice(-30)))
