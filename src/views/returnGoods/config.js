import { _getName, isSame } from 'assets/js'
import { Cookie, PowWeight, Print } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')
// 上一单扫描key
export const lastPkgCountKey = `${warehouseId}_lastPkgBackCount`
// 电子称重
export const POWWT = new PowWeight()
// Pow Core 设备
export const PowBox = POWWT.POWWT
// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}

// 表头
export const columns = [
  { title: '运单包裹号', key: 'deliveryCode' },
  { title: '包裹重量', key: 'weight', cell: (val, index, record) => val + (record.weightUnit || '') },
  { title: '派送物流公司', key: 'logisticName' },
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
  {label: '超体积', value: 'returnOverVolumeSeparte'},
  {label: '超重', value: 'returnOverWeightSeparte'}
]

// 退货快递公司
export const returnShipperOptions = [
  {label: '顺丰', value: 'SF'},
]