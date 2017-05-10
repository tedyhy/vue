import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// 创建 Vue 构造函数，使用方式如：new Vue({...})、Vue.extend({...}) 等
function Vue (options) {
  // 非生产环境下检测到 this 实例不属于 Vue，则抛出错误：'Vue 是一个构造器，应该使用 new 关键字调用'。
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 根据传参 options 进行初始化。_init 是内部方法来自 'core/instance/init' 的 initMixin。
  this._init(options)
}

// 初始化入口，各种初始化工作（添加一些属性或方法）
initMixin(Vue)
// 数据绑定的核心方法，包括常用的 $watch 方法
stateMixin(Vue)
// 事件的核心方法，包括常用的 $on，$off，$emit 等方法
eventsMixin(Vue)
// 生命周期的核心方法
lifecycleMixin(Vue)
// 渲染的核心方法，用来生成 render 函数以及 VNode
renderMixin(Vue)

export default Vue
