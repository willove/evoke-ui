# AppLayout 应用框架

后台整体框架：侧边栏（Logo + 菜单 + 折叠）+ 顶栏（明暗切换 + 右侧动作区）+ 内容区，移动端侧边栏自动转为抽屉。菜单与顶栏内容全部由插槽注入。

## 基础框架

`collapsed` 支持 v-model 受控折叠；菜单用 [Menu](/components/menu) 注入：

<DemoBlock>
  <div style="height:280px;border:1px solid var(--eb-border-color);border-radius:8px;overflow:hidden">
    <eb-app-layout v-model:collapsed="collapsed" title="运营后台" logo-text="运" style="height:100%">
      <template #menu>
        <eb-menu style="background:transparent">
          <eb-menu-item index="/">总览</eb-menu-item>
          <eb-menu-item index="/orders">订单</eb-menu-item>
          <eb-menu-item index="/members">会员</eb-menu-item>
        </eb-menu>
      </template>
      <template #topbar-right>
        <span style="font-size:13px">管理员</span>
      </template>
      <div style="padding:16px;font-size:13px">内容区：菜单与顶栏由插槽注入，折叠状态受控。</div>
    </eb-app-layout>
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const collapsed = ref(false)
</script>

<ApiTable title="AppLayout Props" :rows="[
  { name: 'title', desc: 'Logo 旁的系统名', type: 'string', default: 'Elements' },
  { name: 'logo-text', desc: 'Logo 字标（折叠时仅显示它）', type: 'string', default: 'E' },
  { name: 'collapsed', desc: '侧边栏折叠（v-model:collapsed）', type: 'boolean', default: 'false' },
  { name: 'active-menu / active-title', desc: '默认选中菜单路径与标题', type: 'string', default: '根路径 与 首页' },
  { name: 'is-dark', desc: '框架内明暗态同步', type: 'boolean', default: 'false' },
]" />

<ApiTable title="AppLayout Slots" :rows="[
  { name: 'menu', desc: '侧边栏菜单（放 EbMenu）', type: '—', default: '—' },
  { name: 'sidebar-logo', desc: '替换 Logo 区', type: '—', default: '—' },
  { name: 'topbar-left / topbar-right', desc: '顶栏左右内容', type: '—', default: '—' },
  { name: 'theme-toggle', desc: '替换顶栏明暗切换钮', type: '—', default: '—' },
  { name: 'default', desc: '内容区', type: '—', default: '—' },
]" />

<ApiTable title="AppLayout Events" :rows="[
  { name: 'update:collapsed', desc: '折叠状态变化', type: '(collapsed: boolean) => void', default: '—' },
  { name: 'toggle', desc: '点击折叠钮', type: '() => void', default: '—' },
]" />
