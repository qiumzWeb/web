import $http from 'assets/js/ajax'

// 校验批次号
export function getCheckBatchNum (data) {
  return $http({
    url: '/bigBagSign/getBatch',
    method: 'get',
    data
  })
}

// 校验大包号
export function getCheckBigbagNum (data) {
  return $http({
    url: '/bigBagSign/getBigBag',
    method: 'get',
    extCode: ['intSign'],
    data
  })
}

// 获取重量配置
export function getCheckWeight (data) {
  return $http({
    url: '/bigBagSign/getConfig',
    method: 'get',
    data
  })
}

// 提交
export function getSubmitSign (data) {
  return $http({
    url: '/bigBagSign/bigBagSubmit',
    method: 'post',
    data
  })
}