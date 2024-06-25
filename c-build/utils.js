var path = require('path')
// glob模块，用于读取webpack入口目录文件
var glob = require('glob');
var fs = require('fs');
/*
 * 返回静态资源路径(不需要被处理的资源)
 * project/static
 * */
exports.assetsPath = function (_path) {
    return path.posix.join('', _path)
}

//获取react-js入口文件
exports.getEntries = function (globPath) {
  var entries = {}
  glob.sync(globPath).forEach(function (entry) {
	var src = entry.split('/views/')[1];
   	src = src.split("/");
    // if (src.length === 1) {
    //     src = src.map(function(s){return s.replace('.js', '')})
    // } else {
        src.splice(-1);
    // }
	var moduleName = src.join("/")
    moduleName && (entries[moduleName] = entry);
  });
  console.log(entries, 7878)
  return entries;
}
// 获取 widgets- js 入口文件
exports.getWidgetsEntries = function (globPath) {
    var entries = {}
    glob.sync(globPath).forEach(function (entry){
        var src = entry.split('/widgets/')[1]
        var moduleName = src.split('.js')[0]
        entries[moduleName] = entry;
    })
    return entries;
}

// 监听webpack监控以外的文件重启服务
exports.getWatchFileRestartService = function(pathname, restartService) {
  let isFileRename = false
  fs.watch(pathname, (eventType, filename) => {
    if (eventType == 'rename') {
      isFileRename = true
    }
    if (isFileRename) {
      // 检查文件
      // 新增文件 且存在 index.js 文件时 重启服务
      fs.access(path.join(pathname, filename, './index.js'), fs.constants.F_OK, (err) => {
        if (!err) {
          isFileRename = false;
          typeof restartService === 'function' && restartService();
        }
      });
    }
  })

}