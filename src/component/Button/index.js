import React from 'react'
import {getMarginStyle} from 'assets/js/proxy-utils'
require('./button.scss')
const { useScanSubmit } = React
export default React.forwardRef(function Button(props, ref) {
  const { className, scan, onClick, ...args} = props
  const loop = () => {}
  useScanSubmit(function(event){
    if (scan) {
      typeof onClick === 'function' && onClick.call(this, event)
    }
  }, [scan])
  return <button
    ref={ref}
    className={`c-btn  ${className || ''}`}
    {...args}
    style={getMarginStyle(props)}
    onClick={props.disabled ? loop : onClick }
  ></button>
})