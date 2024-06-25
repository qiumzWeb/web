import request from 'assets/js/ajax.js'

// 查询
export function getSearch(data) {
  return request({
    url: `/allot/ptl/sortingWall/show/flowPickSlot`,
    method: 'get',
    data
  })
}
