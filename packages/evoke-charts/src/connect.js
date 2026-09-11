const connectGroups = /* @__PURE__ */ new Map();
function registerConnector(group, connector) {
  let set = connectGroups.get(group);
  if (!set) {
    set = /* @__PURE__ */ new Set();
    connectGroups.set(group, set);
  }
  set.add(connector);
  return () => {
    set.delete(connector);
    if (set.size === 0) connectGroups.delete(group);
  };
}
function broadcastConnect(group, source, apply) {
  const set = connectGroups.get(group);
  if (!set) return;
  set.forEach((target) => {
    if (target !== source) apply(target);
  });
}
export {
  broadcastConnect,
  registerConnector
};
