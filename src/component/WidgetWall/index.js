import React, {useRef, useEffect, useState} from 'react'
import DialogComponent from './DialogComponent'
import FullComponent from './FullComponent'
require('./scss/px2rem.scss')
// 生成页面
export default function App(props) {
  const { isFull, ...attrs } = props
  // 格口状态 
  const sortStatus = [
    'empty', // 空闲
    'disabled', // 播种中
    'ok', // 播种完成
    'warn',// y订单超时
    'error' // 异常
  ]

  return <div>
    {isFull ? <FullComponent
      {...attrs}
      sortStatus={sortStatus}
    ></FullComponent> : <DialogComponent
      {...attrs}
      sortStatus={sortStatus}
    ></DialogComponent>}
  </div>
}