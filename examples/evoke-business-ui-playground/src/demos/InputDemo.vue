<template>
  <section class="demo">
    <h2>EbInput / EbTextarea / EbInputNumber</h2>

    <div class="demo-row">
      <span class="demo-label">基础</span>
      <eb-input v-model="basic" placeholder="请输入内容" style="width: 240px" />
      <eb-input v-model="basic" disabled placeholder="禁用" style="width: 200px" />
      <eb-input v-model="basic" readonly placeholder="只读" style="width: 200px" />
    </div>

    <div class="demo-row">
      <span class="demo-label">图标/明密文</span>
      <eb-input v-model="basic" prefix-icon="search" placeholder="搜索" style="width: 220px" />
      <eb-input v-model="pwd" type="password" show-password placeholder="密码" style="width: 200px" />
    </div>

    <div class="demo-row">
      <span class="demo-label">error/help</span>
      <eb-input v-model="basic" error="格式不正确" style="width: 240px" />
      <eb-input v-model="basic" help="帮助提示文案" style="width: 240px" />
    </div>

    <div class="demo-row">
      <span class="demo-label">字数限制</span>
      <eb-input v-model="limit" maxlength="10" show-word-limit style="width: 240px" />
      <eb-input v-model="limit" type="textarea" :rows="2" maxlength="30" show-word-limit style="width: 320px" />
    </div>

    <div class="demo-row">
      <span class="demo-label">Textarea</span>
      <eb-textarea v-model="limit" :rows="3" placeholder="多行输入" style="width: 400px" />
      <eb-textarea v-model="limit" :autosize="{ minRows: 2, maxRows: 5 }" style="width: 400px" />
    </div>

    <div class="demo-row">
      <span class="demo-label">InputNumber</span>
      <eb-input-number v-model="num" :min="0" :max="100" style="width: 160px" />
      <eb-input-number v-model="num" :step="2" :precision="1" size="small" style="width: 160px" />
      <eb-input-number v-model="num" controls-position="right" size="large" style="width: 160px" />
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
const basic = ref('')
const pwd = ref('')
const limit = ref('')
const num = ref(5)
</script>

<style scoped src="./demo.css"></style>
