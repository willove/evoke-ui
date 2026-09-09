# Auth 权限

权限判定三件套：`usePermission` composable + `v-permission` 指令 + `EvAuth` 组件。权限来源：`ConfigProvider` 的 `permissions` 属性（推荐）或全局 `setPermissions()`。

## EvAuth 组件

<DemoBlock>
  <ev-space size="middle">
    <ev-auth has="admin:write">
      <ev-button type="primary">需要 admin:write 的操作</ev-button>
    </ev-auth>
    <ev-auth :has="['admin:delete', 'admin:write']">
      <ev-button>任一满足即可见</ev-button>
    </ev-auth>
    <ev-auth has="admin:danger">
      <ev-button type="danger">无权限看不到</ev-button>
      <template #fallback>
        <ev-tag type="info">fallback 插槽：权限不足</ev-tag>
      </template>
    </ev-auth>
  </ev-space>
</DemoBlock>

## v-permission 指令

无权限默认**移除元素**；`mode: 'disable'` 保留占位并禁用，权限热更新时实时恢复。

```vue
<ev-button v-permission="'admin:write'">写操作</ev-button>
<ev-button v-permission="{ has: 'admin:write', mode: 'disable' }">禁用形态</ev-button>
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
<ev-config-provider :permissions="userPermissions">
  <router-view />
</ev-config-provider>
```

或无 ConfigProvider 时：`setPermissions(['sys:*', 'report:read'])`。

<script setup>
import { ref } from 'vue'
import { setPermissions } from '@wil-works/evoke-business-ui'

const userPermissions = ref(['admin:write', 'report:read'])
setPermissions(userPermissions.value)
</script>
