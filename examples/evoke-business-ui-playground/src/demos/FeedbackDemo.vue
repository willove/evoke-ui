<template>
  <section class="demo">
    <h2>EvTag / EvAlert / EvDivider / EvSkeleton / EvSpin</h2>

    <h3>EvTag</h3>
    <div class="demo-row">
      <span class="demo-label">类型</span>
      <ev-tag>默认(plain)</ev-tag>
      <ev-tag type="primary">primary</ev-tag>
      <ev-tag type="success">success</ev-tag>
      <ev-tag type="warning">warning</ev-tag>
      <ev-tag type="danger">danger</ev-tag>
      <ev-tag type="info">info</ev-tag>
    </div>
    <div class="demo-row">
      <span class="demo-label">效果/状态</span>
      <ev-tag type="primary" effect="light">light</ev-tag>
      <ev-tag type="primary" effect="dark">dark</ev-tag>
      <ev-tag type="success" round>round</ev-tag>
      <ev-tag type="danger" closable @close="closed = true">
        {{ closed ? '已关闭' : '可关闭' }}
      </ev-tag>
    </div>

    <h3>EvAlert</h3>
    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 560px">
      <ev-alert title="信息提示" type="info" show-icon />
      <ev-alert title="成功提示" type="success" show-icon description="详细描述文案" />
      <ev-alert title="警告提示" type="warning" show-icon effect="dark" />
      <ev-alert title="错误提示" type="error" show-icon center />
    </div>

    <h3>EvDivider</h3>
    <ev-divider />
    <ev-divider content-position="left">左侧文本</ev-divider>
    <ev-divider border-style="dashed" content-position="right">右虚线</ev-divider>
    <div>
      文本 <ev-divider direction="vertical" /> 垂直 <ev-divider direction="vertical" /> 分割
    </div>

    <h3>EvSkeleton</h3>
    <div style="max-width: 420px">
      <ev-skeleton :loading="skLoading" :rows="3" animated>
        <p>真实内容：loading 结束后渲染</p>
      </ev-skeleton>
      <ev-button size="small" style="margin-top: 8px" @click="skLoading = !skLoading">
        切换 loading
      </ev-button>
    </div>

    <h3>EvSpin</h3>
    <div class="demo-row">
      <span class="demo-label">模式</span>
      <ev-spin size="small" />
      <ev-spin />
      <ev-spin size="large" description="加载中" />
      <div style="width: 240px; padding: 12px">
        <ev-spin :spinning="spinning" description="数据处理中">
          <p>包裹内容区域。Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </ev-spin>
      </div>
      <ev-button size="small" @click="spinning = !spinning">切换 spinning</ev-button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
const closed = ref(false)
const skLoading = ref(true)
const spinning = ref(true)
</script>

<style scoped src="./demo.css"></style>
