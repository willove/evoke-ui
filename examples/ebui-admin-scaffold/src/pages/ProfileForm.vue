<template>
  <div class="page-card page">
    <eb-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <eb-form-item :label="t('profile.name')" prop="name">
        <eb-input v-model="form.name" :placeholder="t('profile.namePlaceholder')" />
      </eb-form-item>
      <eb-form-item :label="t('profile.email')" prop="email">
        <eb-input v-model="form.email" :placeholder="t('profile.emailPlaceholder')" />
      </eb-form-item>
      <eb-form-item :label="t('profile.dept')" prop="dept">
        <eb-select v-model="form.dept" :placeholder="t('profile.deptPlaceholder')" style="width: 240px">
          <eb-option label="销售部" value="sales" />
          <eb-option label="交付部" value="delivery" />
        </eb-select>
      </eb-form-item>
      <eb-form-item :label="t('profile.bio')" prop="bio">
        <eb-textarea v-model="form.bio" :rows="3" :placeholder="t('profile.bioPlaceholder')" />
      </eb-form-item>
      <eb-form-item>
        <eb-button type="primary" @click="save">{{ t('form.save') }}</eb-button>
        <eb-button style="margin-left: 8px" @click="reset">{{ t('form.cancel') }}</eb-button>
      </eb-form-item>
    </eb-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSettings } from '../settings'

const { t, notify } = useSettings()
const formRef = ref(null)

const form = ref({
  name: '张三',
  email: 'zhangsan@example.com',
  dept: 'sales',
  bio: '',
})

const rules = {
  name: [{ required: true, message: t('profile.nameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: t('profile.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('profile.emailInvalid'), trigger: 'blur' },
  ],
}

function save() {
  formRef.value?.validate((ok) => {
    if (ok) notify({ type: 'success', title: t('form.saved') })
  })
}

function reset() {
  form.value = { name: '', email: '', dept: '', bio: '' }
  formRef.value?.resetFields?.()
  notify({ type: 'info', title: t('form.reset') })
}
</script>
