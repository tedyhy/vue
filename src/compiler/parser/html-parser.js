/**
 * Not type-checking this file because it's mostly vendor code.
 * 此文件没有类型校验，因为它几乎是 vendor 代码
 */

/*!
 * HTML Parser By John Resig (ejohn.org)
 * Modified by Juriy "kangax" Zaytsev
 * Original code by Erik Arvidsson, Mozilla Public License
 * 参考 http://erik.eae.net/simplehtmlparser/simplehtmlparser.js
 * HTML 分析
 */

import { makeMap, no } from 'shared/util'
import { isNonPhrasingTag } from 'web/compiler/util'

// Regular Expressions for parsing tags and attributes
// 分析 tags 和 attributes 的正则表达式
const singleAttrIdentifier = /([^\s"'<>/=]+)/ // 匹配属性 key 值
const singleAttrAssign = /(?:=)/ // 匹配等号，非捕获
const singleAttrValues = [ // 匹配单双引号
  // attr value double quotes
  // 属性值双引号
  /"([^"]*)"+/.source,
  // attr value, single quotes
  // 属性值单引号
  /'([^']*)'+/.source,
  // attr value, no quotes
  // 属性值无引号
  /([^\s"'=<>`]+)/.source
]
// 匹配属性正则
const attribute = new RegExp(
  '^\\s*' + singleAttrIdentifier.source +
  '(?:\\s*(' + singleAttrAssign.source + ')' +
  '\\s*(?:' + singleAttrValues.join('|') + '))?'
)

// could use https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
// but for Vue templates we can enforce a simple charset
// 可以使用命名空间，但是对于 .vue 模板，我们强制使用简单字符命名空间
const ncname = '[a-zA-Z_][\\w\\-\\.]*' // 匹配属性名称
const qnameCapture = '((?:' + ncname + '\\:)?' + ncname + ')' // 匹配 Qualified Names，支持命名空间 tag
const startTagOpen = new RegExp('^<' + qnameCapture) // 匹配 tag 开始
const startTagClose = /^\s*(\/?)>/ // 匹配 tag 开始右尖括号，可以是一元 tag
const endTag = new RegExp('^<\\/' + qnameCapture + '[^>]*>') // 匹配 tag 结束标签
const doctype = /^<!DOCTYPE [^>]+>/i // 匹配 DOCTYPE
const comment = /^<!--/ // 匹配评论
const conditionalComment = /^<!\[/ // 匹配 CDATA 或 IE 条件判断，如：<![if !IE]>...<![endif]>

// 火狐浏览器关于正则的一个 bug，参考 https://bugzilla.mozilla.org/show_bug.cgi?id=369778
// RESOLVED FIXED in mozilla34，所以 mozilla34 之前是存在这个 bug 的。
// 下例中，正常情况下应该返回：x undefined。但是火狐浏览器下返回：x ''。
let IS_REGEX_CAPTURING_BROKEN = false
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})

// Special Elements (can contain anything)
// 用于判断是否是 'script,style,textarea' 元素中的一种
const isPlainTextElement = makeMap('script,style,textarea', true)
// 正则缓存池
const reCache = {}

// html 标签解码 map 映射
const decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n'
}
// 带 ?: 的 () 里面内容是不会被捕获的
const encodedAttr = /&(?:lt|gt|quot|amp);/g // 非捕获转码：< > " &
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10);/g // 非捕获转码：< > " & 换行（Unicode编码）

/**
 * 解码属性
 * IE 上的一个 bug, 如果 dom 节点的属性分多行书写，那么它会把 '\n' 转义成 &#10; ，
 * 而其它浏览器并不会这么做，因此需要手工处理。
 * @param  {string} value                html 字符串
 * @param  {boolean} shouldDecodeNewlines 是否解码换行
 * @return {string}                      解码后的 html 字符串
 */
function decodeAttr (value, shouldDecodeNewlines) {
  // 根据传参 shouldDecodeNewlines 判断是否需要解码换行
  const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
  // 将 html 中的 html 编码通过正则解码
  return value.replace(re, match => decodingMap[match])
}

/**
 * 分析 html
 * @param html .vue 模板代码
 * @param options 一些选项，包括：start、end 等
 */
export function parseHTML (html, options) {
  const stack = []
  const expectHTML = options.expectHTML
  const isUnaryTag = options.isUnaryTag || no // 是否是一元标签，默认 false
  const canBeLeftOpenTag = options.canBeLeftOpenTag || no
  let index = 0 // 字符串的起始位置索引
  let last, lastTag
  while (html) {
    last = html
    // Make sure we're not in a plaintext content element like script/style
    // 确保当前 lastTag 不是 'script,style,textarea' 元素
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf('<')
      if (textEnd === 0) {
        // Comment:
        // 匹配到评论，并从评论后开始继续分析，即忽略评论内容
        if (comment.test(html)) {
          const commentEnd = html.indexOf('-->')

          if (commentEnd >= 0) {
            advance(commentEnd + 3)
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          const conditionalEnd = html.indexOf(']>')

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2)
            continue
          }
        }

        // Doctype:
        // 匹配 DOCTYPE，如：<!DOCTYPE html>
        // 匹配到后开始继续分析，即忽略 DOCTYPE 内容
        const doctypeMatch = html.match(doctype)
        if (doctypeMatch) {
          advance(doctypeMatch[0].length)
          continue
        }

        // End tag:
        // 匹配结束 tag
        const endTagMatch = html.match(endTag)
        if (endTagMatch) {
          const curIndex = index
          advance(endTagMatch[0].length)
          parseEndTag(endTagMatch[1], curIndex, index)
          continue
        }

        // Start tag:
        const startTagMatch = parseStartTag()
        if (startTagMatch) {
          handleStartTag(startTagMatch)
          continue
        }
      }

      let text, rest, next
      if (textEnd >= 0) {
        rest = html.slice(textEnd)
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1)
          if (next < 0) break
          textEnd += next
          rest = html.slice(textEnd)
        }
        text = html.substring(0, textEnd)
        advance(textEnd)
      }

      if (textEnd < 0) {
        text = html
        html = ''
      }

      if (options.chars && text) {
        options.chars(text)
      }
    } else {
      var stackedTag = lastTag.toLowerCase()
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
      var endTagLength = 0
      var rest = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!--([\s\S]*?)-->/g, '$1')
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
        }
        if (options.chars) {
          options.chars(text)
        }
        return ''
      })
      index += html.length - rest.length
      html = rest
      parseEndTag(stackedTag, index - endTagLength, index)
    }

    if (html === last) {
      options.chars && options.chars(html)
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(`Mal-formatted tag at end of template: "${html}"`)
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag()

  // 根据传参 n 截取 html 字符串内容
  function advance (n) {
    index += n
    html = html.substring(n)
  }

  // 分析 tag 开始
  function parseStartTag () {
    const start = html.match(startTagOpen) // 匹配开始 tag
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
        start: index
      }
      advance(start[0].length)
      let end, attr
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push(attr)
      }
      if (end) {
        match.unarySlash = end[1]
        advance(end[0].length)
        match.end = index
        return match
      }
    }
  }

  function handleStartTag (match) {
    const tagName = match.tagName
    const unarySlash = match.unarySlash

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag)
      }
      if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
        parseEndTag(tagName)
      }
    }

    const unary = isUnaryTag(tagName) || tagName === 'html' && lastTag === 'head' || !!unarySlash

    const l = match.attrs.length
    const attrs = new Array(l)
    for (let i = 0; i < l; i++) {
      const args = match.attrs[i]
      // hackish work around FF bug https://bugzilla.mozilla.org/show_bug.cgi?id=369778
      if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
        if (args[3] === '') { delete args[3] }
        if (args[4] === '') { delete args[4] }
        if (args[5] === '') { delete args[5] }
      }
      const value = args[3] || args[4] || args[5] || ''
      attrs[i] = {
        name: args[1],
        value: decodeAttr(
          value,
          options.shouldDecodeNewlines
        )
      }
    }

    if (!unary) {
      stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs })
      lastTag = tagName
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end)
    }
  }

  /**
   * 分析 tag 结束
   * @param tagName tag 名称
   * @param start tag 的起始
   * @param end tag 的结束
   */
  function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index

    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
    }

    // Find the closest opened tag of the same type
    if (tagName) {
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (process.env.NODE_ENV !== 'production' &&
            (i > pos || !tagName) &&
            options.warn) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`
          )
        }
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
