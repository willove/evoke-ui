/** 菜单 / 工具区 schema 运行时统一出口（L0） */
export {
  SCHEMA_NODE_TYPES,
  assertSchemaNode,
  mergeSchema,
  pruneSchema,
  collectCommandRefs,
  findDanglingCommandRefs,
  flattenSchema,
  checkVisibleBudget,
} from './schema'
