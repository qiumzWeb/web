import request from 'assets/js/ajax.js'

// 查询
export function getSearch(data) {
  return request({
    url: `/allot/flowpick/sortingWall/show/flowPickManufactureScreen`,
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

// 异常格口回调
export function getAbnormalPackageUpdateCache(data) {
  return request({
    url: "/allot/ptl/sortingWall/flowpick/abnormalPackage/updateCache",
    method: 'post',
    data,
  })
}


// 扫描大包号
export function getScanBigPackage(data) {
  return request({
    url: '/flowPick/sowing/scanBigBag',
    method: 'post',
    data
  })
}