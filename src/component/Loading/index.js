import React from 'react';
require('./index.scss')
export default React.forwardRef(function App(props, ref) {
  const { isFullScreen } = props
  const style = {
    position: 'absolute',
    zIndex: 99,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
  if (isFullScreen) {
    style.position = 'fixed'
  }
  return <div style={style}>
  <div ref={ref} className="next-loading next-open next-loading-inline">
    <div className="next-loading-tip">
      <div className="next-loading-indicator">
        <div className="next-loading-fusion-reactor">
          <span className="next-loading-dot"></span>
          <span className="next-loading-dot"></span>
          <span className="next-loading-dot"></span>
          <span className="next-loading-dot"></span>
        </div>
      </div>
      <div className="next-loading-tip-content"></div>
      <div className="next-loading-tip-placeholder"></div>
    </div>
    <div className="next-loading-component next-loading-wrap">
      <div className="next-loading-masker"></div>
    </div>
  </div>
  </div>
})
