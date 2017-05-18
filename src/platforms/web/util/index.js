/* @flow */

import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 * 通过 id 或元素节点查找元素并返回
 */
export function query (el: string | Element): Element {
  // el 为字符串，如：#id
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      // 如果非生产环境下，没有找到元素，则发出警告，并返回一个新的 div 元素
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      )
      return document.createElement('div')
    }
    return selected
  } else {
    // 如果 el 为元素节点，则直接返回
    return el
  }
}
