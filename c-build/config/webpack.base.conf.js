var webpack = require('webpack')
var path = require('path')
var config = require('./index')
var utils = require('../utils')
var loaders = require('./loaders')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
module.exports = {
    entry: [
        path.resolve(__dirname, './react.proxy.middleware.js'),
        path.resolve(__dirname, '../../src/assets/js/base.js'),
        path.resolve(__dirname, '../../src/app.js')
    ],
    mode: process.env.NODE_ENV,
    resolve: {
        modules: ['node_modules', 'static'],
        extensions: ['.js', '.jsx'],
        alias: {
            '@': path.resolve(__dirname, '../../src'),
            'assets': path.resolve(__dirname, '../../src/assets'),
            'componentPath': path.resolve(__dirname, '../src/component'),
            'commonPath': path.resolve(__dirname, '../../src/assets'),
            'static': path.resolve(__dirname, '../../static')
        }
    },

    module: {
        rules: loaders
    },
    plugins:[
        // 生成 html
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../../static/index.html'),
            minify: false
        }),
    ]
}


