import adapter from 'webrtc-adapter';
import React, {useCallback, useEffect, useRef, useMemo} from 'react'
import { getWid, getObjType, isEmpty, getUuid, getResult } from 'assets/js'
import Bus from 'assets/js/bus'
console.log('浏览器版本：', JSON.stringify(adapter.browserDetails))
// 代理 useEffect Hook
React.useEffect = new Proxy(React.useEffect, {
  apply(fn, cxt, args) {
    const [callback, updateCode] = args
    const intCall = new Proxy(callback, {
      apply(call, ctx, props) {
        return Reflect.apply(call, ctx, props)
      }
    })
    const useEffect = () => {
      const destroy = intCall()
      return function () {
        switch (getObjType(destroy)) {
          case 'Promise':
            destroy.then(e => {
              if (typeof e == 'function') {
                e()
              }
            });
            break;
          case 'Function':
            destroy()
            break;
          default: break;
        }
      }
    }
    return Reflect.apply(fn, cxt, [useEffect, updateCode])
  }
})

// 路由初始化
React.useRouterEffect = function(fn, watchs = [window.Router]) {
  const routerInit = useCallback(() => {
    if (window.Router && window.Router.location) {
      if (typeof fn === 'function') {
        getResult(fn, window.Router.location).then(routeParam => {
          getObjType(routeParam) === 'Object' && window.Router.replace(routeParam)
        })
      }
    }
  }, watchs)
  useEffect(() => {
    routerInit()
  }, watchs)
}
//自定义更新Hooks
React.useReset = function(fn, watchs = []) {
  const refresh = useCallback(() => {
    const inputs = document.querySelectorAll('input[type=text]')
    inputs.forEach(input => {
      input.value = ''
    })
    typeof fn === 'function' && fn()
  }, watchs)
  useEffect(() => {
    const unBus = Bus.$on(window.location.pathname, refresh)
    return () => {
      unBus()
    }
  }, [watchs])
  return refresh
}
React.useRefresh = function(key) {
  Bus.$emit(key || window.location.pathname)
}

// 自定义输入框取值
React.useInput = function(names, inputs) {
  if(Array.isArray(names)) {
    inputs = {}
    names.forEach(name => {inputs[name] = useRef()})
  }
  if (getObjType(names) === 'Object') {
    inputs = names
    names = null
  }
  // 获取input
  const getRef = (ref) => ref && ref.current || {}
  // 获取input 值
  const getValue = function(key) {
    if (key) return getRef(inputs[key]).value
    const values = {}
    Object.entries(inputs).forEach(([key, input]) => {
      values[key] = getRef(input).value
    })
    return values
  }
  // 设置 input 值
  const setValue = function(key, val){
    let values = {}
    if (getObjType(key) === 'String') {
      values[key] = val
    }
    if (getObjType(key) === 'Object') {
      values = key
    }
    Object.entries(values).forEach(([k, v]) => {
      getRef(inputs[k]).value = v
    })
  }
  // input 聚集
  const getFocus = function(key) {
    getRef(inputs[key]).focus()
  }
  // input 全选
  const getSelect = function(key) {
    getRef(inputs[key]).select()
  }
  // input 失焦
  const getBlur = function(key) {
    getRef(inputs[key]).blur()
  }

  return {
    getValue,
    setValue,
    refs: inputs,
    getFocus,
    getSelect,
    getBlur
  }
}

// 状态管理
/**
 * 
 * @param {String} name 缓存的名字，不填 则 随机生成 uuid
 * @param {*} defaultValue 初始化默认值
 * @returns 
 */
React.useAction = function(name, defaultValue = null) {
  const actionName = useMemo(() => name || getUuid(), [])
  useEffect(() => {
    Bus.setState({[actionName]: defaultValue});
    return () => {
      Bus.clearState(actionName);
    }
  }, [])
  return [
    () => {
      return Bus.getState(actionName)
    },
    (value) => {
      Bus.setState({[actionName]: value})
    }
  ]
}

/**
 * 
 * @param {*} fn 回调
 * @param {*} watchs 
 */

React.useScanSubmit = function(fn, watchs) {
  useEffect(() => {
    let SCODE = "scansubmitenter"
    let inputText = ''
    let timeStamp = 0
    function watchScanEnter(event) {
      // 输入时间超过 50 ms , 则清除输入值
      if (event.timeStamp - timeStamp > 50) {
        inputText = ''
      }
      timeStamp = event.timeStamp
      inputText += ("" + event.key);
      console.log(inputText.toLowerCase(), SCODE, inputText.toLowerCase() === SCODE, )
      if (event.which === 13 || event.key === 'Enter' || event.keyCode === 13) {
        if (inputText.toLowerCase() === SCODE) {
          typeof fn === 'function' && fn.call(this, event);
        }
        inputText = ''
      }
    }
    document.addEventListener('keypress', watchScanEnter, false)
    return () => {
      SCODE = null;
      inputText = null;
      timeStamp = null;
      document.removeEventListener('keypress', watchScanEnter, false)
    }
  }, watchs)
};


// 老代码过期 hook 更新
function __oldHookReplaceByNewHook(discardedHook = 'componentWillMount', newHook = 'componentDidMount') {
  const hasOldHook = this.hasOwnProperty(discardedHook)
  const hasNewHook = this.hasOwnProperty(newHook)
  const oldHook = this[discardedHook]
  Reflect.defineProperty(this, newHook, {
    value: new Proxy(this[newHook] || proxyRegister, {
      apply(fn, cxt, args) {
        if (discardedHook === newHook) {
          hasOldHook && Reflect.apply(fn, cxt, args)
        } else {
          hasOldHook && Reflect.apply(oldHook, cxt, args)
          hasNewHook && Reflect.apply(fn, cxt, args)
        }
        return Reflect.apply(proxyRegister, cxt, args)
      }
    })
  })
  function proxyRegister() {
    // 全局数据处理
  }
  if (discardedHook === newHook) return
  Reflect.deleteProperty(this, discardedHook)
}

Reflect.defineProperty(React.Component.prototype, 'replaceHook', {
  value: __oldHookReplaceByNewHook
})

Reflect.defineProperty(React.Component.prototype, 'getWid', {
  value: function() {
    const warehouseId = getWid()
    return warehouseId && +warehouseId || ''
  }
})



