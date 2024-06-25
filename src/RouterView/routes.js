import Interceptor from './Interceptor'
const routes = []
const getRoutes = require.context('@/routes', true, /\.js$/);
getRoutes.keys().forEach(key => {
  const routeModule = getRoutes(key)
  routes.push(...(routeModule.default || routeModule))
});
const NotFount = () => import(/* webpackChunkName: "NotFound" */ '@/pages/404')
routes.push({
  component: NotFount
})
routes.forEach(route => {
  Interceptor(route, routes)
})


export default routes