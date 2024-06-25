import { getUuid, getObjType, logout } from 'assets/js'
export default function JsonPAjax(option) {
  return new Promise((resolve, reject) => {
    const { url, data } = option
    if (!url) return reject('URL not allow empty')
    const callbackName = "CALL_" + getUuid()
    const script = document.createElement('script')
    let responseSuccess =  false;
    window[callbackName] = function(res) {
      console.log(res, '请求返回-----')
      responseSuccess = true;
      if (res.success) {
        resolve(res.data)
      } else {
        reject(res)
      }
      script.remove();
      delete window[callbackName];
    }
    let requestUrl =  url
    if (getObjType(data) === 'Object') {
      let params = ''
      Object.entries(data).forEach(([key, val], index) => {
        if (index) {
          params += `&${key}=${val}`
        } else {
          const f = url.includes('?') ? "&" : '?';
          params += `${f}${key}=${val}`
        }
      })
      requestUrl += params
    }
    const c = requestUrl.includes('?') ? "&" : '?'
    requestUrl += `${c}callback=${callbackName}`
    script.setAttribute('src', requestUrl)
    script.setAttribute('async', true)
    script.onload = function() {
      if (!responseSuccess) {
        logout('Network Error')
      }
    }
    document.body.appendChild(script)
  })
}

