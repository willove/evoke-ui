<template>
  <form class="ew-contact-form" novalidate @submit.prevent="onSubmit">
    <template v-if="!sent">
      <div class="ew-contact-form__row">
        <div class="ew-contact-form__field">
          <label class="ew-contact-form__label" for="ew-contact-name">称呼</label>
          <input
            id="ew-contact-name"
            v-model.trim="form.name"
            class="ew-contact-form__input"
            :class="{ 'is-error': errors.name }"
            type="text"
            placeholder="怎么称呼你"
            @input="errors.name = false"
          />
          <span v-if="errors.name" class="ew-contact-form__error">请填写称呼</span>
        </div>
        <div class="ew-contact-form__field">
          <label class="ew-contact-form__label" for="ew-contact-email">邮箱</label>
          <input
            id="ew-contact-email"
            v-model.trim="form.email"
            class="ew-contact-form__input"
            :class="{ 'is-error': errors.email }"
            type="email"
            placeholder="用于回复你"
            @input="errors.email = false"
          />
          <span v-if="errors.email" class="ew-contact-form__error">邮箱格式不正确</span>
        </div>
      </div>
      <div class="ew-contact-form__field">
        <label class="ew-contact-form__label" for="ew-contact-message">留言</label>
        <textarea
          id="ew-contact-message"
          v-model.trim="form.message"
          class="ew-contact-form__input ew-contact-form__textarea"
          :class="{ 'is-error': errors.message }"
          rows="4"
          placeholder="想聊点什么…"
          @input="errors.message = false"
        />
        <span v-if="errors.message" class="ew-contact-form__error">留言不能为空</span>
      </div>
      <div class="ew-contact-form__footer">
        <EwButton type="submit" :loading="loading">{{ buttonText }}</EwButton>
        <span v-if="$slots.hint" class="ew-contact-form__hint"><slot name="hint" /></span>
      </div>
    </template>

    <div v-else class="ew-contact-form__done">
      <EwIcon name="check" :size="18" class="ew-contact-form__done-icon" />
      <div class="ew-contact-form__done-text">
        <slot name="sent">{{ sentText }}</slot>
      </div>
      <EwButton variant="ghost" size="small" @click="reset">再发一条</EwButton>
    </div>
  </form>
</template>

<script setup>
/**
 * EwContactForm — 留言/合作表单（企业站联系区块）
 * 内置必填与邮箱校验；submit 派发后切成功态，可 reset 再填
 */
import { reactive, ref } from 'vue'
import EwButton from '../button/index.vue'
import EwIcon from '../icon/index.vue'

const props = defineProps({
  buttonText: { type: String, default: '发送留言' },
  sentText: { type: String, default: '已收到你的留言，会尽快回复！' },
})

const emit = defineEmits(['submit'])

const form = reactive({ name: '', email: '', message: '' })
const errors = reactive({ name: false, email: false, message: false })
const loading = ref(false)
const sent = ref(false)

function validate() {
  errors.name = !form.name
  errors.email = !/^\S+@\S+\.\S+$/.test(form.email)
  errors.message = !form.message
  return !errors.name && !errors.email && !errors.message
}

function onSubmit() {
  if (!validate()) return
  loading.value = true
  emit('submit', { ...form })
  // 单帧后切成功态；接真实接口时可自行管理 sent（暴露 reset）
  Promise.resolve().then(() => {
    loading.value = false
    sent.value = true
  })
}

function reset() {
  form.name = ''
  form.email = ''
  form.message = ''
  sent.value = false
}

defineExpose({ reset, sent })
</script>

<style src="./style.css"></style>
