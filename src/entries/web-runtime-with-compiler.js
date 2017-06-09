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
 * 模板有三种引用写法：el, template, render(JSX)。其中的优先级是 render > template > el。
 * 参考
 * https://vuejs.org/v2/api/#vm-mount
 * https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram
 */
const mount = Vue.prototype.$mount // 保留之前的方法为 mount，然后重新定义 Vue.prototype.$mount
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 查找 el，返回 Element 类型
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    // 如果非生产环境下，el 是 body 或者 documentElement，则发出警告并返回 vm 实例
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  // vm 实例选项。参考 https://vuejs.org/v2/api/#vm-options
  const options = this.$options
  // resolve template/el and convert to render function
  // 如果没有选项 render 函数，则分析选项 template 模板或 el，并将其转换成 render 函数
  if (!options.render) {
    // 优先取选项 template 模板
    let template = options.template
    if (template) {
      // 选项 template 为字符串
      if (typeof template === 'string') {
        // 如果以 '#' 开头，说明是 #id，则通过 id 获取 template 内容
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            // 在非生产环境下，没有获取到 template，则发出警告
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        // 如果是元素节点，则取其 html 内容
        template = template.innerHTML
      } else {
        // 非生产环境下，template 不是 string | Element，则发出警告并返回 vm 实例
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 没有选项 template 模板，则取 el 获取模板内容
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      // 非生产环境下做性能分析
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile') // 模板编译开始
      }

      // 通过 compileToFunctions 将 template 转换生成：render 函数、staticRenderFns 数组，并放入实例选项
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        delimiters: options.delimiters
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end') // 模板编译结束
        measure(`${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 执行之前的 mount 方法
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
    // 如果不支持 outerHTML，则创建父容器节点 div，向其添加子节点 el 的克隆，然后取 div.innerHTML
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
