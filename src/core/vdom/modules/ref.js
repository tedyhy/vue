/* @flow */

import { remove } from 'shared/util'

export default {
  // 创建 ref 引用
  create (_: any, vnode: VNodeWithData) {
    registerRef(vnode)
  },
  // 更新 ref 引用
  update (oldVnode: VNodeWithData, vnode: VNodeWithData) {
    // 如果 oldVnode 和 vnode 节点 ref 引用来自不同引用，则说明 vnode 有更新，
    // 则删除旧的 ref 引用，注册新的 ref 引用
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true)
      registerRef(vnode)
    }
  },
  // 移除 ref 引用
  destroy (vnode: VNodeWithData) {
    registerRef(vnode, true)
  }
}

/**
 * 注册 vnode 上的 ref，如：<p ref="pp"></p>，this.$refs.pp
 * ref 被用来给元素或子组件注册节点引用信息的
 * @param vnode
 * @param isRemoval 是否移除 ref
 */
export function registerRef (vnode: VNodeWithData, isRemoval: ?boolean) {
  const key = vnode.data.ref
  // 如果 vnode 节点不存在 ref，直接返回
  if (!key) return

  const vm = vnode.context // vm 实例
  const ref = vnode.componentInstance || vnode.elm // 组件实例或者真实 DOM 节点
  const refs = vm.$refs // ref 引用集合
  // 移除 ref
  if (isRemoval) {
    // 如果是数组，说明有多个节点设置了同一个 ref
    if (Array.isArray(refs[key])) {
      // 从 ref 引用集合中移除当前 vnode 节点
      remove(refs[key], ref)
    } else if (refs[key] === ref) {
      // 如果 ref 引用集合只有当前节点，说明只有一个节点设置了此 ref，则置为 undefined
      refs[key] = undefined
    }
    // 添加 ref
  } else {
    // 如果有 refInFor，说明有多个节点设置了同一个 ref
    if (vnode.data.refInFor) {
      // 如果是数组，而且数组里 ref 不存在，则将此 ref 入队列
      if (Array.isArray(refs[key]) && refs[key].indexOf(ref) < 0) {
        refs[key].push(ref)
      } else {
        // 创建数组
        refs[key] = [ref]
      }
    } else {
      refs[key] = ref
    }
  }
}
