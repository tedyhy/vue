/* @flow */

import config from '../config'
import { warn, isPlainObject } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   * 在 Vue 上添加 ['component', 'directive', 'filter'] 静态方法
   * 通过 Vue.component|Vue.directive|Vue.filter 注册或获取全局组件|指令|过滤器
   * 注意：下面 this 实际指向 Vue
   * 参考 https://vuejs.org/v2/guide/custom-directive.html
   */
  config._assetTypes.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      // 如果只有传参 id，则说明是获取操作，则返回 Vue.options 下相关集合中与 id 对应的内容
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        // 如果有传参 definition，则说明是自定义 'component|directive|filter'
        if (process.env.NODE_ENV !== 'production') {
          // 非生产环境下，如果是注册 component，而且 id 使用了保留字，则警告之
          if (type === 'component' && config.isReservedTag(id)) {
            warn(
              'Do not use built-in or reserved HTML elements as component ' +
              'id: ' + id
            )
          }
        }
        // 如果是注册全局组件，而且传参 definition 是普通对象
        if (type === 'component' && isPlainObject(definition)) {
          // 为自定义的全局组件设置 name
          definition.name = definition.name || id
          // 通过 Vue.options._base（Vue）创建新的组件
          definition = this.options._base.extend(definition)
        }
        // 如果是注册全局指令，而且传参 definition 是函数
        // 参考 https://vuejs.org/v2/guide/custom-directive.html
        if (type === 'directive' && typeof definition === 'function') {
          // 如果传参 definition 是函数，说明使用了函数简写，则此函数只放在 bind 和 update 钩子上
          // 且生成新的 definition 对象
          definition = { bind: definition, update: definition }
        }
        // 将 definition 对象存入 Vue.options 下相关集合内
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
