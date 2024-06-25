import axios from 'axios'
import { asyncAntiShake, isType, Cookie, Bus } from './utils'
import { logout, getObjType, widList, isTrue } from 'assets/js'
import { getAjaxUrl } from './proxy-utils'
import Api from 'assets/api'
import qs from 'querystring'
const service = axios.create({
    timeout: 300000,
    transformRequest: [function(data, headers, ...args) {
        if (getObjType(data) === 'FormData') {
            return data
        }
        if (headers['Content-Type'].includes('form')) {
            return qs.stringify(data)
        }
        return JSON.stringify(data)
    }]
})
// 添加请求拦截器
const getMsg = (msg) => getObjType(msg) == 'Object' && msg.message || msg
service.interceptors.request.use(function (config) {  
    return config;
  }, function (error) {
    return Promise.reject(error);
  });

// 添加响应拦截器
service.interceptors.response.use(function (response) {
    if(typeof response.data === 'object') {
        response.data.responseDate = response.headers.date
    }
    return response.data;
  }, function (error) {
    /**
     * 免登录接口白名单
     */
    const noDoUrl = [
      '/pcsweb/getMenus',
      '/pcsservice/getMenus',
      '/pcsapiweb/web/monitor/collect'
    ]
    const errorCode = [error.message, error.code]
    if (errorCode.includes("Network Error") && !noDoUrl.some(url => error.config.url.includes(url))) {
        return logout()
    }
    if (noDoUrl.some(url => error.config.url.includes(url))) {
        return null
    } else {
        return Promise.reject(error);
    }
  });

// 响应JSON 数据处理
function _dataHandle(rsp, resolve, reject, extCode, options) {
    if (isType(extCode) === 'Object' && !options) {
        options = extCode
        extCode = options.extCode || null
    }
    if (options.oldApi) {
        rsp = {
            data: rsp,
            success: true,
            errorCode: null
        }
    }
    if (rsp && rsp.responseDate && typeof options.getResponseDate === 'function') {
        options.getResponseDate(rsp.responseDate)
    }
    const suc = rsp.success;
    let data =  rsp.data;
    if (Array.isArray(extCode) && extCode.length) {
      if (!data) data = {};
      extCode.forEach(key => {
        data[key] = rsp[key]
      })
    }
    if (suc) {
        if (options.url === Api.getCompanyWareHouseList) { // 缓存仓库列表
            console.log(data && Array.isArray(data) && data.length)
            if (data && Array.isArray(data) && data.length) {
                data = data.map(d => ({
                    label: d.warehouseName,
                    value: d.warehouseId,
                    ...d
                }))
                data.sort((a, b) => a.label.localeCompare(b.label))
                Bus.setState({ [widList]: data })
            }
        }
        if (options.returnRes) {
          resolve(rsp)
        } else {
          resolve(data);
        }
    } else {
        const errorCode = rsp.errorCode;
        const message = rsp.displayMsg || rsp.errorMsg || rsp.errMsg || getMsg(rsp.message) || '内部错误';
        if (errorCode == 'noLogin') logout() // 重新登录
        rsp.message = message
        reject(rsp)
    }
}

function _optionsHandle(options) {
    const {data, type, extCode, ...args} = options
    if (type && !args.method) {
        args.method = type
    }
    args.method = (args.method || 'get').toLocaleLowerCase()
    const qs = (obj) => {
        if (typeof obj !== 'object' || !isTrue(obj)) return obj
        const newObj = {}
        Object.entries(obj).forEach(([key,val]) => {
            newObj[key] = typeof val === 'object' && String(val) || val
        })
        return newObj
    }
    const reqData = args.method.toLocaleLowerCase() === 'get' ? { 
        params: qs(data)
    } : {data}
    args.url = getAjaxUrl(args.url)
    return {
        headers: {
            "Content-Type": 'application/json; charset=utf-8'
        },
        ...args,
        ...reqData
    }
}

function $ajax(options) {
    // 读取仓库缓存
    const warehouseList = Bus.getState(widList)
    if (options.url === Api.getCompanyWareHouseList && warehouseList) {
        return Promise.resolve(warehouseList)
    }
    // 发出接口请求
    const {extCode} = options
    const requestData = _optionsHandle({...options})
    return new Promise((resolve, reject) => {
        service(requestData).then(rsp => {
            if (isType(rsp) === 'Object') {
                _dataHandle(rsp, resolve, reject, options)
            } else if (isType(rsp) === 'Blob') {
                const response = new Response(rsp)
                response.json().then(res => {
                    if (isType(res) === 'Object') {
                        _dataHandle(res, resolve, reject, extCode)
                    } else {
                        resolve(rsp)
                    }
                }).catch(error => {
                    resolve(rsp)
                })
            } else {
                resolve(rsp)
            }
        }).catch(error => {
            const  message = getMsg(error.message) || error.errMsg || '服务器异常，请稍后再试'
            reject({
                ...error,
                message
            });
        })
    })
}
const $http = asyncAntiShake($ajax, {formatData: _optionsHandle})

export default $http
