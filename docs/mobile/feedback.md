# 反馈与浮层

桌面浮层体系（Dialog 居中模态、Drawer 侧滑、Dropdown 菜单、Popconfirm 气泡）在移动端收束为两种形态：**底部面板**（动作选择、字段拾取，拇指可达）与**全屏页**（长表单、内容编辑）。hover 类气泡（Tooltip / Popconfirm / Dropdown）在触屏上没有触发条件，一律迁移。

## 底部动作面板

「更多操作」是底部动作面板的典型场景：桌面端的 Dropdown 菜单或操作列按钮组，在移动端收敛为一个入口 + 面板内纵向动作列表。破坏性动作放最底部并用警示色，与普通动作隔开，最后是取消栏。

<DemoBlock>
<MobileStage title="订单详情">
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__head">
        <span class="mb-card__title">报销单 CL-0908-01</span>
        <eb-status-tag value="pending" :statuses="sheetStatuses" />
      </div>
      <div class="mb-card__rows">
        <div><div class="mb-card__label">申请人</div><div class="mb-card__value">李工</div></div>
        <div><div class="mb-card__label">金额</div><div class="mb-card__value">¥1,860</div></div>
      </div>
    </div>
    <eb-button style="align-self: stretch;" @click="sheetOpen = true">更多操作</eb-button>
  </div>
  <eb-action-sheet
    v-model="sheetOpen"
    title="单据操作"
    :actions="sheetActions"
    :append-to-body="false" :lock-scroll="false"
    @select="onSelect"
  />
</MobileStage>
</DemoBlock>

下方演示即 [ActionSheet](/mobile/components/action-sheet) 组件：动作列表纵向排布、破坏性动作
着警示色排在最末、底部取消栏独立成组。实现口径：舞台内 `:append-to-body="false"`（并配 `:lock-scroll="false"` 防止锁文档页滚动），
真机页面保持默认 Teleport 即可。

## 全屏表单页

字段数超过一屏的编辑场景（新建 / 复杂编辑）不用居中 Dialog——窄屏上既放不下也不便输入。用 `Dialog fullscreen` 让表单页占满整屏：头部标题 + 关闭，底部吸底操作，等价于推入一个新页面。

<DemoBlock>
<MobileStage title="客户详情">
  <div class="mb-page">
    <div class="mb-card mb-card--pad">
      <div class="mb-card__head">
        <span class="mb-card__title">上海云启科技有限公司</span>
        <eb-tag type="primary">A 级</eb-tag>
      </div>
      <div class="mb-card__rows">
        <div><div class="mb-card__label">行业</div><div class="mb-card__value">软件与信息服务</div></div>
        <div><div class="mb-card__label">负责人</div><div class="mb-card__value">李工</div></div>
      </div>
    </div>
    <eb-button type="primary" style="align-self: stretch;" @click="editOpen = true">编辑客户资料</eb-button>
  </div>
  <eb-dialog v-model="editOpen" fullscreen :append-to-body="false" :lock-scroll="false" title="编辑客户资料">
    <div style="padding: 16px;">
      <eb-form label-position="top">
        <eb-form-item label="客户名称"><eb-input model-value="上海云启科技有限公司" /></eb-form-item>
        <eb-form-item label="行业"><eb-input model-value="软件与信息服务" /></eb-form-item>
        <eb-form-item label="规模"><eb-segmented model-value="200-500 人" block :options="['<50 人', '50-200 人', '200-500 人', '500+ 人']" /></eb-form-item>
        <eb-form-item label="备注"><eb-input type="textarea" :rows="3" placeholder="选填" /></eb-form-item>
      </eb-form>
    </div>
    <template #footer>
      <div style="display: flex; gap: 10px; padding: 0 16px;">
        <eb-button style="flex: 1;" @click="editOpen = false">取消</eb-button>
        <eb-button style="flex: 1;" type="primary" @click="editOpen = false; $message.success('已保存（演示）')">保存</eb-button>
      </div>
    </template>
  </eb-dialog>
</MobileStage>
</DemoBlock>

全屏页内表单沿用 `label-position="top"`，footer 双按钮等宽（取消 + 主操作），不要在 footer 塞第三个按钮。

## 危险操作确认

Popconfirm 依赖 hover / popper 定位，触屏上改用**小型居中 Dialog**：文案一句话说清后果，主按钮用警示色，取消按钮平级。避免弹窗里再套弹窗。

<DemoBlock>
<MobileStage title="订单详情">
  <div class="mb-page">
    <div class="mb-divider-text" style="padding: 0;">删除后单据进入回收站，30 天内可恢复</div>
    <eb-button type="danger" style="align-self: stretch;" @click="confirmOpen = true">删除报销单</eb-button>
  </div>
  <eb-dialog v-model="confirmOpen" title="删除报销单？" width="300px" align-center :append-to-body="false" :lock-scroll="false">
    <p style="font-size: 13px; color: var(--bd-text-secondary);">CL-0908-01 将移入回收站，30 天内可恢复。</p>
    <template #footer>
      <div style="display: flex; gap: 10px;">
        <eb-button style="flex: 1;" @click="confirmOpen = false">取消</eb-button>
        <eb-button style="flex: 1;" type="danger" @click="confirmOpen = false; $message.success('已移入回收站（演示）')">删除</eb-button>
      </div>
    </template>
  </eb-dialog>
</MobileStage>
</DemoBlock>

## 轻提示（Toast）

Message 在移动端承担 toast 职责：成功 / 失败等操作结果用轻提示反馈，出现位置建议在**顶部安全区下方**居中（不挡底部操作区）。本站演示中 toast 出现在文档视口顶部，真机形态以 H5 样板为准。时长 2–3 秒；需要用户确认的信息不要用 toast，改用对话框。

<DemoBlock>
<MobileStage title="轻提示">
  <div class="mb-page">
    <eb-button style="align-self: stretch;" @click="$message.success('保存成功')">成功提示</eb-button>
    <eb-button style="align-self: stretch;" type="warning" @click="$message.warning('网络不稳定，已自动重试')">警示提示</eb-button>
    <eb-button style="align-self: stretch;" type="danger" @click="$message.error('提交失败，请检查网络')">失败提示</eb-button>
  </div>
</MobileStage>
</DemoBlock>

<script setup>
import { ref } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'

const sheetOpen = ref(false)
const editOpen = ref(false)
const confirmOpen = ref(false)
const sheetStatuses = [{ value: 'pending', label: '审批中', type: 'warning' }]
const sheetActions = [
  { name: '转发审批' },
  { name: '编辑单据', subname: '进入全屏编辑' },
  { name: '导出 PDF' },
  { name: '撤回单据', color: 'var(--eb-color-danger)' },
]
function onSelect(action) {
  sheetOpen.value = false
  EbMessage.success(`已${action.name}（演示）`)
}
</script>
