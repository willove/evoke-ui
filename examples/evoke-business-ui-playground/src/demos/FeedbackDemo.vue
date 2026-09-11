<template>
  <section class="demo">
    <h2>EbTag / EbAlert / EbDivider / EbSkeleton / EbSpin</h2>

    <h3>EbTag</h3>
    <div class="demo-row">
      <span class="demo-label">类型</span>
      <eb-tag>默认(plain)</eb-tag>
      <eb-tag type="primary">primary</eb-tag>
      <eb-tag type="success">success</eb-tag>
      <eb-tag type="warning">warning</eb-tag>
      <eb-tag type="danger">danger</eb-tag>
      <eb-tag type="info">info</eb-tag>
    </div>
    <div class="demo-row">
      <span class="demo-label">效果/状态</span>
      <eb-tag type="primary" effect="light">light</eb-tag>
      <eb-tag type="primary" effect="dark">dark</eb-tag>
      <eb-tag type="success" round>round</eb-tag>
      <eb-tag type="danger" closable @close="closed = true">
        {{ closed ? '已关闭' : '可关闭' }}
      </eb-tag>
    </div>

    <h3>EbAlert</h3>
    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 560px">
      <eb-alert title="信息提示" type="info" show-icon />
      <eb-alert title="成功提示" type="success" show-icon description="详细描述文案" />
      <eb-alert title="警告提示" type="warning" show-icon effect="dark" />
      <eb-alert title="错误提示" type="error" show-icon center />
    </div>

    <h3>EbDivider</h3>
    <eb-divider />
    <eb-divider content-position="left">左侧文本</eb-divider>
    <eb-divider border-style="dashed" content-position="right">右虚线</eb-divider>
    <div>
      文本 <eb-divider direction="vertical" /> 垂直 <eb-divider direction="vertical" /> 分割
    </div>

    <h3>EbSkeleton</h3>
    <div style="max-width: 420px">
      <eb-skeleton :loading="skLoading" :rows="3" animated>
        <p>真实内容：loading 结束后渲染</p>
      </eb-skeleton>
      <eb-button size="small" style="margin-top: 8px" @click="skLoading = !skLoading">
        切换 loading
      </eb-button>
    </div>

    <h3>EbSpin</h3>
    <div class="demo-row">
      <span class="demo-label">模式</span>
      <eb-spin size="small" />
      <eb-spin />
      <eb-spin size="large" description="加载中" />
      <div style="width: 240px; padding: 12px">
        <eb-spin :spinning="spinning" description="数据处理中">
          <p>包裹内容区域。Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </eb-spin>
      </div>
      <eb-button size="small" @click="spinning = !spinning">切换 spinning</eb-button>
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
