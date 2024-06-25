
import $http from 'assets/js/ajax';
import {getWid, toUrlCode} from 'assets/js';
// 错误码配置
window.ErrorLogConfig = {}
const errorCode = {
  lemoCode_print: 'lemoCode_print',
  cloud_print: 'cloud_print',
  agent_print: 'agent_print',
  wet_weight: 'pc_wet_weight',
  pow_weight: 'lemoCode_weight',
  volume_weight: 'volume_weight',
  lemoCode_video_record: 'lemoCode_video_record',
  wet_video_record: 'wet_usb_video_record'
}
Object.entries(errorCode).forEach(([key, code]) => {
  window.ErrorLogConfig[key] = {
    getCode: () => code // + toUrlCode(location.pathname)
  }
})
/**
 * 错误日志上报
 */
window.CatchErrorLog = function ErrorLog (item) {
  try {
    $http({
      url: '/web/monitor/collect',
      method: 'post',
      data: {
        metricName: window.ErrorLogConfig[item.code].getCode(), // 上报类型
        warehouseId: getWid(), // 仓库
        success: item.status, // 是否成功
        errorCode: item.errorCode || '', // 错误码
        message: item.message, // 上报消息描述
      }
    })
  } catch(e) {console.log(e)}

}