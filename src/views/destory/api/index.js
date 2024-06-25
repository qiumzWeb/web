import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: '/package/destruction',
    method: 'post',
    data,
    returnRes: true
  })
}
