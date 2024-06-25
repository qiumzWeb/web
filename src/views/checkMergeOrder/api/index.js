import $http from 'assets/js/ajax.js'
import { getWid } from 'assets/js'
// 查询
export function getSearch(searchCode) {
  return $http({
    url: '/merge/checkSku/scanPackage',
    method: 'post',
    data: {
      searchCode
    }
  })
}

// 少票密码确认
export function getCheckPassWordConfirm(password) {
  return $http({
    url: '/merge/checkSku/missing/confirm',
    method: 'post',
    data: {
      warehouseId: getWid(),
      password
    }
  })
}

// 提交复核
export function getCheckSkuSubmit(data) {
  return $http({
    url: '/merge/checkSku/submitPackage',
    method: 'post',
    data
  })
}


// 提交
export function getSubmit(data) {
  return $http({
    url: "/merge/checkSku/mergeSubmit",
    method: 'post',
    data,
    returnRes: true
  })
}


