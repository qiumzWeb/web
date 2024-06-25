
import React, { useState, useEffect, useRef} from 'react'
require('./index.scss')
export default function App(props) {
  const {children, className, ...attrs} = props
  const [isOpen, setIsOpen] = useState(false)
  const [sm, setSm] = useState(false)
  const copyRef = useRef()
  const parentRef = useRef()

  const showMore = () => {
    setIsOpen(!isOpen)
  }
  useEffect(() => {
    const parentH = parentRef.current.clientHeight
    const copyH = copyRef.current.clientHeight
    if (copyH > parentH) {
      setSm(true)
    }
  }, [])
  return <div className="q-t-b">
    <div className={`t-c-box`} ref={parentRef}>
      <div {...attrs} className={`t-text ${className || ''} ${!isOpen && 'm-hide' || ''}`}>{children}</div>
      <div {...attrs} className={`t-copy ${className || ''}`} ref={copyRef}>{children}</div>
    </div>
    {sm && <div className="tshow-more" onClick={showMore}>
      <span>{isOpen && '收起' || '展开'}</span>
      <span className={isOpen && "_ar_t" || "_ar_b"} style={{width: 12, height: 12}}></span>
    </div>}
  </div>
}