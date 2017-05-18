/* @flow */

import Dep from '../observer/dep'
import Watcher from '../observer/watcher'

import {
  set,
  del,
  observe,
  observerState,
  defineReactive
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  isReserved,
  handleError,
  validateProp,
  isPlainObject
} from '../util/index'

// 通用属性定义项
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

/**
 * 通过代理设置对象属性的 setter 和 getter。
 * 核心通过 Object.defineProperty 来为 target[sourceKey] 对象设置属性 key。
 * @param target
 * @param sourceKey
 * @param key
 */
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 * 初始化 vm 实例的 state
 * @param vm
 */
export function initState (vm: Component) {
  // 设置 watchers 关联
  vm._watchers = []
  // 获取 vm 实例选项
  const opts = vm.$options
  // 如果有 props，则初始化 props
  if (opts.props) initProps(vm, opts.props)
  // 如果有 methods，则初始化 methods
  if (opts.methods) initMethods(vm, opts.methods)
  // 如果有 data，则初始化 data
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  // 如果有 computed，则初始化 computed
  if (opts.computed) initComputed(vm, opts.computed)
  // 如果有 watch，则初始化 watch
  if (opts.watch) initWatch(vm, opts.watch)
}

// 保留属性
const isReservedProp = { key: 1, ref: 1, slot: 1 }

/**
 * 初始化属性
 * 如：
  Vue.component('child', {
    // 声明 props
    props: ['message'],
    // 就像 data 一样，prop 可以用在模板内
    // 同样也可以在 vm 实例中像 “this.message” 这样使用
    template: '<span>{{ message }}</span>'
  })
 * @param vm
 * @param propsOptions
 */
function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存属性 key
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  observerState.shouldConvert = isRoot
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      if (isReservedProp[key]) {
        warn(
          `"${key}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (vm.$parent && !observerState.isSettingProps) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  observerState.shouldConvert = true
}

/**
 * 初始化数据
 * 参考 https://vuejs.org/v2/api/#Options-Data
 * 如：
  var vm = new Vue({
    data: { a: 1 }
  })
 * @param vm
 */
function initData (vm: Component) {
  // 获取 data 数据信息
  let data = vm.$options.data
  // 如果 data 是函数则执行之，否则取 data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    // 如果最终 data 数据不是普通对象，则非生产环境下发出警告，并赋予 data 为空对象
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  let i = keys.length
  while (i--) {
    // 遍历 data 字段，验证当前字段是否已经存在于 props 里
    if (props && hasOwn(props, keys[i])) {
      // 如果存在于 props 里，则非生产环境下发出警告
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${keys[i]}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(keys[i])) {
      // 如果 key 不是以 $ 或 _ 开头，则使用 Vue 实例代理设置 data。
      // 以 _ 或 $ 开头的属性不会被 Vue 实例代理，因为它们可能和 Vue 内置的属性、API 方法冲突。
      // 可以使用例如 vm.$data._property 的方式访问这些属性。
      proxy(vm, `_data`, keys[i])
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}

// 如果 data 是函数，则通过 getData 调用执行获取 data 数据
// data 函数的作用域为 vm
function getData (data: Function, vm: Component): any {
  // data 函数执行过程中有异常则抛出异常
  try {
    return data.call(vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  }
}

// 定义计算属性 Watcher 对象的 Options
const computedWatcherOptions = { lazy: true }

/**
 * 初始化 computed 计算属性
 * 如：
  new Vue({
    computed: {
      filteredTodos: function () {
        return filters[this.visibility](this.todos)
      },
      remaining: function () {
        return filters.active(this.todos).length
      },
      allDone: {
        get: function () {
          return this.remaining === 0
        },
        set: function (value) {
          this.todos.forEach(function (todo) {
            todo.completed = value
          })
        }
      }
    },
  })
 * @param vm
 * @param computed
 */
function initComputed (vm: Component, computed: Object) {
  // 创建 vm._computedWatchers 对象，即 watcher
  const watchers = vm._computedWatchers = Object.create(null)
  // 遍历计算属性对象
  for (const key in computed) {
    const userDef = computed[key]
    // 获取 userDef 的 getter
    let getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production') {
      // 非生产环境下，userDef 对象如果没有设置 get 属性，会发出警告，并设置为 noop 函数
      if (getter === undefined) {
        warn(
          `No getter function has been defined for computed property "${key}".`,
          vm
        )
        getter = noop
      }
    }
    // create internal watcher for the computed property.
    // 为计算属性 key 创建一个内部 watcher（观察者）
    watchers[key] = new Watcher(vm, getter, noop, computedWatcherOptions)

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    // 组件定义的计算属性已经在组件原型上定义，同样我们也需要定义实例的计算属性。
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    }
  }
}

/**
 * 定义组件选项中的 computed 属性
 * @param target Comp.prototype
 * @param key key in computed
 * @param userDef computed[key]
 */
export function defineComputed (target: any, key: string, userDef: Object | Function) {
  // 计算属性 key 是函数
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = createComputedGetter(key)
    sharedPropertyDefinition.set = noop
    // 计算属性 key 是对象
  } else {
    // 如果设置了计算属性的 getter，则判断是否设置了 cache，
    // 如果开启了 cache 缓存，则从 watcher 里取值。
    sharedPropertyDefinition.get = userDef.get
      ? userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop
    // 设置计算属性的 setter
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set
      : noop
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

/**
 * 创建计算属性的 getter
 * @param key 计算属性
 * @returns {computedGetter}
 */
function createComputedGetter (key) {
  return function computedGetter () {
    // 根据计算属性 key 获取实例 vm._computedWatchers[key]，即计算属性 key 的 watcher 对象
    const watcher = this._computedWatchers && this._computedWatchers[key]
    // 如果有 watcher 对象，则返回计算属性 key 的值
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

/**
 * 初始化 methods 方法
 *  如：
  new Vue({
    methods: {
      filteredTodos: function () {
        // ...
      },
      remaining: function () {
        // ...
      },
    },
  })
 * @param vm
 * @param methods
 */
function initMethods (vm: Component, methods: Object) {
  // 获取属性对象
  const props = vm.$options.props
  // 遍历 methods 对象
  for (const key in methods) {
    // 如果当前方法为空，则指定为 noop，否则将当前方法与 vm 实例绑定起来
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm)
    if (process.env.NODE_ENV !== 'production') {
      // 非生产环境下，如果方法为空，发出警告
      if (methods[key] == null) {
        warn(
          `method "${key}" has an undefined value in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      if (props && hasOwn(props, key)) {
        // 非生产环境下，如果发现当前方法已经存在于 vm.$options.props，则发出警告
        warn(
          `method "${key}" has already been defined as a prop.`,
          vm
        )
      }
    }
  }
}

/**
 * 初始化 watch
 * 一个更通用的方法通过 watch 选项，来响应数据的变化。
 * 当你想要在数据变化响应时，执行异步操作或开销较大的操作，这是很有用的。
 * 参考 https://vuejs.org/v2/api/#watch
 * 如：
  var vm = new Vue({
    data: {
      a: 1,
      b: 2,
      c: 3
    },
    watch: {
      a: function (val, oldVal) {
        console.log('new: %s, old: %s', val, oldVal)
      },
      // 方法名
      b: 'someMethod',
      // 深度 watcher
      c: {
        handler: function (val, oldVal) { ... },
        deep: true
      }
    }
  })
 * @param vm
 * @param watch
 */
function initWatch (vm: Component, watch: Object) {
  // 遍历 watch 对象
  for (const key in watch) {
    const handler = watch[key]
    // 如果当前 watch 是一个数组，则遍历之，分别创建 watcher。否则直接创建 watcher。
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

/**
 * 创建 watcher
 * @param vm
 * @param key
 * @param handler
 */
function createWatcher (vm: Component, key: string, handler: any) {
  let options
  // 如果当前 watch 是普通对象，则 watch 为 handler.handler
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  // 如果当前 watch 是字符串，则 watch 为实例方法 vm[handler]
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  /**
   * vm.$watch
   * 观察 Vue 实例变化的一个表达式或计算属性函数。
   * 回调函数得到的参数为新值和旧值。
   * 参考 https://vuejs.org/v2/api/#vm-watch
   */
  vm.$watch(key, handler, options)
}

export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function (newData: Object) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: Function,
    options?: Object
  ): Function {
    const vm: Component = this
    options = options || {}
    options.user = true
    const watcher = new Watcher(vm, expOrFn, cb, options)
    if (options.immediate) {
      cb.call(vm, watcher.value)
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
