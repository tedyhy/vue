/* @flow */

export * from './merge-hook'
export * from './update-listeners'
export * from './normalize-children'

/**
 * 获取第一个组件子节点
 * @param children [?Array<VNode>] 子节点集合
 * @returns {Array.<VNode>|T|VNode}
 */
export function getFirstComponentChild (children: ?Array<VNode>): ?VNode {
  // 如果有传参 children，则遍历过滤有 componentOptions 属性的子节点，并返回第一个子节点
  return children && children.filter((c: VNode) => c && c.componentOptions)[0]
}
