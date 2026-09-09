<template>
  <section class="demo">
    <h2>EvButton</h2>

    <div class="demo-row">
      <span class="demo-label">类型</span>
      <ev-button>Default</ev-button>
      <ev-button type="primary">Primary</ev-button>
      <ev-button type="success">Success</ev-button>
      <ev-button type="warning">Warning</ev-button>
      <ev-button type="danger">Danger</ev-button>
      <ev-button type="info">Info</ev-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">plain</span>
      <ev-button plain>Default</ev-button>
      <ev-button type="primary" plain>Primary</ev-button>
      <ev-button type="success" plain>Success</ev-button>
      <ev-button type="danger" plain>Danger</ev-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">round / circle</span>
      <ev-button type="primary" round>Round</ev-button>
      <ev-button type="primary" :icon="'search'" circle />
      <ev-button type="primary" :icon="'plus'" circle />
    </div>

    <div class="demo-row">
      <span class="demo-label">尺寸</span>
      <ev-button size="large">Large</ev-button>
      <ev-button>Default</ev-button>
      <ev-button size="small">Small</ev-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">状态</span>
      <ev-button type="primary" loading>Loading</ev-button>
      <ev-button type="primary" disabled>Disabled</ev-button>
      <ev-button type="primary" ghost>Ghost</ev-button>
      <ev-button type="danger" danger-solid>Danger Solid</ev-button>
      <ev-button text>Text</ev-button>
      <ev-button type="primary" link>Link</ev-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">图标按钮</span>
      <ev-button type="primary" icon="search">搜索</ev-button>
      <ev-button icon="download">下载</ev-button>
      <ev-button-group>
        <ev-button icon="arrow-left">上一页</ev-button>
        <ev-button>1</ev-button>
        <ev-button>
          下一页
          <ev-icon name="arrow-right" />
        </ev-button>
      </ev-button-group>
    </div>
  </section>
</template>

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
  margin-bottom: var(--ev-space-4);
}
.demo-label {
  width: 90px;
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}
</style>
