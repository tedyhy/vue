const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
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

build(builds)

function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        next()
      }
    }).catch(logError)
  }

  next()
}

function buildEntry (config) {
  const isProd = /min\.js$/.test(config.dest)
  return rollup.rollup(config).then(bundle => {
    const code = bundle.generate(config).code
    if (isProd) {
      var minified = (config.banner ? config.banner + '\n' : '') + uglify.minify(code, {
        fromString: true,
        output: {
          screw_ie8: true,
          ascii_only: true
        },
        compress: {
          pure_funcs: ['makeMap']
        }
      }).code
      return write(config.dest, minified, true)
    } else {
      return write(config.dest, code)
    }
  })
}

function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
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

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  console.log(e)
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
