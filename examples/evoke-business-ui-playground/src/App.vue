<template>
  <div class="playground">
    <header class="playground-header">
      <h1>Evoke Business UI Playground</h1>
      <ev-button size="small" @click="toggleDark">
        {{ isDark ? '🌙 暗色' : '☀️ 明色' }}
      </ev-button>
    </header>
    <nav class="playground-nav">
      <ev-button
        v-for="item in navItems"
        :key="item.id"
        :type="active === item.id ? 'primary' : 'default'"
        size="small"
        @click="active = item.id"
      >
        {{ item.label }}
      </ev-button>
    </nav>
    <main class="playground-main">
      <component :is="activeComponent" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDarkMode } from '@wil-works/evoke-business-ui'
import ButtonDemo from './demos/ButtonDemo.vue'
import IconDemo from './demos/IconDemo.vue'
import TokenDemo from './demos/TokenDemo.vue'
import InputDemo from './demos/InputDemo.vue'
import FormDemo from './demos/FormDemo.vue'
import FeedbackDemo from './demos/FeedbackDemo.vue'
import DialogDemo from './demos/DialogDemo.vue'
import SelectDemo from './demos/SelectDemo.vue'
import OverlayDemo from './demos/OverlayDemo.vue'
import TableDemo from './demos/TableDemo.vue'
import DateTimeDemo from './demos/DateTimeDemo.vue'

const { isDark, toggleDark } = useDarkMode()

const navItems = [
  { id: 'button', label: 'Button', component: ButtonDemo },
  { id: 'icon', label: 'Icon', component: IconDemo },
  { id: 'token', label: 'Tokens', component: TokenDemo },
  { id: 'input', label: 'Input', component: InputDemo },
  { id: 'form', label: 'Form', component: FormDemo },
  { id: 'feedback', label: 'Feedback', component: FeedbackDemo },
  { id: 'dialog', label: 'Dialog/Message', component: DialogDemo },
  { id: 'select', label: 'Select/Pagination', component: SelectDemo },
  { id: 'overlay', label: 'Overlay/Tabs/Drawer', component: OverlayDemo },
  { id: 'table', label: 'Table/Tree', component: TableDemo },
  { id: 'datetime', label: 'Date/Time/Cascader', component: DateTimeDemo },
]

const active = ref('button')
const activeComponent = computed(
  () => navItems.find((n) => n.id === active.value)?.component ?? ButtonDemo
)
</script>

<style scoped>
.playground {
  min-height: 100vh;
  padding: var(--ev-space-6);
}
.playground-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ev-space-4);
}
.playground-header h1 {
  font-size: var(--ev-font-size-lg);
  font-weight: var(--ev-font-weight-semibold);
}
.playground-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ev-space-2);
  margin-bottom: var(--ev-space-6);
  padding-bottom: var(--ev-space-4);
  border-bottom: 1px solid var(--ev-border-color-light);
}
.playground-main {
  max-width: 960px;
}
</style>
