import { _getName, isSame, getWid } from 'assets/js'


// 表头
export const columns = [
  { title: '运单包裹号', key: 'trackingNumber' },
  { title: '包裹LP号', key: 'logisticsOrderCode' },
  { title: '包裹重量(g)', key: 'weight', cell: (val, index, record) => (val || '') + (record.weightUnit || '') },
  { title: '状态', key: 'statusDesc'}
]

// 标记扫描
export function getMark(d) {
  // 标记已扫
  d.isActive = 1
  // 标记扫描时间
  d.deliveryCodeTime = `${d.trackingNumber}_${Date.now()}`
  // 标记已入库
  d.statusDesc = '已入库'
  d.status = 10
}


// 表格row Class 显示
export const setRowClass = (item, index) => {
  if (item.exceptionStatus) return 'error'
  if (item.disabled) return 'disabled'
  if (item.isActive) return 'success'
}

