import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: '/change/sheet/get',
    method: 'get',
    data,
    returnRes: true
  })
}
