import React from 'react'
import ReactApp from 'react-dom/client'
import App from '@/RouterView'
// 视频录制
require('assets/js/plugins/webcam');
// 页面渲染
ReactApp.createRoot(document.getElementById('pcs-app')).render(<App></App>)



