/* @flow */
// 浏览器兼容性处理

import { inBrowser } from 'core/util/index'

// check whether current browser encodes a char inside attribute values
// 检查当前浏览器是否编码属性值内的字符
function shouldDecode (content: string, encoded: string): boolean {
  const div = document.createElement('div')
  div.innerHTML = `<div a="${content}">`
  return div.innerHTML.indexOf(encoded) > 0
}

// #3663
// IE encodes newlines inside attribute values while other browsers don't
// IE 会 encode 元素属性内的换行符，然而其他浏览器不会
// 这里判断是否需要 decode 换行符
export const shouldDecodeNewlines = inBrowser ? shouldDecode('\n', '&#10;') : false
