var { spawn, exec, execSync  } = require('child_process');
var path = require('path');
var utils = require('./utils');
var ora = require('ora')
var childProcess;

startServer();
utils.getWatchFileRestartService(path.join(__dirname, '../src/component'), () => {
  // 监听进程退出事件
  childProcess.on('exit', (code, signal) => {
    /**
     * 重启服务
     */
    startServer('Project/pcs-web webpack Compiling...');
  });
  // 杀掉进程
  childProcess.kill('SIGTERM');
})

/**
 * 启动服务
 */
function startServer(msg) {
  var spinner = ora(msg || 'Project/pcs-web service starting...');
  spinner.start()
  execSync('set NODE_ENV=development')
  childProcess = spawn('node', ['--max_old_space_size=10240','c-build/dev-server.js']);
  // 监听子进程输出
  childProcess.stdout.on('data', (data) => {
    console.group(`${data}`);
    console.groupEnd();
  });
  
  childProcess.stderr.on('data', (data) => {
    console.clear();
    console.group(`${data}`);
    console.groupEnd();
    if (data.toString().includes('100%')) {
      spinner.stop()
    }
  });
  
  childProcess.on('close', (code) => {
    console.log(`======= Process Closed ======`);
  });
}
