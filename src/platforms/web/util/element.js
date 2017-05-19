/* @flow */

import { inBrowser } from 'core/util/env'
import { makeMap } from 'shared/util'

// svg、math 命名空间
export const namespaceMap = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
}

// 判断是不是 html 标签
export const isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template'
)

// this map is intentionally selective, only covering SVG elements that may
// contain child elements.
// 判断是否是 svg 元素，包括 svg 子元素
export const isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
)

// 判断是否是 pre 标签
export const isPreTag = (tag: ?string): boolean => tag === 'pre'

// 判断是否是保留标签
export const isReservedTag = (tag: string): ?boolean => {
  return isHTMLTag(tag) || isSVG(tag)
}

// 获取标签命名空间
export function getTagNamespace (tag: string): ?string {
  // 如果是 svg 节点，则返回 'svg'
  if (isSVG(tag)) {
    return 'svg'
  }
  // basic support for MathML
  // note it doesn't support other MathML elements being component roots
  // 如果标签是 math，则返回 'math'
  if (tag === 'math') {
    return 'math'
  }
}

// 未知元素缓存池
const unknownElementCache = Object.create(null)
// 判断是否是未知元素
export function isUnknownElement (tag: string): boolean {
  /* istanbul ignore if */
  // 非浏览器环境直接返回 true
  if (!inBrowser) {
    return true
  }
  // 是否是保留标签
  if (isReservedTag(tag)) {
    return false
  }
  tag = tag.toLowerCase()
  /* istanbul ignore if */
  // 是否是未知标签
  if (unknownElementCache[tag] != null) {
    return unknownElementCache[tag]
  }
  const el = document.createElement(tag)
  // 如果标签名称里有 '-' 字符，则需要通过下面方法判断是否是未知标签，否则使用正则判断
  if (tag.indexOf('-') > -1) {
    // http://stackoverflow.com/a/28210364/1070244
    // 下面可以很好的验证 el 元素是否是未知标签
    return (unknownElementCache[tag] = (
      el.constructor === window.HTMLUnknownElement ||
      el.constructor === window.HTMLElement
    ))
  } else {
    // 使用正则判断是否是未知标签
    return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
  }
}
