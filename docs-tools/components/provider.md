# EtProvider · 全局提供者

工具框架的全局提供者：注入密度档位，并把密度写成根级属性。

<script setup>
import { ref } from 'vue'
const density = ref('default')
</script>

<DemoBlock>
  <div class="demo-col">
    <div class="demo-row">
      <et-tool-button
        v-for="d in [['compact', '紧凑'], ['default', '默认'], ['relaxed', '宽松']]"
        :key="d[0]"
        size="small"
        icon="menu"
        :label="d[1]"
        :active="density === d[0]"
        @click="density = d[0]"
      />
    </div>
    <et-provider :density="density">
      <et-tool-group label="剪贴板">
        <et-tool-button icon="copy" label="复制" />
        <et-tool-button icon="more" label="更多" />
      </et-tool-group>
    </et-provider>
    <p class="demo-readout">当前档 <code>{{ density }}</code></p>
  </div>
</DemoBlock>

写在应用根上：chrome 与画布是整页布局，只包一层 div 的话画布侧令牌拿不到档位。其余属性（locale / 主题 / zIndex 管理）透传到底座 `EbConfigProvider`。

## API

<CompApi id="provider" />

## 行为

- 挂载写 `<html data-density>`，卸载还原挂载前的外部值（外部已设置的不动）。
- 运行时切档 prop 即时跟随，不需要刷新页面。
- 嵌套 EtProvider 以最后挂载者为准（一个产品一个密度）。
- 同时 `provide(ET_DENSITY_KEY, ...)`；`useDensity()` 读档，未挂时回落 `'default'`。

## 令牌与门禁

- 密度度量全部走令牌，三档对照表见[设计规范](/guide/design#三档密度)。
- G7：布局属性禁字面量 px。
