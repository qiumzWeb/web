import { _indexMenuCode, BusMenuMap,  } from 'assets/js'
import Bus from 'assets/js/bus'

/**
 * 判断首页权限
 * 通过菜单权限决定数据权限
 */
export const checkIndexAuth = () => new Promise(async (resolve) => {
  await (Bus.getState(BusMenuMap) || new Promise(resolve => Bus.watch(BusMenuMap, resolve)))
  const menu = Bus.getState(BusMenuMap)
  const indexKey = '/' + _indexMenuCode
  menu && menu[indexKey] && resolve(true) || resolve(false)
})