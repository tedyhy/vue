/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

// Array 原型
const arrayProto = Array.prototype
// 定义继承 Array.prototype 对象的对象
export const arrayMethods = Object.create(arrayProto)

/**
 * Intercept mutating methods and emit events
 * 拦截数组原型方法，主要用于在数组长度发生变化时触发相关监听事件
 */
;[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  // cache original method
  // 缓存原始方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator () {
    // avoid leaking arguments:
    // http://jsperf.com/closure-with-arguments
    // 避免 arguments 内存泄漏
    // 避免 arguments 引用，重新定义数组用来 copy 存储每个参数，这种方式效率更高
    let i = arguments.length
    const args = new Array(i)
    while (i--) {
      args[i] = arguments[i]
    }
    // 执行原始方法，保存其结果
    const result = original.apply(this, args)
    // 取对象 arrayMethods 属性 __ob__
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
        inserted = args
        break
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 如果是 push|unshift|splice 方法，说明数组长度发生改变，
    // 为新添加的数组元素 inserted 添加 observer 观察
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 通知相关监听器
    ob.dep.notify()
    return result
  })
})
