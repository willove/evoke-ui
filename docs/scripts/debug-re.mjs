import { readFileSync } from 'node:fs'
const src = readFileSync('components/audit-timeline.md', 'utf-8')
const i = src.indexOf(':code=')
console.log(JSON.stringify(src.slice(i, i + 70)))
const RE = /\s+:code="(?:\\[\s\S]|[^`\\])*`"/g
console.log('matches:', (src.match(RE) || []).length)
