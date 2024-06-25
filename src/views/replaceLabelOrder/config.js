import { Cookie, Print } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')

// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}

// 小票类型
export const typeOptions = [
  {label: '合箱打单小票', value: 'merge'},
  {label: '称重打单小票', value: 'weight'},
]