import $http from 'assets/js/ajax.js'
import { warehouseId } from '../config'

// 获取分拣墙
export function getSortWall() {
  return $http({
    url: `/human/sorting/warehouse/${warehouseId}/wall/list`,
    method: 'get',
    data: {
      pageNum: 1,
      pageSize: 50
    }
  })
}

// 获取 分拣计划
export function getSortPlan() {
  return $http({
    url: `/human/sorting/warehouse/${warehouseId}/solution/list`,
    method: 'get',
    data: {
      pageNum: 1,
      pageSize: 50
    }
  })
}

// 获取 格口列表
export function getSortSlotList(id) {
  return $http({
    url: `/human/sorting/warehouse/${warehouseId}/solution/${id}/detail/slots`,
    method: 'get',
  })
}

// 获取推荐格口
export function getBestSlot(data) {
  return $http({
    url: `/human/sorting/warehouse/${warehouseId}/wall/slot/recommend`,
    method: 'get',
    data
  })
}

// 完结格口
export function getSubmit(data) {
  return $http({
    url: `/human/sorting/warehouse/${warehouseId}/sorting/finished`,
    method: 'post',
    data,
    returnRes: true
  })
}
