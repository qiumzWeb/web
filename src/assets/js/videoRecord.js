import { _getName } from 'assets/js';
import { Cookie, PowWeight, WetVideoRecord, Bus } from 'assets/js/utils';
import $http from 'assets/js/ajax';

// 仓id
export const warehouseId = Cookie.get('warehouseId')
// 电子称重
export const POWWT = new PowWeight()
// Pow Core 设备
export const PowBox = POWWT.POWWT
// wet 视频录制
export const WETRecord = new WetVideoRecord()

// 判断是否是COE 业务  
//  天眼录制 使用 鹰眼 +  lemoCode 设备的时候 ， 需要特殊处理
export const powAndPCWarehouseId = [
  '10006001',
  '10005001',
  '10046003', // 台湾海运-厦门自营集运仓
  '10026001', // 天猫海外_华东新马自营集运仓

] 
export const isCOE = powAndPCWarehouseId.some(w => w == warehouseId)


// 视频录制
// 启用视频录制
export async function _startRecord(data) {
  const { isLemoCodeUsbOpen, isWetUsbOpen, empNo } = await window.getEyeVideoConfig();
  try {
      if (isLemoCodeUsbOpen) {
        // lemoCode USB 录制
        PowBox.startVideoRecord({
            warehouse: Cookie.get('warehouseId'),
            workerStationNo: Cookie.get("jobPlaceCode") || '',
            employeeNo: data.employeeNo || empNo,
            waybillNo: data.waybillNo || data.deliveryCode || '',
            lpNo: data.lpNo || data.deliveryCode  || '',
            waybillArray : Array.isArray(data.voList) && data.voList.map((item) => {
              return item.deliveryCode;
            }) || [data.deliveryCode || ''],
            flowNo: data.flowNo || data.deliveryCode || '',
            account: data.employeeNo || empNo,
            busiType: 6,
        }).then(function(){
          if (!data.waybillNo && !data.cartCode) {
            PowBox.videoMakeTap(data.deliveryCode).then(console.log);
          } else {
            data.waybillNo  && PowBox.videoMakeTap(data.waybillNo).then(console.log);
            data.cartCode && PowBox.videoMakeTap(data.cartCode).then(console.log);
          }
        })
      }
      if (isWetUsbOpen) {
        // WET USB 录制
        WETRecord.startVideoRecord({
          employeeNo: data.employeeNo || empNo,
          waybillNo: data.waybillNo || data.deliveryCode || '',
          lpNo: data.lpNo || data.deliveryCode || '',
          waybillArray : Array.isArray(data.voList) && data.voList.map((item) => {
            return item.deliveryCode;
          }) || [data.deliveryCode || ''],
          flowNo: data.flowNo || data.deliveryCode || '',
          account: data.employeeNo || empNo,
        })
      }
  } catch(e) {console.log('videoRecord error log:', e)}
}

// 停止视频录制
export async function _stopRecord(data) {
  const { isLemoCodeUsbOpen, isWetUsbOpen } = await window.getEyeVideoConfig();
  if (isLemoCodeUsbOpen && (data.waybillNo || data.deliveryCode || data.cartCode) && PowBox && PowBox.stopVideoRecord) {
    PowBox.stopVideoRecord(data.waybillNo || data.deliveryCode || data.cartCode, data.cartCode || data.waybillNo || data.deliveryCode)
  }
  console.log('===========',data, isWetUsbOpen, '==============')
  if (isWetUsbOpen) {
    WETRecord.stopVideoRecord()
  }
}

// 视频录制打水印
export async function getVideoMakeTap(deliveryCode) {
  const { isLemoCodeUsbOpen, isWetUsbOpen } = await window.getEyeVideoConfig();
  if (isLemoCodeUsbOpen && PowBox && PowBox.videoMakeTap) {
    PowBox.videoMakeTap(deliveryCode).then(console.log);
  }
  if (isWetUsbOpen) {
    WETRecord.videoMakeTap(deliveryCode)
  }
}

// IPC视频录制 接口打水印
// PC 扫描包裹后通知通知后台
export async function getIPCVideoMakeTap(mailNo, Message) {
  const { isIPCOpen } = await window.getEyeVideoConfig();
    if (!isIPCOpen) return
    const jobPlaceCode = Cookie.get("jobPlaceCode");
    if (jobPlaceCode) {
      $http({
        url: '/merge/mergeCheckPackage',
        method: 'post',
        data: {
            jobPlaceCode,
            warehouseId: Cookie.get('warehouseId'),
            mailNo: mailNo
        },
      }).catch(e => {
        console.log(e)
        // 仅在PC 下提示
        if(!isPow()) {
          Message && Message.error(e.message || '作业台号校验失败')
        }
      })
    } else {
      Bus.$emit('setJobPlaceCode')
    }
}

// IPC 视频录制，结束录制
export async function getIPCStopRecord(deliveryCode) {
  const { isIPCOpen, currentNode } = await window.getEyeVideoConfig();
  const jobPlaceCode = Cookie.get("jobPlaceCode");
  if (isIPCOpen) {
    $http({
      url: '/mergingWeighing/sendVideoRecordByPackageCode',
      method: 'post',
      data: {
        deliveryCode,
        tableCode: jobPlaceCode,
        warehouseId: Cookie.get('warehouseId'),
        videoJobTypeCode: currentNode
      }
    })
  }
}

// 校验桌号
export function checkJobCode(onSearch) {
  return new Promise((resolve, reject) => {
    window.getEyeVideoConfig().then(res => {
      if (res.openSwitch == 'true') {
        if (
          !Cookie.get('jobPlaceCode')
        ) {
          Bus.$emit('setJobPlaceCode', onSearch)
          reject('请设置桌号')
        } else {
          resolve(true)
        }
      } else {
        resolve(true)
      }
    }).catch(e => resolve(true))
  })
}

// 新版录制
// 创建天眼录制
export class VideoRecordBox {
  constructor() {
    this.deliveryCode = ''
  }
  start(data) {
    log(`=====开始录制====${JSON.stringify(data)}`)
    this.deliveryCode = data.waybillNo || data.cartCode || data.deliveryCode || ("JYB" + Date.now())
    _startRecord(data);
  }
  makeTap(Message, deliveryCode) {
    log(`=====记录扫描包裹====${this.deliveryCode}`)
    getVideoMakeTap(deliveryCode || this.deliveryCode);
    getIPCVideoMakeTap(deliveryCode || this.deliveryCode, Message)
  }
  end(data) {
    data = data || {deliveryCode : this.deliveryCode}
    log(`=====结束录制====${JSON.stringify(data)}`)
    _stopRecord(data);
    getIPCStopRecord(this.deliveryCode)
  }
    // 开始录制
  startRecord(searchCode, Message) {
    this.deliveryCode = searchCode
    this.start({deliveryCode: searchCode})
    this.makeTap(Message)
  }
  // 结束录制
  finishRecord() {
    this.end({deliveryCode : this.deliveryCode})
  }
}


