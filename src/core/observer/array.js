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
 * 拦截方法并触发相关事件
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
    // 避免内存泄漏
    // 避免引用，重新定义数组用来存储参数
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
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    return result
  })
})
