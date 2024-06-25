import React from 'react'

export default React.forwardRef(function Row(props, ref) {
  return <div ref={ref} style={{
    display: 'flex',
    position: 'relative',
    alignItems: 'center'
  }} {...props}></div>
})