import $http from 'assets/js/ajax.js'
import Bus from 'assets/js/bus'
import { isCOE, getIPCVideoMakeTap } from '../config'
import { getWid, localStore, Cookie, Base64, isEmpty, getObjType } from 'assets/js'

// 查询、大包签收 
export function getSearch(bigBagId) {
  return $http({
    url: `/instock/bigbagSign`,
    method: 'post',
    data: {
      bigBagId
    }
  })
}
