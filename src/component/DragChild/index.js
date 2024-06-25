import React from 'react';
export default React.forwardRef(function App(props, ref) {
  const {onClick, ...attrs} = props
  return <div ref={ref} onClick={function(...args){
    if (!window.dragStatus || window.dragStatus.length < 5) {
      typeof onClick === 'function' && onClick(...args)
    }
  }} {...attrs}></div>
})