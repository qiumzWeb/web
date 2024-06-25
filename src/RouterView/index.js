import React, { lazy, Suspense } from 'react';
import { Loading, WaterMark } from '@/component'
import { Switch, Route, BrowserRouter as Router } from 'react-router-dom';
import { flatMap, isObj, BasePath } from 'assets/js'
import routes from './routes';
import Layout from '@/layout'
import Bus from 'assets/js/bus'
export default function RouteView() {
  return (
    <div>
    <Router>
      <Layout>
        <Suspense fallback={loadRoute()}>
          <Switch>
              {RenderRoute(routes)}
          </Switch>
        </Suspense>
      </Layout>
    </Router>
    <WaterMark></WaterMark>
    </div>
  );
}
function loadRoute() {
  return <Loading isFullScreen></Loading>
}

function RenderRoute(routes) {
    const newRoutes = flatMap(routes);
    newRoutes.forEach(n => {
      n.component = lazy(n.component);
    });
    Bus.setState({
      routes: newRoutes
    })
    return (
      Array.isArray(newRoutes) &&
      newRoutes.map((r, key) => {
        if (!isObj(r)) return null;
        if (r.path) {
          r.path = BasePath + r.path
        }
        if (r.path == '') {
          r.path = '/'
        }
        return <Route {...r} key={key}></Route>;
      })
    );
}
