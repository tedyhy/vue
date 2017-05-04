import config from '../config'
import { noop } from 'shared/util'

// 定义 warn、tip、formatComponentName 接口
let warn = noop
let tip = noop
let formatComponentName

// 如果非生产环境，那么初始化 warn、tip、formatComponentName 函数
if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined' // 是否有控制台输出接口
  /**
   * 匹配类似这样的组件名称：
   * myvue => myvue
   * my-vue => myVue
   * my_vue => myVue
   * @type {RegExp}
   */
  const classifyRE = /(?:^|[-_])(\w)/g
  const classify = str => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')

  /**
   * 输出警告信息
   * @param msg 警告信息
   * @param vm Vue vm 实例
   */
  warn = (msg, vm) => {
    // 非静默模式下输出 error 信息
    if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg} ` + (
        vm ? formatLocation(formatComponentName(vm)) : ''
      ))
    }
  }

  /**
   * 输出提示信息
   * @param msg 提示信息
   * @param vm Vue vm 实例
   */
  tip = (msg, vm) => {
    // 非静默模式下输出 warn 信息
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg} ` + (
        vm ? formatLocation(formatComponentName(vm)) : ''
      ))
    }
  }

  // 根据 vm 格式化组件名称并返回
  // vm.$root 当前组件树的根 Vue 实例。如果当前实例没有父实例，此实例将会是其自已。参考 https://cn.vuejs.org/v2/api/#vm-root
  formatComponentName = (vm, includeFile) => {
    // 当前 vm 实例是根 Vue 实例
    if (vm.$root === vm) {
      return '<Root>'
    }
    // 如果 vm 是字符串，则默认 vm 为组件名称
    // vm.$options 参考 https://cn.vuejs.org/v2/api/#vm-options
    let name = typeof vm === 'string'
      ? vm
      /**
       * 参考 'test/unit/features/options/name.spec.js'
       * 如果 vm 是函数且有 vm.options 则取 vm.options.name 值，如：
       * const vm = Vue.extend({
       *   name: 'SuperVue'
       * })
       * vm.options.components['SuperVue'] === vm // true
       * vm.options.name === 'SuperVue // true
       */
      : typeof vm === 'function' && vm.options
        ? vm.options.name
        /**
         * 如果是 Vue 实例，取 vm.$options.name || vm.$options._componentTag，否则取 vm 函数名。如：
         * var vm = new Vue({
         *   name: 'SuperVue',
         *   el: '#app',
         *   data: {
         *     showModal: false
         *   }
         * })
         */
        : vm._isVue
          ? vm.$options.name || vm.$options._componentTag
          : vm.name

    const file = vm._isVue && vm.$options.__file
    if (!name && file) {
      // 根据 .vue 文件获取组件名称
      const match = file.match(/([^/\\]+)\.vue$/)
      name = match && match[1]
    }

    // 如果没有组件 name，则默认为 Anonymous 组件
    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }

  /**
   * 最终输出警告信息整合
   * @param str 警告信息及来自哪个组件和文件
   * @returns {string}
   */
  const formatLocation = str => {
    // 如果是匿名组件，则附加提示'使用 vm.options.name 选项可以更好的 debug'
    if (str === `<Anonymous>`) {
      str += ` - use the "name" option for better debugging messages.`
    }
    return `\n(found in ${str})`
  }
}

// debug 工具集，包括了 warn、tip、formatComponentName
export { warn, tip, formatComponentName }
