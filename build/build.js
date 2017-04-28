const fs = require('fs')
const path = require('path')
// 参考 http://nodejs.cn/api/zlib.html
const zlib = require('zlib') // nodejs zlib 模块，这里使用 zlib.gzip
const rollup = require('rollup')
const uglify = require('uglify-js')

// 如果不存在 dist 目录，就创建 dist 目录
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

// 获取所有 build 子任务配置，返回数组
let builds = require('./config').getAllBuilds()

// filter builds via command line arg
// 通过命令行传参过滤 build 子任务，如下：
// "build:ssr": "npm run build -- vue.runtime.common.js,vue-server-renderer",
// "build:weex": "npm run build -- weex-vue-framework,weex-template-compiler",
// 根据不同的场景选择不同的入口文件
if (process.argv[2]) {
  // 从命令行参数数组里获取传参，并用','分割
  const filters = process.argv[2].split(',')
  // 从子任务里过滤出来跟传参任务名相关的任务
  builds = builds.filter(b => {
    return filters.some(f => b.dest.indexOf(f) > -1)
  })
} else {
  // filter out weex builds by default
  // 默认过滤掉 weex 相关的构建任务
  builds = builds.filter(b => {
    return b.dest.indexOf('weex') === -1
  })
}

// 根据任务遍历构建筛选出来的多个子任务
build(builds)

// 根据任务遍历构建子任务
function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    // 异步构建子任务
    buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        next()
      }
    }).catch(logError)
  }

  next()
}

// 根据子任务配置信息异步构建子任务
function buildEntry (config) {
  // 根据后缀判断是否要生成生产环境代码
  const isProd = /min\.js$/.test(config.dest)
  // 利用 rollup 根据子任务的配置信息进行异步打包
  // 这里的 config 用到了里面的 entry、plugins 等配置信息
  return rollup.rollup(config).then(bundle => {
    // 1.这里的 config 用到了里面的 format、dest 等配置信息
    // 2.bundle.write(config) 也可以，但是它直接生成文件了，
    // 不能像 bundle.generate(config) 可以在 code 写入文件前后做额外处理
    const code = bundle.generate(config).code
    // 如果是要生成生产代码，则添加 banner 信息，压缩源代码后写入文件
    if (isProd) {
      var minified = (config.banner ? config.banner + '\n' : '') + uglify.minify(code, {
        fromString: true,
        output: {
          // Pass this flag if you don’t care about full compliance with Internet Explorer 6-8 quirks（怪癖）
          screw_ie8: true,
          // Setting this flag converts those characters into the \uxxxxx pattern.
          ascii_only: true
        },
        compress: {
          // 假如返回值没被调用则可以安全移除的函数。
          // 例如`--pure-funcs Math.floor console.info`(需要设置 `--compress`)
          // 参考：https://segmentfault.com/a/1190000008995453
          pure_funcs: ['makeMap']
        }
      }).code
      return write(config.dest, minified, true)
    } else {
      return write(config.dest, code)
    }
  })
}

// 将 code 源代码异步写入文件，写入成功之后可以做 gzip 压缩并打印信息
function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    // 打印 gzip 后相关信息
    function report (extra) {
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      resolve()
    }

    // 异步写入文件
    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      // 是否需要 gzip 压缩
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}

// 获取源码大小，单位 kb
function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

// 错误日志输出
function logError (e) {
  console.log(e)
}

// font color blue
function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
