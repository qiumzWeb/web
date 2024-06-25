import React, {useEffect, useState } from 'react'
import  Action  from './action'
import  Branding  from './branding'
import Bus from 'assets/js/bus'
import { VirtualKeyboard, Button } from '@/component'
import {Cookie, _CountryList, _getName} from 'assets/js'
import './index.scss'
export default function Header(props) {
  const [title, setTitle] = useState(Bus.getState('currentRouteTitle'))
  const [region, setRegion] = useState('')
  const [titleType, setTitleType] = useState('')
  useEffect(() => {
    setTitle(Bus.getState('currentRouteTitle'))
    Bus.watch('currentRouteTitle', (state) => {
      setTitle(state.currentRouteTitle)
    })
    window.dbStore.get(_CountryList).then(list => {
      setRegion(_getName(list, Cookie.get('putinArea')))
    })
    const unBus = Bus.$on('setTitle', (title) => {
      setTitleType(title)
    })
    return () => {
      unBus()
    }
  }, [])
  return (<div className='pcs-header'>
    <Branding></Branding>
    <div style={{
      display: 'flex',
      flex: 1,
      fontSize: titleType ? 30 : 40,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontWeight: 700,
    }}>
      <div>{(title || '') + (region ? `(${region})` : '')}</div>
      {(titleType ? `(${titleType})` : '')}
    </div>
    <Action></Action>
    {/* 虚拟键盘 */}
    <VirtualKeyboard></VirtualKeyboard>
  </div>)
}
