import React from 'react'
import { isTrue, isHttpUrl, BasePath } from './index'
import Bus from './bus'

/**
 * 获取子组件
 * @param {reactChildren} children 
 * @returns {Array[children]}
 */
export function getChildren(children) {
  return Array.isArray(children) ? children.filter(c => !!c) : (children && [children] || [])
}

/**
 * 复制组件属性
 * @param {reactNode - 当前组件} to 
 * @param {reactNode - 来源组件} from 
 * @param {function - 自定义} callback 
 */
export function AssignProps(to, from, callback) {
  Object.keys(from).forEach(key => {
    if (key === 'propTypes') return
    to[key] = from[key]
    if (typeof callback === 'function') {
      callback(key, to, from)
    }
  })
}

/**
 * 代理子组件
 * @param {reactNode} child 
 * @returns {reactNode}
 */
export function ProxyChild(child) {
  const children = getChildren(child)
  return children.map((c, index) => {
    if (!c || !c.$$typeof || !c.type) return c; // 非 class 组件不做处理
    const NChild = c.type
    // 更新老代码hook
    typeof NChild.prototype.replaceHook === 'function' && NChild.prototype.replaceHook()

    return <NChild key={index} {...c.props} ref={c.ref}></NChild>
  })
}

/**
 * 组件 样式添加 margin 配置
 * @param {*} props 
 * @returns {style}
 */
export function getMarginStyle(props) {
  const {style, mt, mr, mb, ml } = props
  const getSize = (size) => !/\d$/.test(size) ? size : `${size}px`
  const marginRight = isTrue(mr) && { marginRight: getSize(mr)} || {}
  const marginTop = isTrue(mt) && { marginTop: getSize(mt) } || {}
  const marginLeft =isTrue(ml) && { marginLeft: getSize(ml)} || {}
  const marginBottom =isTrue(mb) && { marginBottom: getSize(mb)} || {}
  return {
    ...(style || {}),
    ...marginBottom,
    ...marginLeft,
    ...marginRight,
    ...marginTop
  }
}

export const apiBase = '/pcsapiweb'

export function getAjaxUrl(url) {
  if (!isHttpUrl(url)) {
    if (!/^\//.test(url)) {
      url = '/' + url
    }

    if (!/^\/gos|pcsweb|pcsservice|pcsfbi|pcsapiweb|pcslogin\//.test(url)) {
        const preApi = Bus.getState('apiBase')
        url = (preApi || apiBase) + url
    }
  }
  return url
}

// 路由 histroy 代理
export function ProxyHistory(history) {
  const proxyHooks = ['push', 'replace']
  proxyHooks.forEach(key => {
    history[key] = new Proxy(history[key], {
      apply(fn, cxt, args) {
        let path = args[0]
        if (typeof path === 'string') {
          if (!/^\//.test(path)) {
            path = '/' + path
          }
          if (!new RegExp(`^\\${BasePath}`).test(path)) {
            args[0] = BasePath + path
          }
        }
        return Reflect.apply(fn,cxt, args)
      }
    })
  })
  return history
}