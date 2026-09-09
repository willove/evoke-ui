/**
 * v-copy — 点击复制
 *
 * 用法：
 *   <span v-copy>{{ orderNo }}</span>            复制元素文本
 *   <span v-copy="orderNo">{{ orderNo }}</span>  复制指定值
 *   v-copy="{ value, feedback: false }"          关闭消息提示
 */
import { EvMessage } from '../components/message'
import { useClipboard } from '../composables/useClipboard'

function attach(el, binding) {
  const { copy } = useClipboard()
  const opts = typeof binding.value === 'object' && binding.value !== null ? binding.value : null
  const getValue = () => {
    if (opts) return opts.value
    if (binding.value != null && typeof binding.value !== 'object') return String(binding.value)
    return el.textContent?.trim() ?? ''
  }
  el.__evCopyHandler = async () => {
    const ok = await copy(getValue())
    if (opts?.feedback ?? true) {
      if (ok) EvMessage.success('已复制')
      else EvMessage.error('复制失败')
    }
  }
  el.addEventListener('click', el.__evCopyHandler)
}

export function createCopyDirective() {
  return {
    mounted(el, binding) {
      attach(el, binding)
      el.classList.add('is-copyable')
    },
    updated(el, binding) {
      if (el.__evCopyHandler && binding.value !== binding.oldValue) {
        el.removeEventListener('click', el.__evCopyHandler)
        attach(el, binding)
      }
    },
    unmounted(el) {
      if (el.__evCopyHandler) {
        el.removeEventListener('click', el.__evCopyHandler)
        el.__evCopyHandler = null
      }
    },
  }
}
