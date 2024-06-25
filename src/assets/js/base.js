require('assets/scss/_base.scss');
import React from 'react';
import Bus from 'assets/js/bus';
import $http from 'assets/js/ajax';
import Api from 'assets/api';
import { getResult, localStore, isJSON, isEmpty} from 'assets/js';
import DBStore from 'assets/js/dbStore';
import  Cookie from 'assets/js/cookie';
import $jsonp from 'assets/js/jsonpAjax'

// 加载第三方 sdk,
// 电子称
require('assets/js/plugins/websocket');
// 云打印
require('assets/js/plugins/cloudWebsocket');
// 天机
require('assets/js/plugins/visionWebSocket');
// 系统日志
require('assets/js/systemLog');
// 百分比字体缩放
(function(){
  setFontSize()
  window.addEventListener('resize', setFontSize, false)
  window.px2rem = function($px) {
    return `${$px/30}rem`
  }
  window.remForPxNum = function($px) {
    return $px * (window.innerWidth / 1700)
  }
  function setFontSize() {
    document.documentElement.style.fontSize = (window.innerWidth / 1700) * 30 + 'px'
  }
})();


// 全局注册DB
DBStore.install(React.Component);

// 重写定时器, 自销毁处理, 防止页面放久了系统卡顿
const stout = window.setTimeout;
window.setTimeout = function(fn, timer = 0) {
    let t = stout(() => {
        typeof fn === 'function' && fn()
        clearTimeout(t)
        t = null
    }, timer)
    return t
};

// 错误弹层
window.log = async function(msg, align = 'left') {
    let errBox = document.getElementById('_errorCoverBox_')
    msg = await getResult(msg)
    if (typeof msg === 'object') {
        try { 
            msg = JSON.stringify(msg)
        } catch(e) {}
    }
    if (window.debugStatus) {
        let message = document.createElement('div')
        message.innerHTML = msg
        if (errBox) {
            errBox.appendChild(message)
        } else {
            errBox = document.createElement('div')
            errBox.id = "_errorCoverBox_"
            errBox.style.textAlign = align
            errBox.appendChild(message)
            document.body.appendChild(errBox)
        }
        setTimeout(() => {
            errBox.scrollTop = errBox.scrollHeight
        }, 100)
    } else {
      if (errBox) errBox.remove()
      console.log(msg)
    }
};
window.onerror = function(e){window.log(e)}

// 设置document title
window._setTitle = function (title){
    Bus.setState({currentRouteTitle: title})
    document.title = title
};

// 系统卸载事件监听
window.onbeforeunload = function(event) {
    // event.preventDefault();
    // event.returnValue = true;
    // 离开页面时缓存页签
    // window.dbStore.set(NavTag, React.__localTagList)
};

// 加载菜单
Bus.setState({getMenu: new Promise(resolve => {
    $http({
        url: Api.getMenu,
        method: 'get'
    })
    .then(resolve)
    .catch(e => resolve([]))
})});

// 加载仓库
Bus.setState({
    getWarehouseList: new Promise(resolve => {
        $http({
            url: Api.getCompanyWareHouseList,
            method: 'get'
        })
        .then(resolve)
        .catch(() => resolve([]))
    }) 
});

// 注册设备ID
(function setIpAdress(){
  var ipKey = 'equipmentId';
  var DbStorage = window.indexedDB && window.dbStore;
  if (DbStorage) {
    DbStorage.get(ipKey).then(function(id){
      getDeviceId(id, Cookie, localStorage, sessionStorage);
    })
  } else {
    getDeviceId(null, Cookie, localStorage, sessionStorage);
  }
  function getDeviceId (dbId, Cookie, ls, session){
    var local_ip = dbId || getId(ls,ipKey) || getId(session, ipKey) || Cookie.get(ipKey);
    if (!local_ip) {
      local_ip = getRandom(999) + "." + getRandom(999) + '.' + getRandom(999) + '.' + getRandom(999) + '.' + getRandom(99999) + "." + Date.now().toString(16);
    }
    setId(ls,ipKey, local_ip);
    setId(session, ipKey, local_ip);
    Cookie.set(ipKey, local_ip, {domain: '.cainiao.com'});
    DbStorage && DbStorage.set(ipKey, local_ip)
    console.log(local_ip)
    function getRandom(n){
      return Math.floor(Math.random() * n).toString(16);
    }
    function getId(l, k) {
      return l && l.getItem(k);
    }
    function setId(l, k, v) {
      l && l.setItem(k, v);
    }
  };
})();

/**
 * 获取用户信息
 */
window.getEmployeeNo = $http({
  url: '/merge/info/getEmployeeNo',
  method: 'get'
}).catch(e => Cookie.get('account'));




// 获取天眼配置信息
// 获取天眼配置
async function getVideoHttpRequest(requestTimes = 0) {
  if (requestTimes > 10) {
    window.debugStatus = true;
    window.log('视频录制出现异常，请重新登录系统重试，或者联系系统IT管理员');
    return {}
  }
  try {
    const result = await $http({
      url: '/mergingWeighing/eyeVideoConfig/get',
      method: 'get',
      data: {
        warehouseId: Cookie.get('warehouseId')
      }
    }).then(res => {
      let resData = res || {}
      if (res) {
        resData.openSwitch = res.value;
        resData.isNew = res.hasOwnProperty('features');
        Object.assign(resData, (isJSON(resData.features) && JSON.parse(resData.features) || {}))
        // 未启用新配置之前 ，使用老配置
        if (!resData.isNew) {
          // 判断是否是COE 业务  
          //  天眼录制 使用 鹰眼 +  lemoCode 设备的时候 ， 需要特殊处理
          const isCOE = [
            '10006001',
            '10005001',
            '10046003', // 台湾海运-厦门自营集运仓
            '10026001', // 天猫海外_华东新马自营集运仓
          ].some(w => w == Cookie.get('warehouseId'));
          Object.assign(resData, {
            PC: 'ipc',
            LemoCode: isCOE ? 'ipc' : 'usb',
            siteCode: '123456',
          })
        }
        localStore.set('baseInfo', JSON.stringify(resData));
      }
      return resData || {};
    }).catch(e => ({}));
    // 获取配置失败 重试
    if (isEmpty(result)) {
      return await getVideoHttpRequest(requestTimes + 1)
    } else {
      return result;
    }
  } catch(e) {
    // 获取配置失败重试
    return await getVideoHttpRequest(requestTimes + 1)
  }

}
window.getVideoRecordConfig = getVideoHttpRequest();
// 初始化配置
window.getEyeVideoConfig =  async function () {
  const res = await window.getVideoRecordConfig
  const empNo = await window.getEmployeeNo
  console.log(res, '录制视频配置', empNo)
  const jobCode = Cookie.get("jobPlaceCode") || ''
  const mergeNodes = res.mergeNodes || ['mergeOrder', 'childMotherSplitOder'];
  // 获取当前设备类型
  const deviceType = {
    [isPow()]: 'LemoCode',
    [!isPow()]: 'PC'
  }
  let currentNode = ''
  const isOpen = jobCode && res.value == 'true' && mergeNodes.some(auth => {
    if (window.location.pathname.includes(auth)) {
      currentNode = auth;
      return true
    }
    return false
  })
  log('校验录制视频配置')
  log("作业台号====" + jobCode)
  log("天眼开关是否打开===="+ res.value + "=======")
  log("是否为lemoCore设备:====== " + isPow() + "===========")
  log(window.navigator.userAgent)
  const config = {
    ...res,
    isIPCOpen: !!(isOpen && res[deviceType[true]] === 'ipc' && res.siteCode),
    isWetUsbOpen: !!(isOpen && deviceType[true] == 'PC' && res.PC === 'usb' && res.siteCode),
    isLemoCodeUsbOpen: !!(isOpen && deviceType[true] == 'LemoCode' && res.LemoCode === 'usb'),
    currentNode,
    empNo: empNo || ''
  }
  const configStatus = {
    [true]: '未配置录制模式',
    [config['isIPCOpen']]: '---录制模式：IPC - 已开启---',
    [config['isWetUsbOpen']]: '---录制模式： Wet-USB  - 已开启---',
    [config['isLemoCodeUsbOpen']]: '---录制模式： lemoCode-USB  - 已开启---'
  }
  log(configStatus[true])
  log("---录制模式： IPC==== " + config['isIPCOpen'] + " ====")
  log("---录制模式： Wet-USB=== " + config['isWetUsbOpen'] + " ====")
  log("---录制模式： lemoCode-USB==== " + config['isLemoCodeUsbOpen'] + " ====")
  console.log(configStatus[true], config)
  return config
};

window.getCompanyEnterpriseList = $jsonp({
  url: 'https://cnlogin.cainiao.com/listEnterprises',
  method: 'get'
}).then(listRes => {
  console.log(listRes, '============可切换企业============')
  if (listRes && Array.isArray(listRes.result)) {
    return listRes.result.map(r => ({
      ...r,
      label: r.name,
      value: r.id
    }))
  }
  return null
}).catch(e => null)
console.log(window.getCompanyEnterpriseList, '======注册企业=====')

