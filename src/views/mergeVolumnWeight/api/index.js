import $http from 'assets/js/ajax.js'
import { getVolumeTagPrint } from '@/views/mergeOrder/api'


// 查询
export function getCheckPackage(code) {
  return $http({
    url: '/change/sheet/weighPrintPackage/get',
    method: 'get',
    data: {
      code
    }
  })
}

// 提交
export function getSubmit(data) {
  return $http({
    url: "/change/sheet/weighPrint/submit",
    method: 'post',
    data,
    returnRes: true
  })
}


// 打小票
export function getTickPrint(deliveryCode) {
  return getVolumeTagPrint(deliveryCode, 'weight')
}