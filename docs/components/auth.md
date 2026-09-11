# Auth 权限

权限判定三件套：`usePermission` composable + `v-permission` 指令 + `EbAuth` 组件。权限来源：`ConfigProvider` 的 `permissions` 属性（推荐）或全局 `setPermissions()`。

## EbAuth 组件

<DemoBlock>
  <eb-space size="middle">
    <eb-auth has="admin:write">
      <eb-button type="primary">需要 admin:write 的操作</eb-button>
    </eb-auth>
    <eb-auth :has="['admin:delete', 'admin:write']">
      <eb-button>任一满足即可见</eb-button>
    </eb-auth>
    <eb-auth has="admin:danger">
      <eb-button type="danger">无权限看不到</eb-button>
      <template #fallback>
        <eb-tag type="info">fallback 插槽：权限不足</eb-tag>
      </template>
    </eb-auth>
  </eb-space>
</DemoBlock>

## v-permission 指令

无权限默认**移除元素**；`mode: 'disable'` 保留占位并禁用，权限热更新时实时恢复。

```vue
<eb-button v-permission="'admin:write'">写操作</eb-button>
<eb-button v-permission="{ has: 'admin:write', mode: 'disable' }">禁用形态</eb-button>
```

## usePermission

```js
import { usePermission } from '@wil-works/evoke-business-ui'

const { has, hasAny, hasAll } = usePermission()
has('admin:write')                    // 精确匹配（注册表含 'admin:*' 时前缀通配）
has(['a:1', 'b:2'])                   // 任一满足
hasAll(['a:1', 'b:2'])                // 全部满足
has((perms) => perms.length > 0)      // 自定义判定
```

## 权限来源注入

```vue
<eb-config-provider :permissions="userPermissions">
  <router-view />
</eb-config-provider>
```

或无 ConfigProvider 时：`setPermissions(['sys:*', 'report:read'])`。

<script setup>
import { ref } from 'vue'
import { setPermissions } from '@wil-works/evoke-business-ui'

const userPermissions = ref(['admin:write', 'report:read'])
setPermissions(userPermissions.value)
</script>
