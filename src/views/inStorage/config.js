import { _getName } from 'assets/js'
import { Cookie, PowWeight, Print } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')

// 电子称重
export const POWWT = new PowWeight()

// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}
