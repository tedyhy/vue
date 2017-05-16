// 声明接口 GlobalAPI，规范全局接口（Vue）
declare interface GlobalAPI {
  cid: number;
  options: Object;
  config: Config;
  util: Object;

  // 参考 https://vuejs.org/v2/api/#Vue-extend
  extend: (options: Object) => Function; // 使用基础 Vue 构造器，创建一个“子类”
  set: <T>(target: Object | Array<T>, key: string | number, value: T) => T; // 设置对象的属性
  delete: <T>(target: Object| Array<T>, key: string | number) => void; // 删除对象的属性
  nextTick: (fn: Function, context?: Object) => void; // 在下次 DOM 更新循环结束之后执行延迟回调
  use: (plugin: Function | Object) => void; // 安装 Vue.js 插件
  mixin: (mixin: Object) => void; // 全局注册一个混合，影响注册之后所有创建的每个 Vue 实例
  compile: (template: string) => { render: Function, staticRenderFns: Array<Function> }; // 在 render 函数中编译模板字符串

  directive: (id: string, def?: Function | Object) => Function | Object | void; // 注册或获取全局指令
  component: (id: string, def?: Class<Component> | Object) => Class<Component>; // 注册或获取全局组件
  filter: (id: string, def?: Function) => Function | void; // 注册或获取全局过滤器

  // allow dynamic method registration
  // 允许动态方法注册
  [key: string]: any
}
