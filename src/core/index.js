import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'

initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

// 在 rollup 打包时，全局搜索并替换关键字 __VERSION__ 成 Vue 版本号
Vue.version = '__VERSION__'

export default Vue
