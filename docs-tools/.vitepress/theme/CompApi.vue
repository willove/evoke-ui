<template>
  <div v-if="api" class="comp-api">
    <p class="comp-api__meta">
      <code class="comp-api__import">{{ importLine }}</code>
      <span class="comp-api__tags">
        <span class="comp-api__tag">{{ api.layerZh }}</span>
        <span class="comp-api__tag">{{ api.categoryZh }}</span>
        <span class="comp-api__tag">{{ api.granularityZh }}</span>
      </span>
    </p>

    <div class="api-table">
      <h3 class="api-table__title">Props</h3>
      <table v-if="api.props.length" class="api-table__table">
        <thead>
          <tr><th>名称</th><th>类型</th><th>默认</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in api.props" :key="p.name">
            <td class="api-table__name">{{ p.name }}</td>
            <td class="api-table__type">{{ p.type || '—' }}</td>
            <td class="api-table__default">{{ p.default || '—' }}</td>
            <td>{{ p.desc }}<span v-if="!p.desc" class="comp-api__gap">未写</span></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="comp-api__none">{{ api.attrs ? '无声明式 props，属性经 $attrs 透传给底座' : '无 props' }}</p>
    </div>

    <div v-if="api.emits.length" class="api-table">
      <h3 class="api-table__title">Emits</h3>
      <table class="api-table__table">
        <thead>
          <tr><th>事件</th><th>载荷</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr v-for="e in api.emits" :key="e.name">
            <td class="api-table__name">{{ e.name }}</td>
            <td><code v-if="e.payload" class="comp-api__attr">{{ e.payload }}</code><span v-else>—</span></td>
            <td>{{ e.desc }}<span v-if="!e.desc" class="comp-api__gap">未写</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="slots.length || api.slots.default || api.slots.slotless || api.slots.passthrough" class="api-table">
      <h3 class="api-table__title">Slots</h3>
      <table v-if="slots.length || api.slots.default" class="api-table__table">
        <thead>
          <tr><th>槽</th><th>吃什么</th><th>作用域</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in slots" :key="s.slot">
            <td class="api-table__name">#{{ s.slot }}</td>
            <td>{{ s.desc }}</td>
            <td><code v-if="s.scope">{{ s.scope }}</code><span v-else>—</span></td>
          </tr>
          <tr v-if="api.slots.default">
            <td class="api-table__name">default</td>
            <td colspan="2">{{ api.slots.default }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="comp-api__none">
        {{ api.slots.slotless || (api.slots.passthrough ? '底座命名槽原样透传' : '无槽') }}
      </p>
    </div>

    <div v-if="api.expose.length" class="api-table">
      <h3 class="api-table__title">暴露（ref 方法）</h3>
      <table class="api-table__table">
        <thead>
          <tr><th>方法</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr v-for="m in api.expose" :key="m.name">
            <td class="api-table__name">{{ m.name }}()</td>
            <td>{{ m.desc }}<span v-if="!m.desc" class="comp-api__gap">未写</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="api-table">
      <h3 class="api-table__title">键盘 · 可访问名 · 密度</h3>
      <table class="api-table__table">
        <tbody>
          <tr>
            <th>键盘</th>
            <td>
              <template v-if="api.keyboard.keys.length">
                <kbd v-for="k in api.keyboard.keys" :key="k" class="comp-api__kbd">{{ k }}</kbd>
              </template>
              <span v-else-if="api.keyboard.handlers" class="comp-api__dim">自定义按键（见下）</span>
              <span v-else class="comp-api__dim">不接管按键</span>
              <span v-if="api.keyboard.ime" class="comp-api__note">组字守卫</span>
            </td>
          </tr>
          <tr>
            <th>可访问名</th>
            <td>
              <code v-for="a in api.a11y.aria" :key="a" class="comp-api__attr">{{ a }}</code>
              <code v-for="r in api.a11y.roles" :key="r" class="comp-api__attr">role={{ r }}</code>
              <code v-if="labelFrom" class="comp-api__attr">aria-label ← {{ labelFrom }}</code>
              <span v-if="!api.a11y.aria.length && !api.a11y.roles.length" class="comp-api__dim">
                无 ARIA 属性（原生语义）
              </span>
            </td>
          </tr>
          <tr>
            <th>密度</th>
            <td>
              <template v-if="api.tokens.metric.length">
                <code v-for="t in api.tokens.metric" :key="t" class="comp-api__attr">{{ t }}</code>
              </template>
              <span v-else class="comp-api__dim">
                {{ api.tokens.all.length ? '不引用度量令牌（随内容或宿主）' : '件内无令牌引用' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
/**
 * CompApi — 组件页的六面表，数据由 vite 插件 virtual:component-api 从源码现算
 * （SFC 的 defineProps/Emits/Expose + slots.js 契约 + taxonomy.js + 件内 style.css）。
 * 页内不再手抄 API：源码改一处，页面即跟随；「未写」是留给源码 JSDoc 的缺口，
 * 由 G11 文档覆盖门（scripts/check-docs-coverage.mjs）逐件列出。
 */
import { computed } from 'vue'
import componentApi from 'virtual:component-api'

const props = defineProps({
  id: { type: String, required: true },
})

const api = computed(() => componentApi.components[props.id])
const slots = computed(() => (api.value?.slots?.named || []).filter((s) => s && s.slot))
const importLine = computed(() =>
  api.value ? `import { ${api.value.exportName} } from '@wil-works/evoke-tools-ui'` : '',
)
/** `:aria-label="label || undefined"` 这类表达式压成可读的来源名（去掉 props. 与兜底分支） */
const labelFrom = computed(() => {
  const raw = api.value?.a11y?.labelSource || ''
  const first = raw.split('||')[0].replace(/\bprops\./g, '').trim()
  return /^[A-Za-z_$][\w$]*$/.test(first) ? first : ''
})
</script>

<style>
.comp-api__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0 0 4px;
}
.comp-api__import {
  font-family: var(--td-mono);
  font-size: 12px;
  color: var(--td-text-secondary);
  background: var(--td-bg-secondary);
  border: 1px solid var(--td-border-light);
  border-radius: 4px;
  padding: 3px 7px;
}
.comp-api__tags {
  display: flex;
  gap: 6px;
}
.comp-api__tag {
  font-size: 11.5px;
  color: var(--td-text-tertiary);
  border: 1px solid var(--td-border);
  border-radius: 2px;
  padding: 2px 6px;
}
.comp-api__none,
.comp-api__dim {
  color: var(--td-text-tertiary);
}
.comp-api__gap {
  font-size: 11.5px;
  color: #d4681f;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0 4px;
  margin-left: 6px;
}
html.dark .comp-api__gap {
  color: #e8912d;
}
.comp-api__kbd {
  font-family: var(--td-mono);
  font-size: 11.5px;
  color: var(--td-text-secondary);
  background: var(--td-bg-secondary);
  border: 1px solid var(--td-border);
  border-bottom-width: 2px;
  border-radius: 2px;
  padding: 1px 5px;
  margin-right: 4px;
}
.comp-api__attr {
  font-family: var(--td-mono);
  font-size: 11.5px;
  color: var(--td-primary);
  margin-right: 8px;
}
.comp-api__note {
  font-size: 11.5px;
  color: var(--td-text-tertiary);
  border-left: 1px solid var(--td-border);
  padding-left: 8px;
  margin-left: 4px;
}
.api-table__table th {
  text-align: start;
}
</style>
