<template>
  <section class="demo">
    <h2>Design Tokens（--eb-* 语义层 + --eb-* 设计层）</h2>

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
        :style="{ background: `var(--eb-color-primary-light-${10 - i})` }"
      >
        <span class="color-name">light-{{ 10 - i }}</span>
      </div>
    </div>

    <div class="demo-row">
      <span class="demo-label">阴影</span>
      <div v-for="i in 5" :key="i" class="shadow-card" :style="{ boxShadow: `var(--eb-shadow-${i})` }">
        shadow-{{ i }}
      </div>
    </div>

    <div class="demo-row">
      <span class="demo-label">圆角/间距</span>
      <div class="radius-chip" style="border-radius: var(--eb-radius-xs)">xs</div>
      <div class="radius-chip" style="border-radius: var(--eb-radius-sm)">sm</div>
      <div class="radius-chip" style="border-radius: var(--eb-radius-md)">md</div>
      <div class="radius-chip" style="border-radius: var(--eb-radius-lg)">lg</div>
      <div class="radius-chip" style="border-radius: var(--eb-radius-xl)">xl</div>
    </div>
  </section>
</template>

<script setup>
const colors = [
  { name: 'primary', var: '--eb-color-primary' },
  { name: 'success', var: '--eb-color-success' },
  { name: 'warning', var: '--eb-color-warning' },
  { name: 'danger', var: '--eb-color-danger' },
  { name: 'info', var: '--eb-color-info' },
]
</script>

<style scoped>
.demo h2 {
  font-size: var(--eb-font-size-md);
  font-weight: var(--eb-font-weight-semibold);
  margin-bottom: var(--eb-space-4);
}
.demo-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
  margin-bottom: var(--eb-space-6);
}
.demo-label {
  width: 90px;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}
.color-chip {
  width: 88px;
  height: 48px;
  border-radius: var(--eb-radius-md);
  display: flex;
  align-items: flex-end;
  padding: var(--eb-space-1) var(--eb-space-2);
  border: 1px solid var(--eb-border-color-lighter);
}
.color-name {
  font-size: var(--eb-font-size-xs);
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
.shadow-card {
  width: 110px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--eb-bg-color);
  border-radius: var(--eb-radius-md);
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}
.radius-chip {
  width: 64px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--eb-color-primary-light-9);
  color: var(--eb-color-primary);
  font-size: var(--eb-font-size-sm);
}
</style>
