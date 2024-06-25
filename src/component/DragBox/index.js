import React, {useState, useEffect, useRef, useImperativeHandle} from 'react'
import ReactDOM from 'react-dom'
import DragChild from '@/component/DragChild/index'
import {isTrue} from 'assets/js'
require('./px2rem.scss')


function DragBox(props, ref) {
  const {top, bottom, left, right, className, zIndex, ...attrs} = props
  const dragboxRef = useRef()
  let diffX = null
  let diffY = null
  const addEvent = () => {
    const dragbox = dragboxRef && dragboxRef.current
    if (!dragbox) return
    const getSize = (size) => !/\d$/.test(size) ? size : `${size}px`
    dragbox.style.top = isTrue(top) ? getSize(top) : null
    dragbox.style.left = isTrue(left) ? getSize(left) : null
    dragbox.style.bottom = isTrue(bottom) ? getSize(bottom) : null
    dragbox.style.right = isTrue(right) ? getSize(right) : null
    dragbox.style.display = 'block'
    dragbox.addEventListener('mousedown', dragStart, false)
    dragbox.addEventListener('touchstart', dragStart, {capture: false, passive: false})
  }
  const removeEvent = () => {
    const dragbox = dragboxRef && dragboxRef.current
    if (!dragbox) return
    dragbox.removeEventListener('mousedown', dragStart, false)
    dragbox.removeEventListener('touchstart', dragStart, {capture: false, passive: false})
  }
  useEffect(() => {
    addEvent()
    return () => removeEvent()
  }, [])
  function dragStart(e) {
    const dragbox = dragboxRef && dragboxRef.current
    const ev = e || window.event
    const event = ev.touches ? ev.touches[0] : ev
    diffX = event.clientX - dragbox.offsetLeft
    diffY = event.clientY- dragbox.offsetTop
    document.addEventListener('mousemove', dragMove, false)
    document.addEventListener('touchmove', dragMove, {capture: false, passive: false})
    document.addEventListener('mouseup', dragEnd, false)
    document.addEventListener('touchend', dragEnd, {capture: false, passive: false})
    // 拖拽状态
    window.dragStatus = [1]
  }
  function dragMove(e) {
    const dragbox = dragboxRef && dragboxRef.current
    dragbox.style.bottom = null
    dragbox.style.right = null
    const ev = e || window.event
    ev.preventDefault();
    const event = ev.touches ? ev.touches[0] : ev
    let moveX = event.clientX - diffX
    let moveY = event.clientY - diffY
    if (moveX < 0) {
      moveX = 0
    } else if (moveX > window.innerWidth - dragbox.offsetWidth) {
      moveX = window.innerWidth - dragbox.offsetWidth
    }
    if (moveY < 0) {
      moveY = 0
    } else if (moveY > window.innerHeight - dragbox.offsetHeight) {
      moveY = window.innerHeight - dragbox.offsetHeight
    }
    dragbox.style.left = moveX + 'px'
    dragbox.style.top = moveY + 'px'
    document.addEventListener('mouseup', dragEnd, false)
    document.addEventListener('touchend', dragEnd, {capture: false, passive: false})
    if(window.dragStatus) {
      window.dragStatus.push(2)
    }
  }
  function dragEnd(e) {
    if (window.dragStatus) {
      window.dragStatus.push(3)
    }
    document.removeEventListener('mousemove', dragMove, false)
    document.removeEventListener('mouseup', dragEnd, false)
    document.removeEventListener('touchmove', dragMove, {capture: false, passive: false})
    document.removeEventListener('touchend', dragEnd, {capture: false, passive: false})
  }
  return ReactDOM.createPortal(<div style={{zIndex: zIndex || 199}} className={`dragbox ${className}`} {...attrs} ref={dragboxRef}>
    {props.children}
  </div>, document.body)
}
const App = React.forwardRef(DragBox)
App.Child = DragChild

export default App