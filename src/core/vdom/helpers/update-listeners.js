/* @flow */

import { cached } from 'shared/util'
import { warn } from 'core/util/index'

/**
 * 通过 cached 生成一个自带缓存机制的函数，此函数接收一个参数。
 * 此函数主要用途就是通过事件 name 来判断事件类型：once 或 capture。
 * @param name [string] 事件名称
 * @returns {name: string,once: boolean,capture: boolean} 返回一个对象
 */
const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean
} => {
  // 通过首字母判断是否是 once 或 capture
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture
  }
})

/**
 * 创建回调调用器
 * @param fns [Function | Array<Function>] 回调集合
 * @returns {invoker} [Function] 返回的调用器
 */
export function createFnInvoker (fns: Function | Array<Function>): Function {
  function invoker () {
    // 获取当前调用器关联的 fns
    const fns = invoker.fns
    // 如果 fns 是数组，则遍历调用之
    if (Array.isArray(fns)) {
      for (let i = 0; i < fns.length; i++) {
        fns[i].apply(null, arguments)
      }
    } else {
      // return handler return value for single handlers
      // 如果 fns 是一个函数，则直接调用之
      return fns.apply(null, arguments)
    }
  }
  // 将 fns 与 invoker 做关联
  invoker.fns = fns
  return invoker
}

/**
 * 更新监听器
 * @param on
 * @param oldOn
 * @param add
 * @param remove
 * @param vm
 */
export function updateListeners (
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  vm: Component
) {
  let name, cur, old, event
  // 遍历新的监听器集合
  for (name in on) {
    cur = on[name] // 当前监听器
    old = oldOn[name] // 旧的监听器
    event = normalizeEvent(name) // 调用 normalizeEvent 规范化一个监听器
    if (!cur) {
      // 如果监听器 cur 为空，则抛出错误
      process.env.NODE_ENV !== 'production' && warn(
        `Invalid handler for event "${event.name}": got ` + String(cur),
        vm
      )
    } else if (!old) {
      // 如果没有旧的监听器 old，则创建之
      if (!cur.fns) {
        cur = on[name] = createFnInvoker(cur)
      }
      // 执行 add
      add(event.name, cur, event.once, event.capture)
    } else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }
  }
  // 遍历旧的监听器集合，如果当前监听器不在新的集合里，直接移除
  for (name in oldOn) {
    if (!on[name]) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
