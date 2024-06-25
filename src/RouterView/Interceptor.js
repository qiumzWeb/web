import { upperToLine, getResult} from 'assets/js';
import { ProxyHistory } from 'assets/js/proxy-utils'
import { createBrowserHistory } from 'history';

// 路由守卫
import RouteGuard from './beforeRouteEnter'
// 路由拦截代理
const NotFount = () => import(/* webpackChunkName: "NotFound" */ '@/pages/404')
export default function(route, routes) {
  if (
    route.hasOwnProperty('path') &&
    !route.hasOwnProperty('exact')
  ) {
    route.exact = true
  }
  !route.component && (route.component = NotFount)
  route.component = new Proxy(route.component, {
    async apply(fn, cxt, args) {
      let result = false;
      let newPath = route.redirect || '';
      const history = ProxyHistory(createBrowserHistory());
      await getResult(
        RouteGuard.beforeEach(
          (path) => {
            result = true;
            if (route.path === path) return
            path && (newPath = path)
          },
          route
        )
      );
      if (!result) return null;
      let cFn = fn;
      if (newPath) {
        const c = (
          routes.find(r => r.path === newPath) ||
          {component: NotFount}
        ).component;
        if (c) {
          cFn = c;
          !route.redirect && history.replace(newPath);
        }
      };
      let NComponent = (await Reflect.apply(cFn, cxt, args)).default;
      
      if (NComponent.title) {
        window._setTitle(NComponent.title)
        route.name = NComponent.title
      } else {
        // NComponent.title = route.name = document.title
      }

      if (NComponent.name === 'ProxyApp') {
        return {
          default: NComponent
        }
      };
      if (typeof NComponent.prototype.replaceHook === 'function') {
        if (NComponent.prototype.componentWillMount) {
          NComponent.prototype.replaceHook('componentWillMount', 'componentDidMount');
        } else {
          NComponent.prototype.replaceHook('componentDidMount', 'componentDidMount');
        }
        NComponent.prototype.replaceHook('componentWillUnmount', 'componentWillUnmount');
      }
      const newCom = RouteGuard.beforeRouteEnter(NComponent, route);
      newCom.model = NComponent.model = route.mode;
      return {
        default: newCom
      };
    }
  });
}


