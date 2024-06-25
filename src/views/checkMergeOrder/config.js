import React from 'react'
import { _getName, isSame } from 'assets/js'
import { exceptionTypeOptions } from '@/views/mergeOrder/config'
// 表头
export const columns = [
  { title: '运单包裹号', key: 'deliveryCodeEncrypt' },
  { title: '包裹重量', key: 'weight', cell: (val, index, record) => val + (record.weightUnit || '') },
  { title: '物流公司', key: 'logisticName' },
  { title: 'SKU数(已扫/总数)', key: 'skuLength', cell: (val, index, record) => {
    const skuList = Array.isArray(record.skuList) && record.skuList || []
    const total = skuList.reduce((a, b) => {
      return a + (b.quantity || 0)
    }, 0)
    const hasChecked = skuList.reduce((a, b) => {
      return a + (b.scanCount || 0)
    }, 0)
    return hasChecked + '/' + total;
  }},
  { title: '状态', key: 'exceptionType', cell: (val) => {
    if(isNaN(val)) return val
    return _getName(exceptionTypeOptions, val)
  }}
]


// sku 表头
export const skuColumns = [
  { title: '运单包裹号', key: 'deliveryCode' },
  { title: '包裹重量', key: 'packageWeight', cell: (val, index, record) => val + (record.weightUnit || '') },
  { title: 'SKU', key: 'skuCode'},
  { title: 'SKU数(已扫/总数)', key: 'quantity', cell: function (val, index, record, columns, {onChange, rowIndex} = {}) {
    const currentScanCount = record.scanCount || 0
    const totalCount = val || 0
    return <div>
      {currentScanCount} / {totalCount}
      {currentScanCount > 0 && <span className="btn"
        onClick={() => {
          
          if (typeof onChange === 'function') {
            onChange({...record, scanCount: record.scanCount - 1}, rowIndex)
          }
        }}
        style={{
          display: 'inline-block',
          padding: "2px 10px",
          border: '1px solid',
          borderRadius: 4,
          marginLeft: 50,
          cursor: 'pointer'
        }}
      >删减</span> || null}
    </div>
  }}
]


// 标记包裹状态
export function setPackageStatus(d) {
  if (!d.exceptionType) {
    let statusStr =  d.packageStatusName || '';
    if (d.hasChecked && !d.notCheckFlag) {
      statusStr += ' / 已复核'
    }
    if (d.notCheckFlag) {
      d.hasChecked = true
      statusStr += ' / 无需复核'
    }
    d.exceptionType = statusStr
  }
}

// 标记sku 状态
export function getMark(item) {
  item.isActive = item.scanCount == item.quantity
  item.exceptionType = item.scanCount > item.quantity
}


// sku表格row Class 显示
export const setSkuRowClass = (item, index) => {
  if (item.exceptionType) return 'error'
  if (item.disabled) return 'disabled'
  if (item.isActive) return 'success'
}


// 获取包裹标记list
export function getSkuCode(data){
  const pass = []
  const miss = []
  const more = []
  if (Array.isArray(data)) {
    data.forEach(d => {
      const total = (d.quantity || 0)
      const scanCount = (d.scanCount || 0)
      const diffC = total - scanCount
      const pC = Math.min(total, scanCount)
      if (diffC < 0) {
        more.push({...d, quantity: Math.abs(diffC)})
        if (total > 0) {
          pass.push({...d, quantity: pC})
        }
      } else if (diffC == 0) {
        pass.push({...d, quantity: pC})
      } else if (diffC > 0) {
        miss.push({...d, quantity: diffC})
        pC && pass.push({...d, quantity: pC})
      }
    })
  }
  return { pass, miss, more }
}
