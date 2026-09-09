<template>
  <section class="demo">
    <h2>Design Tokens（--ev-* 语义层 + --ev-* 设计层）</h2>

    <div class="demo-row">
      <span class="demo-label">语义色</span>
      <div
        v-for="c in colors"
        :key="c.name"
        class="color-chip"
        :style="{ background: `var(${c.var})` }"
      >
        <span class="color-name">{{ c.name }}</span>
      </div>
    </div>

    <div class="demo-row">
      <span class="demo-label">梯度</span>
      <div
        v-for="i in 9"
        :key="i"
        class="color-chip"
        :style="{ background: `var(--ev-color-primary-light-${10 - i})` }"
      >
        <span class="color-name">light-{{ 10 - i }}</span>
      </div>
    </div>

    <div class="demo-row">
      <span class="demo-label">阴影</span>
      <div v-for="i in 5" :key="i" class="shadow-card" :style="{ boxShadow: `var(--ev-shadow-${i})` }">
        shadow-{{ i }}
      </div>
    </div>

    <div class="demo-row">
      <span class="demo-label">圆角/间距</span>
      <div class="radius-chip" style="border-radius: var(--ev-radius-xs)">xs</div>
      <div class="radius-chip" style="border-radius: var(--ev-radius-sm)">sm</div>
      <div class="radius-chip" style="border-radius: var(--ev-radius-md)">md</div>
      <div class="radius-chip" style="border-radius: var(--ev-radius-lg)">lg</div>
      <div class="radius-chip" style="border-radius: var(--ev-radius-xl)">xl</div>
    </div>
  </section>
</template>

<script setup>
const colors = [
  { name: 'primary', var: '--ev-color-primary' },
  { name: 'success', var: '--ev-color-success' },
  { name: 'warning', var: '--ev-color-warning' },
  { name: 'danger', var: '--ev-color-danger' },
  { name: 'info', var: '--ev-color-info' },
]
</script>

<style scoped>
.demo h2 {
  font-size: var(--ev-font-size-md);
  font-weight: var(--ev-font-weight-semibold);
  margin-bottom: var(--ev-space-4);
}
.demo-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ev-space-2);
  margin-bottom: var(--ev-space-6);
}
.demo-label {
  width: 90px;
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}
.color-chip {
  width: 88px;
  height: 48px;
  border-radius: var(--ev-radius-md);
  display: flex;
  align-items: flex-end;
  padding: var(--ev-space-1) var(--ev-space-2);
  border: 1px solid var(--ev-border-color-lighter);
}
.color-name {
  font-size: var(--ev-font-size-xs);
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
.shadow-card {
  width: 110px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ev-bg-color);
  border-radius: var(--ev-radius-md);
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}
.radius-chip {
  width: 64px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ev-color-primary-light-9);
  color: var(--ev-color-primary);
  font-size: var(--ev-font-size-sm);
}
</style>
