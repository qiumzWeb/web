import React, {useRef, useEffect, useState} from 'react'
import { getMarginStyle } from 'assets/js/proxy-utils'
import { onEnter as onInputEnter } from 'assets/js/utils'
require('./index.scss')
function AInput(props, ref) {
  const { label, style, width, children, onEnter, number, show, className, ...args } = props
  return <div style={{...getMarginStyle(props)}}
    onClick={children && args.onClick || (() => {})}
    className={`c-input ${className} ${show === false ? 'hide' : ''}`}
  >
    {label && <span>{label}:</span>}
    {
      children
      ? <div className='c-input-text' style={Object.assign({}, {width})} {...args}>{children}</div>
      : <input type="text" label={label} className="text c-input-text" onFocus={(e) => {
        window._focusTarget = e.target;
        e.target.dispatchEnterEvent = onEnter;
      }} ref={ref} style={Object.assign({}, {width})} onKeyPress={onInputEnter(onEnter)} {...args}></input>
    }
  </div>
}
export default React.forwardRef(AInput)