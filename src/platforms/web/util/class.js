/* @flow */

import { isObject } from 'shared/util'

// 从 VNode 节点中获取 class 数据
export function genClassForVnode (vnode: VNode): string {
  let data = vnode.data
  let parentNode = vnode
  let childNode = vnode
  while (childNode.componentInstance) {
    childNode = childNode.componentInstance._vnode
    if (childNode.data) {
      data = mergeClassData(childNode.data, data)
    }
  }
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data) {
      data = mergeClassData(data, parentNode.data)
    }
  }
  return genClassFromData(data)
}

// merge 父子节点类数据，生成 class 和 staticClass
function mergeClassData (child: VNodeData, parent: VNodeData): {
  staticClass: string,
  class: any
} {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: child.class
      ? [child.class, parent.class]
      : parent.class
  }
}

// 结合静态类 staticClass 和动态类 dynamicClass
function genClassFromData (data: Object): string {
  // 从 VNode 节点数据 data 中获取 class 和 staticClass 属性
  const dynamicClass = data.class
  const staticClass = data.staticClass
  if (staticClass || dynamicClass) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

// 连接两个字符串
export function concat (a: ?string, b: ?string): string {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

// 将 class 转换成字符串形式
export function stringifyClass (value: any): string {
  let res = ''
  if (!value) {
    return res
  }
  // 如果是字符串，直接返回
  if (typeof value === 'string') {
    return value
  }
  // 如果是数组，迭代遍历之，获取父子节点类
  if (Array.isArray(value)) {
    let stringified
    for (let i = 0, l = value.length; i < l; i++) {
      if (value[i]) {
        if ((stringified = stringifyClass(value[i]))) {
          res += stringified + ' '
        }
      }
    }
    // 清除最后一个空格
    return res.slice(0, -1)
  }
  // 如果是对象，枚举属性，清除最后一个空格
  if (isObject(value)) {
    for (const key in value) {
      if (value[key]) res += key + ' '
    }
    return res.slice(0, -1)
  }
  /* istanbul ignore next */
  return res
}
