const path = require('path')
const flow = require('rollup-plugin-flow-no-whitespace') // 去除源码中 flow 类型检查相关代码，并去除后续的遗留空格
const buble = require('rollup-plugin-buble') // 替代 babel，用 buble 转换 ES2015 代码
const replace = require('rollup-plugin-replace') // 打包时替换环境变量
const alias = require('rollup-plugin-alias') // 为模块起个别名，打包过程中对各个模块做路径映射，这样代码中就可以用 src 作为根目录引用模块了
// 如果没有指定 VERSION，就从 package.json 的 version 字段获取版本信息
const version = process.env.VERSION || require('../package.json').version
// 获取 vue for weex 的版本信息
const weexVersion = process.env.WEEX_VERSION || require('../packages/weex-vue-framework/package.json').version

// vue 版本信息
const banner =
  '/*!\n' +
  ' * Vue.js v' + version + '\n' +
  ' * (c) 2014-' + new Date().getFullYear() + ' Evan You\n' +
  ' * Released under the MIT License.\n' +
  ' */'

// vue for weex Factory wrap plugin
// 模块包裹插件
const weexFactoryPlugin = {
  intro () {
    return 'module.exports = function weexFactory (exports, renderer) {'
  },
  outro () {
    return '}'
  }
}

// 各种构建任务配置
const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'web-runtime-cjs': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.common.js'),
    format: 'cjs',
    banner
  },
  // Runtime+compiler CommonJS build (CommonJS)
  'web-full-cjs': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.common.js'),
    format: 'cjs',
    alias: { he: './entity-decoder' },
    banner
  },
  // Runtime only (ES Modules). Used by bundlers that support ES Modules,
  // e.g. Rollup & Webpack 2
  'web-runtime-esm': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.esm.js'),
    format: 'es',
    banner
  },
  // Runtime+compiler CommonJS build (ES Modules)
  'web-full-esm': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.esm.js'),
    format: 'es',
    alias: { he: './entity-decoder' },
    banner
  },
  // runtime-only build (Browser)
  'web-runtime-dev': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.js'),
    format: 'umd',
    env: 'development',
    banner
  },
  // runtime-only production build (Browser)
  'web-runtime-prod': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.min.js'),
    format: 'umd',
    env: 'production',
    banner
  },
  // Runtime+compiler development build (Browser)
  'web-full-dev': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.js'),
    format: 'umd',
    env: 'development',
    alias: { he: './entity-decoder' },
    banner
  },
  // Runtime+compiler production build  (Browser)
  'web-full-prod': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.min.js'),
    format: 'umd',
    env: 'production',
    alias: { he: './entity-decoder' },
    banner
  },
  // Web compiler (CommonJS).
  'web-compiler': {
    entry: path.resolve(__dirname, '../src/entries/web-compiler.js'),
    dest: path.resolve(__dirname, '../packages/vue-template-compiler/build.js'),
    format: 'cjs',
    external: Object.keys(require('../packages/vue-template-compiler/package.json').dependencies)
  },
  // Web server renderer (CommonJS).
  'web-server-renderer': {
    entry: path.resolve(__dirname, '../src/entries/web-server-renderer.js'),
    dest: path.resolve(__dirname, '../packages/vue-server-renderer/build.js'),
    format: 'cjs',
    external: Object.keys(require('../packages/vue-server-renderer/package.json').dependencies)
  },
  // Weex runtime factory
  'weex-factory': {
    weex: true,
    entry: path.resolve(__dirname, '../src/entries/weex-factory.js'),
    dest: path.resolve(__dirname, '../packages/weex-vue-framework/factory.js'),
    format: 'cjs',
    plugins: [weexFactoryPlugin]
  },
  // Weex runtime framework (CommonJS).
  'weex-framework': {
    weex: true,
    entry: path.resolve(__dirname, '../src/entries/weex-framework.js'),
    dest: path.resolve(__dirname, '../packages/weex-vue-framework/index.js'),
    format: 'cjs'
  },
  // Weex compiler (CommonJS). Used by Weex's Webpack loader.
  'weex-compiler': {
    weex: true,
    entry: path.resolve(__dirname, '../src/entries/weex-compiler.js'),
    dest: path.resolve(__dirname, '../packages/weex-template-compiler/build.js'),
    format: 'cjs',
    external: Object.keys(require('../packages/weex-template-compiler/package.json').dependencies)
  }
}

// 获取 build 配置，并处理返回新的 config
function genConfig (opts) {
  // 根据传参 opts 初始化新的 rollup config
  const config = {
    entry: opts.entry, // 打包入口
    dest: opts.dest, // 打包出口
    external: opts.external, // 额外依赖
    format: opts.format, // 打包成什么格式模块
    banner: opts.banner, // banner 信息
    moduleName: 'Vue', // 统一模块名称
    // rollup 打包插件集
    plugins: [
      // 替换源码内的环境变量：__WEEX__、__WEEX_VERSION__、__VERSION__
      replace({
        __WEEX__: !!opts.weex, // 是否是 vue for weex
        __WEEX_VERSION__: weexVersion, // vue for weex version
        __VERSION__: version // vue version
      }),
      flow(),
      buble(),
      alias(Object.assign({}, require('./alias'), opts.alias)) // 配置别名，打包过程中对各个模块做路径映射
    ].concat(opts.plugins || []) // 联合 plugins
  }

  if (opts.env) {
    // 如果指定了 env 配置，那么新增一个关于替换 process.env.NODE_ENV 环境变量的插件
    config.plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  return config
}

// 如果指定了 TARGET，就只构建指定的 TARGET 子任务
// 否则模块返回两个方法：getBuild、getAllBuilds
if (process.env.TARGET) {
  module.exports = genConfig(builds[process.env.TARGET])
} else {
  // 根据传参 name，获取子任务配置信息
  exports.getBuild = name => genConfig(builds[name])
  // 获取所有子任务配置信息，返回数组
  exports.getAllBuilds = () => Object.keys(builds).map(name => genConfig(builds[name]))
}
