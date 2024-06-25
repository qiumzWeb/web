var webpack = require('webpack')
var path = require('path');
var { merge } = require('webpack-merge')
var config = require('./index')
var MiniCssExtractPlugin = require('mini-css-extract-plugin')
var CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
var utils = require('../utils')
var baseWebpackConfig = require('./webpack.base.conf')
var TerserPlugin = require('terser-webpack-plugin');
var splitChunks = require('./chunks')
var AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var webpackConfig = merge(baseWebpackConfig, {
    output: {
      publicPath: config.build.assetsPublicPath,
      path: config.build.assetsRoot,
      filename: (chunk) => {
          return utils.assetsPath('js/ali-[name].js')
      },
      chunkFilename: (chunk) => {
          return utils.assetsPath('js/ali-[name].chunk.[contenthash].js')
      }
    },
    // 拆包优化
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            warnings: false,
            compress: {
              comparisons: false,
              drop_console: true,
              drop_debugger: true,
            },
            parse: {},
            mangle: true,
            output: {
              comments: false,
              ascii_only: true
            }
          },
          parallel: true,
          extractComments: false
        }),
        new CssMinimizerPlugin({
          parallel: true
        })
      ],
      removeEmptyChunks: true,
      sideEffects: true,
      concatenateModules: true,
      providedExports: true,
      usedExports: true,
      splitChunks: splitChunks,
    },
    plugins: [
      // new BundleAnalyzerPlugin(),
      // extract css into its own file
      // vendor_alifd
      new MiniCssExtractPlugin({
        ignoreOrder: true,
        filename: function(module){
          let name = module && module.chunk && module.chunk.name
          if (name != 'main') {
            name = 'vendor'
          }
          return utils.assetsPath(`css/ali-${name}.css`)
        },
        chunkFilename: utils.assetsPath('css/ali-[name].chunk.[contenthash].css'),
      }),
      new AddAssetHtmlPlugin({
        filepath: config.dev.assetsDllOutPath + '/ali_react.js',
        publicPath: config.build.assetsPublicPath + 'js',
        outputPath: 'js',
        includeSourcemap: false
      }),
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require('../../dll/ali_react-manifest.json')
      }),
    ]
})

module.exports = webpackConfig
