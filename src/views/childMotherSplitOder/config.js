import { isTrue, isEmpty, _getName, isSame } from 'assets/js'
import { Cookie, PowWeight, Print } from 'assets/js/utils'

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
export const lastPkgCountKey = `${warehouseId}_lastSplitCount`

// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}

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
    return msg(exceptionType, '请异常处理后再拆单')
  } else {
    return msg(exceptionType)
  }
}

// 表头
export const columns = [
  { title: '运单包裹号', key: 'deliveryCode' },
  { title: '包裹重量', key: 'weight', cell: (val, index, record) => val + (record.weightUnit || '') },
  { title: '派送物流公司', key: 'logisticName' },
  { title: '目的国', key: 'country', show: false},
  { title: '状态', key: 'exceptionType', cell: (val) => {
    if(isNaN(val)) return val
    return _getName(exceptionTypeOptions, val)
  }}
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