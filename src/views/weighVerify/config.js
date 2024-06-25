import { Cookie, PowWeight } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')
// 电子称重
export const POWWT = new PowWeight()

