/* @flow */

/**
 * Convert a value to a string that is actually rendered.
 * 将值转换成字符串，val 可以是任何值类型
 */
export function _toString (val: any): string {
  return val == null // val：undefined|null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 * 坚持将值转换成数值，一旦失败，返回原始值。val 为字符串。
 */
export function toNumber (val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 * @param {string} str key 值
 * @param {?boolean} expectsLowerCase key 值是否转换成小写【参数可选】
 * @return {func} 返回一个函数，此函数返回值为 true | undefined。
 * 
 * 创建一个 map，然后返回一个函数用来检查一个 key 是否在此 map 里。
 */
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  // 创建一个 map 空对象
  const map = Object.create(null)
  // 用','分隔传参 str 成一个字符串数组，并遍历数组，生成 key 值 map 映射
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase
    ? val => map[val.toLowerCase()]
    : val => map[val]
}

/**
 * Check if a tag is a built-in tag.
 * 调用 makeMap 生成一个函数，用来检查一个 tag 是否是内置 tag
 */
export const isBuiltInTag = makeMap('slot,component', true)

/**
 * Remove an item from an array
 * 从数组中移除 item。item 可以是任意值类型。
 */
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 * 检查对象 obj 是否有属性 key。
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}

/**
 * Check if value is primitive
 * 检测 value 是否是简单类型值（string,number）
 */
export function isPrimitive (value: any): boolean {
  return typeof value === 'string' || typeof value === 'number'
}

/**
 * Create a cached version of a pure function.
 * 使用 flow 泛型，限制传参为函数，创建一个纯函数缓存器
 */
export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}

/**
 * Camelize a hyphen-delimited string.
 * 将连字符字符串驼峰化
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

/**
 * Capitalize a string.
 * 将字符串首字母大写
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Hyphenate a camelCase string.
 * 将驼峰转换成连字符格式，如：camelCase => camel-Case
 * 之所以执行两次 replace，是为了避免两个大写字母在一起的情况，如：camelCAse => camel-CAse
 */
const hyphenateRE = /([^-])([A-Z])/g
export const hyphenate = cached((str: string): string => {
  return str
    .replace(hyphenateRE, '$1-$2')
    .replace(hyphenateRE, '$1-$2')
    .toLowerCase()
})

/**
 * Simple bind, faster than native
 * 简单的 bind 作用域，速度比原生 bind 快
 */
export function bind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l: number = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
  // record original fn length
  // 记录原始函数 fn 的参数个数
  boundFn._length = fn.length
  return boundFn
}

/**
 * Convert an Array-like object to a real Array.
 * 转换一个类数组对象成真实的数组
 * @param start【可选】从第几个开始转换
 */
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * Mix properties into target object.
 * 混合属性到目标对象
 */
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 判断是不是对象（可以是 Array 等），而不是 null
 */
export function isObject (obj: mixed): boolean {
  return obj !== null && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 * 严格校验是不是普通对象，而不是 Array 等
 */
const toString = Object.prototype.toString
const OBJECT_STRING = '[object Object]'
export function isPlainObject (obj: any): boolean {
  return toString.call(obj) === OBJECT_STRING
}

/**
 * Merge an Array of Objects into a single Object.
 * 将数组中的对象 merge 到一个对象中
 */
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/**
 * Perform no operation.
 * 空函数
 */
export function noop () {}

/**
 * Always return false.
 * 此函数总是返回 false
 */
export const no = () => false

/**
 * Return same value
 * 接收任何类型值，并返回原值
 */
export const identity = (_: any) => _

/**
 * Generate a static keys string from compiler modules.
 * @modules 一个数组，每项值都是 ModuleOptions 类型对象
 */
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  // 遍历数组 modules，获取每个对象的 staticKeys 值，并存储到 keys 里
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 * loose 模式下校验两个值是否相等，不考虑引用类型，只看它俩是否有 same shape。
 */
export function looseEqual (a: mixed, b: mixed): boolean {
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch (e) {
      // possible circular reference
      // 可能存在循环引用
      return a === b
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

// loose 模式下查找某值索引
export function looseIndexOf (arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

/**
 * Ensure a function is called only once.
 * 确保函数只调用一次
 */
export function once (fn: Function): Function {
  let called = false
  return () => {
    if (!called) {
      called = true
      fn()
    }
  }
}
