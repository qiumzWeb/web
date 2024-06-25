(function(window){

	var socket = window.cloudSocket = function(){
		this.message = [];
	};

	socket.prototype = {

		constructor: socket,
		
		//发送信息打印	
	    send: function(message, success, error){
			var that = this;
            this.message.push(message);
	    	this.success = success;
	    	this.error = error;

	    	if(!this.socket){	    		    		
	    		this.socket = this.createWebsocket();
	    		this.bindSocketEvent();
	    	}else if(this.socket.readyState === 1){	    		
	    		this.setPrinter();
                this.sendMessages(message);
                this.message = [];


	    	}
	    },
	    
	    //创建WebSocket
	    createWebsocket: function(appkey){
	    	return new WebSocket('ws://localhost:13528');	    	
	    },
	    
	    //为WebSocket绑定事件
	    bindSocketEvent: function(){	    	
	    	var that = this;
	    	this.socket.onopen = function(){
	    		
	    		that.setPrinter();
				Array.isArray(that.message) && that.message.forEach(message => {
					that.sendMessages(message);
				})
                that.message = [];

	    		
	    		that.socket.onmessage = function(event){
	    			//console.log('Client received a message', event);
	    			var data = JSON.parse(event.data);
	    			if (typeof that.success == 'function') {
	    			    if (data.cmd === 'print') {
                            that.success({
                                Success: data.status === 'success' ? true : false,
                                Msg: data.msg
                            });
                        }
                        else if (data.cmd === 'getPrinters') {
	    			        that.success(data);
                        }
                    }
		    	};
	    	};

            this.socket.onerror = function(event){
                //console.log('Client notified socket has closed', event);
                if(typeof that.error == 'function'){
                    that.error(event);
                }
            };
	    },
	    
	    //设置打印机信息
	    setPrinter: function(msg){
	    	var config = this.createConfig();
	    	this.socket.send(JSON.stringify(config));
	    },
	    
	    //创建打印机配置信息
	    createConfig: function(){
	    	var msg = this.message;
	    	return {
		        "cmd":"setPrinterConfig",
		        "requestID": this.createRandom(9),
		        "version": "1.0",
		        "printer": {
		             "name": msg.printer || "Microsoft XPS Document Writer",
		             "needTopLogo": true,
		             "needBottomLogo": true,
		             "horizontalOffset": 0.0,
		             "verticalOffset": 0.0,
		             "forceNoPageMargins": true,
		             "paperSize": msg.data ?  msg.data.paperSize : ''
		        }
	    	}
	    },
	    
	    //发送打印信息
	    sendMessages: function(message){
	    	var newMessage = this.createMessage(message);
        var that = this;
        console.log(newMessage, '9999')
        newMessage.forEach(function(msg){
          that.socket.send(JSON.stringify(msg));
        })
	    	
	    },
	    
	    //创建发送信息
	    createMessage: function(msg){
        var that = this;
	    	// 如果消息本身就是完整的命令，则直接返回。
	    	if (msg.cmd) {
	    	  return [msg];
        }

	    	var documents = msg.data.cloudPrintParamList;

	    	if (msg.data.dataType == 'Label') {
	    	    documents = msg.data.documents;
        }

        function getPrintMessage(data){
          return {
            "cmd": "print",
            "requestID": that.createRandom(9),
            "version": "1.0",
            "task": {
                "taskID": that.createRandom(7),
                "preview": false,
                "printer": msg.printer || "Microsoft XPS Document Writer",
                "previewType": "pdf",
                "firstDocumentNumber": 1,
                "totalDocumentCount": 100,
                "documents": data
            }
          }
        };

        var contents = documents[0].contents;
        var newPrintMessages = [];

        if (Array.isArray(contents)) {

          contents.forEach(function(item){
            var newDocuments = JSON.parse(JSON.stringify(documents));
            newDocuments[0].contents = [item]
            var printMsg = getPrintMessage(newDocuments);
            var printType="";
            var contentType = item.contentType;
            if (!!contentType && contentType.toLowerCase() === 'pdf') {
                printType="dirctPrint";
                printMsg["task"]["printType"]=printType;
                if (Array.isArray(newDocuments[0]?.contents)) {
                  newDocuments[0]?.contents.forEach(function(item){
                    delete item.encryptedData;
                    delete item.signature
                  })
                }
            }
            newPrintMessages.push(printMsg)
          })

        } else {
          newPrintMessages.push(getPrintMessage(documents))
        }

	    	// var printType="";
	    	// var contentType = documents[0].contents[0].contentType;
	    	// if (!!contentType && contentType.toLowerCase() === 'pdf') {
        //     printType="dirctPrint";
        //     printMessage["task"]["printType"]=printType;
        //     if (Array.isArray(documents[0]?.contents)) {
        //       documents[0]?.contents.forEach(function(item){
        //         delete item.encryptedData;
        //         delete item.signature
        //       })
        //     }
			  // }
	    	// return printMessage;

        return newPrintMessages;
	    },
	    
	    //创建随机数
	    createRandom: function(n){
	    	var ret = '', i = 0;	    	
	    	for(; i < n ; i++){
   	         	ret += Math.floor(Math.random()*10);
   	     	}
			if (n === 7) {
				return this.getUuid(ret)
			}
	    	return ret;
	    },
		getUuid: function getUuid(s) {
			return s + (Date.now().toString(32) + Math.random() * Math.pow(10, 5)).split('.')[0];
		}
	};
})(window);