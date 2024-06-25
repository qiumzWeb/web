import request from 'assets/js/ajax.js'

// 查询
export function getSearch(data) {
  return request({
    url: `/allot/ptl/sortingWall/flowpickWallPackage`,
    method: 'get',
    data
  })
}

// 提交
export function getSubmit(data) {
  return request({
    url: "/allot/ptl/sortingWall/finsh/flowpickWall",
    method: 'post',
    data,
  })
}
// 解绑容器
export function getUnBindSubmit(data) {
  return request({
    url: "/allot/ptl/sortingWall/finsh/ucsBindingWave",
    method: 'post',
    data,
  })
}