<template>
  <section
    v-if="groups.length || conflicts.length"
    class="et-shortcutpanel"
    tabindex="0"
    role="region"
    aria-label="快捷键一览"
  >
    <div v-for="group in groups" :key="group.group" class="et-shortcutpanel__group">
      <h3 class="et-shortcutpanel__group-name">{{ group.group }}</h3>
      <ul class="et-shortcutpanel__list">
        <li v-for="item in group.items" :key="item.id" class="et-shortcutpanel__row">
          <span class="et-shortcutpanel__title">{{ item.title }}</span>
          <et-key-hint :combo="item.combo" :platform="platformValue" class="et-shortcutpanel__keys" />
        </li>
      </ul>
    </div>
    <div v-if="conflicts.length" class="et-shortcutpanel__conflicts">
      <span class="et-shortcutpanel__conflict-tag">键位冲突</span>
      <span v-for="c in conflicts" :key="c.combo" class="et-shortcutpanel__conflict-row">
        <et-key-hint :combo="c.combo" :platform="platformValue" />
        <span class="et-shortcutpanel__conflict-ids">{{ c.ids.join(' / ') }}</span>
      </span>
    </div>
  </section>
</template>

<script setup>
/**
 * EtShortcutPanel — 快捷键一览（M1 交付物 6）
 *
 * 单一来源 = 命令注册表（buildShortcutTable）；**不手写列表**——命令表加一行，
 * 本页自动多一行（计划 05 §四验收）。冲突（detectKeyConflicts）直接展示在面板里：
 * 登记期就能发现的事故，不该等用户按出来。
 */
import { computed } from 'vue'
import EtKeyHint from '../key-hint/index.vue'
import { buildShortcutTable, detectKeyConflicts } from '../../runtime/shortcuts/index'
import { currentPlatform } from '../../runtime/keys/keys'

defineOptions({ name: 'EtShortcutPanel' })

const props = defineProps({
  /** 命令注册表（buildShortcutTable 的数据源） */
  registry: { type: Object, required: true },
  platform: {
    type: String,
    default: 'auto',
    validator: (v) => ['auto', 'mac', 'win'].includes(v),
  },
})

const platformValue = computed(() => (props.platform === 'auto' ? currentPlatform() : props.platform))
const groups = computed(() => buildShortcutTable(props.registry, platformValue.value))
const conflicts = computed(() => detectKeyConflicts(props.registry))
</script>

<style src="./style.css"></style>
