import config from '../config'
import { warn } from './debug'
import { inBrowser } from './env'

// 错误处理
export function handleError (err, vm, info) {
  if (config.errorHandler) {
    // 如果指定了组件渲染和观察期间捕获错误的处理函数，那么执行此函数。
    config.errorHandler.call(null, err, vm, info)
  } else {
    // 如果没有指定 errorHandler，且非生产环境下，则抛出错误警告信息
    if (process.env.NODE_ENV !== 'production') {
      warn(`Error in ${info}:`, vm)
    }
    /* istanbul ignore else */
    // 如果是浏览器环境而且有控制台日志输出接口，则直接 console.error(err)，否则抛出错误信息
    if (inBrowser && typeof console !== 'undefined') {
      console.error(err)
    } else {
      throw err
    }
  }
}
