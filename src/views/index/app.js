import React, {useRef, useState, useEffect} from "react"
import {Icon} from '@/component'
import $http from 'assets/js/ajax'
import localStore from 'assets/js/localStore'
import { flatMap, _menus_ } from 'assets/js'
import Bus from 'assets/js/bus'
import { menuWhiteConfig, testRoute } from "./config"
require('./index.scss')
App.title = '选择操作'
const isProd = ['pcs-web.wt.cainiao.com', 'pcs-admin.wt.cainiao.com'].includes(window.location.hostname)
export default function App(props) {
    const [menu, setMenu] = useState([])
    useEffect(() => {
      console.log('进入选择操作')
      Bus.$emit('closeSetDialog');
        window.dbStore.get(_menus_).then(menu => {
            setMenu(menu)
            Bus.getState('getMenu').then(data => {
                if (Array.isArray(data)) {
                    const menuMap = flatMap(
                      data.filter(d => d.id == 9660), {childrenCode: 'childrens'}
                    ).filter(m => menuWhiteConfig[m.href])
                    menuMap.sort((a, b) => {
                      return (menuWhiteConfig[a.href]).show ? -1 : 1
                    })
                    window.dbStore.set(_menus_, menuMap)
                    if (!isProd) {
                      // 测试菜单，不可合并到生产
                      menuMap.push(...testRoute)
                    }
                    setMenu(menuMap)
                }
            })  
        })
    }, [])
    return <div className="pcs-menu-index">
        {Array.isArray(menu) && menu.map((m) => {
            const menuItem = menuWhiteConfig[m.href]
            if (!menuItem) return null
            const isShow = menuItem.show
            const iconType = menuItem.icon
            if (!isShow) return null
            return <div className="menu-cell" key={m.id || m.href}>
                <div className="cell-handler" onClick={() => {
                    if (!isShow) return
                    window.Router.push(m.href)
                    window._setTitle(m.text)
                }} style={{opacity: isShow && 1 || 0.1, cursor: isShow && "pointer" || 'not-allowed'}}>
                    <div className="icon-box"><Icon size='large' type={iconType}></Icon></div>
                    {m.text}
                </div>
            </div>
        }).filter(f => f)}
    </div>
}