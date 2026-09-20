<template>
  <form class="ev-contact-form" novalidate @submit.prevent="onSubmit">
    <template v-if="!sent">
      <div class="ev-contact-form__row">
        <div class="ev-contact-form__field">
          <label class="ev-contact-form__label" :for="`${uid}-name`">称呼</label>
          <input
            :id="`${uid}-name`"
            v-model.trim="form.name"
            class="ev-contact-form__input"
            :class="{ 'is-error': errors.name }"
            type="text"
            placeholder="怎么称呼你"
            @input="errors.name = false"
          />
          <span v-if="errors.name" class="ev-contact-form__error">请填写称呼</span>
        </div>
        <div class="ev-contact-form__field">
          <label class="ev-contact-form__label" :for="`${uid}-email`">邮箱</label>
          <input
            :id="`${uid}-email`"
            v-model.trim="form.email"
            class="ev-contact-form__input"
            :class="{ 'is-error': errors.email }"
            type="email"
            placeholder="用于回复你"
            @input="errors.email = false"
          />
          <span v-if="errors.email" class="ev-contact-form__error">邮箱格式不正确</span>
        </div>
      </div>
      <div class="ev-contact-form__field">
        <label class="ev-contact-form__label" :for="`${uid}-message`">留言</label>
        <textarea
          :id="`${uid}-message`"
          v-model.trim="form.message"
          class="ev-contact-form__input ev-contact-form__textarea"
          :class="{ 'is-error': errors.message }"
          rows="4"
          placeholder="想聊点什么…"
          @input="errors.message = false"
        />
        <span v-if="errors.message" class="ev-contact-form__error">留言不能为空</span>
      </div>
      <div class="ev-contact-form__footer">
        <EvButton type="submit" :loading="loading">{{ buttonText }}</EvButton>
        <span v-if="$slots.hint" class="ev-contact-form__hint"><slot name="hint" /></span>
      </div>
    </template>

    <div v-else class="ev-contact-form__done">
      <EvIcon name="check" :size="18" class="ev-contact-form__done-icon" />
      <div class="ev-contact-form__done-text">
        <slot name="sent">{{ sentText }}</slot>
      </div>
      <EvButton variant="ghost" size="small" @click="reset">再发一条</EvButton>
    </div>
  </form>
</template>

<script setup>
/**
 * EvContactForm — 留言/合作表单（企业站联系区块）
 * 内置必填与邮箱校验；submit 派发后切成功态，可 reset 再填
 * label/input 关联用 useId 生成，多实例同页不串 id
 */
import { reactive, ref, useId } from 'vue'
import EvButton from '../button/index.vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  buttonText: { type: String, default: '发送留言' },
  sentText: { type: String, default: '已收到你的留言，会尽快回复！' },
})

const emit = defineEmits(['submit'])

const uid = useId()

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
