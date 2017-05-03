/* @flow */

import { no, noop, identity } from 'shared/util'

// 定义 Config 类型
export type Config = {
  // user 开发时相关配置属性
  optionMergeStrategies: { [key: string]: Function };
  silent: boolean;
  productionTip: boolean;
  performance: boolean;
  devtools: boolean;
  errorHandler: ?(err: Error, vm: Component, info: string) => void;
  ignoredElements: Array<string>;
  keyCodes: { [key: string]: number | Array<number> };
  // platform 平台相关配置属性
  isReservedTag: (x?: string) => boolean;
  parsePlatformTagName: (x: string) => string;
  isUnknownElement: (x?: string) => boolean;
  getTagNamespace: (x?: string) => string | void;
  mustUseProp: (tag: string, type: ?string, name: string) => boolean;
  // internal 内部使用的配置属性
  _assetTypes: Array<string>;
  _lifecycleHooks: Array<string>;
  _maxUpdateCount: number;
};

// 定义全局配置
// 参考 https://cn.vuejs.org/v2/api/
const config: Config = {
  /**
   * Option merge strategies (used in core/util/options)
   * 自定义选项混合策略（用在 core/util/options）
   * 参考 https://cn.vuejs.org/v2/guide/mixins.html#自定义选项混合策略
   */
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   * 取消 Vue 所有的日志与警告。开启静默模式。
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   * 是否显示生产模式下的提示消息
   */
  productionTip: process.env.NODE_ENV !== 'production',

  /**
   * Whether to enable devtools
   * 是否启用 devtools 开发工具
   */
  devtools: process.env.NODE_ENV !== 'production',

  /**
   * Whether to record perf
   * 是否记录性能数据
   */
  performance: false,

  /**
   * Error handler for watcher errors
   * 指定组件的渲染和观察期间未捕获错误的处理函数。这个处理函数被调用时，可获取错误信息和 Vue 实例。
   */
  errorHandler: null,

  /**
   * Ignore certain custom elements
   * 忽略某些自定义元素
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   * 给 v-on 自定义键位别名，如：
   * Vue.config.keyCodes = {
   *   v: 86,
   *   f1: 112,
   *   mediaPlayPause: 179,
   *   up: [38, 87]
   * }
   */
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   * 检查标签是否被保留，使其不能被注册为组件。这与平台有关，可以被覆盖。
   */
  isReservedTag: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   * 检查标签是否是未知元素
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   * 获取元素的命名空间
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   * 根据具体平台分析真实的标签名称
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   * 检查属性是否必须使用属性绑定，如：value
   */
  mustUseProp: no,

  /**
   * List of asset types that a component can own.
   * 一个组件拥有的类型列表
   */
  _assetTypes: [
    'component',
    'directive',
    'filter'
  ],

  /**
   * List of lifecycle hooks.
   * 生命周期钩子函数列表
   */
  _lifecycleHooks: [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
    'activated',
    'deactivated'
  ],

  /**
   * Max circular updates allowed in a scheduler flush cycle.
   */
  _maxUpdateCount: 100
}

export default config
