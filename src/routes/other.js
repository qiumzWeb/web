// 手动配置路由配置
// 路由的component 必须使用懒加载 component:  () => import(/* webpackChunkName: "my-chunk-name" */ '@/pages/index')
export default [
/**
 * 手动配置路由
 */
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '',
    redirect: '/index'
  },
]
