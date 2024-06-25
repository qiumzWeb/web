/**
 * @desc 公共方法
 * @Time 2021-04-28
 */

/**
 * @desc 节流
 * @param {Function} fn 回调函数
 * @param {Number} delay 延时时间
 * @param {Object} options 参数
 */
export const throttle = (
  fn,
  delay = 300,
  options = {
    ctx: null
  }
) => {
  let lastTime = 0;
  return function (...args) {
    const nowTime = new Date().getTime();
    if (nowTime - lastTime > delay) {
      fn.call(options.ctx, ...args);
      lastTime = nowTime;
    }
  };
};

/**
 * @desc 防抖
 * @param {Function} fn 回调函数
 * @param {Number} delay 延时时间
 * @param {Object} options 参数
 */
export const debounce = (
  fn,
  delay = 300,
  options = {
    ctx: null
  }
) => {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.call(options.ctx, ...args);
    }, delay);
  };
};

/**
 * @desc 异步防抖
 * @param {*} val 
 * @returns 
 */
export function AsyncDebounce(fn, delay = 300) {
  let timer = null;
  return async function(...args) {
    clearTimeout(timer)
    const res = await new Promise((resolve, reject) => {
      timer = setTimeout(() => {
        fn(...args).then(resolve).catch(reject).finally(() => clearTimeout(timer))
      }, delay)
    })
    return res
  }
}
/**
 * @desc 判断是不是null
 * @param {Any} val
 */
export const isNUll = val => typeof val === 'object' && !val;

/**
 * @desc 判断是不是JSON数据
 * @param {Any} val
 */
export const isJSON = str => {
  if (typeof str === 'string') {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};


/**
 * @desc 合并对象
 */
export function mergeObj(a, b) {
  isObj(a) &&
    isObj(b) &&
    Object.keys(b).forEach(k => {
      if (isObj(a[k]) && isObj(b[k])) {
        mergeObj(a[k], b[k]);
      } else {
        a[k] = b[k];
      }
    });
  return a;
}

/**
 * @desc 深度合并，多个对象
 * @param {*} args
 */
export function deepAssign(...args) {
  if (args.some(a => !isObj(a) && isTrue(a))) {
    throw new Error('all args must be a Object');
  }
  if (!args[0]) {
    throw new Error('target must be a Object');
  }
  return args.reduce(mergeObj);
}

/**
 * @desc 深度克隆
 * @param {Any} obj
 * @return {Any}
 */
export const deepClone = obj => {
  if (
    getObjType(obj) === 'Object' ||
    Array.isArray(obj)
  ) {
    return deepAssign(JSON.parse(JSON.stringify(obj)), obj);
  }
  return obj;
};

/**
 * @desc 计算dom元素到顶部的距离
 * @param {Element} target
 * @return {Number}
 */
export function getOffsetTop(target, topParent) {
  let top = 0;
  let parent = target;
  if (parent instanceof HTMLElement) {
    while (parent instanceof HTMLElement && parent !== (topParent || document.body)) {
      top += parent.offsetTop;
      parent = parent.offsetParent;
    }
  }
  return top;
}


/**
 * @desc 只调用一次
 * @param {Function} fn
 */
export function onceCall(fn) {
  let called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  };
}

/**
 * @desc 首字母大写
 * @param {String} str
 * @return {String}
 */
export function firstToUp(str) {
  if (typeof str !== 'string') return str;
  return str[0].toLocaleUpperCase() + str.slice(1);
}

/**
 * @desc 下划线转驼峰
 * @param {String} name
 * @return {String}
 */
export function toUpper(name) {
  if (typeof name !== 'string') return name;
  return name.replace(/(?:\_|\-|\/)(\w+?)/g, function ($1, $2) {
    return $2.toLocaleUpperCase();
  });
}

/**
 * @desc 斜划线（url）转下划线
 * @param {String} name
 * @return {String}
 */
export function toUrlCode(name) {
  if (typeof name !== 'string') return name;
  return name.replace(/(?:\-|\/)(\w+?)/g, function ($1, $2) {
    return '_' + $2;
  });
}

/**
 * @desc 驼峰转中划线
 * @param {String} name
 * @return {String}
 */
export function upperToLine(name) {
  if (typeof name !== 'string') return name;
  return name
    .replace(/(?:[A-Z])(\w+?)/g, function ($1, $2) {
      return '-' + $1.toLocaleLowerCase();
    })
    .replace(/^\-/, '');
}

/**
 * @desc 是否为空
 * @param {Any} obj
 * @return {Boolean}
 */
export function isEmpty(obj) {
  if (isObj(obj)) {
    if (['Object', 'Array'].includes(getObjType(obj))) return !Object.values(obj).toString();
  }
  if (typeof obj === 'string') return !(isTrue(obj) && obj.trim());
  return !isTrue(obj);
}

/**
 * @desc 判断是不是非空值
 * @param {Any} val
 * @return {Boolean}
 */
 export function isTrue(target) {
  const type = [null, undefined, '', 'null', 'undefined']
  return type.every(t => target !== t)
}

/**
 * @desc 数组扁平化
 * @param {Array} arr
 * @param {Object} options
 * @return {Array}
 */
export function flatMap(arr, options) {
  const flatArr = [];
  const { childrenCode, callBack, clone } = deepAssign(
    {
      childrenCode: 'children',
      clone: true
    },
    options
  );
  const flat = ar => {
    if (Array.isArray(ar)) {
      const d = clone && deepClone(ar) || ar;
      d.forEach(a => {
        flatArr.push(a);
        typeof callBack === 'function' && callBack(a);
        isObj(a) && flat(a[childrenCode]);
      });
    }
  };
  flat(arr);
  return flatArr;
}

/**
 * @desc 数组去重
 * @param {Array} arr
 * @param {String} code
 * @return {Array}
 */
export function uniqBy(Arr, code) {
  const resultArr = [];
  const valArr = [];
  const codeArr = [];
  Array.isArray(Arr) &&
    Arr.forEach(a => {
      if (isObj(a) && isTrue(code)) {
        !codeArr.includes(a[code]) && resultArr.push(a);
        !codeArr.includes(a[code]) && codeArr.push(a[code]);
      } else {
        !valArr.includes(a) && resultArr.push(a);
        !valArr.includes(a) && valArr.push(a);
      }
    });
  return resultArr;
}

/**
 * @desc 获取数据类型
 * @param {Any} obj
 * @return {Boolean}
 */
export function getObjType(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

/**
 * @desc 清空对象
 * @param {Any} obj
 */
export function setEmpty(obj) {
  try {
    return new window[getObjType(obj)]().valueOf();
  } catch (e) {
    return '';
  }
}

/**
 * @desc 获取结果 支持 方法，对象，promise
 * @param {Any} source
 * @return {Any}
 */
export async function getResult(source, ...args) {
  const type = typeof source;
  let r = source;
  if (type === 'function') {
    r = source(...args);
    if (r && typeof r.then === 'function') {
      r = await r;
    }
  } else if (type === 'object') {
    if (typeof source.then === 'function') {
      r = await source;
    }
  }
  return r;
}

/**
 * @desc 对象检测
 * @param {Any} target
 * @return {Boolean}
 */
export function isObj(target) {
  return target !== null && typeof target === 'object';
}


/**
 * @desc 随机生成uuid
 * @param {String} val
 * @return {String}
 */
export function getUuid(s = '') {
  return s + _uid() + _uid() + _uid() + Date.now().toString(32)
}

export function _uid() {
  return (Math.random() * 9999).toString(32).split('.')[1].slice(-4)
}

/**
 * @desc 获取地址栏参数
 * @param {String} val
 * @return {String}
 */
 export function getQuery(q) {
  var m = window.location.search.match(new RegExp("(\\?|&)" + q + "=([^&]*)(&|$)"));
  return !m ? "" : decodeURIComponent(m[2]);
}

/**
 * @desc 获取设备
 * @return {Boolean}
 */
export function getDevice() {
  const u  = window.navigator.userAgent
  return {
    isPhone: !!u.match(/AppleWebKit.*Mobile.*/),
    isPad: u.indexOf('iPad') > -1,
    IsAndroid: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1,
    isIos: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
    isIPhone: u.indexOf('iPhone') > -1
  }
}
/**
 * @desc 判断http 路径
 * @param {*} url 
 * @returns {Boolean}
 */
export function isHttpUrl(url) {
  return /^(https?:)?\/\//.test(url)
}

/**
 * 保留两位小数千分位
 * @param {*} num 
 * @param {*} precision 
 * @returns 
 */
export const decimal = (num, precision = 2) => {
  if (typeof num !== 'number' && !num) {
    return ''
  }
  if (typeof num === 'string' && (num.includes('**') || num.includes('✽✽'))) {
    return num
  }
  return `${(+num).toFixed(precision).replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g, '$&,')}`
}
/**
 * 千分位
 * @param {*} num 
 * @returns 
 */
export const thousands = (num) => {
  if (isNaN(num)) return num
  return (+num).toLocaleString()
}
/**
 * 等待
 */
export async function sleepTime(time = 0, cb) {
  let timer = null
  await new Promise(resolve => {
    function getStatus() {
      timer = setTimeout(() => {
        if (typeof cb === 'function') {
          if (cb()) {
            resolve(true)
          } else {
            getStatus()
          }
        } else {
          resolve(true)
        }
        clearTimeout(timer)
      }, time)
    }
    getStatus()
  })
  return timer
}
/**
 * 通过value 匹配 label 值
 */
export function _getName(options, value, _ = "") {
  return Array.isArray(options) ? (
    (options.find(o => isObj(o) && o.value == value) || {label: _ }).label
  ) : value
}
export function isAllIncludes(options, value) {
  value = Array.isArray(value) ? value : [value]
  return Array.isArray(options) && value.every(v => options.some(s => s.value == v))
}

/**
 * 字符串对比
 */
export function isSame(str1, str2) {
  if (typeof str1 === 'string' && typeof str2 === 'string') {
    return str1.toLowerCase().trim() == str2.toLowerCase().trim()
  } else {
    return str1 == str2
  }
}


// 下载数据
export function download(res, {fileName, mimeType}) {
  const blob = new Blob(res, {type: mimeType})
  if (window.navigator.msSaveBlob) { // IE
    window.navigator.msSaveBlob(blob, fileName)
  } else { // 其它
    const url = window.URL.createObjectURL(blob)
    let a = document.createElement('a')
    a.download = fileName
    a.href= url
    a.click()
    window.URL.revokeObjectURL(url)
    a = null
  }
}


/**
 * 接口轮询
 * @param {*} requestCall 请求接口方法， 返回数据时会中断轮询并返回该数据，需要继续轮询则不返回数据
 * @param {Object} Obj  Obj.times: 请求次数  Obj.delay: 延迟请求时间  Obj.timeoutMsg: 超时未请求成功返回的提示语 
 * @returns {resData} 接口返回数据
 */
export async function getRequestRepeatTimes(requestCall, {
  times = 10,
  delay = 1000,
  timeoutMsg = '请求次数已达上限，请稍后再试'
}={}) {
  const doRequest = async (requestTimes = 1) => {
    const res = await getResult(requestCall, requestTimes);
    if (!res) {
      if (requestTimes < times) {
        await sleepTime(delay);
        return doRequest(requestTimes + 1)
      } else {
        throw new Error(timeoutMsg)
      }
    }
    return res
  }
  return await doRequest()
}
/**
 * base64 加密， 解密
 */
export const Base64 = {
  // 加密
  enCode(str) {
    return window.btoa(decodeURIComponent(encodeURIComponent(str)));
  },
  // 解密
  deCode(str) {
    return decodeURIComponent(encodeURIComponent(window.atob(str)));
  }
}