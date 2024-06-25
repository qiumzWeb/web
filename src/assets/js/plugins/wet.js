//定义Beautifier的构造函数
var WET = function(opt) {
    this.businessType = opt.businessType;
    this.messageType = opt.messageType || this.messageType;
    this.configName = opt.configName || this.configName;
    this.debug = opt.debug;
    this.handlerError = opt.handlerError;
    this.handlerClose = opt.handlerClose;
    this.https = typeof opt.https === "boolean"
        ? opt.https
        : true;
    this.registeredEvent = opt.registeredEvent;
    if (typeof this._init === 'function') {
        this._init();
    }
}
//定义Beautifier的方法
WET.prototype = {
    /**
     * 构建
     */
    constructor: WET,
    /**
     * 初始化;
     * @returns {boolean}
     * @private
     */
    _init: function() {
        var s = this;
        try {
            s.log('初始化');
            if (s.businessType > 0) {
                s._register();

            } else {
                s.log('初始化异常：业务类型不能为空');
                return false;
            }
        } catch (ex) {
            s.log('初始化异常：' + ex);
        }
    },
    /**
     * 统一打点方法
     * @param params
     */
    goldLog: function(params) {
        // 日志统计
        // 黄金令箭打点统一公用方法
        if (typeof goldlog !== 'undefined') {
            if (!params.logkey || !params.chksum) {
                return;
            }

            goldlog.record(params.logkey, params.gmkey || '', params.gokey || '', params.chksum);
        }
    },
    send: function(data) {
        var s = this;
        try {
            //            s.goldLog({
            //                logkey: '/cn.6.17.1',
            //                chksum: 'H46717801'
            //            });
            //循环判断未注册成功
            if (s.registered == false) {
                s._register();
                return false;
            }
            //正在注册
            if (s.registered == 'doing') {
                return false;
            }
            //正在发送，未回传
            if (s.cycle == true) {
                s.log('正在发送，请等待');
                setTimeout(function() {
                    s.send(data);
                    s.testTimes++;
                }, 50);
                return false;
            }
            s.log('业务调用');
            if (data == undefined) {
                data = {};
            }
            data.bussinessType = s.businessType;
            data.messageType = data.messageType
                ? data.messageType
                : s.messageType;

            s.returnValues = null;
            s.cycle = true;
            s.socket.send(s.stringify(data));
            s.storage.setItem('weightValue', '');
            s.socket.onmessage = function(evt) {
                s.valueDom.val(evt.data);
                s.log(evt.data);
                var res = JSON.parse(evt.data);
                res && res.data && s.filterWeightValue(res.data);
                if (res.success) {
                    switch (s.businessType) {
                        case 11:
                            break;
                    }
                    if (s.businessType == 11) {
                        if (res.type == 11) {
                            s.cycle = false;
                            s.log('获取MAC成功：' + res.data1 + '/' + res.data2);
                            s.returnValues = res;
                        } else {
                            s.log('获取MAC成功：数据未返回，请等待');
                        }
                    } else {
                        //其他用途
                        s.returnValues = res;
                        s.log('业务调用：执行完成');
                        s.cycle = false;
                    }

                    if (typeof s.success === 'function') {
                        s.success.call(s, res);
                    }
                } else {
                    s.returnValues = res;
                    s.log('业务调用异常：' + res.message || '');
                    s.log('业务调用数据：' + res.data || '');

                    if (typeof s.fail === 'function') {
                        s.fail.call(s, res);
                    }
                }
            }
        } catch (ex) {
            s.log('业务调用异常：' + ex);
        }
    },
    /**
     * 创建用于容纳返回数据的容器
     */
    createValueDOM: function() {
        var s = this;
        if (s.valueId && document.getElementById(s.valueId)) return;
        var Num = "";
        for (var i = 0; i < 6; i++) {
            Num += Math.floor(Math.random() * 10);
        }
        s.valueId = 'J_wetDom_' + s.businessType + '_' + Num;
        var valueDom = document.getElementById(s.valueId)
        if (!valueDom) {
            var input = document.createElement('input')
            input.setAttribute('type', 'hidden')
            input.id = s.valueId
            s.valueDom = input;
            document.body.appendChild(s.valueDom);
            s.watchInput(s.valueDom);
        }
    },
    watchInput: function(input) {
        // input = input[0];
        Object.defineProperty(input, 'value', {
            get: function() {
                return this.getAttribute('value');
            },
            set: function(val) {
                this.setAttribute('value', val);
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent("valuechange", true, false);
                this.dispatchEvent(evt);
            }
        });
        Object.defineProperty(input, 'val', {
          value: function(val) {
              return this.value = val;
          },
        });
    },
    getValueDom: function() {
        return this.valueDom;
    },
    /**
     * socket注册方法
     * @private
     */
    _register: function() {
        var s = this;
        s.createValueDOM();
        try {
            if (s.socket && s.socket.readyState == 1) {
                s.log('SOCKET注册：对象已经注册过，无需重新注册');
            } else {
                //                s.goldLog({
                //                    logkey: '/cn.6.17.2',
                //                    chksum: 'H46717823'
                //                });
                s.log('SOCKET注册：新注册');
                s.socket = new WebSocket(
                    s.https
                    ? s.wss
                    : s.ws);
                s.registered = 'doing';
                s.socket.onopen = function(evt) {
                    s.log('连接SOCKET服务：已经与服务器建立了连接，当前状态【' + s.socket.readyState + '】');
                    s.storage.setItem('weightValue', '');
                    s.socket.onmessage = function(evt) {
                        s.valueDom.val(evt.data);
                        s.log('连接SOCKET服务：接收到服务器发送的数据，当前状态【' + s.socket.readyState + '】');
                        var res = JSON.parse(evt.data);
                        res && res.data && s.filterWeightValue(res.data);
                        if (res.success) {
                            s.log('连接SOCKET服务器：' + res.message);
                            s.log('当前业务注册');
                            try {
                                var sendData = {
                                    bussinessType: s.businessType,
                                    messageType: s.messageType
                                };
                                if (s.businessType == 7) {
                                    sendData.configName = s.configName;
                                }

                                s.socket.send(s.stringify(sendData));
                            } catch (ex) {}
                            s.storage.setItem('weightValue', '');
                            s.socket.onmessage = function(evts) {
                                s.valueDom.val(evts.data);
                                s.log(evts.data);
                                var res2 = JSON.parse(evts.data);
                                res2 && res2.data && s.filterWeightValue(res2.data);
                                if (typeof(s.registeredEvent) == "function") {
                                    s.registeredEvent(res2.success);
                                }

                                if (res2.success) {
                                    if (s.registered != true) {
                                      window.CatchErrorLog({
                                        status: true,
                                        message: 'PC_WET电子称连接成功',
                                        code: 'wet_weight'
                                      })
                                      s.log('当前业务注册：成功，当前状态【' + s.socket.readyState + '】');
                                    }
                                    s.registered = true;
                                } else {
                                    window.CatchErrorLog({
                                      status: false,
                                      message: 'PC_WET电子称注册失败' + res2.message,
                                      code: 'wet_weight'
                                    })
                                    s.log('当前业务注册：失败，' + res2.message + ', 当前状态【' + s.socket.readyState + '】');
                                    s.registered = false;
                                }
                            }
                        } else {
                            window.CatchErrorLog({
                              status: false,
                              message: 'PC_WET电子称连接异常' + res.message,
                              code: 'wet_weight'
                            })
                            s.log('连接SOCKET服务器异常：' + res.message);
                            s.registered = false;
                        }
                    }
                }
                s.socket.onclose = function(evt) {
                    try {
                        if (typeof(s.handlerClose) == 'function') {
                            s.handlerClose();
                        }
                    } catch (ex) {
                        console.log(ex);
                    }
                    s.log('连接SOCKET服务：已经与服务器断开了连接，当前状态【' + s.socket.readyState + '】');
                    s.registered = false;
                }
                s.socket.onerror = function(evt) {
                    try {
                        if (typeof(s.handlerError) == 'function') {
                            s.handlerError();
                        }
                    } catch (ex) {
                        console.log(ex);
                    }
                    var failMsg = '尝试连接失败，请打开WET智能终端，再刷新浏览器';
                    s.log('连接SOCKET服务：socket服务器未打开或者异常，当前状态【' + s.socket.readyState + '】');
                    s.registered = false;
                    if (s.https) {
                        s.https = false;
                        s._register();
                    } else {
                        if (s.showAlert) {
                            alert(failMsg);
                        } else {
                            s.log(failMsg);
                        }
                    }
                }
            }
        } catch (ex) {
            s.log('连接SOCKET服务器异常：' + ex);
        }
    },
    /**
     * socket服务器地址
     */
    wss: 'wss://localhost:8080',
    ws: 'ws://localhost:8080',
    // localhost test url
    // wss: 'wss://localhost:7001/wet',
    // ws: 'ws://localhost:7001/wet',
    /**
     * socket对象
     */
    socket: null,
    /**
     * 组装报文
     * @param data
     * @returns {string}
     */
    stringify: function(data) {
        return String.fromCharCode(2) + JSON.stringify(data) + String.fromCharCode(3);
    },
    /*
     * 获取时间戳
     */
    time: function() {
        var time = new Date();
        return '[' + time.getFullYear() + '/' + (
        time.getMonth() + 1) + '/' + time.getDate() + ' ' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + ':' + time.getMilliseconds() + '] ';
    },
    /**
     * 输出日志
     */
    log: function(text) {
        if (this.debug) {
            console.info(this.time() + '【' + this.businessTypes[this.businessType] + '】' + text);
        }
    },
    storage: window.localStorage,
    /**
     * 电子秤数据存储
     * @param data
     * @returns {string}
     */
    saveWeightValue: function(data) {
        var s = this;
        data.scaleModel = data.scaleModel == undefined
            ? -1
            : data.scaleModel;
        data.rawData = data.rawData == undefined
            ? ''
            : data.rawData;
        if (s.storage.getItem('scaleModel') == undefined) {
            s.storage.setItem('scaleModel', data.scaleModel);
            s.storage.setItem('weightValue', '');
        }
        if (data.scaleModel != s.storage.getItem('scaleModel')) {
            //数据重置
            s.storage.setItem('weightValue', '');
            s.storage.setItem('scaleModel', data.scaleModel);
        }
        if (s.storage.getItem('weightValue') == undefined) {
            s.storage.setItem('weightValue', '');
        }
        s.storage.setItem('weightValue', s.storage.getItem('weightValue') + data.rawData);
    },
    filterWeightValue: function(data) {
        var s = this;
        s.saveWeightValue(data);
        return s.doFilterWeightValue();
    },
    doFilterWeightValue: function() {
        var s = this;
        var weight = s.storage.getItem('weightValue');
        var model = s.storage.getItem('scaleModel');
        var value = '';
        var currentIndex = -1;
        var tmp = '';
        var tmpItem = '';
        var splitKey = '';
        var splitPre = true; //分割符是否在前端
        if (weight == '') {
            return '';
        }
        window.log("接收的数值" + weight)


        // 中通COE 沙田集运仓  模式是 这个小数点之后,也可能是三位数
        // 只匹配+的
        //-   0.10 kg
        //+   0.00 kg
        //+   0.04 kg
        //+   0.041 kg
        var coestPatternArr = [
            /\+\s+[0-9]{1,4}.[0-9]{2,3}\s+kg/,
            /\+\s+[0-9]{1,4}.[0-9]{2,3}\s+kg\s?/
        ];
        for (var i = 0; i < coestPatternArr.length; i++) {
            if (weight.match(coestPatternArr[i])) {
                model = 'coest';
                break;
            }
        }

        switch (model) {
            case '0':
                // 台衡JSC-QHW-30_连续模式,字符串形式的数据，不断发送
                // 示例数据
                // ST,GS,   0.000,kg
                splitKey = 'ST,GS,';
                tmp = weight.split(splitKey)
                for (var i = tmp.length - 1; i > -1; i--) {
                    if (/^([0-9.]+)$/.test(s.doTrim(tmp[i]).replace(',kg', ''))) {
                        currentIndex = i;
                        value = s.doTrim(tmp[i]).replace(',kg', '');
                        i = -1;
                    }
                }
                break;
            case '1':
                // 台衡JSC-QHW-30_自动模式 字符串形式的数据，重量稳定时发送
                // 示例数据
                // GS  0.171kg
                //  No.      0
                // Total  0.000kg
                splitKey = 'GS';
                tmp = weight.split(splitKey);
                for (var i = tmp.length - 1; i > -1; i--) {
                    tmpItem = tmp[i];
                    tmpItem = s.doTrim(tmpItem);
                    if (tmpItem.length >= 5) {
                        tmpItem = tmpItem.substr(0, tmpItem.indexOf('kg'));
                        if (/^([0-9.]+)$/.test(tmpItem)) {
                            value = tmpItem;
                            currentIndex = i;
                            i = -1
                        }
                    }
                }
                break;
            case '2':
                // 英展 英展XK3150(W)-60kg 字符串形式的数据，重量稳定时发送
                // 示例数据
                // ST,NT,+ 0.250kg
                splitKey = 'ST,NT,+';
                weight = weight.replace(/US/g, 'ST');
                weight = weight.replace(/-/g, '+');
                tmp = weight.split(splitKey);
                for (var i = tmp.length - 1; i > -1; i--) {
                    tmpItem = s.doTrim(tmp[i]);
                    if (tmpItem.length > 3) {
                        tmpItem = tmpItem.replace('kg', '');
                        if (/^([0-9.]+)$/.test(tmpItem)) {
                            value = tmpItem;
                            currentIndex = i;
                            i = -1
                        }
                    }
                }
                break;
            case '3':
                // 彩信  彩信XK315A ### 字符串形式的数据，连续发送。数据以“=”开始，每次8位，且数据全部从低位开始（真实数据需要反转字符串）。
                // 示例数据
                //=81.700 =61.700
                //示例数据中包含了两个值，即7.18kg、7.16kg
                splitKey = '=';
                tmp = weight.split(splitKey);
                for (var i = tmp.length - 2; i > -1; i--) {
                    tmpItem = tmp[i];
                    if (tmpItem.length > 5) {
                        const wV = parseFloat(s.doTrim(tmpItem.split('').reverse().join('')));
                        if (!isNaN(wV)) {
                          value = wV
                        }
                        currentIndex = i;
                        i = -1;
                    }
                }
                break;
            case '4':
                // 坤宏KHW-G 该型电子称数据以"ENTER."字符串结尾，且之前有一个ASCII码为27的特殊字符。
                // 示例数据
                // 0.480[1B]ENTER.
                // 注意 "[1B]"表示一个ASCII码为27的特殊字符。
                //通过'ENTER.'切割数据
                splitKey = 'ENTER.';
                splitPre = false;
                //测试时用于替换特殊字符
                // weight = weight.replace("u001", '');
                tmp = weight.split(splitKey)
                value = '';
                //用ENTER做切割，需要出现结尾ENTER为准
                if (tmp.length > 2) {
                    //去空格，去特殊非数字字符
                    tmp.forEach(function(item, index) {
                        item = s.doTrim(item);
                        item = item.split('');
                        for (var i = 0; i < item.length; i++) {
                            if (isNaN(item[i])) {
                                if (item[i] != '.') {
                                    item[i] = '';
                                }
                            }
                        }
                        tmp[index] = item.join('');
                    });
                    for (var i = tmp.length - 1; i > -1; i--) {
                        // if(tmp[i] != undefined && tmp[i].length > 2){
                        //判断是否存在，是否是数字，是否为空
                        if (tmp[i] != undefined && isNaN(tmp[i]) == false && tmp[i] != '') {
                            value = tmp[i];
                            currentIndex = i;
                            i = -1;
                        }
                    }
                    try {
                        if (value[0] == '.') {
                            value = value.replace('.', '')
                        }
                        if (!isNaN(value) && value != '') {
                            value = parseFloat(value);
                        }
                    } catch (ex) {}
                }
                break;
            case '5':
                // 耀华3190 字符串形式的数据，连续发送。数据以“=”开始，每次8位，且数据全部从低位开始（真实数据需要反转字符串）。
                // 与彩信XK315A不同的是该款电子称精度较高可达小数点后3位（即精度到g），数据形如 =575.600 表示6.575kg
                // 示例数据####
                // =575.600=076.600
                // 示例数据中包含了两个值，即6.575kg、6.760kg
                splitKey = '=';
                tmp = weight.split(splitKey);
                for (var i = tmp.length - 2; i > -1; i--) {
                    tmpItem = tmp[i];
                    if (tmpItem.length > 5) {
                        const wV = parseFloat(s.doTrim(tmpItem.split('').reverse().join('')));
                        if (!isNaN(wV)) {
                          value = wV
                        }
                        currentIndex = i;
                        i = -1;
                    }
                }
                break;
            case 'coest':
                // coe 东莞沙田仓
                //+   0.00 kg
                //+   0.04 kg
                //+   0.041 kg
                // splitKey = '\s';
                splitKey = '+';
                if (weight.indexOf(splitKey) === -1) {
                    break;
                }
                tmp = weight.split(splitKey);
                for(var i = tmp.length -1; i > -1; i--){
                    tmpItem = s.doTrim(tmp[i]);
                    if(tmpItem.length > 4){
                        tmpItem = tmpItem.substr(0, tmpItem.indexOf('kg'));
                        if(/^([0-9.]+)$/.test(tmpItem)){
                            value = tmpItem;
                            currentIndex = i;
                            i = -1
                        }
                    }
                }
                break;

            case '6':
                // 博途，型号：BT418/3C
                // 示例数据####
                // US NT 00000118 g
                // 先去空格,然后用USNT分割
                splitKey = 'USNT';
                tmp = s.doTrim(weight);
                tmp = tmp.split(splitKey);

                for (var i = tmp.length - 1; i > -1; i--) {
                    tmpItem = s.doTrim(tmp[i]);
                    if (tmpItem.length > 4) {
                        tmpItem = tmpItem.substr(0, tmpItem.indexOf('g'));
                        if (/^([0-9.]+)$/.test(tmpItem)) {
                            value = parseFloat(tmpItem) / 1000;
                            currentIndex = i;
                            i = -1
                        }
                    }
                }
                break;
            case '7':
                // 友声，型号：BH-30
                // 示例数据####
                // US NT 00000118 g
                // 先去空格,然后用USNT分割
                var tmpItemArr = [];
                splitKey = 'ff44';
                tmp = s.doTrim(weight);
                tmp = tmp.split(splitKey);
                for (var i = tmp.length - 1; i > -1; i--) {
                    tmpItem = s.doTrim(tmp[i]);
                    if (tmpItem.length == 8) {
                        for (var j = 6; j > -1; j = j - 2) {
                            if (j == 2) { //增加小数点
                                tmpItemArr.push(tmpItem[j] + '.' + tmpItem[j + 1])
                            } else {
                                tmpItemArr.push(tmpItem[j] + tmpItem[j + 1])
                            }
                        }
                        value = parseFloat(tmpItemArr.join(''));
                        currentIndex = i;
                        i = -1;
                    }
                }
                break;

            case '8':
                // 宝衡BT418W电子称 字符串形式的数据，重量稳定时发送
                // 示例数据
                // ST  NT  0001.510kg[0D][0A]
                splitKey = 'STNT';
                tmp = s.doTrim(weight);
                tmp = tmp.split(splitKey)

                for (var i = tmp.length - 1; i > -1; i--) {
                    tmpItem = s.doTrim(tmp[i]);
                    if (tmpItem.length >= 10) {
                        tmpItem = tmpItem.substr(0, tmpItem.indexOf('kg'));
                        value = parseFloat(tmpItem);
                        currentIndex = i;
                        i = -1

                    }
                }
                break;

            case '9':
                // 宝华南天邮电设备电子秤，格式：
                //  00655
                //  00508
                //  示例数据中包含了两个值，即0.655kg、0.508kg
                splitKey = '\r\n';
                tmp = weight.split(splitKey);
                for (var i = tmp.length - 1; i > -1; i--) {
                    tmpItem = tmp[i];
                    if (tmpItem.length > 4) {
                        value = s.doTrim(tmpItem.split('').join(''));
                        // value = parseFloat(value.substr(0,2) + "." + value.substr(2));
                        value = parseInt(value);
                        currentIndex = i;
                        i = -1;
                    }
                }
                break;

            default:
                value = '';
        }
        if (currentIndex > -1) {
            weight = weight.split(splitKey);
            tmp = '';
            for (i = currentIndex + 1; i < weight.length; i++) {
                if (weight[i] != undefined) {
                    if (splitPre) {
                        tmp = splitKey + weight[i];
                    } else {
                        tmp = weight[i] + splitKey;
                    }

                }
            }
            s.storage.setItem('weightValue', tmp);
        }
        s.realWeight = value;
        window.log("解析后的重量" + value)
        return value;
    },
    doTrim: function(str) {
        var result = '';
        if (str && typeof(str) == 'string') {
            result = str.replace(/(^\s+)|(\s+$)/g, "");
            result = result.replace(/\s/g, "");
        }
        return result;
    },
    // 获取请求的UUID，指定长度和进制,如
    getUUID: function() {
        var len = typeof(len) == 'undefined'
            ? 8
            : len;
        var radix = typeof(radix) == 'undefined'
            ? 16
            : radix;
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = [],
            i;
        radix = radix || chars.length;
        if (len) {
            for (i = 0; i < len; i++) 
                uuid[i] = chars[0 | Math.random() * radix];
            }
        else {
            var r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[
                        (i == 19)
                            ? (r & 0x3) | 0x8
                            : r
                    ];
                }
            }
        }
        return uuid.join('');
    },
    /*******************************************/
    /**静态全局变量**/
    /*******************************************/
    /**
     * 尝试连接的次数
     */
    testTimes: 0,
    /**
     * 注册成功循环标志
     */
    cycle: false,
    /**
     * 注册成功标志
     */
    registered: false,
    /**
     * 返回值存储
     */
    returnValues: null,
    /**
     * 是否https环境,
     * 默认https
     */
    https: true,
    /**
     * 是否输出日志
     */
    debug: false,
    /**
     * 信息类型
     */
    messageType: 1,
    /**
     * 当前业务类型
     */
    businessType: null,
    /**
     * 是否显示alert
     */
    showAlert: false,
    /**
     * 调用成功的回调函数
     */
    success: null,
    /**
     * 调用失败的回调函数
     */
    fail: null,
    /**
     * 业务类型
     */
    businessTypes: [
        '', //0
        '打印', //1
        '称重', //2
        '语音', //3
        '蓝牙', //4
        '视频', //5
        '自定义称重', //6
        '串口', //7
        '', //8
        '', //9
        '', //10
        '大宝安全登录', //11
        '天机', //12
        '拍照', //13
        '', //14
        '高级拍照', //15
    ]
}

export default WET