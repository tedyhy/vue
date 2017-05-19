/* @flow */

import { makeMap } from 'shared/util'

// attributes that should be using props for binding
// 属性值应该用 props 绑定的
const acceptValue = makeMap('input,textarea,option,select')
export const mustUseProp = (tag: string, type: ?string, attr: string): boolean => {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
}

// 判断是否是可枚举属性
export const isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck')

// 判断是否是布尔值属性
export const isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
)

// xlink 命名空间
export const xlinkNS = 'http://www.w3.org/1999/xlink'

// 判断是否是 xlink
export const isXlink = (name: string): boolean => {
  return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
}

// 获取 xlink 属性值
export const getXlinkProp = (name: string): string => {
  return isXlink(name) ? name.slice(6, name.length) : ''
}

// 判断属性值是否是 null|false
export const isFalsyAttrValue = (val: any): boolean => {
  return val == null || val === false
}
