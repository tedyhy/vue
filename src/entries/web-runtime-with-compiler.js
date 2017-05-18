/* @flow */
// 将整合好的 compiler 和 runtime 再一次整合封装，最终导出浏览器用的 Vue 构造函数

import Vue from './web-runtime'
import config from 'core/config'
import { query } from 'web/util/index'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'
import { shouldDecodeNewlines } from 'web/util/compat'
import { compileToFunctions } from 'web/compiler/index'

// 通过 id 获取 template 内容
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

/**
 * 如果 vm 在实例化时没有设置 el 选项，则它处于“未挂载”状态，没有关联的 DOM 元素。
 * 后续可以使用 vm.$mount() 手动挂载一个未挂载的实例。
 * 参考 https://vuejs.org/v2/api/#vm-mount
 */
const mount = Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 查找 el
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    // 如果非生产环境下，el 是 body 或者 documentElement，则发出警告
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        delimiters: options.delimiters
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 * 获取元素的 outerHTML，兼容 IE 下的 SVG 元素
 * 用于获取模板 html 内容，如：template = getOuterHTML(el)
 */
function getOuterHTML (el: Element): string {
  // 如果 dom 元素支持 outerHTML，则 el.outerHTML
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    // 如果不支持 outerHTML，则创建父节点 div，向其添加子节点 el 的克隆，然后取 div.innerHTML
    const container = document.createElement('div')
    // 深度克隆子节点
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

/**
 * 全局 API - Vue.compile
 * 在 render 函数中编译模板字符串
 * 参考
 * https://vuejs.org/v2/api/#Vue-compile
 * https://vuejs.org/v2/guide/render-function.html
 */
Vue.compile = compileToFunctions

export default Vue
