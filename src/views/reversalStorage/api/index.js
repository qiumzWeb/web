import $http from 'assets/js/ajax.js'

// 提交
export function getSubmit(data) {
  return $http({
    url: '/instock/reversal/commit',
    method: 'get',
    data,
    returnRes: true
  })
}

// 校验包裹类型
export function getCheckDeliveryCode(data) {
  return $http({
    url: '/instock/reversal/checkDeliveryCode',
    method: 'get',
    data
  })
}


// 获取 逆向入库异常类型
export function getExceptionType(warehouseId) {
  return $http({
    url: `/instock/reversal/exception/reason/list?warehouseId=${warehouseId}`,
    method: 'get'
  }).then(res => {
    return Array.isArray(res) && res.map(r => ({...r, label: r.name, value: r.opCode})) || []
  }).catch(e => [])
}