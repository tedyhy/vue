/* @flow */

import Dep from './dep'
import { arrayMethods } from './array'
import {
  def,
  isObject,
  isPlainObject,
  hasProto,
  hasOwn,
  warn,
  isServerRendering
} from '../util/index'

// 获取对象 arrayMethods 属性名称成数组
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 * 观察者状态
 */
export const observerState = {
  shouldConvert: true,
  isSettingProps: false
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 * 【理解】数据的观察者，让数据对象的读写操作都处于自己的监管之下。
 * 观察者类附加到每个被观察的对象。
 * 一旦附加，此观察者将目标对象的属性键转换为 getter/setters 形式，并收集依赖触发更新。
 */
export class Observer {
  value: any; // 对象或数组，是需要被观察的数据
  dep: Dep; // 订阅通知器
  vmCount: number; // number of vms that has this object as root $data

  constructor (value: any) {
    // 即将被观察的对象
    this.value = value
    // 服务于当前观察者的订阅通知器
    this.dep = new Dep()
    // 实例数目
    this.vmCount = 0
    // 构造器中为 value 添加 __ob__ 属性，作为数据已经被观察的标志，值为当前观察者实例
    def(value, '__ob__', this)
    // value 是数组
    if (Array.isArray(value)) {
      // 判断当前环境是否能使用对象的 __proto__ 属性，
      // 如果有此属性，则使用 protoAugment 方法，否则使用 copyAugment 方法
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      // 调用 observeArray 遍历 value，为数组每个元素调用 observe 分别进行观察
      this.observeArray(value)
    } else {
      // 如果 value 是对象，则调用 defineReactive 为每个属性设置 getter/setters
      this.walk(value)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * 这个方法一定要传参对象，它为对象的每个属性设置 getter/setters
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    // 遍历对象属性
    for (let i = 0; i < keys.length; i++) {
      // 传参为：(对象, 对象的属性, 对象当前属性值)
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }

  /**
   * Observe a list of Array items.
   * 为数组 items 的每个元素调用 observe 分别进行观察
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      // 调用 observe 观察数组 items 的每个元素
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 * 使用 __proto__ 拦截原型链来增强目标对象或数组
 * 将对象 target 原型指向对象 src
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 * 通过 Object.defineProperty 为对象 target 定义属性 key = keys[i]，值为 src[key]
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * 返回被观察对象的属性 __ob__ 的值
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value)) {
    // 如果数据 value 不是对象，则直接返回
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 如果对象 value 有属性 __ob__，而且此属性是 Observer 类实例，则设置 ob
    ob = value.__ob__
  } else if (
    observerState.shouldConvert &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 为当前数据 value 对象添加观察者
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 通过 Object.defineProperty 为对象定义属性，为此属性设置 getter/setters
 */
export function defineReactive (
  obj: Object, // 要设置 getter/setters 的对象
  key: string, // 此对象的属性 key
  val: any, // 此对象属性 key 的值
  customSetter?: Function
) {
  // 生成依赖对象 dep
  const dep = new Dep()

  // 获取当前对象属性 key 的属性描述符，如果当前属性不可用配置，则直接返回
  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 获取当前属性旧的 getter/setters 值
  const getter = property && property.get
  const setter = property && property.set

  // 获取当前数据 val 对象的观察者
  let childOb = observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 如果有旧的 getter，则先执行之，获取新的返回值
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
        if (Array.isArray(value)) {
          dependArray(value)
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      // 非生产环境下，如果有 customSetter，就执行之
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = observe(newVal)
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 * 设置对象属性或数组索引值
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  // 如果 target 是数组，而且 key 是数值，则替换数组 target key 索引处的值为 val
  if (Array.isArray(target) && typeof key === 'number') {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  // 如果对象 target 已经存在 key 属性，则直接替换
  if (hasOwn(target, key)) {
    target[key] = val
    return val
  }
  const ob = (target : any).__ob__
  // 如果对象是实例 vm
  if (target._isVue || (ob && ob.vmCount)) {
    // 非生产环境下发出警告
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果没有 __ob__ 属性，则直接赋值
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 * 删除对象属性或数组索引值
 */
export function del (target: Array<any> | Object, key: any) {
  // 如果 target 是数组，而且 key 是数值，则删除数组 target key 索引处的值为
  if (Array.isArray(target) && typeof key === 'number') {
    target.splice(key, 1)
    return
  }
  const ob = (target : any).__ob__
  // 如果对象是实例 vm
  if (target._isVue || (ob && ob.vmCount)) {
    // 非生产环境下发出警告
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 如果对象 target 没有 key 属性，则直接返回
  if (!hasOwn(target, key)) {
    return
  }
  // 删除对象 target 属性 key
  delete target[key]
  // 如果没有 __ob__ 属性，则直接返回
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  // 遍历数组 value
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
