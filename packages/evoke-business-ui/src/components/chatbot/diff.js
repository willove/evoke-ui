/**
 * 统一 diff 解析
 *
 * 只认标准 unified 格式（git diff 与各家 agent 输出的都是它）。
 * 不做模糊解析——认不出的行按上下文处理，宁可少染一点色，也不猜错语义。
 */

/**
 * @param {string} text 原始 diff 文本
 * @returns {{ files: Array<{ header: string, path: string, oldPath: string, additions: number, deletions: number, lines: Array }>, additions: number, deletions: number }}
 */
export function parseDiff(text) {
  const raw = String(text ?? "").split("\n");
  const files = [];
  let current = null;
  let oldNo = 0;
  let newNo = 0;

  const push = (line) => {
    if (current) current.lines.push(line);
  };

  const openFile = (header) => {
    current = {
      header,
      path: "",
      oldPath: "",
      additions: 0,
      deletions: 0,
      lines: []
    };
    files.push(current);
  };

  for (const line of raw) {
    if (line.startsWith("diff --git ") || line.startsWith("diff --")) {
      // 新文件从这一行开始；路径稍后从 ---/+++ 里取更准
      openFile(line);
      continue;
    }
    if (!current) {
      // 空行不触发兜底：否则空输入会产出一个空文件条目
      if (!line.trim()) continue;
      // 没有 diff 头的裸 hunk 也接受：整个文本当成一个文件
      openFile("");
    }
    if (line.startsWith("--- ")) {
      current.oldPath = normalizePath(line.slice(4));
      push({ type: "meta", text: line });
      continue;
    }
    if (line.startsWith("+++ ")) {
      current.path = normalizePath(line.slice(4));
      push({ type: "meta", text: line });
      continue;
    }
    if (line.startsWith("@@")) {
      const m = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/.exec(line);
      oldNo = m ? Number(m[1]) : 0;
      newNo = m ? Number(m[2]) : 0;
      push({ type: "hunk", text: line, heading: m ? m[3].trim() : "" });
      continue;
    }
    if (line.startsWith("+")) {
      current.additions += 1;
      push({ type: "add", text: line.slice(1), newNo: newNo++ });
      continue;
    }
    if (line.startsWith("-")) {
      current.deletions += 1;
      push({ type: "del", text: line.slice(1), oldNo: oldNo++ });
      continue;
    }
    if (line.startsWith("\\")) {
      push({ type: "note", text: line });
      continue;
    }
    if (line.startsWith(" ")) {
      push({ type: "context", text: line.slice(1), oldNo: oldNo++, newNo: newNo++ });
      continue;
    }
    // 空行与 git 的 index/mode 等元信息行：原样保留为 meta
    push({ type: "meta", text: line });
  }

  const kept = files.filter((f) => f.lines.length || f.header);
  return {
    files: kept,
    additions: kept.reduce((n, f) => n + f.additions, 0),
    deletions: kept.reduce((n, f) => n + f.deletions, 0)
  };
}

function normalizePath(value) {
  const withoutTab = String(value).split("\t")[0].trim();
  // git 用 /dev/null 表示新增/删除文件
  if (withoutTab === "/dev/null") return "";
  // 去掉 a/ b/ 前缀，保留可读路径
  return withoutTab.replace(/^[ab]\//, "");
}

/** 一行里拼出便于读屏与复制的说明 */
export function describeLine(line) {
  switch (line.type) {
    case "add":
      return `+ ${line.text}`;
    case "del":
      return `- ${line.text}`;
    default:
      return line.text;
  }
}
