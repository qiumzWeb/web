import React, {useState, useEffect, useRef} from 'react'
import { Icon } from '@/component'
import {addWatchFullScreen, getFullscreenElement, CancelFullScreen, getFullScreen} from './api'
const config = {
    1: {
        type: 'fullscreen',
        text: '设置全屏'
    },
    2: {
        type: 'initscreen',
        text: '取消全屏'
    }
};
export default function App(props) {
    const {node, iconProps, isIcon, ...attrs} = props
    const [type, setType] = useState()
    const [text, setText] = useState()
    useEffect(() => {
        setStatus()
        addWatchFullScreen(function success(...args){
            setStatus()
        }, function error(...args){
            console.log(args, '失败')
        })
    }, [])
    function setStatus() {
        if (getFullscreenElement()) {
            setText(config[2].text)
            setType(config[2].type)
        } else {
            setText(config[1].text)
            setType(config[1].type)
        }
    }
    return <span style={{cursor: 'pointer', display: 'flex', alignItems: 'center'}} onClick={() => {
        if (getFullscreenElement()) {
            CancelFullScreen()
        } else {
            getFullScreen(node)
        }
    }}>
        {isIcon && <Icon title={text} type={type} {...iconProps}></Icon> || text}
    </span>
}