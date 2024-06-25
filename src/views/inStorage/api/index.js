import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: "/instock/merge/save",
    method: 'post',
    data,
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


// 多票提交
export function getMoreSubmit(data) {
  return $http({
    url: '/instock/multi/commit',
    method: 'post',
    data,
    returnRes: true
  })
}
// 多票无预报打印
export function getMorePrint(data) {
  return $http({
    url: '/instock/multi/saveNoPreAlertAndPrintLabel',
    method: 'post',
    data,
    returnRes: true
  })
}