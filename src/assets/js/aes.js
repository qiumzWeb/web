import Cookie from 'assets/js/cookie'
import TraceSdk from '@ali/trace-sdk';
import TracePvPlugin from '@ali/trace-plugin-pv'
import TracePerfPlugin from '@ali/trace-plugin-perf'
import TraceApiPlugin from '@ali/trace-plugin-api'
import TraceResourceErrorPlugin from '@ali/trace-plugin-resource-error'
import {isEmpty} from 'assets/js'
const isProd = location.hostname === 'pcs-web.wt.cainiao.com'
const ARMS = TraceSdk ({
  pid: isProd ? "pcs-manage" : 'pcs-web',
  errorEnable:true, // 非必填 默认已经开启了js报错，若关闭则设置errorEnable:false
  env: 'prod', //可选 prod | pre | daily | string 
  uid: Cookie.get('accountId'),
  ignoreErrors: [], //可选，用法参考"初始化配置说明"
  aplusUrl: 'gm.mmstat.com', // 可选 默认gm.mmstat.com, 海外(新加坡)埋点配置 sg.mmstat.com
  ignoreErrors: [
    /^Script error\.?$/, // 正则表达式
    function(str) { // 方法
        if (str && str.indexOf('Unkown error') >= 0) return true;   // 不上报
        return false;   // 上报
    }
  ],
  plugins: [
    [TracePvPlugin],
    [TraceApiPlugin, {sampling: 0.1}],
    [TracePerfPlugin],
    [TraceResourceErrorPlugin]
  ],
  getUrl: function() {
    return document.title
  }
});

export default {
  // 开启监控，注入配置
  ...ARMS,
  open: function(opts) {
    if(!isEmpty(opts)) this.setConfig(opts)
    this.install()
  },
  changePage: function(name) {
    document.title = name
  }
}
