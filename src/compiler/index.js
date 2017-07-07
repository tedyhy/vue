/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { detectErrors } from './error-detector'
import { extend, noop } from 'shared/util'
import { warn, tip } from 'core/util/debug'

// 模板编译的核心
function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 根据模板字符串和编译选项将 html 转换成 AST
  const ast = parse(template.trim(), options)
  // 优化 ast
  optimize(ast, options)
  // 通过 ast generate render 字符串、staticRenderFns 字符串数组
  const code = generate(ast, options)
  return {
    ast,
    render: code.render, // render 字符串
    staticRenderFns: code.staticRenderFns // staticRenderFns 字符串数组
  }
}

// 根据 code 传参，利用内置 Function 构造器来创建函数，
// 如果出现异常，则返回 noop 并记录错误信息
function makeFunction (code, errors) {
  try {
    return new Function(code)
  } catch (err) {
    // 将错误存储在 errors 数组
    errors.push({ err, code })
    return noop
  }
}

/**
 * 暴露模板编译器
 * @param baseOptions 原始编译选项
 * @returns {{compile: compile, compileToFunctions: compileToFunctions}}
 */
export function createCompiler (baseOptions: CompilerOptions) {
  /**
   * 根据模板创建编译缓存池，key 为模板字符串，其值为 CompiledFunctionResult 类型对象，
   * 其对象结构为：
   * {
   *   render: Function; // render 函数
   *   staticRenderFns: Array<Function>; // 数组
   * }
   */
  const functionCompileCache: {
    [key: string]: CompiledFunctionResult;
  } = Object.create(null)

  /**
   * compile 方法
   * @param template 模板字符串
   * @param options 编译选项
   * @returns {CompiledResult}
   */
  function compile (
    template: string,
    options?: CompilerOptions
  ): CompiledResult {
    // 根据原始选项 baseOptions 创建最终选项 finalOptions
    const finalOptions = Object.create(baseOptions)
    // 错误信息和提示信息集合
    const errors = []
    const tips = []
    // 创建 warn 方法收集 errors 或 tips
    finalOptions.warn = (msg, tip) => {
      (tip ? tips : errors).push(msg)
    }

    // 有传参 options 编译选项
    if (options) {
      // merge custom modules
      // 如果有 options.modules，就将其 merge 到原始选项 baseOptions.modlues，生成最终 finalOptions.modules
      if (options.modules) {
        finalOptions.modules = (baseOptions.modules || []).concat(options.modules)
      }
      // merge custom directives
      // 如果有 options.directives，就将其 merge 到原始选项 baseOptions.directives，生成最终 finalOptions.directives
      if (options.directives) {
        finalOptions.directives = extend(
          Object.create(baseOptions.directives),
          options.directives
        )
      }
      // copy other options
      // 遍历传参 options，将除了 modules、directives 外的选项直接赋值给 finalOptions，生成最终 finalOptions
      for (const key in options) {
        if (key !== 'modules' && key !== 'directives') {
          finalOptions[key] = options[key]
        }
      }
    }

    // 调用核心方法 baseCompile 对模板进行编译，生成最终编译结果对象 compiled
    const compiled = baseCompile(template, finalOptions)
    if (process.env.NODE_ENV !== 'production') {
      // 非生产环境下会检查编译后的语法树 compiled.ast 是否有报错，如果有则收集报错信息
      errors.push.apply(errors, detectErrors(compiled.ast))
    }
    // 错误信息集
    compiled.errors = errors
    // 提示信息集
    compiled.tips = tips
    return compiled
  }

  /**
   * compileToFunctions 方法
   * @param template 模板字符串
   * @param options 编译选项
   * @param vm 组件实例
   * @returns {*}
   */
  function compileToFunctions (
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult {
    options = options || {}

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      // detect possible CSP restriction
      // 检测可能的 CSP 限制
      try {
        new Function('return 1')
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          )
        }
      }
    }

    // check cache
    // 检测缓存，如果存在，则直接取缓存
    // 如果 options.delimiters 分隔符传参，则和模板字符串拼接生成最终 key
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    // 检测缓存，如果有则返回，不再执行后续逻辑
    if (functionCompileCache[key]) {
      return functionCompileCache[key]
    }

    // compile
    // 调用 compile 方法进行编译
    const compiled = compile(template, options)

    // check compilation errors/tips
    // 检查编译错误或提示
    if (process.env.NODE_ENV !== 'production') {
      // 非生产环境下，如果编译出错则发出警告
      if (compiled.errors && compiled.errors.length) {
        warn(
          `Error compiling template:\n\n${template}\n\n` +
          compiled.errors.map(e => `- ${e}`).join('\n') + '\n',
          vm
        )
      }
      // 如果编译有提示信息，则输出提示
      if (compiled.tips && compiled.tips.length) {
        compiled.tips.forEach(msg => tip(msg, vm))
      }
    }

    // turn code into functions
    const res = {}
    // 用来存储转换过程中出现的 error
    const fnGenErrors = []
    // 将编译生成的 compiled.render 字符串转换成 render 函数
    res.render = makeFunction(compiled.render, fnGenErrors)
    // 获取生成的 compiled.staticRenderFns 数组长度，根据长度生成空数组
    const l = compiled.staticRenderFns.length
    res.staticRenderFns = new Array(l)
    for (let i = 0; i < l; i++) {
      // 遍历 compiled.staticRenderFns，将每项字符串转换成函数，并收集转换过程中报错信息
      res.staticRenderFns[i] = makeFunction(compiled.staticRenderFns[i], fnGenErrors)
    }

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      // 非生产环境下，如果编译没有 errors，生成 render 函数时报错，则发出警告
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
          fnGenErrors.map(({ err, code }) => `${err.toString()} in\n\n${code}\n`).join('\n'),
          vm
        )
      }
    }

    // 将编译过的模板缓存起来
    return (functionCompileCache[key] = res)
  }

  return {
    compile,
    compileToFunctions
  }
}
