/* @flow */
/* globals MutationObserver */
// 跟环境相关

import { noop } from 'shared/util'

// can we use __proto__?
// 判断当前环境是否能使用对象的 __proto__ 属性
export const hasProto = '__proto__' in {}

// Browser environment sniffing
// 浏览器环境嗅探
export const inBrowser = typeof window !== 'undefined' // 是否是浏览器环境
export const UA = inBrowser && window.navigator.userAgent.toLowerCase() // UA
export const isIE = UA && /msie|trident/.test(UA) // 是否是 IE
export const isIE9 = UA && UA.indexOf('msie 9.0') > 0 // 是否是 IE9
export const isEdge = UA && UA.indexOf('edge/') > 0 // 是否是 Edge
export const isAndroid = UA && UA.indexOf('android') > 0 // 是否是 Android
export const isIOS = UA && /iphone|ipad|ipod|ios/.test(UA) // 是否是 IOS
export const isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge // 是否是 Chrome

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
// 判断当前环境是否是 server 端，主要通过 process.env.VUE_ENV === 'server' 来判断的
// VUE_ENV 环境变量是在 vue-server-renderer 包里手动设置的：process.env.VUE_ENV = 'server'
let _isServer
export const isServerRendering = () => {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      // 检测到 vue-server-renderer 的存在，并避免 Webpack 调整该 process
      _isServer = global['process'].env.VUE_ENV === 'server'
    } else {
      _isServer = false
    }
  }
  return _isServer
}

// detect devtools
// 检测浏览器是否安装了 Vue devtools 开发工具插件，如果安装了插件而且启用此插件，
// 那么全局 window.__VUE_DEVTOOLS_GLOBAL_HOOK__ 就会存在
export const devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__

/* istanbul ignore next */
// 判断函数是否是 native code（浏览器接口）
// 如：Array.toString() => "function Array() { [native code] }"
export function isNative (Ctor: Function): boolean {
  return /native code/.test(Ctor.toString())
}

// 判断是否有 Symbol 和 Reflect
export const hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys)

/**
 * Defer a task to execute it asynchronously.
 * 延迟任务以异步执行
 */
export const nextTick = (function () {
  const callbacks = []
  let pending = false
  let timerFunc

  function nextTickHandler () {
    pending = false
    const copies = callbacks.slice(0)
    callbacks.length = 0
    for (let i = 0; i < copies.length; i++) {
      copies[i]()
    }
  }

  // the nextTick behavior leverages the microtask queue, which can be accessed
  // via either native Promise.then or MutationObserver.
  // MutationObserver has wider support, however it is seriously bugged in
  // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
  // completely stops working after triggering a few times... so, if native
  // Promise is available, we will use it:
  // 参考 https://vuejs.org/v2/api/#Vue-nextTick
  // 一个打包执行延迟任务的方法，采用 Promise => MutationObserver => setTimeout(0) 的降级设计。
  // 1. 在使用 Promise 的时候，ios 里（其实就是 safari 和 uiwebview）如果直接用 Promise.resolve() 触发一个 then 的话，
  // 它不会立即执行，然而运行一个空的 setTimeout 之后，就没问题了。
  // 2. MutationObserver 是通过观测 dom 元素的变化来触发事件回调。
  // 3. 还有一个细节，在执行一批回调的时候，用的是 [].length = 0 来清空数组，而不是空数组赋值的方法，感觉是为了省内存，不用频繁 gc。
  //
  // nextTick 的延迟任务队列，可以通过 native Promise.then 或 MutationObserver 实现。
  // MutationObserver 具有更广泛的支持，但是当触摸事件句柄触发时，iOS> = 9.3.3 中的 UIWebView 会有严重 bug（触发几次后，它完全停止工作）
  // 因此，如果 native Promise 可用，那么我们优先使用它。
  /* istanbul ignore if */
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve()
    var logError = err => { console.error(err) }
    timerFunc = () => {
      p.then(nextTickHandler).catch(logError)
      // in problematic UIWebViews, Promise.then doesn't completely break, but
      // it can get stuck in a weird state where callbacks are pushed into the
      // microtask queue but the queue isn't being flushed, until the browser
      // needs to do some other work, e.g. handle a timer. Therefore we can
      // "force" the microtask queue to be flushed by adding an empty timer.
      // 在有问题的 UIWebViews 中，Promise.then 不会完全中断，
      // 但是它可能会陷入一个奇怪的状态，即：回调被推入延迟任务队列，但队列没有被刷新，直到浏览器需要做一些其他工作，
      // 例如：处理一个计时器。因此，我们可以通过添加一个空的定时器来“强制”微任务队列被刷新。
      if (isIOS) setTimeout(noop)
    }
  } else if (typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // use MutationObserver where native Promise is not available,
    // e.g. PhantomJS IE11, iOS7, Android 4.4
    var counter = 1
    var observer = new MutationObserver(nextTickHandler)
    var textNode = document.createTextNode(String(counter))
    observer.observe(textNode, {
      characterData: true
    })
    timerFunc = () => {
      counter = (counter + 1) % 2
      textNode.data = String(counter)
    }
  } else {
    // fallback to setTimeout
    /* istanbul ignore next */
    timerFunc = () => {
      setTimeout(nextTickHandler, 0)
    }
  }

  return function queueNextTick (cb?: Function, ctx?: Object) {
    let _resolve
    callbacks.push(() => {
      if (cb) cb.call(ctx)
      if (_resolve) _resolve(ctx)
    })
    if (!pending) {
      pending = true
      timerFunc()
    }
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise(resolve => {
        _resolve = resolve
      })
    }
  }
})()

// Set 集合
let _Set
/* istanbul ignore if */
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  // 一个非标准 Set（集合）polyfill 实现，仅仅使用原始简单值（string|number）作为 keys
  _Set = class Set {
    set: Object;
    constructor () {
      this.set = Object.create(null)
    }
    has (key: string | number) {
      return this.set[key] === true
    }
    add (key: string | number) {
      this.set[key] = true
    }
    clear () {
      this.set = Object.create(null)
    }
  }
}

export { _Set }
