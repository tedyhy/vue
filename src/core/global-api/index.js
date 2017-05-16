/* @flow */

import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import builtInComponents from '../components/index' // keep-alive 内置组件

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  // 使用 Object.defineProperty 配置 Vue.config 的 setter 和 getter
  // 所以在设置 Vue.config 的时候是不能直接 Vue.config = {....}，否则会报错，得一项一项设置
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    // 非生产环境下，如果直接 Vue.config = {....}，会警告"不要直接替换 Vue.config 对象，设置单个字段更佳"
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 暴露一些工具方法供内部使用，注意：这些方法不是作为公共 API 暴露，所以尽量避免过度依赖它们
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  // 给实例添加属性，参考 https://vuejs.org/v2/api/#Vue-set
  Vue.set = set
  // 删除对象的属性，参考 https://vuejs.org/v2/api/#Vue-delete
  Vue.delete = del
  /**
   * 在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM。
   * 参考 https://vuejs.org/v2/api/#Vue-nextTick
   */
  Vue.nextTick = nextTick

  // 创建 Vue.options 对象属性，并分别初始化 Vue.options.components|Vue.options.directives|Vue.options.filters 集合
  // 通过 Vue.component|Vue.directive|Vue.filter 注册的回调都分别放在这些集合里
  Vue.options = Object.create(null)
  config._assetTypes.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // 用来给所有实例标记 base 构造函数用的属性，以在 Weex 的多实例场景中扩展所有普通对象组件
  Vue.options._base = Vue

  // 挂载 keep-alive 内置组件
  // 参考 https://vuejs.org/v2/api/#keep-alive
  extend(Vue.options.components, builtInComponents)

  // 挂载 Vue.use 方法
  initUse(Vue)
  // 挂载 Vue.mixin 方法
  initMixin(Vue)
  // 挂载 Vue.extend 方法
  initExtend(Vue)
  // 挂载 Vue.component|Vue.directive|Vue.filter 方法
  initAssetRegisters(Vue)
}
