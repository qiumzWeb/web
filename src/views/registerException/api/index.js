import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: '/register/exception',
    method: 'get',
    data,
    returnRes: true
  })
}
