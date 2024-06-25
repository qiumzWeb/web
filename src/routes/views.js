import { upperToLine } from 'assets/js';

const routes = []
// views 目录
const getModel = require.context('@/views', true, /\/app\.js$/, 'lazy');
getModel.keys().forEach(key => {
  const requirePath = key.replace(/^\./, '')
  let component = () => import(/* webpackChunkName: "[request]"*/ `@/views${requirePath}`)
  let path = key.match(/^\.(.*)\/app\.js$/)[1];
  routes.push({
    path,
    component,
    exact: true
  });
});

export default routes