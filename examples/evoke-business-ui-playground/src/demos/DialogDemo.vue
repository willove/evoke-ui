<template>
  <section class="demo">
    <h2>EvDialog + EvMessage</h2>

    <h3>EvDialog</h3>
    <div class="demo-row">
      <span class="demo-label">基础</span>
      <ev-button @click="basic = true">基础对话框</ev-button>
      <ev-button @click="formDialog = true">表单对话框</ev-button>
      <ev-button @click="confirmDialog = true">before-close 拦截</ev-button>
      <ev-button @click="fullscreen = true">全屏</ev-button>
    </div>

    <ev-dialog v-model="basic" title="基础对话框" width="480px">
      <p>点击遮罩 / ESC / 右上角关闭均可关闭（close-on-click-modal 默认 true）。</p>
      <template #footer>
        <ev-button @click="basic = false">取消</ev-button>
        <ev-button type="primary" @click="basic = false">确定</ev-button>
      </template>
    </ev-dialog>

    <ev-dialog v-model="formDialog" title="新增条目" width="520px" destroy-on-close>
      <ev-form :model="{ name: '' }" label-width="80px">
        <ev-form-item label="名称" required>
          <ev-input placeholder="销毁后重置（destroy-on-close）" />
        </ev-form-item>
        <ev-form-item label="备注">
          <ev-textarea :rows="2" placeholder="多行备注" />
        </ev-form-item>
      </ev-form>
      <template #footer>
        <ev-button @click="formDialog = false">取消</ev-button>
        <ev-button type="primary" @click="onSubmit">提交并提示</ev-button>
      </template>
    </ev-dialog>

    <ev-dialog
      v-model="confirmDialog"
      title="拦截关闭"
      width="420px"
      :before-close="handleBeforeClose"
    >
      <p>点击关闭按钮会触发 before-close 钩子，取消则阻止关闭。</p>
    </ev-dialog>

    <ev-dialog v-model="fullscreen" title="全屏对话框" fullscreen>
      <p>fullscreen 模式占满视口。</p>
    </ev-dialog>

    <h3>EvMessage（命令式 API）</h3>
    <div class="demo-row">
      <span class="demo-label">快捷方法</span>
      <ev-button @click="EvMessage.info('普通信息提示')">info</ev-button>
      <ev-button type="success" @click="EvMessage.success('操作成功')">success</ev-button>
      <ev-button type="warning" @click="EvMessage.warning('请注意风险')">warning</ev-button>
      <ev-button type="danger" @click="EvMessage.error('操作失败，请重试')">error</ev-button>
    </div>
    <div class="demo-row">
      <span class="demo-label">选项</span>
      <ev-button @click="EvMessage({ message: '常驻消息（duration 0）', duration: 0, showClose: true })">
        常驻 + 关闭按钮
      </ev-button>
      <ev-button @click="EvMessage({ message: '居中消息', center: true })">居中</ev-button>
      <ev-button @click="sendStack">堆叠 3 条</ev-button>
      <ev-button @click="EvMessage.close()">关闭全部</ev-button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'

const basic = ref(false)
const formDialog = ref(false)
const confirmDialog = ref(false)
const fullscreen = ref(false)

function onSubmit() {
  formDialog.value = false
  EvMessage.success('提交成功')
}

function handleBeforeClose(done) {
  EvMessage({ message: 'before-close：1 秒后关闭', duration: 1000 })
  setTimeout(done, 1000)
}

function sendStack() {
  EvMessage.info('第一条消息')
  setTimeout(() => EvMessage.success('第二条消息'), 150)
  setTimeout(() => EvMessage.warning('第三条消息'), 300)
}
</script>

<style scoped src="./demo.css"></style>
