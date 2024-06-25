import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: '/cardBoard/Weighing',
    method: 'get',
    data,
    returnRes: true
  })
}

// 校验包裹类型
export function getCheckDeliveryCode(data) {
  return $http({
    url: '/cardBoard/check',
    method: 'get',
    data
  })
}