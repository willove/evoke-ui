<template>
  <section class="demo">
    <h2>EbDialog + EbMessage</h2>

    <h3>EbDialog</h3>
    <div class="demo-row">
      <span class="demo-label">基础</span>
      <eb-button @click="basic = true">基础对话框</eb-button>
      <eb-button @click="formDialog = true">表单对话框</eb-button>
      <eb-button @click="confirmDialog = true">before-close 拦截</eb-button>
      <eb-button @click="fullscreen = true">全屏</eb-button>
    </div>

    <eb-dialog v-model="basic" title="基础对话框" width="480px">
      <p>点击遮罩 / ESC / 右上角关闭均可关闭（close-on-click-modal 默认 true）。</p>
      <template #footer>
        <eb-button @click="basic = false">取消</eb-button>
        <eb-button type="primary" @click="basic = false">确定</eb-button>
      </template>
    </eb-dialog>

    <eb-dialog v-model="formDialog" title="新增条目" width="520px" destroy-on-close>
      <eb-form :model="{ name: '' }" label-width="80px">
        <eb-form-item label="名称" required>
          <eb-input placeholder="销毁后重置（destroy-on-close）" />
        </eb-form-item>
        <eb-form-item label="备注">
          <eb-textarea :rows="2" placeholder="多行备注" />
        </eb-form-item>
      </eb-form>
      <template #footer>
        <eb-button @click="formDialog = false">取消</eb-button>
        <eb-button type="primary" @click="onSubmit">提交并提示</eb-button>
      </template>
    </eb-dialog>

    <eb-dialog
      v-model="confirmDialog"
      title="拦截关闭"
      width="420px"
      :before-close="handleBeforeClose"
    >
      <p>点击关闭按钮会触发 before-close 钩子，取消则阻止关闭。</p>
    </eb-dialog>

    <eb-dialog v-model="fullscreen" title="全屏对话框" fullscreen>
      <p>fullscreen 模式占满视口。</p>
    </eb-dialog>

    <h3>EbMessage（命令式 API）</h3>
    <div class="demo-row">
      <span class="demo-label">快捷方法</span>
      <eb-button @click="EbMessage.info('普通信息提示')">info</eb-button>
      <eb-button type="success" @click="EbMessage.success('操作成功')">success</eb-button>
      <eb-button type="warning" @click="EbMessage.warning('请注意风险')">warning</eb-button>
      <eb-button type="danger" @click="EbMessage.error('操作失败，请重试')">error</eb-button>
    </div>
    <div class="demo-row">
      <span class="demo-label">选项</span>
      <eb-button @click="EbMessage({ message: '常驻消息（duration 0）', duration: 0, showClose: true })">
        常驻 + 关闭按钮
      </eb-button>
      <eb-button @click="EbMessage({ message: '居中消息', center: true })">居中</eb-button>
      <eb-button @click="sendStack">堆叠 3 条</eb-button>
      <eb-button @click="EbMessage.close()">关闭全部</eb-button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'

const basic = ref(false)
const formDialog = ref(false)
const confirmDialog = ref(false)
const fullscreen = ref(false)

function onSubmit() {
  formDialog.value = false
  EbMessage.success('提交成功')
}

function handleBeforeClose(done) {
  EbMessage({ message: 'before-close：1 秒后关闭', duration: 1000 })
  setTimeout(done, 1000)
}

function sendStack() {
  EbMessage.info('第一条消息')
  setTimeout(() => EbMessage.success('第二条消息'), 150)
  setTimeout(() => EbMessage.warning('第三条消息'), 300)
}
</script>

<style scoped src="./demo.css"></style>
