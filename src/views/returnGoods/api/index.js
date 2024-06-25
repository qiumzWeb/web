import $http from 'assets/js/ajax.js'

// 查询
export function getSearch(searchCode) {
  return $http({
    url: '/back/goods/getPackageList',
    method: 'get',
    extCode: ['intSign'],
    data: {
      searchCode
    }
  })
}

// 提交
export function getSubmit(data) {
  return $http({
    url: "/back/goods/executeSave",
    method: 'post',
    data,
    returnRes: true
  })
}


// 拆单
export function getSplitCode(data) {
  return $http({
    url: '/back/goods/order/separate',
    method: 'post',
    data,
    returnRes: true
  })
}


// 获取快递公司
export function getLogisticsCompany() {
  return $http({
    url: '/pcsapiweb/sys/base/getDictData?type=returnLogisticsCompany',
    method: 'get',
  })
}