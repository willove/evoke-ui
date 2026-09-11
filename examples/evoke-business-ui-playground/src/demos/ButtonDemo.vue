<template>
  <section class="demo">
    <h2>EbButton</h2>

    <div class="demo-row">
      <span class="demo-label">类型</span>
      <eb-button>Default</eb-button>
      <eb-button type="primary">Primary</eb-button>
      <eb-button type="success">Success</eb-button>
      <eb-button type="warning">Warning</eb-button>
      <eb-button type="danger">Danger</eb-button>
      <eb-button type="info">Info</eb-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">plain</span>
      <eb-button plain>Default</eb-button>
      <eb-button type="primary" plain>Primary</eb-button>
      <eb-button type="success" plain>Success</eb-button>
      <eb-button type="danger" plain>Danger</eb-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">round / circle</span>
      <eb-button type="primary" round>Round</eb-button>
      <eb-button type="primary" :icon="'search'" circle />
      <eb-button type="primary" :icon="'plus'" circle />
    </div>

    <div class="demo-row">
      <span class="demo-label">尺寸</span>
      <eb-button size="large">Large</eb-button>
      <eb-button>Default</eb-button>
      <eb-button size="small">Small</eb-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">状态</span>
      <eb-button type="primary" loading>Loading</eb-button>
      <eb-button type="primary" disabled>Disabled</eb-button>
      <eb-button type="primary" ghost>Ghost</eb-button>
      <eb-button type="danger" danger-solid>Danger Solid</eb-button>
      <eb-button text>Text</eb-button>
      <eb-button type="primary" link>Link</eb-button>
    </div>

    <div class="demo-row">
      <span class="demo-label">图标按钮</span>
      <eb-button type="primary" icon="search">搜索</eb-button>
      <eb-button icon="download">下载</eb-button>
      <eb-button-group>
        <eb-button icon="arrow-left">上一页</eb-button>
        <eb-button>1</eb-button>
        <eb-button>
          下一页
          <eb-icon name="arrow-right" />
        </eb-button>
      </eb-button-group>
    </div>
  </section>
</template>

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
  margin-bottom: var(--eb-space-4);
}
.demo-label {
  width: 90px;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
}
</style>
