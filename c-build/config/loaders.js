var path = require('path')
var devMode = process.env.NODE_ENV !== 'production'
var MiniCssExtractPlugin = require('mini-css-extract-plugin')
var utils = require('../utils')
var buildEnv = require('../../env')
module.exports = [
  {
    test: /\.jsx?$/,
    use: ['babel-loader'],
    exclude: /node_modules/,
  },
  {
    test: /\.json$/,
    use: ['json-loader'],
  },
  {
    test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
    use: [
        {
          loader: 'url-loader',
          options: {
              limit: 1024,
              outputPath: 'imgs',
          }
        }
    ],
  },
  {
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
    use: [
        {
          loader: 'url-loader',
          options: {
              limit: 10000,
              name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
          }
        }
    ],
  },
  {
    test: /\.(sa|sc|c)ss$/,
    use: [
      devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
      "css-loader",
      "postcss-loader",
      {
        loader: "sass-loader",
        options: {
          additionalData: `@import "assets/scss/_theme.scss";$version: ${buildEnv.version.replace(/\./g, '_')};`,
          implementation: require('sass'),
          sassOptions: {
            fiber: false,
          },
        }
      }
    ],
  },
]