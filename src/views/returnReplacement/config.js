import { Cookie, Print } from 'assets/js/utils'
// 仓id
export const warehouseId = Cookie.get('warehouseId')

// 打印面单 
export function PrintLabel(data) {
  return new Print(data).send()
}

// 是否需要一段面单
export const isNeedType = [
  {label: '需要', value: 'true'},
  {label: '不需要', value: 'false'}
]

// 包裹类型
export const packageTypeOptions = [
   {label: '正常包裹', value: '0'},
   {label: '异常包裹-品类限制：带电', value: '5829'},
   {label: '异常包裹-品类限制：电容类', value: '5830'},
   {label: '异常包裹-品类限制：液体', value: '5831'},
   {label: '异常包裹-品类限制：粉末', value: '5832'},
   {label: '异常包裹-品类限制：膏状体', value: '5833'},
   {label: '异常包裹-品类限制：易碎品', value: '5834'},
   {label: '异常包裹-品类限制：磁性物品', value: '5835'},
   {label: '异常包裹-限运品', value: '5836'},
   {label: '异常包裹-禁运品：枪支弹药', value: '5837'},
   {label: '异常包裹-禁运品：管制器具', value: '5838'},
   {label: '异常包裹-禁运品：易燃易爆', value: '5839'},
   {label: '异常包裹-禁运品：压缩容器（含打火机、电子烟等）', value: '5840'},
   {label: '异常包裹-禁运品：毒性物质（毒品、食品、药品、活体）', value: '5841'},
   {label: '异常包裹-禁运品', value: '5842'},
   {label: '异常包裹-海外退件', value: '5843'},
   {label: '异常包裹-其他原因', value: '5844'},
]