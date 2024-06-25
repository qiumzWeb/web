import Cookie from './cookie'
import localStore from './localStore'
import request from './ajax'
import Bus from './bus'
import PowWeight from './powWeight'
import Print from './print'
import WetVideoRecord from './plugins/wetVideoRecord'
export {
  Cookie,
  localStore,
  request,
  Bus,
  PowWeight,
  Print,
  WetVideoRecord
}

// 单号正则
export const codeRegExp = /^[\w-\s]+$/
// 重量校验，必须是数字， 最大不能超过10000
export const weightRegExp = {test: (weight) => {
  return /(^[1-9]\d*(\.\d+)?)|(^0\.\d*[1-9]\d*)/.test(weight) && Number(weight) < 10000
}} 

export function asyncAntiShake (request, {cxt, formatData}) {
  const requestBox = {}
  if (
      typeof request === 'function'
  ) {
      const newRequest = async function (...args) {
          const key = JSON.stringify(
            typeof formatData === 'function' &&
            formatData(...args) ||
            args
          )
          if (!requestBox[key]) {
              requestBox[key] = request.apply(cxt, args)
          }
          try {
              if (
                  typeof requestBox[key].then === 'function' &&
                  typeof requestBox[key].catch === 'function' &&
                  typeof requestBox[key].finally === 'function'
              ) {
                  const res = await requestBox[key]
                  return res
              } else {
                  return requestBox[key]
              }
          } catch (e) {
              return Promise.reject(e)
          } finally {
              delete requestBox[key]
          }
      }
      return newRequest
  } else {
      return request
  }
}

export function isType(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1)
}

// input 输入框回车事件
export const onEnter = function (callBack) {
  return function onKeyPress(event, ...args) {
    const value = event.target.value
    if (event.which === 13 && value && typeof callBack === 'function') {
        callBack.call(this || event.target, event, ...args)
    }
  }
}

// 下载数据
export function downloadExcel(res, name) {
    const fileName = name.includes('.xls') ? name : name + '.xlsx'
    const blob = new Blob([res], {type: 'application/vnd.ms-excel'})
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, fileName)
    } else {
      const url = window.URL.createObjectURL(blob)
      let a = document.createElement('a')
      a.download = fileName
      a.href= url
      a.click()
      window.URL.revokeObjectURL(url)
      a = null
    }
  }
