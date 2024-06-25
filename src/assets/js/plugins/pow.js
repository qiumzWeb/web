export default class Pow {
  constructor() {}
  // 监听称重
  onWeightChange(callback) {
    document.addEventListener('powWeigh', (data) => {
      const param = data.param || { value: 0, unit: "KG" };
      let weight = param.value;
      if (param.unit.toUpperCase() === "G") {
        weight = (weight / 1000).toFixed(2);
      }
      callback(weight);
    }, false);
  }

  // 打印面单
  print(data) {
    return callWindVane(nativeClassName, "print", data);
  }

  // 视频监控
  // 启动录像
  startVideoRecord (params) {
    if (!this.isOpenAudio()) return Promise.resolve();
    return callWindVane(nativeClassName, 'startRecord', params)
      .then(e => {
        window.CatchErrorLog({
          code: 'lemoCode_video_record',
          status: true,
          message: 'lemoCode视频录制启动成功' + JSON.stringify(params)
        })
        window.log(`开始录制： ${JSON.stringify(e)},\n 请求参数： ${JSON.stringify(params)}`)
      })
      .catch(e => {
        window.CatchErrorLog({
          code: 'lemoCode_video_record',
          status: false,
          message: 'lemoCode视频录制启动失败，请检查摄像头' + JSON.stringify(params)
        })
        window.log(`开始录制错误： ${JSON.stringify(e)},\n 请求参数： ${JSON.stringify(params)}`)
      })
  }
  // 结束录制
  stopVideoRecord (waybillNo, bizCode) {
    if (!this.isOpenAudio()) return Promise.resolve();
    return callWindVane(nativeClassName, 'stopRecord', {waybillNo, bizCode})
      .then(e => {
        window.CatchErrorLog({
          code: 'lemoCode_video_record',
          status: true,
          message: 'lemoCode视频结束录制成功' +  JSON.stringify({waybillNo, bizCode})
        })
        window.log(`结束录制： ${JSON.stringify(e)},\n 请求参数： ${JSON.stringify({waybillNo, bizCode})}`)
      })
      .catch(e => {
        window.CatchErrorLog({
          code: 'lemoCode_video_record',
          status: false,
          message: 'lemoCode视频结束录制失败' + JSON.stringify({waybillNo, bizCode})
        })
        window.log(`结束录制错误： ${JSON.stringify(e)},\n 请求参数： ${JSON.stringify({waybillNo, bizCode})}`)
      })
  }
  // 视频打水印
  videoMakeTap (waybillNo) {
    if (!this.isOpenAudio()) return Promise.resolve();
    return callWindVane(nativeClassName, 'makeTag', {waybillNo})
      .then(e => {
        window.CatchErrorLog({
          code: 'lemoCode_video_record',
          status: true,
          message: 'lemoCode视频打水印成功' + JSON.stringify({waybillNo})
        })
        window.log(`视频打水印： ${JSON.stringify(e)},\n 请求参数： ${JSON.stringify({waybillNo})}`)
      })
      .catch(e => {
        window.CatchErrorLog({
          code: 'lemoCode_video_record',
          status: false,
          message: 'lemoCode视频打水印失败' + JSON.stringify({waybillNo})
        })
        window.log(`视频打水印错误： ${JSON.stringify(e)},\n 请求参数： ${JSON.stringify({waybillNo})}`)
      })
  }

  // 是否启用
  isOpenAudio() {
    var baseInfo = JSON.parse(window.localStorage.getItem('baseInfo') || JSON.stringify({}));
    return baseInfo.openSwitch == 'true';
  }

  // 文字语音播报
  SpeakTextToAudio(text, rate = 1, volume = 1) {
    return callWindVane('CNCVoice', 'tts', {text, rate, volume})
    .then(res => {
      console.log(res)
      window.log(res)
    })
    .catch(e => {
      console.log(e)
      window.log(e)
    });
  }

  // 拍照
  takePhoto() {
    return callWindVane("WVCamera", "takePhoto", {
      type: '1', // 是否只允许拍照或者从相册选择
      mode: 'camera',
      v: '2.0',
      bizCode: 'cainiao',
      identifier: '34345455q5q'
    }).then(data_uri => {
      window.log(data_uri);
      return data_uri
    }).catch(err => {
      window.log(err)
      return null
    })
  }
}