/* @flow */

// Vue 核心
import Vue from 'core/index'
// Vue 全局配置项
import config from 'core/config'
import { patch } from 'web/runtime/patch'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser, isChrome } from 'core/util/index'
import platformDirectives from 'web/runtime/directives/index'
import platformComponents from 'web/runtime/components/index'

import {
  query,
  mustUseProp,
  isReservedTag,
  getTagNamespace,
  isUnknownElement
} from 'web/util/index'

// install platform specific utils
// 关联具体的工具方法
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform runtime directives & components
// 将平台指令和组件扩展到 Vue.options 上
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// install platform patch function
// 浏览器环境下，关联 patch 方法
Vue.prototype.__patch__ = inBrowser ? patch : noop

// public mount method
// 定义组件生命周期方法 $mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  // 挂载组件到 el 上
  return mountComponent(this, el, hydrating)
}

// devtools global hook
// 异步处理 devtools
/* istanbul ignore next */
setTimeout(() => {
  // 非生产环境下启用开发工具 devtools
  if (config.devtools) {
    // 如果启用了 devtools 插件，就初始化之
    if (devtools) {
      devtools.emit('init', Vue)
    } else if (process.env.NODE_ENV !== 'production' && isChrome) {
      // 非生产环境下，如果没有安装或启用 devtools 插件，而且是 Chrome 浏览器，则发出警告
      console[console.info ? 'info' : 'log'](
        'Download the Vue Devtools extension for a better development experience:\n' +
        'https://github.com/vuejs/vue-devtools'
      )
    }
  }
  // 如果非生产环境下，开启了生产环境提示开关，而且是浏览器环境，console 接口存在，则给出 [Vue tip] 提示
  if (process.env.NODE_ENV !== 'production' &&
      config.productionTip !== false &&
      inBrowser && typeof console !== 'undefined') {
    console[console.info ? 'info' : 'log'](
      `You are running Vue in development mode.\n` +
      `Make sure to turn on production mode when deploying for production.\n` +
      `See more tips at https://vuejs.org/guide/deployment.html`
    )
  }
}, 0)

export default Vue
