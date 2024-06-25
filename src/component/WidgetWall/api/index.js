import request from 'assets/js/ajax.js'

// 获取分拣墙
export function getSoftWall(data) {
  return request({
    url: `/allot/ptl/sortingWall/getSoftWall`,
    method: 'get',
    data
  })
}

// 获取格口号
export function getGroupName(data) {
  return request({
    url: "/allot/ptl/sortingWall/getGroupName",
    method: 'get',
    data,
  })
}

// 获取格口列表
export function softPtlListByGroup(data) {
  return request({
    url: "/allot/ptl/sortingWall/softPtlListByGroup",
    method: 'get',
    data,
  })
}
