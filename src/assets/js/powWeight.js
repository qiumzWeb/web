import Cookie from './cookie'
import {isTrue, getObjType} from './common'
import Pow from './plugins/pow'
import WET from './plugins/wet'
import { SpeakTextToSpeech } from './textToSpeech'

/**
 * 电子称重
 */ 

// lemoCode 称重
let lemoCodePoWWt = null

// PC wet 称重
let PCWt = null

 export default class PowWeight {
  constructor(opt) {
    this.POWWT = null
    this.PCWt = null
    this.weight = ''
    this.print = null
    isPow() ? this.openPow() : this.openWET(opt)
    window.__ProwWT = this// 方便调式用
  }
  loop(msg){
    return {
      log: (logItem = {}) => {
        window.CatchErrorLog({
          status: false,
          message: msg,
          ...logItem
        })
      }
    }
  }
  // 获取重量
  /**
   * 
   * @param {Function | Object} callBack  实时回调
   * @param {Object} opts
   * @param {Function} opts.onChange 实时回调
   * @param {Function} opts.onCompleted 完成称重时回调
   */
  getWeight(callBack, opts) {
    // 重量稳定定时器
    let timer = null
    // 历史重量
    let oldValue = null
    opts = getObjType(opts) === 'Object' ? opts : {}
    if (getObjType(callBack) === 'Object') {
      opts = callBack
    }
    if (typeof callBack === 'function') {
      opts.onChange = callBack
    }
    this.POWWT.onChange(val => {
      // 实时推送重量
      if (typeof opts.onChange === 'function') {
        val = typeof val === 'string' ? val.trim() : val;
        if (isTrue(val) && val !== oldValue) {
          oldValue = val
          opts.onChange(val)
          // 重量稳定时 推送实际重量
          if (typeof opts.onCompleted === 'function') {
            clearTimeout(timer)
            timer = setTimeout(() => {
              opts.onCompleted(val)
              oldValue = null
            }, window.getAutoSubmitTime())
          }
        }
      }

    })
  }
  onWeightTest(callback) {
    let weight = 0
    let count = 0
    return function test() {
      if (count > 1000) return
      count++
      // if (weight > 0) {
      //   weight = ''
      // } else {
        weight += 5
      // }
      callback(weight)
      setTimeout(test, 700)
    }
  }
  openPow() {
    try {
      this.POWWT = lemoCodePoWWt || (lemoCodePoWWt = new Pow());
      this.print = this.POWWT.print
      let _self = this
      this.POWWT.onChange = function (callback) {
        // 测试电子称
        window.onWeightTest = _self.onWeightTest(callback)
        // 电子称返回重量
        this.onWeightChange(callback)
      }
      window.CatchErrorLog({
        status: true,
        message: 'lemoCode电子称连接成功',
        code: 'pow_weight'
      })
    } catch(e) {
      window.log(e)
      window.CatchErrorLog({
        status: false,
        message: e.message || e,
        code: 'pow_weight'
      })
    }
    // 天机设备
    try {
      this.PCWt = PCWt || (PCWt = new window.visionSocket());
    } catch(e) {
      window.log(e)
    }
  }
  openWET(opt) {
    // 普通电子称
    try {
      let _self = this
      this.POWWT = lemoCodePoWWt || (lemoCodePoWWt = new WET(opt || {
        messageType: 3,
        businessType: 6,
        debug: true,
        handlerError: (err) => {
          window.CatchErrorLog({
            status: false,
            message: 'PC_WET电子称连接失败',
            code: 'wet_weight'
          })
        },
        handlerClose: () => {
          window.CatchErrorLog({
            status: false,
            message: 'PC_WET电子称连接断开',
            code: 'wet_weight'
          })
        }
      }));
      // 外部获取电子称重量
      this.POWWT.onChange = function (callback) {
        const that = this
        // 测试电子称
        window.onWeightTest = _self.onWeightTest(callback)
        // 电子称返回重量
        // 获取电子称重量返回
        this.getValueDom().addEventListener('valuechange', function() {
          callback(that.realWeight)
        })
      }
    } catch(e) {
      window.log(e)
      window.CatchErrorLog({
        status: false,
        message: 'PC_WET电子称连接失败',
        code: 'wet_weight'
      })
    }
    // 天机设备
    try {
      this.PCWt = PCWt || (PCWt = new window.visionSocket());
    } catch(e) {
      window.log(e)
    }
  }
  // 获取天机重量和体积
  getVolumeAndWeight(businessCode, callback, Message) {
    //businessCode 包裹号
    callback = typeof callback === 'function' ? callback : this.loop
    Message = Message || {
      error: this.loop,
      success: this.loop
    }
    this.PCWt.send({
      bussinessType: 12,
      messageType: 1,
      data: {businessCode}
    }, function Success(res){
      const weight = res && res.data && res.data.weight || ''
      const data = {
        weight,
        width: '',
        height: '',
        length: ''
      }
      Message.clear()
      let errorTitle = ''
      let errorMsg = ''
      // 数据异常
      if (res && !res.success) {
        callback(data)
        errorTitle = '称重异常,'
        errorMsg = '请检查电子称'
        if (res.TLE) {
          errorMsg = '获取稳定重量超时'
        } else if (weight == -3) {
          errorMsg = '请将电子称归零'
        } else if (weight == 0) {
          Message.clear()
          return
        }
        Message.error(errorTitle + errorMsg).log({code: 'volume_weight'})
      } 
      // 数据正常
      if (res && res.type == 12 && res.success) {
        let newData = {}
        const resData = res.data || {}
        const width = resData.width
        const length = resData.length
        const height = resData.height
        if (isTrue(businessCode) && resData.businessCode == businessCode) {
          if (
            width > 0 && length > 0 && height > 0
          ) {
            Object.assign(newData, resData)
          }

          if (res.TLE || res.errCode < 0) {
            errorTitle = '量方异常,'
            errorMsg = res.errMsg || "体积测量设备受到干扰";
            res.TLE && (errorMsg = "体积测量超时");
            newData = {}
            Message.error(errorTitle + errorMsg).log({code: 'volume_weight'})
            callback(data)
            return
          }
        }
        Object.assign(data, newData)
      }
      callback(data)
    }, function Error(err) {
      window.CatchErrorLog({
        status: false,
        message: '天机设备连接失败',
        code: 'volume_weight'
      })
    })
  }

  // 播报文字语音
  speakText(text, opt) {
    const { rate, volume } = opt || opt || {
      rate: 1,
      volume: 1
    }
    if (isPow()) {
      this.POWWT.SpeakTextToAudio(text, rate, volume)
    } else {
      SpeakTextToSpeech(text, opt)
    }
  }

  // 拍照
  crateTakePhoto(webVideoRef) {
    let makePhoto = ()=> Promise.resolve()
    if (isPow()) {
      makePhoto = this.POWWT.takePhoto
    } else {
      getInitWebVedio();
      // 初始化摄像头
      function getInitWebVedio() {
        const webVideo = webVideoRef.current
        if (webVideo) {
          window.Webcam.set({
            width: 400,
            height: 300,
            image_format: 'jpeg',
            jpeg_quality: 75
          });
          window.Webcam.attach(webVideo);
        } else {
          setTimeout(() => {
            getInitWebVedio()
          }, 60)
        }
      }
      makePhoto = () => {
        return new Promise(resolve => {
          window.Webcam.snap(function(data_uri){
            window.log(data_uri)
            resolve(data_uri)
          });
        })
      }
    }
    return makePhoto
  }

}


