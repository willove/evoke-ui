<template>
  <section class="demo">
    <h2>EbTooltip / EbPopover / EbPopconfirm / EbDropdown / EbTabs / EbDrawer / EbProgress</h2>

    <h3>浮层（Tooltip / Popover / Popconfirm）</h3>
    <div class="demo-row">
      <span class="demo-label">Tooltip</span>
      <eb-tooltip content="顶部提示" placement="top">
        <eb-button>top</eb-button>
      </eb-tooltip>
      <eb-tooltip content="浅色提示" effect="light">
        <eb-button>light</eb-button>
      </eb-tooltip>
      <eb-tooltip content="点击触发" trigger="click">
        <eb-button>click</eb-button>
      </eb-tooltip>
    </div>
    <div class="demo-row">
      <span class="demo-label">Popover</span>
      <eb-popover title="标题" content="气泡内容详情" trigger="click" width="240">
        <eb-button>点击打开</eb-button>
      </eb-popover>
      <eb-popconfirm title="确认执行此操作？" @confirm="onOk" @cancel="onCancel">
        <eb-button type="danger" plain>危险操作</eb-button>
      </eb-popconfirm>
    </div>

    <h3>EbDropdown</h3>
    <div class="demo-row">
      <span class="demo-label">触发</span>
      <eb-dropdown @command="onCommand">
        <eb-button>
          hover 触发 <eb-icon name="arrow-down" />
        </eb-button>
        <template #dropdown>
          <eb-dropdown-menu>
            <eb-dropdown-item command="a" label="操作一" icon="edit" />
            <eb-dropdown-item command="b" label="操作二" icon="delete" divided />
            <eb-dropdown-item command="c" label="禁用" disabled />
          </eb-dropdown-menu>
        </template>
      </eb-dropdown>
      <eb-dropdown trigger="click" split-button type="primary" text="分步操作" @command="onCommand" @click="onMainClick">
        <template #dropdown>
          <eb-dropdown-menu>
            <eb-dropdown-item command="x" label="更多操作 1" />
            <eb-dropdown-item command="y" label="更多操作 2" />
          </eb-dropdown-menu>
        </template>
      </eb-dropdown>
    </div>

    <h3>EbTabs</h3>
    <eb-tabs v-model="tab">
      <eb-tab-pane label="用户管理" name="user">
        <p>用户管理内容区</p>
      </eb-tab-pane>
      <eb-tab-pane label="配置管理" name="config">
        <p>配置管理内容区</p>
      </eb-tab-pane>
      <eb-tab-pane label="角色管理" name="role" disabled>
        <p>禁用页</p>
      </eb-tab-pane>
    </eb-tabs>
    <eb-tabs v-model="tab" type="card" style="margin-top: 16px">
      <eb-tab-pane label="Card A" name="user"><p>card 内容</p></eb-tab-pane>
      <eb-tab-pane label="Card B" name="config"><p>card 内容 B</p></eb-tab-pane>
    </eb-tabs>
    <eb-tabs v-model="tab" type="border-card" style="margin-top: 16px">
      <eb-tab-pane label="Border A" name="user"><p>border-card 内容</p></eb-tab-pane>
      <eb-tab-pane label="Border B" name="config"><p>border-card 内容 B</p></eb-tab-pane>
    </eb-tabs>

    <h3>EbDrawer + 命令式 API</h3>
    <div class="demo-row">
      <span class="demo-label">Drawer</span>
      <eb-button @click="d1 = true">右侧</eb-button>
      <eb-button @click="d2 = true">左侧</eb-button>
      <eb-button @click="d3 = true">顶部</eb-button>
      <eb-button @click="EbMsgbox.confirm('确认删除该记录？', '危险操作', { type: 'warning' }).catch(() => {})">
        EbMsgbox.confirm
      </eb-button>
      <eb-button @click="EbMsgbox.alert('保存成功', '提示')">EbMsgbox.alert</eb-button>
      <eb-button @click="showPrompt">EbMsgbox.prompt</eb-button>
      <eb-button @click="EbNotify.success('通知标题', '通知内容详情')">EbNotify</eb-button>
    </div>

    <eb-drawer v-model="d1" title="右侧抽屉" direction="rtl" size="30%">
      <p>右侧抽屉内容</p>
    </eb-drawer>
    <eb-drawer v-model="d2" title="左侧抽屉" direction="ltr" size="360px">
      <p>左侧抽屉内容</p>
    </eb-drawer>
    <eb-drawer v-model="d3" title="顶部抽屉" direction="ttb" size="30%">
      <p>顶部抽屉内容</p>
    </eb-drawer>

    <h3>EbProgress / EbEmpty / EbImageViewer</h3>
    <div class="demo-row" style="max-width: 420px; display: flex; flex-direction: column; gap: 12px">
      <eb-progress :percentage="percent" />
      <eb-progress :percentage="percent" status="success" />
      <eb-progress :percentage="percent" status="exception" :stroke-width="16" text-inside />
      <eb-progress type="circle" :percentage="percent" :width="120" />
      <div style="display: flex; gap: 16px; align-items: center">
        <eb-button size="small" @click="percent = Math.max(0, percent - 10)">-10</eb-button>
        <eb-button size="small" @click="percent = Math.min(100, percent + 10)">+10</eb-button>
      </div>
    </div>
    <eb-empty description="暂无数据" style="max-width: 420px" />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { EbMsgbox, EbNotify, EbMessage } from '@wil-works/evoke-business-ui'

const tab = ref('user')
const d1 = ref(false)
const d2 = ref(false)
const d3 = ref(false)
const percent = ref(60)

function onCommand(cmd) {
  EbMessage.info(`command: ${cmd}`)
}

function onMainClick() {
  EbMessage.info('主按钮点击')
}

function onOk() {
  EbMessage.success('已确认')
}

function onCancel() {
  EbMessage.info('已取消')
}

async function showPrompt() {
  try {
    const { value } = await EbMsgbox.prompt('请输入名称', '输入', { inputPattern: /\S+/, inputErrorMessage: '名称不能为空' })
    EbMessage.success(`输入了：${value}`)
  } catch {
    /* 取消 */
  }
}
</script>

<style scoped src="./demo.css"></style>
