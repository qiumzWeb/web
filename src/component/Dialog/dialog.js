import React, {useState, useEffect, useRef} from 'react'
import Button from '@/component/Button'
import { getResult, isTrue, messageAudio } from 'assets/js'
require('./dialog.scss')
require('./px2rem.scss')
function Dialog(props, ref) {
  const noop = () => {}
  const { title, onOk = noop, onClose= noop, onCancel=noop, visible,
    children, cancelText = '取消', okText = '确认', style, className, footer,
    okLoadingText = '正在提交...',
    isPx2rem, closeCountTime, 
  } = props
  const [message, setMessage] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [okShowText, setOkShowText] = useState(okText)
  const [countTimeText, setCountTimeText] = useState('')
  ref = ref || useRef()

  const onConfirm = async () => {
    setDisabled(true)
    try {
      setOkShowText(okLoadingText)
      setMessage('')
      const message = await getResult(onOk)
      setMessage(message)
      if (message) {
        messageAudio.error()
      }
    } finally {
      setOkShowText(okText)
      setDisabled(false)
    }
  }

  function setCountText(time, totleTime) {
    if (!visible) return;
    if (totleTime <= 0) {
      setCountTimeText('');
      onConfirm();
      return
    }
    setCountTimeText(`(${parseInt(totleTime / 1000)}s后关闭)`);
    setTimeout(() => {
      setCountText(time, totleTime - time);
    }, time)
  }

  useEffect(() => {
    setMessage('')
    if (visible) {
      let time = 1000
      if (!isNaN(closeCountTime) && closeCountTime > 0) {
        setCountText(time, closeCountTime)
      }
    }
  }, [visible])


  return visible && <div className={`c-dialog ${isPx2rem ? 'px2rem' : ''}`}>
    <div className="c-dialog-cover">
    <div className={`c-dialog-warp ${className || ''}`} style={style} ref={ref}>
      <div className="c-dialog-header">
        <span>{title}</span>
        <span className="c-dialog-close" onClick={onClose}>+</span>
      </div>
      <div className="c-dialog-content">{children}</div>
      <div className="c-dialog-footer">
        <div className='c-dialog-footer-msg'>{message}</div>
        {footer ? footer : ( footer !== null && <div className={`c-dialog-footer-btn btnbox ${isPx2rem ? 'px2rem' : ''}`}>
          {okText != false && <Button className={isPx2rem ? 'px2rem' : ''} disabled={disabled} onClick={onConfirm}>{okShowText}{countTimeText}</Button>}
          {cancelText !=false && <Button className={`secondary ${isPx2rem ? 'px2rem' : ''}`} onClick={onCancel}>{cancelText}</Button>}
        </div>)}
      </div>
    </div>
    </div>
  </div>
}

export default React.forwardRef(Dialog)