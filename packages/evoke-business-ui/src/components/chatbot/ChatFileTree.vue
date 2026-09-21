<template>
  <div v-if="tree.length" class="eb-chat-file-tree" role="group" :aria-label="labels.fileTree.group">
    <ul class="eb-chat-file-tree__list">
      <ChatFileTreeNode
        v-for="node in tree"
        :key="node.path"
        :node="node"
        :depth="0"
        :expanded="expanded"
        @toggle="toggleDir"
        @select="(f, p) => emit('select', f, p)"
      />
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import ChatFileTreeNode from "./ChatFileTreeNode.vue";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** [{ path, status?, additions?, deletions? }]；status 取 added/modified/deleted/renamed */
  files: { type: Array, required: false, default: () => [] },
  /** 初始是否展开全部目录 */
  defaultExpandAll: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["select", "toggle"]);

/** 扁平路径 → 嵌套树。同层按目录在前、名称升序排列，保证渲染稳定 */
function buildTree(files) {
  const root = { children: new Map() };
  for (const file of files) {
    const raw = String(file?.path || "").replace(/^\.?\//, "");
    if (!raw) continue;
    const parts = raw.split("/").filter(Boolean);
    let cursor = root;
    parts.forEach((part, i) => {
      const isLeaf = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");
      if (!cursor.children.has(part)) {
        cursor.children.set(part, {
          name: part,
          path,
          isDir: !isLeaf,
          children: new Map(),
          file: isLeaf ? file : null
        });
      }
      cursor = cursor.children.get(part);
      if (isLeaf) cursor.file = file;
    });
  }
  const finalize = (node) => {
    const kids = [...node.children.values()].map(finalize);
    kids.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
    return { ...node, children: kids };
  };
  return finalize(root).children;
}

const tree = computed(() => buildTree(props.files));
const expanded = ref(new Set());
// 默认全展开：目录集合在首帧就要就位，之后再变会闪一下
if (props.defaultExpandAll) {
  const collect = (nodes) => {
    for (const n of nodes) {
      if (n.isDir) {
        expanded.value.add(n.path);
        collect(n.children);
      }
    }
  };
  collect(tree.value);
}

function toggleDir(path, isOpen) {
  const next = new Set(expanded.value);
  if (isOpen) next.add(path);
  else next.delete(path);
  expanded.value = next;
  emit("toggle", path, isOpen);
}

</script>

<style scoped>

.eb-chat-file-tree {
  margin-top: var(--eb-space-2);
  padding: var(--eb-space-2) var(--eb-space-2) var(--eb-space-2) 0;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-light);
}

.eb-chat-file-tree__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
