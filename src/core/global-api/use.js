/* @flow */

import { toArray } from '../util/index'

/**
 * 安装 Vue.js 插件。
 * 初始化 Vue.use 接口，为 Vue 添加静态方法 use。
 * 如果插件是一个对象，必须提供 install 方法。
 * 如果插件是一个函数，它会被作为 install 方法。
 * install 方法的第一个参数是 Vue 构造器，第二个参数是一个可选的选项对象。
 * 参考
 * https://vuejs.org/v2/api/#Vue-use
 * https://vuejs.org/v2/guide/plugins.html
 * https://github.com/vuejs/awesome-vue
 * @param Vue
 */
export function initUse (Vue: GlobalAPI) {
  // 定义 Vue.use 方法
  Vue.use = function (plugin: Function | Object) {
    /* istanbul ignore if */
    // 当前插件已经安装过了
    if (plugin.installed) {
      return
    }
    // additional parameters
    // 除了参数 plugin 的额外参数
    const args = toArray(arguments, 1)
    args.unshift(this)
    // 如果 plugin.install 是函数，则调用之
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      // 如果插件本身是一个函数，则被作为 install 方法调用
      plugin.apply(null, args)
    }
    // 当前插件只会被安装一次
    plugin.installed = true
    return this
  }
}
