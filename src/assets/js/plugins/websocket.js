(function(window){
	var socket = window.socket = function(){
		this.message = [];
	};

	socket.prototype = {

		constructor: socket,
		
		//发送信息打印	
	    send: function(message, success, error){
			var that = this;
			var interval;
	    	this.message.push(message);
	    	this.success = success;
	    	this.error = error;
	    	
	    	if(!this.socket){	    		    		
	    		this.socket = this.createWebsocket(message.appkey || message.Appkey);
	    		this.bindSocketEvent();
	    	}else if(this.socket.readyState === 1){
	    		this.socket.send(JSON.stringify(message));
	    		this.message = [];
	    	}
	    },
	    
	    //创建WebSocket
	    createWebsocket: function(appkey){
    		return new WebSocket('ws://127.0.0.1:9187/AgentServcie?AppKey=' + appkey);	    	
	    },
	    
	    //为WebSocket绑定事件
	    bindSocketEvent: function(){	    	
	    	var that = this;
	    	this.socket.onopen = function(){
	    		that.message.forEach(function(message){	    			
	    			that.socket.send(JSON.stringify(message));
	    		});
	    		that.message = [];
	    		that.socket.onmessage = function(event){
	    			console.log('Client received a message', event);
		    		if(typeof that.success == 'function'){
		    			that.success(JSON.parse(event.data));
		    		}
		    	};

/*		    	that.socket.onerror = function(event){
		    		console.log('Client notified socket has closed', event);
		            if($.isFunction(that.error)){
		    			that.error(event);
		    		}
		        }; */
	    	};

	    	this.socket.onerror = function(event){
                console.log('Client notified socket has error', event);
                if(typeof that.error == 'function'){
                    that.error(event);
                }
            };
	    }
	};	
})(window);