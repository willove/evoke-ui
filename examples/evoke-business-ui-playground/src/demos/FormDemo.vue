<template>
  <section class="demo">
    <h2>EbForm / EbFormItem（async-validator 集成）</h2>

    <eb-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      style="max-width: 520px"
    >
      <eb-form-item label="用户名" prop="name">
        <eb-input v-model="form.name" placeholder="blur 触发必填校验" />
      </eb-form-item>
      <eb-form-item label="邮箱" prop="email">
        <eb-input v-model="form.email" placeholder="change 触发格式校验" />
      </eb-form-item>
      <eb-form-item label="类型" prop="type">
        <eb-radio-group v-model="form.type">
          <eb-radio label="a">类型 A</eb-radio>
          <eb-radio label="b">类型 B</eb-radio>
        </eb-radio-group>
      </eb-form-item>
      <eb-form-item label="权限" prop="perms">
        <eb-checkbox-group v-model="form.perms">
          <eb-checkbox label="read">读</eb-checkbox>
          <eb-checkbox label="write">写</eb-checkbox>
        </eb-checkbox-group>
      </eb-form-item>
      <eb-form-item label="启用" prop="enabled">
        <eb-switch v-model="form.enabled" active-text="开" inactive-text="关" />
      </eb-form-item>
      <eb-form-item>
        <eb-button type="primary" @click="onValidate">校验</eb-button>
        <eb-button @click="onReset">重置</eb-button>
        <eb-button text type="primary" @click="onClear">清除校验</eb-button>
      </eb-form-item>
    </eb-form>

    <h3>Radio / Checkbox / Switch</h3>
    <div class="demo-row">
      <span class="demo-label">Button 组</span>
      <eb-radio-group v-model="form.type">
        <eb-radio-button label="a">A</eb-radio-button>
        <eb-radio-button label="b">B</eb-radio-button>
        <eb-radio-button label="c">C</eb-radio-button>
      </eb-radio-group>
    </div>
    <div class="demo-row">
      <span class="demo-label">Checkbox</span>
      <eb-checkbox v-model="checked1" border>带边框</eb-checkbox>
      <eb-checkbox-group v-model="form.perms" size="small">
        <eb-checkbox-button label="read">读</eb-checkbox-button>
        <eb-checkbox-button label="write">写</eb-checkbox-button>
      </eb-checkbox-group>
      <eb-checkbox :model-value="false" indeterminate>半选</eb-checkbox>
    </div>
    <div class="demo-row">
      <span class="demo-label">Switch</span>
      <eb-switch v-model="checked1" />
      <eb-switch v-model="form.enabled" size="large" />
      <eb-switch v-model="checked1" size="small" />
      <eb-switch v-model="num" :active-value="1" :inactive-value="0" active-text="1" inactive-text="0" inline-prompt />
    </div>
  </section>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'

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
    EbMessage.success('校验通过')
  } catch (fields) {
    EbMessage.error('校验失败：' + Object.values(fields).join('；'))
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
