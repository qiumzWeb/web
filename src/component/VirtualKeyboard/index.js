import React, {useEffect, useState } from 'react';
import ReactDOM from 'react-dom'
import { DragBox, Icon, Button } from '@/component'
require('./px2rem.scss');
const lockedKey = '↑';

export default function App(props) {
  //配置选项
  const options = {
    keys: `
    Esc,1,2,3,4,5,6,7,8,9,0,←,
    q,w,e,r,t,y,u,i,o,p,=,\\,
    a,s,d,f,g,h,j,k,l,-,_,Del,
    ${lockedKey},z,x,c,v,b,n,m,.,/,Enter
    `.split(',').map(k => k.trim().replace(/\s/, '')),
    spKeys: {
      'Esc': EscEnter,
      '←': LeftEnter,
      [lockedKey]: UpEnter,
      'Del': DelEnter,
      'Enter': DispatchEnterEvent
    },
    spKeysDesc: {
      'Esc': '退出',
      '←': '回退',
      [lockedKey]: "大写锁定",
      'Del': '清空',
    },
    iconPosition: {        		
      right: px2rem(6),
      bottom: px2rem(6)
    },
    keyBoardPosition: {
      right: '30%',
      bottom: '20%'
    }
  }
  const [visible, setVisible] = useState(false)
  const [keys, setKeys] = useState(options.keys)
  const [upStatus, setUpStatus] = useState(false)
  useEffect(() => {
      const focusInput = getInput()
      focusInput && focusInput.focus()
      if (!visible) {
        setKeys(options.keys)
        setUpStatus(false)
      }
  }, [visible])
  // 按键事件
  const keyEnter = (key) => {
    if (typeof options.spKeys[key] == 'function') {
      options.spKeys[key].call(null, key)
    } else {
      TextEnter.call(null, key)
    }
    getInput().focus()
  }
  // 获取输入框
  function getInput() {
    return window._focusTarget ? window._focusTarget : document.querySelector('input[type=text]')
  }
  // 退出键
  function EscEnter() {
    setVisible(false)
  }
  // 文字键
  function TextEnter(key) {
    let value = getInput().value
    getInput().value = value + key
  }
  // 回格键
  function LeftEnter() {
    let value = getInput().value.slice(0, -1)
    getInput().value = value
  }
  // 上档键（大小写切换）
  function UpEnter() {
    setKeys(keys.map(k => {
      if (options.spKeys[k]) {
        return k
      } else if (upStatus && /[A-Z]/.test(k)) {
        return k.toLowerCase()
      } else if (/[a-z]/.test(k)) {
        return k.toUpperCase()
      } else {
        return k
      }
    }))
    setUpStatus(!upStatus)
  }
  // 删除键
  function DelEnter() {
    getInput().value = ''
  }
  // 触发回车事件
  function DispatchEnterEvent() {
    const EnterEvent = getInput().dispatchEnterEvent;
    typeof EnterEvent === 'function' && EnterEvent.call(getInput())
  }
  return ReactDOM.createPortal(<div style={{position: 'relative', zIndex: 999998}}>
      {visible && <DragBox zIndex={999999} {...options.keyBoardPosition}>
        <div className='v-key-board'>
          {
            keys.map(key => {
              return <DragBox.Child
                key={key}
                className={`v-keys ${options.spKeys[key] ? 'sp' : ''} ${key === lockedKey && upStatus ? 'active' : ''} ${key}`}
                onClick={() => keyEnter(key)}
              >
                {key}
              </DragBox.Child>
            })
          }
        </div>
      </DragBox> || <Icon
        type="keyboard"
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          zIndex: 99,
          cursor: 'pointer',
          ...options.iconPosition,
          textShadow: '0 px2rem(2) px2rem(4) rgb(0 0 0 / 50%)',
          color: '#fff'
        }}
      ></Icon>}
      {/* <Button style={{position: 'fixed', zIndex: 999999999999999, bottom: 100, left: '10%'}} onClick={() => {window.onWeightTest()}}>模拟电子称重</Button> */}
  </div>, document.body)
}