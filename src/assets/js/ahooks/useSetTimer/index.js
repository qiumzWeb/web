import { useEffect, useRef } from 'react'
import { getResult } from 'assets/js'
/**
 * 
 * @param {Function} fn 回调方法
 * @param {Number} delay 定时循环时间
 * @param {Number} time 初始化延迟时间
 */
export default function useSetTimer(fn, delay, time = 0) {
  const isToDo = useRef(true)
  const { current } = useRef(fn)
  useEffect(() => {
    setTimeout(() => {
      setTimer()
    }, time)
    return () => {
      isToDo.current = null
    }
  }, [])
  function setTimer() {
    console.log(isToDo, '9999')
    if (isToDo.current) {
      setTimeout(() => {
        getResult(current).finally(e => {
          setTimeout(setTimer, delay)
        })
      }, 0)
    }
  }
}