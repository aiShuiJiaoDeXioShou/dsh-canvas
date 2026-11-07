/** Menu items shared by the canvas context menu and the layer-row menu. */

export function buildSelectionMenu(store) {
  const selection = store.selectedNodes()
  const primary = store.primaryNode()
  const allLocked = selection.length > 0 && selection.every((node) => node.sourceNode?.locked)
  const allHidden = selection.length > 0 && selection.every((node) => node.sourceNode?.visible === false)
  const hasGroup = selection.some((node) => node.sourceNode?.type === 'group')
  const hasClipboard = (store.clipboard?.length ?? 0) > 0
  const items = [
    { label: '复制', shortcut: '⌘C', icon: 'front', disabled: !selection.length, action: () => store.copySelection() },
    { label: '剪切', shortcut: '⌘X', icon: 'trash', disabled: !selection.length, action: () => { store.copySelection(); store.deleteSelection() } },
    { label: '粘贴', shortcut: '⌘V', icon: 'back', disabled: !hasClipboard, action: () => store.paste() },
    { label: '创建副本', shortcut: '⌘D', icon: 'group', disabled: !selection.length, action: () => store.duplicateSelection() },
    { label: '删除', shortcut: '⌫', icon: 'trash', danger: true, disabled: !selection.length, action: () => store.deleteSelection() },
    { separator: true },
    { label: '插入到对话', icon: 'send', disabled: !selection.length, action: () => store.insertSelectionToComposer() },
    { separator: true },
    { label: '复制渲染图片', shortcut: '⇧⌘C', icon: 'image', action: () => store.copySelectionImage() },
    { label: '导出 PNG', icon: 'download', action: () => store.exportSelection('png') },
    { label: '导出 SVG', icon: 'download', action: () => store.exportSelection('svg') },
    { label: '导出 Drafi 包', icon: 'download', action: () => store.exportPack() },
    { separator: true },
    { label: '编组', shortcut: '⌘G', icon: 'group', disabled: selection.length < 2, action: () => store.groupSelection() },
    { label: '取消编组', shortcut: '⇧⌘G', icon: 'ungroup', disabled: !hasGroup, action: () => store.ungroupSelection() },
    { label: '置顶', shortcut: ']', icon: 'front', disabled: !selection.length, action: () => store.reorder('front') },
    { label: '置底', shortcut: '[', icon: 'back', disabled: !selection.length, action: () => store.reorder('back') },
    { label: '上移一层', icon: 'front', disabled: !selection.length, action: () => store.reorder('forward') },
    { label: '下移一层', icon: 'back', disabled: !selection.length, action: () => store.reorder('backward') },
    { separator: true },
    {
      label: allLocked ? '解锁' : '锁定',
      shortcut: '⇧⌘L',
      icon: allLocked ? 'unlock' : 'lock',
      disabled: !selection.length,
      action: () => selection.forEach((node) => store.setLocked(node.sourceId, !allLocked)),
    },
    {
      label: allHidden ? '显示' : '隐藏',
      shortcut: '⇧⌘H',
      icon: allHidden ? 'eye' : 'eyeOff',
      disabled: !selection.length,
      action: () => selection.forEach((node) => store.setVisibility(node.sourceId, allHidden)),
    },
    { separator: true },
    {
      label: '创建组件',
      shortcut: '⌥⌘K',
      icon: 'component',
      disabled: !primary || !primary.editable || primary.isInstanceRoot,
      action: () => store.createComponentFromSelection(),
    },
    { separator: true },
    { label: '适合选区', shortcut: '2', icon: 'fit', disabled: !selection.length, action: () => store.zoomToSelection() },
    { label: '适合画布', shortcut: '1', icon: 'fit', action: () => store.zoomToFit() },
    { label: '全选', shortcut: '⌘A', disabled: !store.state.scene?.roots?.length, action: () => store.setSelection((store.state.scene?.roots ?? []).map((node) => node.key)) },
    { label: '取消选择', action: () => store.clearSelection() },
  ]
  return items
}
