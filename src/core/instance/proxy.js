/* not type checking this file because flow doesn't play well with Proxy */

import config from 'core/config'
import { warn, makeMap } from '../util/index'

let initProxy

// 非生产环境下使用 Proxy
if (process.env.NODE_ENV !== 'production') {
  // 被允许的 key
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  )

  // 警告 key
  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      `referenced during render. Make sure to declare reactive data ` +
      `properties in the data option.`,
      target
    )
  }

  // 判断当前环境是否有 Proxy 接口
  // 参考 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
  const hasProxy =
    typeof Proxy !== 'undefined' &&
    Proxy.toString().match(/native code/)

  if (hasProxy) {
    // 内置 keys
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta')
    // 设置全局配置 keyCodes，如果设置的 key 是内置的，则会发出警告并设置失败
    config.keyCodes = new Proxy(config.keyCodes, {
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          // 警告避免覆盖内置 key
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {
          // 如果不是内置的 key，就正常赋值
          target[key] = value
          return true
        }
      }
    })
  }

  // hasHandler - 枚举用
  const hasHandler = {
    has (target, key) {
      const has = key in target
      const isAllowed = allowedGlobals(key) || key.charAt(0) === '_'
      if (!has && !isAllowed) {
        // 如果 target 没有此属性，而且不是被允许的 key（或者以 '_' 开头的 key），则发出警告
        warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }

  // getHandler - getter 用
  const getHandler = {
    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        // 如果 key 是字符串而且不是 target 的属性，则发出警告
        warnNonPresent(target, key)
      }
      return target[key]
    }
  }

  // 初始化实例 vm._renderProxy 属性
  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      // 从实例选项 render 上获取 _withStripped 属性，如果存在此属性，则使用 getHandler，否则使用 hasHandler
      const options = vm.$options
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
}

export { initProxy }
