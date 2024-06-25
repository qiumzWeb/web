(function(window) {
    var initialized = false;
    var socket = window.visionSocket = function() {
        if (!this.socket || this.socket.readyState == 3) {
            this.socket = this.createWebsocket();
            this.bindSocketEvent();
        }
    };

    socket.prototype = {

        constructor: socket,

        //发送信息打印
        send: function(message, success, error) {
            var that = this;
            that.message = message;
            this.success = success;
            this.error = error;

            if (!this.socket || this.socket.readyState == 3) {
                this.socket = this.createWebsocket();
                this.bindSocketEvent();
            }
            // 建立连接后需要先发送调用接口声明，再发送消息
            var interval = setInterval(() => {
                if (!that.initialized) {
                    if (that.socket.readyState == 1) {
                        // 对WET发送接口类型声明 businessType = 12 为天机接口调用
                        var bizType = {
                            bussinessType: 12
                        };
                        that.socket.send(JSON.stringify(bizType));
                    }
                } else {
                    if (that.socket.readyState == 1) {
                        that.socket.send(JSON.stringify(that.message));
                        clearInterval(interval);
                    }
                }
            }, 1000);
        },

        //创建WebSocket
        createWebsocket: function() {
            return new WebSocket('ws://localhost:3005/vision');
            // return new WebSocket('ws://localhost:7001/vision');
        },

        //为WebSocket绑定事件
        bindSocketEvent: function() {
            var that = this;
            this.socket.onopen = function() {
                that.initialized = false;
                console.log('Client has been open!');
            };

            this.socket.onmessage = function(event) {
                console.log('Client received a message', event);
                var data = JSON.parse(event.data);
                if (data && data.type == 12 && data.success && data.enable) {
                    that.initialized = true;
                } else if (that.initialized && typeof that.success == 'function') {
                    that.success(data);
                }
            };

            this.socket.onerror = function(event) {
                console.log('Client notified socket has error', event);
                that.initialized = false;
                if (typeof that.error == 'function') {
                    that.error(event);
                }
            };

            this.socket.onclose = function() {
                that.initialized = false;
            }
        }
    };
})(window);
