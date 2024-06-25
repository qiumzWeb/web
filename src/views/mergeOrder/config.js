import React from 'react';
import { _getName, isSame } from 'assets/js'
import { Print } from 'assets/js/utils'
// 视频录制配置
import { 
  isCOE, warehouseId, POWWT, PowBox, WETRecord,
  _startRecord, _stopRecord, getVideoMakeTap, getIPCVideoMakeTap, checkJobCode
} from 'assets/js/videoRecord'

export {
  isCOE, warehouseId, POWWT, PowBox, WETRecord,
  _startRecord, _stopRecord, getVideoMakeTap, getIPCVideoMakeTap, checkJobCode
}

// 上一单扫描key
export const lastPkgCountKey = `${warehouseId}_lastPkgCount`

export const isUNAutoSubmit = ['10024002', '20132001'].some(s => s == warehouseId)

// 是否启用自动提交
export const isUnUseAutoSubmit = ['10024002'].some(s => s == warehouseId)

// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}
window.print = PrintLabel

// 异常类型
export const exceptionTypeOptions = [
  {label: '已超时', value: '100'},
  {label: '已取消', value: '200'},
  {label: '已标记丢失', value: '300'},
  {label: '已标记破损', value: '400'},
  {label: '包裹超大', value: '401'},
  {label: '包裹销毁', value: '404'},
  {label: '逆向包裹', value: '500'},
  {label: '关联包裹异常', value: '800'},
]


// 显示异常描述
export function _getExceptionDesc (exceptionType, deliveryCode) {
  exceptionType = parseInt(exceptionType);
  const msg = (val, desc) => `包裹${deliveryCode}${_getName(exceptionTypeOptions, val)},${desc}`
  if([300, 400, 800].includes(exceptionType)) {
    return msg(exceptionType, '请异常处理后再合箱')
  } else {
    return msg(exceptionType)
  }
}

// 表头
export const columns = [
  { title: '运单包裹号', key: 'deliveryCodeEncrypt' },
  { title: '包裹重量', key: 'weight', cell: (val, index, record) => val + (record.weightUnit || '') },
  { title: '派送物流公司', key: 'logisticName' },
  { title: '目的国', key: 'country', show: false},
  { title: '状态', key: 'exceptionType', cell: (val, index, record) => {
    if(isNaN(val)) return val
    const text =  _getName(exceptionTypeOptions, val)
    if (text) {
      return text
    }
    if (isCHOICEPackage(record)) {
      return <div style={{color: '#f00', marginLeft: 100}}>拆包装</div>
    }
    return null
  }},
]

// 标记扫描
export function getMark(d) {
  // 标记已扫
  d.isActive = 1
  // 标记扫描时间
  d.deliveryCodeTime = `${d.deliveryCode}_${Date.now()}`
}

// 标记禁用
export function setDisabled(data, val) {
  Array.isArray(data) && data.forEach(d => {
    if (isSame(d.deliveryCode, val)) {
      d.disabled = true
      d.exceptionType = '已拆单'
    }
  })
}

// 标记拆包去泡，拆包去泡订单 提交时需要弹窗输入 员工工号
export function setUnpackingStatus(data) {
  Array.isArray(data) && data.forEach(d => {
      d.exceptionType = '拆包去泡'
  })
}


// 表格row Class 显示
export const setRowClass = (item, index) => {
  if (item.exceptionType && !isNaN(item.exceptionType)) return 'error'
  if (item.disabled) return 'disabled'
  if (item.isActive) return 'success'
}

// 获取包裹标记list
export function getDeliveryCode(data){
  return {
    pass: data.filter(d => d && d.isActive && !d.disabled).map(d =>d && d.deliveryCode),
    miss: data.filter(d => d && !d.isActive).map(d =>d && d.deliveryCode),
    time: data.filter(d => d && d.deliveryCodeTime && !d.disabled).map(d => d && d.deliveryCodeTime),
    scanned: data.filter(d => d && d.isActive).map(d =>d && d.deliveryCode)
  }
}
// 拆单原因
export const splitCodeReasonOptions = [
  {label: '超体积', value: 'mergeOverVolumeSeparte'},
  {label: '超重', value: 'mergeOverWeightSeparte'}
]


// 特殊合箱逻辑
// 页面生成失败校验
export function checkBillIsFail(res) {
  return res.errCode === 'F0105_107_4_B_018'
}
// 合箱需要测量体积时合箱成功code
export function checkVolumeMergeCode(res) {
  return res.errCode === 'F0105_107_4_B_026'
}

// 判断是否是汇单包裹
export function isCHOICEPackage(data) {
  return data && data.source == "CAINIAO_CHOICE"
}