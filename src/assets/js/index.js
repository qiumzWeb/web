import Cookie from 'assets/js/cookie';
import localStore from './localStore';
import Bus from 'assets/js/bus';
export * from './common';
export * from './textToSpeech';
// 路由根路径
export const BasePath = '/operation'
/**
 * 统一变量名
 */
// 首页快捷入口code
export const defineFastEntry = 'DEFINE_FAST_ENTRY_' + Cookie.get('accountId')
// 菜单 Map code
export const BusMenuMap = 'menuMap_web'
// 自定义菜单 code
export const _menus_ = 'MENU_TREE_WEB' + Cookie.get('accountId')
// 用户token code
export const token = 'TwAhx8HL'
// 仓id code
export const wid = 'warehouseId'
// 用户仓id code
export const uWid  = Cookie.get('accountId') + '_warehouseId'
// 版本号 
export const version = '__VERSION__WEB'
// 仓库名称
export const widName = 'warehouseName'
// 仓库列表
export const widList = 'warehouseList'
// 页签
export const NavTag = '__NabPageTag__WEB'
// 首页菜单 menuCode
export const _indexMenuCode = 'pcs-wms-manage#menu#index'
// 页面刷新方法name
export const pageRefreshName = 'PAGEREFRESH'

// 最近一次打印数据缓存key
export const currentPrintDataKey = '__LAST_PRINT_DATA_KEY_'

// 入库地区
export const _CountryList = 'country_' + Cookie.get('accountId')


// 企业id code
export const CEId = 'companyEnterpriseId'
// 用户企业id code
export const uCEId  = Cookie.get('accountId') + '_companyEnterpriseId'
// 企业名称
export const CEIdName = 'companyEnterpriseName'
// 企业列表
export const CEIdList = 'companyEnterpriseList'

// 触发企业选择事件
export const changeCompanyEnterpriseEvent = "_NOT_LOGIN_CompanyEnterprise"


/**
 * end
 */
export {
    Cookie,
    localStore
}
// 是否登录
export function isLogin() {
    return !!Cookie.get(token)
}
// 获取仓Id ,判断是否选择仓库
export function getWid() {
    if (!localStore.get(uWid) || !Cookie.get(wid)) {
        setWid(localStore.get(uWid) || Cookie.get(wid))
    }
    return +Cookie.get(wid) || ''
}

// 获取仓库名称
export function getWName(wid) {
    const wl = Bus.getState(widList)
    wid = wid || getWid()
    if (wl) {
        return (wl.find(w => w.value == wid) || {label: wid}).label
    } else {
        return wid
    }
}

// 设置仓id
export function setWid(val) {
    Cookie.set(wid, val)
    localStore.set(uWid, val)
}



// 获取企业Id ,判断是否选择企业
export function getCEId() {
  if (!localStore.get(uCEId) || !Cookie.get(CEId)) {
      setWid(localStore.get(uCEId) || Cookie.get(CEId))
  }
  return +Cookie.get(CEId) || ''
}

// 获取企业名称
export function getCEName(CEId) {
  const wl = Bus.getState(CEIdList)
  CEId = CEId || getCEId()
  if (wl) {
      return (wl.find(w => w.value == CEId) || {label: CEId}).label
  } else {
      return CEId
  }
}

// 设置企业id
export function setCEId(val) {
  Cookie.set(CEId, val)
  localStore.set(uCEId, val)
}


// 退出登录
export async function logout(isHandle) {
  const exit = () => {
    Cookie.del(token)
    Cookie.del(wid)
    // localStore.remove(wid)
    const currentPath = encodeURIComponent(window.location.href)
    window.location.href = 'https://cnlogin.cainiao.com/login?isNewLogin=true&redirectURL=' + currentPath
  }
  if (isHandle) {
    exit()
  } else {
    window.getCompanyEnterpriseList && window.getCompanyEnterpriseList.then(CE => {
      console.log(CE, '=======菜鸟企业=======')
      if (CE) {
        Bus.$emit(changeCompanyEnterpriseEvent, CE)
      } else {
        exit()
      }
    })
  }
}
// 成功音频
export const audioSuccess = [
  document.getElementById('audioSuccess'),
  document.getElementById('scanSuccess'),
  document.getElementById('mergeSuccess')
]
// 失败音频
export const audioError = [
  document.getElementById('audioError'),
  document.getElementById('scanError'),
]
// 系统提示音
export const messageAudio = {
  // type : 0 普通提示音，1 合箱提示单扫描成功， 2 合箱提示单合箱成功
    success: (type = 0) => {
        const a = audioSuccess[type]
        a && a.play()
    },
  // type : 0 普通提示音失败，1 合箱提示单失败
    error: (type = 0) => {
        const a = audioError[type]
        a && a.play()
    }
}

