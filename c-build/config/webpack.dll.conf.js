require('shelljs/global')
var webpack = require('webpack')
var { merge } = require('webpack-merge')
var config = require('../config')
var path = require('path')
var ora = require('ora')
var dllConf = merge({
    devtool: false, // 是否生成 sourceMap 文件
    mode: 'production', //'production', ，development
    entry: config.build.assetsDllChunks,
    output: {
        path: config.dev.assetsDllOutPath,
        filename: '[name].js',
        library: {
            name: 'vendor_[fullhash]',
            type: 'umd'
        },
        libraryTarget: 'umd',
    },
    plugins: [
        new webpack.DllPlugin({
            context: __dirname,
            name: 'vendor_[fullhash]',
            format:true,
            entryOnly: true,
            path: config.dev.assetsDllOutPath + '/[name]-manifest.json',
        }),
    ]
})
// webpack 打包
rm('-rf', config.dev.assetsDllOutPath) // 删除 assetsRoot(dist) 目录下的文件及目录， 忽略不存在的目录
var spinner = ora('building for dll...')
spinner.start()
webpack(dllConf, function (err, stats) {
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