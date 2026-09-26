<template>
  <!-- 模态：焦点陷阱 + Esc 收敛 + 焦点归还触发器（三处浮层同一套焦点契约） -->
  <div class="dialog-stage">
    <eb-button type="primary" size="small" @click="open = true">打开模态</eb-button>
    <et-dialog v-model="open" title="另存为" confirm-text="保存" cancel-text="取消" @confirm="open = false">
      <p>Tab 在陷阱内循环，Esc 收敛并把焦点还给触发按钮。</p>
    </et-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>
