// https://github.com/shelljs/shelljs
require('shelljs/global')
env.NODE_ENV = 'production'

var path = require('path')
var config = require('./config')
var ora = require('ora')
var webpack = require('webpack')
var webpackConfig = require('./config/webpack.prod.conf')
var minifyStaticJS = require('../minify')

console.log(
    '  Tip:\n' +
    '  Built files are meant to be served over an HTTP server.\n' +
    '  Opening index.html over file:// won\'t work.\n'
)

var spinner = ora('building for production...')
spinner.start()
var assetsRoot = path.resolve(config.build.assetsRoot)
var assetsPath = path.join(config.build.assetsRoot, config.build.assetsSubDirectory)

rm('-rf', assetsRoot) // 删除 assetsRoot(dist) 目录下的文件及目录， 忽略不存在的目录
// // rm('-rf', assetsPath)
mkdir('-p', assetsRoot) // 若路径中的某些目录尚不存在, 系统将自动建立好那些尚不存在的目录,即一次可以建立多个目录
cp('-R', 'static/*', assetsRoot) // 复制目录及目录内的所有项目

minifyStaticJS() // 压缩优化 static 目录下的静态js

// webpack 打包
webpack(webpackConfig, function (err, stats) {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false
        }) + '\n')
})
