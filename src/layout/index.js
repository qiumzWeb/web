import './index.scss'
import React, { useEffect, useState } from 'react'
import Header from './header'
import Bus from 'assets/js/bus'

export default function App(props) {
  useEffect(() => {
  }, [])
  return (<div className="pcs-layout">
    <Header></Header>
    <div className='pcs-main'>
      <div style={{width: '100%', overflow: 'hidden'}}>
        <div className={`pcs-content`} id="pcs-app-route">
          <div style={{width: '100%', height: '100%'}}>
            <div className={`route mch`}>
                {props.children}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>);
}
