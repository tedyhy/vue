/* @flow */
/**
 * 1.
 * 指令（Directives）是带有 v- 前缀的特殊属性。
 * 指令属性的值预期是单一 JavaScript 表达式（除了 v-for，之后再讨论）。
 * 指令的职责就是当其表达式的值改变时相应地将某些行为应用到 DOM 上。
 * 如：
 * <p v-if="seen">Now you see me</p>
 * <a v-bind:href="url"></a>
 * <a v-on:click="doSomething">
 *
 * 2.
 * 修饰符（Modifiers）是以半角句号 . 指明的特殊后缀，用于指出一个指令应该以特殊方式绑定。
 * 例如，.prevent 修饰符告诉 v-on 指令对于触发的事件调用 event.preventDefault()。
 * 如：<form v-on:submit.prevent="onSubmit"></form>
 */

import { emptyNode } from 'core/vdom/patch'
import { resolveAsset } from 'core/util/options'
import { mergeVNodeHook } from 'core/vdom/helpers/index'

export default {
  create: updateDirectives, // create 钩子
  update: updateDirectives, // update 钩子
  // destroy 钩子
  destroy: function unbindDirectives (vnode: VNodeWithData) {
    updateDirectives(vnode, emptyNode)
  }
}

/**
 * 更新指令集
 * @param oldVnode 旧的节点
 * @param vnode 新的节点
 */
function updateDirectives (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  // 新旧节点上注册的指令集是相同的，一旦注册不可更改。如果旧的节点上没有注册指令集，则新的节点可以注册指令集。
  // 所以优先判断旧节点上是否有注册，如果没有，则看看新节点上是否有注册。
  // 只要当前节点注册了指令集，就去更新指令集。
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode)
  }
}

// 真正更新指令集操作的内部使用函数
function _update (oldVnode, vnode) {
  // 通过 oldVnode|vnode 节点是否为空来判断是否 create|destroy 指令
  const isCreate = oldVnode === emptyNode
  const isDestroy = vnode === emptyNode
  // 旧节点的指令集
  const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context)
  // 新节点的指令集
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context)

  const dirsWithInsert = []
  const dirsWithPostpatch = []

  let key, oldDir, dir
  // 遍历新节点的指令集
  for (key in newDirs) {
    oldDir = oldDirs[key]
    dir = newDirs[key]
    // 如果旧节点没有此指令
    if (!oldDir) {
      // new directive, bind
      // 说明当前指令是新指令，则触发 bind 钩子回调
      callHook(dir, 'bind', vnode, oldVnode)
      // 如果当前指令里有 inserted 钩子，则收集此指令到 dirsWithInsert。
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir)
      }
    } else {
      // existing directive, update
      // 如果旧的指令集中存在此指令，则触发 update 钩子更新当前指令
      dir.oldValue = oldDir.value
      callHook(dir, 'update', vnode, oldVnode)
      // 如果当前指令里有 componentUpdated 钩子，则收集此指令到 dirsWithPostpatch。
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir)
      }
    }
  }

  // 如果 dirsWithInsert 里有值
  if (dirsWithInsert.length) {
    // 调用 dirsWithInsert 里所有 inserted 钩子回调
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
      }
    }
    if (isCreate) {
      mergeVNodeHook(vnode.data.hook || (vnode.data.hook = {}), 'insert', callInsert)
    } else {
      callInsert()
    }
  }

  // 如果 dirsWithPostpatch 里有值
  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode.data.hook || (vnode.data.hook = {}), 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
      }
    })
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy)
      }
    }
  }
}

// 空对象
const emptyModifiers = Object.create(null)

/**
 * 规范化指令集合
 * @param dirs [?Array<VNodeDirective>] 指令集
 * @param vm [Component] 组件实例
 * @returns {any} 即：?Array<VNodeDirective> => { [key: string]: VNodeDirective }
 */
function normalizeDirectives (
  dirs: ?Array<VNodeDirective>,
  vm: Component
): { [key: string]: VNodeDirective } {
  // 创建空对象
  const res = Object.create(null)
  // 如果没有指令集，则返回空对象
  if (!dirs) {
    return res
  }
  let i, dir
  // 遍历指令集
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i]
    // 如果当前指令没有修饰符，则将添加修饰符属性并初始化为空对象
    if (!dir.modifiers) {
      dir.modifiers = emptyModifiers
    }
    res[getRawDirName(dir)] = dir
    // 为当前指令指定钩子
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true)
  }
  return res
}

// 获取当前指令原来名称
function getRawDirName (dir: VNodeDirective): string {
  // 如果有原名称则返回原名称，否则返回格式如：'click.stop.prevent'
  return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`
}

/**
 * 调用钩子回调
 * @param dir 指令节点
 * @param hook 钩子名称，如：create、update
 * @param vnode vnode 节点
 * @param oldVnode 旧的 vnode 节点
 * @param isDestroy
 */
function callHook (dir, hook, vnode, oldVnode, isDestroy) {
  // dir.def 当前指令的钩子
  const fn = dir.def && dir.def[hook]
  // 如果有钩子函数，则执行
  if (fn) {
    fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
  }
}
