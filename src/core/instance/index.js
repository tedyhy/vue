import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// 创建 Vue 构造函数
function Vue (options) {
  // 非生产环境下检测到 this 实例不属于 Vue，则抛出错误：'Vue 是一个构造器，应该使用 new 关键字调用'
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options) // 根据传参 options 进行初始化。_init 内部方法来自 'core/instance/init'。
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
