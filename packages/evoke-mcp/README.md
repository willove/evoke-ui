# @wil-works/evoke-mcp

[Evoke](https://evoke-ui.wil-works.com) 生态的 MCP（Model Context Protocol）服务：让 AI 编码助手（Claude / Cursor / Codex 等）直接使用 Evoke 三库的知识——组件目录与文档检索、图表 options 的 JSON Schema、spec 校验与数据直生。

> **⚠️ 本包正在开发迭代中，尚未发布正式版：工具集与行为可能随版本调整，请勿用于生产环境。**

## 提供的工具

| 工具 | 说明 |
| --- | --- |
| `list_components` | 列出三库组件与页面目录（ui=官网级 Evoke UI / business=中后台 Business UI / charts=图表库） |
| `search_components` | 按关键词搜索组件（英文名 / 中文名 / 分类） |
| `get_component_docs` | 取组件页完整文档（纯 Markdown，含何时使用、配置要点与示例） |
| `get_docs_page` | 按路径取任意文档页（安装与引入 / 主题接入 / 设计规范…） |
| `get_chart_spec_schema` | 图表 options 的 JSON Schema（ECharts 风格配置） |
| `lint_chart_spec` | 图表 spec 三层校验（Schema → 规则 → 无头渲染文本越界），返回问题与自动修正 |
| `get_chart3d_spec_schema` | 三维图表 options 的 JSON Schema（bar3d/line3d/scatter3d/surface3d/pie3d 与相机配置） |
| `lint_chart3d_spec` | 三维图表 spec schema 校验，返回问题列表 |
| `generate_chart_spec` | 表格数据直生图表 options（自动选型；需求带「三维/立体/3D」或三个数值列时产出三维 spec） |
| `build_chart_prompt` | 生成图表契约提示词，让任意大模型都能写出合法配置（`mode: '3d'` 切三维篇章契约） |

组件文档正文实时取自三个文档站的纯 Markdown 版本，始终与线上文档一致；图表校验与生成由 `@wil-works/evoke-charts` 的 AI 生成引擎直接驱动。

## 接入

在 MCP 客户端配置中加入（Claude Desktop / Cursor 等通用写法）：

```json
{
  "mcpServers": {
    "evoke": {
      "command": "npx",
      "args": ["-y", "@wil-works/evoke-mcp"]
    }
  }
}
```

## 推荐用法

1. 写界面前先 `list_components` / `search_components` 确认组件与所属包；
2. `get_component_docs` 取该组件的完整文档与示例再动手；
3. 写图表配置时先 `get_chart_spec_schema` 对照，生成后 `lint_chart_spec` 自检；
4. 写三维图表（`EvChart3d`）时用 `get_chart3d_spec_schema` / `lint_chart3d_spec`，文档见 charts 站 `/3d/` 篇章；
5. 只有一堆表格数据时直接 `generate_chart_spec` / `build_chart_prompt`。

## 相关包

- [`@wil-works/evoke-ui`](https://www.npmjs.com/package/@wil-works/evoke-ui) — 官网级 UI 框架
- [`@wil-works/evoke-business-ui`](https://www.npmjs.com/package/@wil-works/evoke-business-ui) — 中后台 UI 框架
- [`@wil-works/evoke-charts`](https://www.npmjs.com/package/@wil-works/evoke-charts) — 零依赖 Canvas 图表库
