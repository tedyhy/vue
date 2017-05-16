/* @flow */

import { remove } from 'shared/util'
import { createFnInvoker } from './update-listeners'

/**
 * merge VNode 节点钩子集合，其实是为当前钩子关联 fns
 * @param def VNode.data.hook [Object] 当前节点所有钩子
 * @param hookKey 钩子名称
 * @param hook 钩子回调
 */
export function mergeVNodeHook (def: Object, hookKey: string, hook: Function) {
  let invoker
  const oldHook = def[hookKey] // 当前钩子

  function wrappedHook () {
    hook.apply(this, arguments)
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    // 重要：移除合并的钩子，以确保它只被调用一次并防止内存泄漏
    remove(invoker.fns, wrappedHook)
  }

  if (!oldHook) {
    // no existing hook
    // 如果不存在当前钩子，则创建之，并返回调用器
    invoker = createFnInvoker([wrappedHook])
  } else {
    /* istanbul ignore if */
    if (oldHook.fns && oldHook.merged) {
      // already a merged invoker
      // 如果当前钩子存在，而且已经关联 fns，merge 过 once 钩子 wrappedHook，则直接赋值
      invoker = oldHook
      invoker.fns.push(wrappedHook)
    } else {
      // existing plain hook
      // 如果当前钩子存在，但是没有关联 fns，或者还没有 merge 过，
      // 则调用 createFnInvoker 为当前钩子关联 fns，merge once 钩子 wrappedHook。
      invoker = createFnInvoker([oldHook, wrappedHook])
    }
  }

  // 标识此钩子已经 merge 过了
  invoker.merged = true
  def[hookKey] = invoker
}
