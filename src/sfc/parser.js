/* @flow */
// 标识此文件需要通过 flow type 类型校验

// remove extra indent from a block of code
// 参考 https://github.com/yyx990803/de-indent
import deindent from 'de-indent'
import { parseHTML } from 'compiler/parser/html-parser'
import { makeMap } from 'shared/util'

// 用换行符来分割的正则
const splitRE = /\r?\n/g
// 替换任意单个字符正则
const replaceRE = /./g
// 检查一个 tag 是否是 'script,style,template' 中的一种
const isSpecialTag = makeMap('script,style,template', true)

// 自定义对象数据类型
type Attribute = {
  name: string,
  value: string
};

/**
 * Parse a single-file component (*.vue) file into an SFC Descriptor Object.
 * 分析单文件组件（即：*.vue）文件成一个 SFC 描述对象
 * 参考：https://github.com/vuejs-templates/webpack-simple/blob/master/template/src/App.vue
 *
 * @param {string} content vue 组件模板字符串内容
 * @param {Object} options 选项配置，默认空对象
 * @return {SFCDescriptor} 返回 sfc 描述对象，此类型在 flow/compiler.js 里有声明
 */
export function parseComponent (
  content: string,
  options?: Object = {}
 ): SFCDescriptor {
  // 定义一个类型为 SFCDescriptor 的 sfc 对象并初始化
  // SFCDescriptor 是一个自定义类型，定义在 flow/complier.js 里
  // 有4种代码块，其中 style 和自定义块允许多个，template、script 只允许一个
  const sfc: SFCDescriptor = {
    template: null,
    script: null,
    styles: [], // 存储多个 style 块数据
    customBlocks: [] // 存储自定义块数据
  }
  // 每个代码块都有自己的深度，这里的 depth 就是用来标记嵌套深度的
  // 在此不会处理嵌套的块，只处理一层，嵌套块处理交给了 parseHTML
  let depth = 0
  let currentBlock: ?(SFCBlock | SFCCustomBlock) = null // 定义当前处理的代码块

  // 匹配到标签开始时的钩子，主要是对标签的属性进行处理
  function start (
    tag: string, // 元素 tag
    attrs: Array<Attribute>, // 元素属性集
    unary: boolean, // 是否是一元 tag
    start: number,
    end: number
  ) {
    if (depth === 0) {
      // 初始化元素块
      currentBlock = {
        type: tag,
        content: '',
        start: end,
        attrs: attrs.reduce((cumulated, { name, value }) => { // 合并处理此元素上的所有属性
          cumulated[name] = value || true // 属性值如果不设置值，则默认为 true
          return cumulated
        }, Object.create(null)) // 初始化数据
      }
      // 判断 tag 是否是 'script,style,template' 中的一种，如果不是，则为自定义块
      if (isSpecialTag(tag)) {
        // 如果是 'script,style,template' 中的一种，就检查并添加属性
        checkAttrs(currentBlock, attrs)
        // .vue 模板可以写多个 'style' 标签，但是 'script,template' 分别只能写一个
        if (tag === 'style') {
          sfc.styles.push(currentBlock)
        } else {
          sfc[tag] = currentBlock
        }
      } else { // custom blocks
        sfc.customBlocks.push(currentBlock)
      }
    }
    // 如果是非一元标签，那么标记深度，添加锁
    if (!unary) {
      depth++
    }
  }

  /**
   * 检查并添加属性，筛选出 'lang|scoped|module|src'
   * @param block SFCBlock
   * @param attrs Array<Attribute> 如：[{name: 'lang', value: ''}, {name: 'scoped', value: ''}, ...]
   *
   * 如：
     parseComponent(`
       <template lang="jade">
        h1(class="red") {{msg}}
       </template>
       <style src="./test.css"></style>
       <style lang="stylus" scoped>
         h1
          color red
         h2
          color green
       </style>
       <style lang="stylus" src="style.styl"></style>
       <style module>
        h1 { font-weight: bold }
       </style>
       <style bool-attr val-attr="test"></style>
       <script lang="coffee">
         module.exports =
          data: ->
            msg: 'Hello world!'
       </script>
       <div>
        <style>nested should be ignored</style>
       </div>
     `)
   */
  function checkAttrs (block: SFCBlock, attrs: Array<Attribute>) {
    // 遍历属性数组
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i]
      // 用 lang 标签设置 style 标签内用的预处理语法，less、sass 之类的
      if (attr.name === 'lang') {
        block.lang = attr.value
      }
      // 如果设置了 scoped 属性，那么这个 style 标签就只对当前组件有作用
      if (attr.name === 'scoped') {
        block.scoped = true
      }
      /**
       * style 模块化，如：
       * <style module>
       *  h1 { font-weight: bold }
       * </style>
       */
      if (attr.name === 'module') {
        block.module = attr.value || true
      }
      // 引用 css 文件，如：<style src="./test.css"></style>
      if (attr.name === 'src') {
        block.src = attr.value
      }
    }
  }

  // 匹配到标签结束时调用的钩子函数，主要是对标签里的内容进行处理
  function end (tag: string, start: number, end: number) {
    // 检查锁的状态，并且标签是非一元标签(不是<tag/>这样的)
    if (depth === 1 && currentBlock) {
      // end 标记的是标签内的内容结束的位置
      currentBlock.end = start
      // 去除标签内的缩进，deindent 是作者专门为了去除缩进开发的模块
      let text = deindent(content.slice(currentBlock.start, currentBlock.end))
      // pad content so that linters and pre-processors can output correct
      // line numbers in errors and warnings
      // 判断是不是 'template' 标签，如果不是都要加 pad，目的是在 lint 报错时，报错信息行数能对应上
      if (currentBlock.type !== 'template' && options.pad) {
        text = padContent(currentBlock, options.pad) + text
      }
      currentBlock.content = text
      // currentBlock 其实已经保存了 sfc 的属性的引用，它只是个临时变量，这里充分的运用了 js 对象都是引用类型的特性
      currentBlock = null
    }
    // 解锁
    depth--
  }

  // 用来生成能跟 .vue 文件内行数对应上的内容。用来对应 lint 或预编译软件的报错信息的行数。
  function padContent (block: SFCBlock | SFCCustomBlock, pad: true | "line" | "space") {
    // 替换空格
    if (pad === 'space') {
      return content.slice(0, block.start).replace(replaceRE, ' ')
    // 替换行
    } else {
      // 获取当前这段代码到底在多少行
      const offset = content.slice(0, block.start).split(splitRE).length
      // 根据不同的块使用不同的换行
      const padChar = block.type === 'script' && !block.lang
        ? '//\n'
        : '\n'
      // 最后返回对应行数的换行
      return Array(offset).join(padChar)
    }
  }

  // 解析 html 的核心操作
  // 第二个参数里面可以设置匹配到标签开始和结束时的钩子函数，通过钩子来获取自己想要的内容。
  // 比如：有个 <tag>xxx</tag> 这样的内容，匹配到 <tag> 时执行start，匹配到 </tag> 时执行end。如果匹配到 <tag/>，就只执行start。
  parseHTML(content, {
    start,
    end
  })

  return sfc
}
