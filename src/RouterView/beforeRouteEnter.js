
import React, {useEffect} from 'react'
import Bus from 'assets/js/bus'
import { getWid } from 'assets/js'
import { ProxyHistory } from 'assets/js/proxy-utils'

export default {
/**
 * @desc 路由首次进入时调用, 路由守卫
 * @param {function} next // 必须执行next() 才能进入页面
 * @param {Object} route // 当前路由信息
 */
  async beforeEach(next, route) {
    if (!getWid() && route.path !== '/selectwarehouse') {
      window._setTitle('选择仓库')
      await new Promise(resolve => {
        const unBus = Bus.$on('routeRefresh', () => {
          unBus()
          resolve()
        })
      })
    }
    next()
  },


/**
 * @desc 所有路由总开关  // beforeRouteEntry
 * @param {*} Route //当前加载的路由组件
 * @returns
 */
  beforeRouteEnter(Route) {
    return function ProxyApp (props) {
      const path = props.location.pathname
      const TagUrl = props.match.url + props.location.search
      let RouteTitle = Route.title
      useEffect(() => {
        if (Route.title) {
          window._setTitle(Route.title)
          RouteTitle = Route.title
        } else if (document.title) {
          RouteTitle = document.title
        }
        // 全局挂载路由
        !window.Router && (window.Router = ProxyHistory(props.history))
      },[props.match.url])
      return <Route {...props}></Route>
    };
  }
}

