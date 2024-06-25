var path = require('path')
var buildEnv = require('../../env')
module.exports = {
    build: {
        assetsRoot: path.resolve(__dirname, '../../build'),
        assetsSubDirectory: 'static',
        assetsPublicPath: buildEnv.rootPath,
        assetsDllChunks: {
            ['ali_react']: ['react', 'react-dom', 'react-router', 'react-router-dom','axios'],
        },
        assetsChunks: {
            // react_wangeditor: ['@wangeditor'],
            // react_echarts: ['echarts', 'zrender'],
            // vendor_tools: ['@alifd'],
        },
    },
    dev: {
        port: 9898,
        assetsDallPath: path.resolve(__dirname, '../../static/js/'),
        assetsDllOutPath: path.resolve(__dirname, '../../dll/'),
        assetsSubDirectory: 'static',
        assetsPublicPath: 'https://localhost:9898/',
        cachesDllDirectory: {
          type: 'filesystem',
        },
        proxyTable: {
            '/pcsweb':{
                "target":'https://pre-pcs-manage.wt.cainiao.com/',
                "changeOrigin": true,
                "pathRewrite":{'^/pcsweb':''},
                "secure": false,
            },
            '/gos': {
                target: 'https://pre-api.gos.cainiao.com/',
                changeOrigin: true,
                secure: false
            },
            '/pcsapiweb': {
                target: 'https://pre-pcs-web.wt.cainiao.com/',
                changeOrigin: true,
                "pathRewrite":{'^/pcsapiweb':''},
                secure: false
            },
            '/pcsfbi': {
                target: 'https://pre-pcs-manage.wt.cainiao.com/',
                changeOrigin: true,
                "pathRewrite":{'^/pcsfbi':''},
                secure: false
            },
            '/pcsservice': {
                "target":'https://pre-pcs-service.wt.cainiao.com/',
                "changeOrigin": true,
                "pathRewrite":{'^/pcsservice':''},
                "secure": false,
            },
            '/webopration': {
              "target":'https://127.0.0.1:9898/',
              "changeOrigin": true,
              "pathRewrite":{'^/webopration':''},
              "secure": false,
            },
            '/pcslogin': {
              "target":'https://cnlogin.cainiao.com/',
              "changeOrigin": true,
              "pathRewrite":{'^/pcslogin':''},
              "secure": false,
            }
		},
        cssSourceMap: false
    }
}
