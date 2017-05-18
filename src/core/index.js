// Vue 最核心初始化入口
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'

initGlobalAPI(Vue)

// 通过 Object.defineProperty 定义 Vue.prototype.$isServer 属性，此属性的 getter 之后不能修改
// 用于判断当前 Vue 实例是否运行于服务器
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

// 在 rollup 打包时，全局搜索并替换关键字 __VERSION__ 成 Vue 版本号
Vue.version = '__VERSION__'

export default Vue
