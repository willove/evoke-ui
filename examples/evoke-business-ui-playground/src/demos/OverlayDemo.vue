<template>
  <section class="demo">
    <h2>EvTooltip / EvPopover / EvPopconfirm / EvDropdown / EvTabs / EvDrawer / EvProgress</h2>

    <h3>浮层（Tooltip / Popover / Popconfirm）</h3>
    <div class="demo-row">
      <span class="demo-label">Tooltip</span>
      <ev-tooltip content="顶部提示" placement="top">
        <ev-button>top</ev-button>
      </ev-tooltip>
      <ev-tooltip content="浅色提示" effect="light">
        <ev-button>light</ev-button>
      </ev-tooltip>
      <ev-tooltip content="点击触发" trigger="click">
        <ev-button>click</ev-button>
      </ev-tooltip>
    </div>
    <div class="demo-row">
      <span class="demo-label">Popover</span>
      <ev-popover title="标题" content="气泡内容详情" trigger="click" width="240">
        <ev-button>点击打开</ev-button>
      </ev-popover>
      <ev-popconfirm title="确认执行此操作？" @confirm="onOk" @cancel="onCancel">
        <ev-button type="danger" plain>危险操作</ev-button>
      </ev-popconfirm>
    </div>

    <h3>EvDropdown</h3>
    <div class="demo-row">
      <span class="demo-label">触发</span>
      <ev-dropdown @command="onCommand">
        <ev-button>
          hover 触发 <ev-icon name="arrow-down" />
        </ev-button>
        <template #dropdown>
          <ev-dropdown-menu>
            <ev-dropdown-item command="a" label="操作一" icon="edit" />
            <ev-dropdown-item command="b" label="操作二" icon="delete" divided />
            <ev-dropdown-item command="c" label="禁用" disabled />
          </ev-dropdown-menu>
        </template>
      </ev-dropdown>
      <ev-dropdown trigger="click" split-button type="primary" text="分步操作" @command="onCommand" @click="onMainClick">
        <template #dropdown>
          <ev-dropdown-menu>
            <ev-dropdown-item command="x" label="更多操作 1" />
            <ev-dropdown-item command="y" label="更多操作 2" />
          </ev-dropdown-menu>
        </template>
      </ev-dropdown>
    </div>

    <h3>EvTabs</h3>
    <ev-tabs v-model="tab">
      <ev-tab-pane label="用户管理" name="user">
        <p>用户管理内容区</p>
      </ev-tab-pane>
      <ev-tab-pane label="配置管理" name="config">
        <p>配置管理内容区</p>
      </ev-tab-pane>
      <ev-tab-pane label="角色管理" name="role" disabled>
        <p>禁用页</p>
      </ev-tab-pane>
    </ev-tabs>
    <ev-tabs v-model="tab" type="card" style="margin-top: 16px">
      <ev-tab-pane label="Card A" name="user"><p>card 内容</p></ev-tab-pane>
      <ev-tab-pane label="Card B" name="config"><p>card 内容 B</p></ev-tab-pane>
    </ev-tabs>
    <ev-tabs v-model="tab" type="border-card" style="margin-top: 16px">
      <ev-tab-pane label="Border A" name="user"><p>border-card 内容</p></ev-tab-pane>
      <ev-tab-pane label="Border B" name="config"><p>border-card 内容 B</p></ev-tab-pane>
    </ev-tabs>

    <h3>EvDrawer + 命令式 API</h3>
    <div class="demo-row">
      <span class="demo-label">Drawer</span>
      <ev-button @click="d1 = true">右侧</ev-button>
      <ev-button @click="d2 = true">左侧</ev-button>
      <ev-button @click="d3 = true">顶部</ev-button>
      <ev-button @click="EvMsgbox.confirm('确认删除该记录？', '危险操作', { type: 'warning' }).catch(() => {})">
        EvMsgbox.confirm
      </ev-button>
      <ev-button @click="EvMsgbox.alert('保存成功', '提示')">EvMsgbox.alert</ev-button>
      <ev-button @click="showPrompt">EvMsgbox.prompt</ev-button>
      <ev-button @click="EvNotify.success('通知标题', '通知内容详情')">EvNotify</ev-button>
    </div>

    <ev-drawer v-model="d1" title="右侧抽屉" direction="rtl" size="30%">
      <p>右侧抽屉内容</p>
    </ev-drawer>
    <ev-drawer v-model="d2" title="左侧抽屉" direction="ltr" size="360px">
      <p>左侧抽屉内容</p>
    </ev-drawer>
    <ev-drawer v-model="d3" title="顶部抽屉" direction="ttb" size="30%">
      <p>顶部抽屉内容</p>
    </ev-drawer>

    <h3>EvProgress / EvEmpty / EvImageViewer</h3>
    <div class="demo-row" style="max-width: 420px; display: flex; flex-direction: column; gap: 12px">
      <ev-progress :percentage="percent" />
      <ev-progress :percentage="percent" status="success" />
      <ev-progress :percentage="percent" status="exception" :stroke-width="16" text-inside />
      <ev-progress type="circle" :percentage="percent" :width="120" />
      <div style="display: flex; gap: 16px; align-items: center">
        <ev-button size="small" @click="percent = Math.max(0, percent - 10)">-10</ev-button>
        <ev-button size="small" @click="percent = Math.min(100, percent + 10)">+10</ev-button>
      </div>
    </div>
    <ev-empty description="暂无数据" style="max-width: 420px" />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { EvMsgbox, EvNotify, EvMessage } from '@wil-works/evoke-business-ui'

const tab = ref('user')
const d1 = ref(false)
const d2 = ref(false)
const d3 = ref(false)
const percent = ref(60)

function onCommand(cmd) {
  EvMessage.info(`command: ${cmd}`)
}

function onMainClick() {
  EvMessage.info('主按钮点击')
}

function onOk() {
  EvMessage.success('已确认')
}

function onCancel() {
  EvMessage.info('已取消')
}

async function showPrompt() {
  try {
    const { value } = await EvMsgbox.prompt('请输入名称', '输入', { inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    EvMessage.success(`输入了：${value}`)
  } catch {
    /* 取消 */
  }
}
</script>

<style scoped src="./demo.css"></style>
