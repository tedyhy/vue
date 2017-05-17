/* @flow */

import { mergeOptions } from '../util/index'

/**
 * 全局注册一个混合，影响注册之后所有创建的每个 Vue 实例。
 * 插件作者可以使用混合，向组件注入自定义的行为。
 * 不推荐在应用代码中使用。
 * 参考 https://vuejs.org/v2/guide/mixins.html
 * @param Vue
 */
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
  }
}
