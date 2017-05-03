// vue-template-compiler 模块入口，详情参考其 README.md
try {
  var vueVersion = require('vue').version // 获取 vue 当前版本
} catch (e) {}

// 获取此模块名称和版本并检测是否与 vue 版本匹配上
// 使用此模块，需要确保与当前 vue 版本一致
var packageName = require('./package.json').name
var packageVersion = require('./package.json').version
// 如果此模板版本与 vue 版本不匹配，抛出错误信息
if (vueVersion && vueVersion !== packageVersion) {
  throw new Error(
    '\n\nVue packages version mismatch:\n\n' +
    '- vue@' + vueVersion + '\n' +
    '- ' + packageName + '@' + packageVersion + '\n\n' +
    'This may cause things to work incorrectly. Make sure to use the same version for both.\n' +
    'If you are using vue-loader@>=10.0, simply update vue-template-compiler.\n' +
    'If you are using vue-loader@<10.0 or vueify, re-installing vue-loader/vueify should bump ' + packageName + ' to the latest.\n'
  )
}

module.exports = require('./build')
