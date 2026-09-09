<template>
  <section class="demo">
    <h2>EvForm / EvFormItem（async-validator 集成）</h2>

    <ev-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      style="max-width: 520px"
    >
      <ev-form-item label="用户名" prop="name">
        <ev-input v-model="form.name" placeholder="blur 触发必填校验" />
      </ev-form-item>
      <ev-form-item label="邮箱" prop="email">
        <ev-input v-model="form.email" placeholder="change 触发格式校验" />
      </ev-form-item>
      <ev-form-item label="类型" prop="type">
        <ev-radio-group v-model="form.type">
          <ev-radio label="a">类型 A</ev-radio>
          <ev-radio label="b">类型 B</ev-radio>
        </ev-radio-group>
      </ev-form-item>
      <ev-form-item label="权限" prop="perms">
        <ev-checkbox-group v-model="form.perms">
          <ev-checkbox label="read">读</ev-checkbox>
          <ev-checkbox label="write">写</ev-checkbox>
        </ev-checkbox-group>
      </ev-form-item>
      <ev-form-item label="启用" prop="enabled">
        <ev-switch v-model="form.enabled" active-text="开" inactive-text="关" />
      </ev-form-item>
      <ev-form-item>
        <ev-button type="primary" @click="onValidate">校验</ev-button>
        <ev-button @click="onReset">重置</ev-button>
        <ev-button text type="primary" @click="onClear">清除校验</ev-button>
      </ev-form-item>
    </ev-form>

    <h3>Radio / Checkbox / Switch</h3>
    <div class="demo-row">
      <span class="demo-label">Button 组</span>
      <ev-radio-group v-model="form.type">
        <ev-radio-button label="a">A</ev-radio-button>
        <ev-radio-button label="b">B</ev-radio-button>
        <ev-radio-button label="c">C</ev-radio-button>
      </ev-radio-group>
    </div>
    <div class="demo-row">
      <span class="demo-label">Checkbox</span>
      <ev-checkbox v-model="checked1" border>带边框</ev-checkbox>
      <ev-checkbox-group v-model="form.perms" size="small">
        <ev-checkbox-button label="read">读</ev-checkbox-button>
        <ev-checkbox-button label="write">写</ev-checkbox-button>
      </ev-checkbox-group>
      <ev-checkbox :model-value="false" indeterminate>半选</ev-checkbox>
    </div>
    <div class="demo-row">
      <span class="demo-label">Switch</span>
      <ev-switch v-model="checked1" />
      <ev-switch v-model="form.enabled" size="large" />
      <ev-switch v-model="checked1" size="small" />
      <ev-switch v-model="num" :active-value="1" :inactive-value="0" active-text="1" inactive-text="0" inline-prompt />
    </div>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'

const formRef = ref(null)

const form = reactive({
  name: '',
  email: '',
  type: 'a',
  perms: ['read'],
  enabled: false,
})

const rules = {
  name: [{ required: true, message: '用户名必填', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱必填', trigger: 'change' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'change' },
  ],
}

const checked1 = ref(true)
const num = ref(1)

async function onValidate() {
  try {
    await formRef.value.validate()
    EvMessage.success('校验通过')
  } catch (fields) {
    EvMessage.error('校验失败：' + Object.values(fields).join('；'))
  }
}

function onReset() {
  formRef.value.resetFields()
}

function onClear() {
  formRef.value.clearValidate()
}
</script>

<style scoped src="./demo.css"></style>
