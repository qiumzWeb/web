import { Cookie, Print } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')

// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}
