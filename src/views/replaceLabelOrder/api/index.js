import $http from 'assets/js/ajax.js'
import { getVolumeTagPrint } from '@/views/mergeOrder/api'

// 提交
export function getSubmit(deliveryCode, jobNodeCode) {
  return getVolumeTagPrint(deliveryCode, jobNodeCode)
}
