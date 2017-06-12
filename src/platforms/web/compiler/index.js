/* @flow */

import { isUnaryTag, canBeLeftOpenTag } from './util'
import { genStaticKeys } from 'shared/util'
import { createCompiler } from 'compiler/index'

import modules from './modules/index'
import directives from './directives/index'

import {
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '../util/index'

export const baseOptions: CompilerOptions = {
  expectHTML: true,
  // modules 模块
  modules,
  // directives 模块
  directives,
  // 判断是否是 pre 标签
  isPreTag,
  // 判断是否是一元 tag 标签
  isUnaryTag,
  // 属性值应该用 props 绑定的
  mustUseProp,
  // 当遇到相同类型 tag 时，应该结束上一个 tag，即 <td>xxx<td>xxx</td> 应该被解析为 <td>xxx</td><td>xxx</td>
  canBeLeftOpenTag,
  // 判断是否是保留标签
  isReservedTag,
  // 获取标签命名空间
  getTagNamespace,
  // 获取 modules 模块的 staticKeys 属性值，即：['staticStyle', 'staticClass']
  staticKeys: genStaticKeys(modules)
}

// 通过函数 createCompiler 和基本选项 baseOptions 创建编译器函数 compile、compileToFunctions
const { compile, compileToFunctions } = createCompiler(baseOptions)
export { compile, compileToFunctions }
