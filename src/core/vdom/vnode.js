/* @flow */

// 定义 VNode 类，它是 Vue 框架的虚拟 dom 的基类
export default class VNode {
  // 声明类静态属性
  tag: string | void; // 当前节点 tagName
  data: VNodeData | void; // 当前 VNode 节点 VNodeData 数据
  children: ?Array<VNode>; // 当前节点子节点
  text: string | void; // 文本内容，一般文本节点或注释节点会有该属性
  elm: Node | void; // 当前虚拟节点对应的真实 DOM 节点
  ns: string | void; // 当前节点的命名空间（namespace）
  context: Component | void; // rendered in this component's scope  编译作用域
  functionalContext: Component | void; // only for functional component root nodes  函数化组件的作用域
  key: string | number | void; // VNode 节点 key，用于作为节点的标识，有利于 patch 的优化
  componentOptions: VNodeComponentOptions | void; // 创建组件实例时会用到的选项信息
  componentInstance: Component | void; // component instance  当前节点对应的组件实例
  parent: VNode | void; // component placeholder node   组件的占位节点
  raw: boolean; // contains raw HTML? (server only)   是否包含 raw HTML
  isStatic: boolean; // hoisted static node   是否是静态节点
  isRootInsert: boolean; // necessary for enter transition check  是否作为根节点插入，被 <transition> 包裹的节点
  isComment: boolean; // empty comment placeholder?   是否是注释占位节点
  isCloned: boolean; // is a cloned node?   是否是 clone 节点
  isOnce: boolean; // is a v-once node?   当前节点是否有 v-once 指令

  // 构造器初始化实例属性
  constructor (
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions
  ) {
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.functionalContext = undefined
    this.key = data && data.key
    this.componentOptions = componentOptions
    this.componentInstance = undefined
    this.parent = undefined
    this.raw = false
    this.isStatic = false
    this.isRootInsert = true
    this.isComment = false
    this.isCloned = false
    this.isOnce = false
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  // 【弃用】：componentInstance 的别名，向后兼容
  /* istanbul ignore next */
  get child (): Component | void {
    return this.componentInstance
  }
}

// 创建注释 VNode 节点
export const createEmptyVNode = () => {
  const node = new VNode()
  node.text = '' // 文本为空
  node.isComment = true // 标识为注释节点
  return node
}

/**
 * 创建文本节点 vnode
 * @param val [string | number] 原始类型值
 * @returns {VNode}
 */
export function createTextVNode (val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
/**
 * 避免 DOM 操作时因为引用类型导致出错。
 * clone VNode 节点可以是下面任意类型节点，唯一的区别在于 isCloned 属性为 true。
 * 1）EmptyVNode: 没有内容的注释节点
 * 2）TextVNode: 文本节点
 * 3）ElementVNode: 普通元素节点
 * 4）ComponentVNode: 组件节点
 * @param vnode
 * @returns {VNode}
 */
export function cloneVNode (vnode: VNode): VNode {
  // 根据源 VNode 节点 clone 新的 VNode 节点
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions
  )
  cloned.ns = vnode.ns
  cloned.isStatic = vnode.isStatic
  cloned.key = vnode.key
  cloned.isCloned = true // 用于区分是否是 clone VNode
  return cloned
}

//
/**
 * 批量 clone VNode 节点
 * @param vnodes [Array<VNode>] VNode 节点数组集合
 * @returns {Array|any[]}
 */
export function cloneVNodes (vnodes: Array<VNode>): Array<VNode> {
  const len = vnodes.length
  const res = new Array(len) // 初始化数组容器（大小固定），优化性能
  // 遍历 clone VNode 节点
  for (let i = 0; i < len; i++) {
    res[i] = cloneVNode(vnodes[i])
  }
  return res
}
