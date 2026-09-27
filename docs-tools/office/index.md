# office-tools · 办公子类

`@wil-works/evoke-tools-ui/office` —— 办公形态的一层：功能区的 tab / 组语义、「文件」全屏后台页、画布调色板桥。
它依赖 [common-tools](/common/) 的基准件与通用壳；办公语义令牌 `--ot-*` 归产品侧（回流禁令：`--et-*` 内不得出现办公语义）。

```js
import CommonTools from '@wil-works/evoke-tools-ui/common'
import OfficeTools from '@wil-works/evoke-tools-ui/office'
import '@wil-works/evoke-tools-ui/styles'

createApp(App).use(CommonTools).use(OfficeTools)
```

<ToolsOverview layer="office" />
