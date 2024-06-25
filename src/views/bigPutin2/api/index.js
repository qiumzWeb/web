import $http from 'assets/js/ajax.js'

// 单票提交
export function getSubmit(data) {
  return $http({
    url: "/instock/big/commit",
    method: 'post',
    data,
    returnRes: true
  })
}

// 多票提交
export function getMoreSubmit(data) {
  return $http({
    url: '/instock/big/new/commit',
    method: 'post',
    data,
    returnRes: true
  })
}
// 多票打标签
// 提交无预报包裹
export function getSaveNoPrealertPackage(data) {
  return $http({
    url: '/instock/big/new/saveNoPrealertPackage',
    method: 'post',
    headers: {
      "Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    data,
  })
}
// 多票无预报打印
export function getMorePrint(data) {
  return $http({
    url: '/instock/big/print',
    method: 'post',
    data,
    headers: {
      "Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    returnRes: true
  })
}

// 无预报包裹
export function getPackageSupportNoPreAlert(data) {
  return $http({
    url: '/instock/getPackage/supportNoPreAlert',
    method: 'get',
    data
  })
}
