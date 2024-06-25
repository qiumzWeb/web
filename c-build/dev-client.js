import { BasePath } from 'assets/js'
var hotClient = require('webpack-hot-middleware/client?noInfo=true&reload=false')
hotClient.setOptionsAndConnect({
  path:  BasePath + '/__webpack_hmr'
})
hotClient.subscribe(function (event) {
    if (event.action === 'reload') {
        window.location.reload()
    }
})
