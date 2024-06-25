import request from 'assets/js/ajax.js'

// 查询
export function getSearch(warehouseId) {
  return request({
    url: `/value/addedServices/get`,
    method: 'get',
    // data: {
    //   warehouseId
    // }
  })
}

// 提交
export function getSubmit(data) {
  return request({
    url: "/value/addedServices/save",
    method: 'post',
    data,
  })
}

export const typeOptions = new Array(100).fill().map((f, i) => ({serviceType: `aaa${i}`, serviceItem: `bbbb${i}`, settlementCode: `a${i}`}))