# 分步表单示例（开放平台 · 新建应用）

企业中后台「分步向导表单」场景的基础 case：三步收集信息 → 确认复核 → 提交结果页，每步独立校验，上一步保留已填内容，提交模拟异步并返回应用凭证。

## 运行

```bash
# 在 monorepo 根目录
pnpm --filter @wil-works/ebui-example-step-form dev
# http://localhost:8623
```

## 覆盖组件

| 组件 | 用途 |
| --- | --- |
| Steps | 分步进度（基本资料 → 能力与安全 → 确认创建） |
| Form / FormItem | 每步表单 + 规则校验（validate Promise 化） |
| Input / Select / RadioGroup / CheckboxGroup / Switch / InputNumber / Textarea | 各类录入控件 |
| DetailDescriptions | 第三步确认页回显 |
| Result | 提交成功结果页（含凭证展示与再建入口） |
| Alert | 提示条（计费提醒） |
| Message | 校验失败 / 提交成功反馈 |
| PageHeader / Card / SectionCard | 页面骨架 |

## 分步策略

- 每步一个独立 form model；「下一步」先 `formRef.validate()`，通过才 `active += 1`，失败 Message 提示并停留。
- 「上一步」直接回退不校验；已填值保留在 model 中。
- 第 3 步只读回显全部数据（DetailDescriptions），「提交创建」模拟 800ms 请求 → Result 页展示 AppId / AppSecret。
- 「再创建一个」重置全部 model 与步骤。

## 结构

```
src/
  App.vue                  # 独立运行外壳
  pages/
    AppCreateForm.vue      # 分步表单页（自包含，可被文档站源码级引入预览）
```

## 与文档站的关系

`pages/AppCreateForm.vue` 被 `evoke-business-ui-docs/examples/step-form.md` 直接 import 作为在线实时预览，文档页同时展示该文件完整源码。
