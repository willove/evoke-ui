<template>
  <div class="slot-contract">
    <section v-for="layer in layers" :key="layer.key" class="slot-contract__layer">
      <h2 class="slot-contract__layer-title">
        {{ layer.label }}
        <span class="slot-contract__layer-zh">{{ layer.zh }} · {{ total(layer.key) }} 件有槽或已声明无槽</span>
      </h2>

      <div v-for="item in items(layer.key)" :key="item.key" class="slot-contract__card">
        <div class="slot-contract__head">
          <code class="slot-contract__tag">&lt;{{ tagOf(item.key) }}&gt;</code>
          <span class="slot-contract__zh">{{ item.zh }}</span>
          <span v-if="contract(item.key).passthrough" class="slot-contract__badge">透传底座槽</span>
          <span v-else-if="contract(item.key).slotless" class="slot-contract__badge">无槽</span>
          <span v-else class="slot-contract__badge">{{ (contract(item.key).slots || []).length }} 槽</span>
        </div>

        <p v-if="contract(item.key).slotless" class="slot-contract__slotless">
          {{ contract(item.key).slotless }}
        </p>
        <p v-else-if="contract(item.key).passthrough" class="slot-contract__slotless">
          包装底座组件，全部命名槽原样透传（槽名与作用域见底座文档）。
        </p>
        <table v-else class="slot-contract__table">
          <thead>
            <tr><th>槽</th><th>吃什么</th><th>作用域</th></tr>
          </thead>
          <tbody>
            <tr v-for="slot in contract(item.key).slots" :key="slot.slot">
              <td><code>#{{ slot.slot }}</code></td>
              <td>{{ slot.desc }}</td>
              <td><code v-if="slot.scope">{{ slot.scope }}</code><span v-else>—</span></td>
            </tr>
            <tr v-if="contract(item.key).default">
              <td><code>default</code></td>
              <td>{{ contract(item.key).default }}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * 组合契约表（/guide/composition）—— 数据来自包内 src/slots.js 单一来源。
 * 槽位改动只需改那一处；本页与 SFC 的一致性由 G10 门 + test/slots.test.js 守。
 */
import { LAYERS, COMPONENT_TAXONOMY } from '../../../packages/evoke-tools-ui/src/taxonomy.js'
import { SLOT_CONTRACT, tagOf } from '../../../packages/evoke-tools-ui/src/slots.js'

const layers = Object.values(LAYERS)
const contract = (key) => SLOT_CONTRACT[key] ?? {}

const items = (layer) =>
  COMPONENT_TAXONOMY.filter((c) => c.layer === layer)
    .map((c) => ({ id: c.id, zh: c.zh, key: c.id.replaceAll('-', '_') }))
    .filter((c) => {
      const k = contract(c.key)
      return (k.slots?.length ?? 0) > 0 || k.default || k.passthrough || k.slotless
    })

const total = (layer) => items(layer).length
</script>

<style scoped>
.slot-contract__layer-title {
  margin: 30px 0 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--td-border-light);
  font-size: 18px;
  font-weight: 600;
  font-family: var(--td-mono);
  color: var(--td-text);
}
.slot-contract__layer-zh {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 400;
  font-family: var(--td-font);
  color: var(--td-text-tertiary);
}
.slot-contract__card {
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid var(--td-border);
  border-radius: 10px;
  background: var(--td-bg);
}
.slot-contract__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.slot-contract__tag {
  font-family: var(--td-mono);
  font-size: 13px;
  color: var(--td-text);
}
.slot-contract__zh {
  font-size: 12.5px;
  color: var(--td-text-secondary);
}
.slot-contract__badge {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--td-primary-bg);
  font-size: 11px;
  color: var(--td-primary);
}
.slot-contract__slotless {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--td-text-secondary);
}
.slot-contract__table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
  font-size: 12.5px;
}
.slot-contract__table th {
  padding: 4px 8px;
  border-bottom: 1px solid var(--td-border-light);
  text-align: start;
  font-weight: 500;
  color: var(--td-text-tertiary);
}
.slot-contract__table td {
  padding: 5px 8px;
  border-bottom: 1px solid var(--td-border-light);
  vertical-align: top;
  color: var(--td-text-secondary);
}
.slot-contract__table tr:last-child td {
  border-bottom: 0;
}
.slot-contract__table code {
  font-family: var(--td-mono);
  font-size: 11.5px;
  color: var(--td-primary);
}
</style>