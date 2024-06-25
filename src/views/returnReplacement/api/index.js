import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: '/instock/reversal/change',
    method: 'get',
    data,
    returnRes: true
  })
}