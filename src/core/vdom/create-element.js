/* @flow */

import VNode, { createEmptyVNode } from './vnode'
import config from '../config'
import { createComponent } from './create-component'
import { normalizeChildren, simpleNormalizeChildren } from './helpers/index'
import { warn, resolveAsset, isPrimitive } from '../util/index'

// 对于子节点集合的两种数据规范化处理类型
const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
// 对 _createElement 进行包装，提供一个灵活的接口函数
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any, // 只支持 SIMPLE_NORMALIZE | ALWAYS_NORMALIZE
  alwaysNormalize: boolean
): VNode {
  // 如果 data 是数组或原始类型值，则变换参数，传参兼容处理
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  // 如果 alwaysNormalize 为 true，则 normalizationType 为 ALWAYS_NORMALIZE 类型
  if (alwaysNormalize) normalizationType = ALWAYS_NORMALIZE
  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode {
  if (data && data.__ob__) {
    // 如果有 data.__ob__ 存在，则说明 data 是被 Observer 观察的数据
    // 非生产环境，提示警告，并返回一个空的注释节点
    // 提示：被监控的 data 不能被用作 vnode 渲染的数据
    // 原因是：data 在 vnode 渲染过程中可能会被改变，这样会触发监控，导致不符合预期的操作
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode()
  }
  if (!tag) {
    // in case of component :is set to falsy value
    // 当组件的 is 属性被设置为一个 falsy 值时，Vue 将不会知道要把这个组件渲染成什么，所以渲染一个空节点
    return createEmptyVNode()
  }
  // support single function children as default scoped slot
  // 新特性：Scoped Slots（作用域插槽）
  // 参考：https://github.com/vuejs/vue/releases/tag/v2.1.0
  if (Array.isArray(children) &&
      typeof children[0] === 'function') {
    data = data || {}
    data.scopedSlots = { default: children[0] }
    children.length = 0
  }
  // 根据 normalizationType 的值类型，选择不同的处理子节点集合的方法
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
  let vnode, ns
  // 标签名 tagName 是字符串类型
  if (typeof tag === 'string') {
    let Ctor
    // 获取标签名的命名空间 ns
    // getTagNamespace 方法来自 'src/platforms/web/util/element'
    ns = config.getTagNamespace(tag)
    // 判断是否为保留标签
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      // 如果是保留标签，就创建一个这样的 vnode
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
      // 如果不是保留标签，那么我们将尝试从 vm 的 components 上查找是否有这个标签的定义
    } else if ((Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      // 如果找到了这个标签的定义，就以此创建虚拟组件节点
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      // 兜底方案，正常创建一个 vnode
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
    }
  } else {
    // direct component options / constructor
    // 当 tag 不是字符串的时候，我们认为 tag 是组件的构造类，所以直接创建
    vnode = createComponent(tag, data, context, children)
  }
  // 如果有 vnode，返回 vnode，否则返回一个空节点
  if (vnode) {
    // 如果有 ns，就为节点 vnode 设置 ns 属性
    if (ns) applyNS(vnode, ns)
    return vnode
  } else {
    return createEmptyVNode()
  }
}

// 对于 svg 节点的支持
// 为 svg vnode 节点添加命名空间属性 ns
function applyNS (vnode, ns) {
  vnode.ns = ns
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    // 参考
    // https://www.w3.org/TR/SVG/extend.html#ForeignObjectElement
    // https://developer.mozilla.org/zh-CN/docs/Web/SVG/Element/foreignObject
    return
  }
  if (vnode.children) {
    // 递归遍历其子节点，为子节点添加 ns
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      const child = vnode.children[i]
      if (child.tag && !child.ns) {
        applyNS(child, ns)
      }
    }
  }
}
