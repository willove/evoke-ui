<script setup>
/**
 * DemoBlock — 文档演示容器
 * 标题 + 描述 + 预览区（演示代码用 markdown 代码块跟在其后）
 */
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  /** 深色预览底（演示深色系组件用） */
  dark: { type: Boolean, default: false },
  /** 居中排布预览内容 */
  center: { type: Boolean, default: false },
})
</script>

<template>
  <div class="demo-block">
    <div v-if="title || description" class="demo-block__head">
      <div class="demo-block__title">{{ title }}</div>
      <div v-if="description" class="demo-block__description">{{ description }}</div>
    </div>
    <div class="demo-block__preview" :class="{ 'is-dark': dark, 'is-center': center }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.demo-block {
  margin: 16px 0 24px;
  border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-md);
  /* 不裁切：EwSelect 等下拉菜单需要溢出展示 */
}

.demo-block__head {
  padding: 12px 16px 0;
}

.demo-block__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.demo-block__description {
  margin-top: 4px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.demo-block__preview {
  /* 与首页 playground 预览框同一虚线语言：标题区与演示区轻分隔 */
  margin-top: 12px;
  padding: 24px 16px;
  border-top: 1px dashed var(--ew-border-color);
}

.demo-block__preview.is-dark {
  background: #17181d;
  border-top-color: transparent;
  border-radius: 0 0 calc(var(--ew-radius-md) - 1px) calc(var(--ew-radius-md) - 1px);
}

.demo-block__preview.is-center {
  text-align: center;
}
</style>
