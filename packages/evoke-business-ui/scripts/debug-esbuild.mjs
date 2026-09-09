import { transformSync } from 'esbuild'
const out = transformSync(`import A from './a.vue'\nconst x = 1\nconsole.log(x)\n`, {
  loader: 'ts', format: 'esm', target: 'es2022',
  tsconfigRaw: { compilerOptions: { verbatimModuleSyntax: true } },
})
console.log('=== out ===')
console.log(out.code)
