import { Cookie, Print } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')

// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}

// 异常类型
export const excelPtionTypeOptions = [
  {label: '丢失', value: '300'},
  {label: '破损', value: '400'}
]