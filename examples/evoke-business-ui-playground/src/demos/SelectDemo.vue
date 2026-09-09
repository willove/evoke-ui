<template>
  <section class="demo">
    <h2>EvSelect / EvPagination / EvAvatar / EvBadge</h2>

    <h3>EvSelect</h3>
    <div class="demo-row">
      <span class="demo-label">基础</span>
      <ev-select v-model="single" placeholder="请选择" style="width: 220px">
        <ev-option value="a" label="选项A" />
        <ev-option value="b" label="选项B" />
        <ev-option value="c" label="禁用项" disabled />
      </ev-select>
      <ev-select v-model="single" clearable style="width: 180px">
        <ev-option v-for="i in 5" :key="i" :value="i" :label="`选项 ${i}`" />
      </ev-select>
    </div>
    <div class="demo-row">
      <span class="demo-label">多选</span>
      <ev-select v-model="multi" multiple style="width: 360px">
        <ev-option value="a" label="标签A" />
        <ev-option value="b" label="标签B" />
        <ev-option value="c" label="标签C" />
      </ev-select>
      <ev-select v-model="multi" multiple collapse-tags style="width: 220px">
        <ev-option value="a" label="标签A" />
        <ev-option value="b" label="标签B" />
        <ev-option value="c" label="标签C" />
      </ev-select>
    </div>
    <div class="demo-row">
      <span class="demo-label">可过滤</span>
      <ev-select v-model="single" filterable placeholder="输入过滤" style="width: 240px">
        <ev-option value="beijing" label="北京" />
        <ev-option value="shanghai" label="上海" />
        <ev-option value="shenzhen" label="深圳" />
      </ev-select>
      <ev-select v-model="single" filterable allow-create placeholder="可创建" style="width: 240px">
        <ev-option value="x" label="预设X" />
      </ev-select>
    </div>
    <div class="demo-row">
      <span class="demo-label">分组</span>
      <ev-select v-model="single" style="width: 240px">
        <ev-option-group label="热门城市">
          <ev-option value="bj" label="北京" />
          <ev-option value="sh" label="上海" />
        </ev-option-group>
        <ev-option-group label="其他">
          <ev-option value="gz" label="广州" />
        </ev-option-group>
      </ev-select>
    </div>

    <h3>EvPagination</h3>
    <ev-pagination
      v-model="pager"
      :total="200"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
    />
    <p class="hint">当前：第 {{ pager.page }} 页 / {{ pager.size }} 条每页</p>
    <ev-pagination :total="50" layout="prev, pager, next" size="small" style="margin-top: 12px" />

    <h3>EvAvatar / EvBadge</h3>
    <div class="demo-row">
      <span class="demo-label">头像</span>
      <ev-avatar>W</ev-avatar>
      <ev-avatar size="small">S</ev-avatar>
      <ev-avatar size="large">L</ev-avatar>
      <ev-avatar :size="64" shape="square">64</ev-avatar>
      <ev-avatar src="/broken.png">兜底</ev-avatar>
    </div>
    <div class="demo-row">
      <span class="demo-label">徽标</span>
      <ev-badge :value="12">
        <ev-button>消息</ev-button>
      </ev-badge>
      <ev-badge :value="200" :max="99">
        <ev-button>溢出</ev-button>
      </ev-badge>
      <ev-badge is-dot>
        <ev-icon name="bell" :size="20" />
      </ev-badge>
      <ev-badge :value="1" type="success" standalone />
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
const single = ref('')
const multi = ref(['a'])
const pager = reactive({ page: 1, size: 20 })
</script>

<style scoped src="./demo.css"></style>
