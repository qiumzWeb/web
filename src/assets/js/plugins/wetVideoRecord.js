import WET from './wet'
import { Cookie, getWid } from "assets/js"

export default class WetVideoRecord {
  constructor(opt) {
    this.open(opt)
  }
  async open(opt) {
    // 读取配置
    const { isWetUsbOpen, siteCode } = await window.getEyeVideoConfig();
    this.wetEnable = isWetUsbOpen;
    this.resCode = siteCode;
    if (!isWetUsbOpen) return
    this.WET = new WET(opt || {
      messageType: 1,
      businessType: 5,
      debug: true,
      success: (res) => {
        log(res, 'wet 视频 socket 连接成功=======')
      },
      handlerError: (err) => {
        window.CatchErrorLog({
          status: false,
          message: 'WET视频录制称连接失败',
          code: 'wet_video_record'
        })
      },
      handlerClose: () => {
        window.CatchErrorLog({
          status: false,
          message: 'WET视频录制连接断开',
          code: 'wet_video_record'
        })
      }
    })
    this.WET.onChange = function(callback) {
      const that = this;
      // 视频录制返回信息
      this.getValueDom().addEventListener('valuechange', function() {
        const res = JSON.parse(that.getValueDom().value);
        console.log(res, '视频录制返回信息-========');
        typeof callback === 'function' && callback(res);
      })
    }
  }
   // 视频监控
  // 启动录像
  async startVideoRecord (params) {
    if (!this.wetEnable) return
    log('==========开始录制，===========', this.resCode, )
    this.WET.send({
      data: {
        account: params.account,
        warehouse: getWid(),
        warehouseId: getWid(),
        resCode: this.resCode,
        waybillNo: params.waybillNo,
        workerStationNo: Cookie.get("jobPlaceCode") || '',
        waybillArray: params.waybillArray,
        ...params
      }
    })
  }
  // 结束录制
  async stopVideoRecord () {
    if (!this.wetEnable) return
    log('==========结束录制，===========')
    this.WET.send({ messageType: 3})
  }
  // 视频打水印
  async videoMakeTap (waybillNo) {
    if (!this.wetEnable) return
    log('==========打水印，===========')
    this.WET.send({
      messageType: 2,
      data: {waybillNo}
    })
  }
}