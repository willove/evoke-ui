<template>
  <form class="ev-newsletter" :class="{ 'is-subscribed': subscribed }" @submit.prevent="onSubmit">
    <template v-if="!subscribed">
      <EvIcon name="mail" :size="18" class="ev-newsletter__icon" />
      <input
        v-model.trim="email"
        class="ev-newsletter__input"
        type="email"
        required
        :placeholder="placeholder"
        :aria-label="placeholder"
      />
      <EvButton type="submit" :pill="pill" :loading="loading" :disabled="loading">
        {{ buttonText }}
      </EvButton>
    </template>
    <span v-else class="ev-newsletter__done">
      <EvIcon name="check" :size="16" class="ev-newsletter__done-icon" />
      <slot name="subscribed">{{ subscribedText }}</slot>
    </span>
  </form>
</template>

<script setup>
/**
 * EvNewsletter — 邮件订阅框
 * 输入 + 主按钮一体式胶囊；提交派发 subscribe(email)，随后展示成功态
 */
import { ref } from 'vue'
import EvButton from '../button/index.vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  placeholder: { type: String, default: '输入你的邮箱' },
  buttonText: { type: String, default: '订阅' },
  subscribedText: { type: String, default: '订阅成功，请查收确认邮件' },
  pill: { type: Boolean, default: true },
})

const emit = defineEmits(['subscribe'])

const email = ref('')
const loading = ref(false)
const subscribed = ref(false)

async function onSubmit() {
  if (!email.value) return
  loading.value = true
  try {
    emit('subscribe', email.value)
    // 给父级异步处理留出一帧；无外部等待时立即切成功态
    await Promise.resolve()
    subscribed.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style src="./style.css"></style>
