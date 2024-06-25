import React, {useEffect, useState, useRef, useMemo} from 'react';
import { Input } from '@/component'
import { getMarginStyle } from 'assets/js/proxy-utils'
import { isEmpty, getUuid, _getName } from 'assets/js'
const { useInput } = React
require('./index.scss')
const ClickBox = {}
export default function App(props) {
  const {children, dataSource, value, onChange, style, PopUpPisition, label, hasClear, ...attrs} = props
  const {getValue, setValue, refs} = useInput(['select'])
  const selectTor = useRef()
  const [visible, setVisible] = useState(false)
  const lock = useMemo(() => getUuid(), [])
  function selectItem(item) {
    setValue('select', item.label)
    typeof item.onClick === 'function' && item.onClick()
    typeof onChange === 'function' && onChange(item.value)
    setVisible(false)
  }
  useEffect(() => {
    setValue('select', _getName(dataSource, value, value))
  }, [value, dataSource])
  useEffect(() => {
    function domClick () {
      if (!ClickBox[lock]) {
        setVisible(false)
      }
      ClickBox[lock] = false
    }
    document.addEventListener('click', domClick, false)
    return () => {
      document.removeEventListener('click', domClick, false)
      delete ClickBox[lock]
    }
  }, [])
  function getPopUpPosition() {
    const selectBox = selectTor.current
    if (!selectBox) return {top: 0, left: 0}
    let position = {}
    const { top, left, width, height, right, bottom } = selectBox.getBoundingClientRect()
    const isTop = (t) => t <= window.innerHeight / 2
    const isLeft = l => l <= window.innerWidth / 2
    if (isTop(top) && isLeft(left))  position = { top: bottom, left: left, maxHeight: window.innerHeight - bottom }
    if (isTop(top) && !isLeft(left)) position = { top: bottom, right: window.innerWidth - right, maxHeight: window.innerHeight - bottom }
    if (!isTop(top) && isLeft(left)) position = { bottom: window.innerHeight - top, left: left, maxHeight: top}
    if (!isTop(top) && !isLeft(left)) position = { bottom: window.innerHeight - top, right: window.innerWidth - right, maxHeight: top}
    Object.entries(position).forEach(([key, val]) => {
      position[key] = val + (PopUpPisition && PopUpPisition[key] || 0) + 'px'
    })
    position.minWidth = width+ 'px'
    position.overflow = 'auto'
    return position
  }
  return <div className='q-selector' ref={selectTor} style={{
    ...getMarginStyle(props),
    ...style
  }}>
      <div className='q-s-box' onClick={(e) => {
        if (!visible) {
          setVisible(true)
          // e.stopPropagation()
          ClickBox[lock] = true
        }
        }}>
        {children ? children : <Input label={label} readOnly placeholder="请选择" ref={refs['select']}></Input>}
      </div>
      <div className="q-s-popup"
        style={{
          ...getPopUpPosition(),
          display: visible ? 'block' : 'none'
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {hasClear && <div className='opt-cell' onClick={() => {
          selectItem({label: '', value: ''})
        }}>请选择</div>}
        {Array.isArray(dataSource) && dataSource.map((p, i) => {
          return p.show !== false ? <div className={`opt-cell ${p.disabled ? 'disabled' : ''}`}
            key={i}
            onClick={() => {
              if (p.disabled) return
              selectItem(p)
            }}
          >{typeof p.label == 'function' ? p.label() : p.label}</div> : null
        })}
      </div>
  </div>
}