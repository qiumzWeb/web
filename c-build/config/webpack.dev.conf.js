var webpack = require('webpack')
var { merge } = require('webpack-merge')
var config = require('../config')
var path = require('path')
var baseWebpackConfig = require('./webpack.base.conf')
var devConf = merge(baseWebpackConfig, {
    devtool: false, // 是否生成 sourceMap 文件
    entry: [path.resolve(__dirname, '../dev-client.js')],
    output: {
        publicPath: config.dev.assetsPublicPath,
    },
    cache: config.dev.cachesDllDirectory,
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.ProgressPlugin()
    ]
})

module.exports = devConf;
