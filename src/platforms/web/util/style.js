/* @flow */

import { cached, extend, toObject } from 'shared/util'

// 分析属性 style 文本字符串
export const parseStyleText = cached(function (cssText) {
  const res = {}
  // style 字符串分割正则表达式
  const listDelimiter = /;(?![^(]*\))/g
  // 属性分割正则表达式
  const propertyDelimiter = /:(.+)/
  // 将属性 style 字符串分析生成 sytle 对象并返回
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter)
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim())
    }
  })
  return res
})

// merge static and dynamic style data on the same vnode
// merge 同一个 vnode 的静态和动态 style 数据
function normalizeStyleData (data: VNodeData): ?Object {
  const style = normalizeStyleBinding(data.style)
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle
    ? extend(data.staticStyle, style)
    : style
}

// normalize possible array / string values into Object
// 将数组或字符串 style 转换成对象形式
export function normalizeStyleBinding (bindingStyle: any): ?Object {
  // 如果是数组，则转换成对象
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  // 如果是字符串，则分析 style 字符串生成对象
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
export function getStyle (vnode: VNode, checkChild: boolean): Object {
  const res = {}
  let styleData

  if (checkChild) {
    let childNode = vnode
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode
      if (childNode.data && (styleData = normalizeStyleData(childNode.data))) {
        extend(res, styleData)
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData)
  }

  let parentNode = vnode
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData)
    }
  }
  return res
}

