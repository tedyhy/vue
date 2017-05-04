/* @flow */
// Vue 事件系统

import { updateListeners } from '../vdom/helpers/index'
import { toArray, tip, hyphenate, formatComponentName } from '../util/index'

/**
 * 初始化当前 vm 实例事件系统
 * @param vm Vue 实例
 */
export function initEvents (vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

let target: Component

function add (event, fn, once) {
  if (once) {
    target.$once(event, fn)
  } else {
    target.$on(event, fn)
  }
}

function remove (event, fn) {
  target.$off(event, fn)
}

export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, vm)
}

// 将事件相关方法混合到 Vue Class 原型上，共4个方法：$on、$once、$off、$emit。
export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/
  /**
   * 添加事件回调
   * @param event 一个或一组事件名称
   * @param fn 事件回调
   * @returns {Component}
   */
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    // 如果传参 event 是数组，则遍历添加事件
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        this.$on(event[i], fn)
      }
    } else {
      // 如果事件 event 的 vm._events 不存在，则创建之，并将新的事件回调入队列
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  /**
   * 添加只执行一次的事件
   * @param event 事件名称
   * @param fn 事件回调
   * @returns {Component}
   */
  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    // 定义一个闭包，封装传参 fn 事件回调，执行此回调前先移除之前添加的事件
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }

  /**
   * 移除之前添加的事件
   * @param event 一个或一组事件名称
   * @param fn【可选】事件回调，不传则清空当前事件回调队列
   * @returns {Component}
   */
  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // all
    // 如果没有传参，则清空此 vm 实例下注册的所有事件及回调
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // array of events
    // 如果是一组事件，则遍历移除事件
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        this.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    // 明确指定事件名称
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    // 如果没有指定 fn 回调，则清空当前事件回调队列
    if (arguments.length === 1) {
      vm._events[event] = null
      return vm
    }
    // specific handler
    // 如果指定了移除某个事件的某个回调，则从队列底开始循环查找此事件回调并移除
    let cb
    let i = cbs.length
    while (i--) {
      cb = cbs[i]
      // cb.fn 是注册了 $once 的事件回调
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1)
        break
      }
    }
    return vm
  }

  /**
   * 触发事件回调执行。可以携带额外参数，如：$emit('camel-case', data)
   * @param event 事件名称
   * @returns {Component}
   */
  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    // 非生产环境下，校验事件名称格式（区分大小写）
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        /**
         * tip 内容如下：
         * 本来应该事件 "camelcase" 在组件 "myVue" 里被触发，但是事件回调被注册在 "camelCase" 事件回调队列里。
         * 注意 HTML 属性是不区分大小写的，所以在 in-DOM templates 环境下不要用 v-on 注册驼峰命名的事件，
         * 可以用连字符替换驼峰方式。所以，这里应该使用 "camel-case" 替换 "camelCase"。
         */
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    let cbs = vm._events[event]
    if (cbs) {
      // toArray(cbs) 将原来队列里的回调调换顺序并生成一个新的数组
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      // 取除了传参 event 外的参数，并将参数传递给每个要执行的回调
      const args = toArray(arguments, 1)
      for (let i = 0, l = cbs.length; i < l; i++) {
        cbs[i].apply(vm, args)
      }
    }
    return vm
  }
}
