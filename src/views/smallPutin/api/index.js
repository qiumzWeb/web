import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: "/instock/save",
    method: 'post',
    data,
    returnRes: true
  })
}

// LZD 业务判断
export function getLZDServiceType() {
  return $http({
    url: '/instock/getServiceType',
    method: 'post',
    oldApi: true
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

// 破损标记
export function getTagDamage(data) {
  return $http({
    url: '/instock/tagDamage',
    method: 'post',
    data,
    returnRes: true
  })
}

// 多票提交
export function getMoreSubmit(data) {
  return $http({
    url: '/instock/small/morePackage/commit',
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
    url: '/instock/print/multipleLabel',
    method: 'post',
    data,
    headers: {
      "Content-Type": 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    returnRes: true
  })
}