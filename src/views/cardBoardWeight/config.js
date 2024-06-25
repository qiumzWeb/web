import { Cookie, PowWeight } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')
// 电子称重
export const POWWT = new PowWeight()

// Pow Core 设备
export const PowBox = POWWT.POWWT
// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}