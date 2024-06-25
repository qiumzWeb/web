var webpack = require('webpack')
var path = require('path')
var config = require('./index')
module.exports = {
  chunks: 'all',
  maxInitialRequests: 10,
  minSize: 20000,
  minChunks: 4,
  cacheGroups: {
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      minChunks: 1,
      name(module) {
        const test = module.context.match(
          /[\\/]node_modules[\\/](.*?)([\\/]|$)/,
        )
        const packageName =  test && test[1] || '';
        let chunkName = 'vendor_react';
        const chunks = config.build.assetsChunks || {};
        Object.entries(chunks).forEach(([name, key]) => {
          key.forEach(k => {
            if (packageName.includes(k)) {
              chunkName = name
            }
          })
        })
        return chunkName;
      },
    },
    default: {
      name: 'vendor_common'
    }
  },
}