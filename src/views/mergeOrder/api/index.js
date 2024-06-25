import $http from 'assets/js/ajax.js'
import Bus from 'assets/js/bus'
import { isCOE, getIPCVideoMakeTap } from '../config'
import { getWid, localStore, Cookie, Base64, isEmpty, getObjType } from 'assets/js'
// 查询
export function getSearch(searchCode) {
  return $http({
    url: '/merge/getPackageList',
    method: 'get',
    data: {
      searchCode
    }
  })
}

// 提交
export function getSubmit(data) {
  return $http({
    url: "/merge/sumbit",
    method: 'post',
    data,
    returnRes: true
  })
}

// 少票
export function getLessCode(data) {
  return $http({
    url: '/merge/missing',
    method: 'post',
    data
  })
}

// 拆单
export function getSplitCode(data) {
  return $http({
    url: '/merge/order/separate',
    method: 'post',
    data,
    returnRes: true
  })
}

// 合箱需要体积时， 小票打印接口
export function getVolumeTagPrint(deliveryCode, jobNodeCode = 'merge') {
  return $http({
    url: '/merge/outstock/ticket/print',
    method: 'post',
    data: {
      deliveryCode,
      warehouseId: getWid(),
      jobNodeCode
    },
    returnRes: true
  }).then(res => {
    return getDeCodeRes(res)
  })
}
// 小票 二段订单号解密
export function getDeCodeRes(res) {
  const data = res && res.data;
  const documents = data && Array.isArray(data.documents) && data.documents;
  const contents = !isEmpty(documents) && documents[0] && Array.isArray(documents[0].contents) && documents[0].contents;
  const cData = !isEmpty(contents) && contents[0] && contents[0].data;
  const dLabel = cData && cData.label;
  // 存在 orderCode 时， 使用 base64 解密
  if (dLabel && dLabel.orderCode && !dLabel.referLogisticsOrderCode) {
    dLabel.referLogisticsOrderCode = Base64.deCode(dLabel.orderCode)
    delete dLabel.orderCode
  }
  return res
}

// 获取天眼配置
export const getEyeVideoConfig = window.getVideoRecordConfig;

// 非当前订单包裹异常上报
export function getMorePackage({deliveryCode, searchCode}) {
  return $http({
    url: '/merge/morePackage',
    method: 'get',
    data: {deliveryCode, searchCode}
  }).then(res => {
    let strMsg='扫描的运单号不是当前合箱的包裹，请确认无误后关闭提示继续扫描。运单号：' + deliveryCode;
    if (res == 1) {
      strMsg = '扫描的运单号不是当前合箱的包裹，请先操作PDA异常处理再操作合箱打单。运单号：'+ deliveryCode;
    }
    return strMsg
  })
} 

// 已取消包裹拦截
export function getConfirmCancel(deliveryCode) {
  return $http({
    url: '/merge/confirmCancel',
    method: 'get',
    data: {
        deliveryCode
    }
  })
}

// PC 扫描包裹后通知通知后台
export const getNotifyServer = getIPCVideoMakeTap;