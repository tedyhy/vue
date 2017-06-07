/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 * 【理解】订阅通知器。Observer 与 Watcher 的纽带。
 * Watcher 通过 Dep 订阅 Observer 观察。
 * 当数据变化时，会被 Observer 观察到，然后由 Dep 通知到 Watcher。
 */
export default class Dep {
  static target: ?Watcher; // Dep 类的静态属性 target
  id: number; // 当前 Dep 实例的唯一标识
  subs: Array<Watcher>; // Watcher 为订阅者

  constructor () {
    this.id = uid++
    this.subs = []
  }

  // 添加子订阅 sub 到 subs 订阅集合中
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  // 从 subs 订阅集合中移除子订阅 sub
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      // 为当前 Watcher 添加依赖对象
      Dep.target.addDep(this)
    }
  }

  // 通知到每个 sub 订阅
  notify () {
    // stabilize the subscriber list first
    // 拷贝一份 subs 订阅集合，避免引用
    const subs = this.subs.slice()
    // 遍历执行所有子订阅 sub 更新
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
// 当前正在使用的 Watcher，同一时刻只能有一个 Watcher 在使用。
Dep.target = null
const targetStack = []

// 替换新的 Dep.target，老的 target 入栈 targetStack
export function pushTarget (_target: Watcher) {
  if (Dep.target) targetStack.push(Dep.target)
  Dep.target = _target
}

// 将 targetStack 栈顶的 target 替换老的 Dep.target
export function popTarget () {
  Dep.target = targetStack.pop()
}
