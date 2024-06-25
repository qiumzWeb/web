import React, {useState, useEffect, useRef} from 'react'
import Dialog from './dialog'
import { getResult, toUpper, isEmpty } from 'assets/js'
import Bus from 'assets/js/bus'
import Cookie from 'assets/js/cookie'
export default function App(props) {
  const { autoKey = toUpper(location.pathname), onCancel, onClose, onOk, content, container, closeAction, ...args } = props
  const [visible, setVisible] = useState(true)
  const AutoSubmitStatus = useRef(Cookie.get(autoKey))
  useEffect(() => {
    if (!isEmpty(AutoSubmitStatus.current)) {
      Bus.$emit(autoKey, false)
    }
  }, [])
  // action : 关闭类型 1： 取消按钮， 2： 关闭按钮， 3： 确认按钮
  const call = async (callback, action) => {
    let result = null
    if (typeof callback === 'function') {
      result = await getResult(callback())
    }
    if (result === false) return
    if (typeof result === 'string') return result
    typeof closeAction === 'function' && closeAction(action)
    setVisible(false)
    if (!isEmpty(AutoSubmitStatus.current)) {
      Bus.$emit(autoKey, true)
    }
    container.remove()
  }
  return <Dialog
    {...args}
    visible={visible}
    onCancel={async() => await call(onCancel, 1)}
    onClose={async() => await call(onClose, 2)}
    onOk={async() => await call(onOk, 3)}
  >
      <div className='dialog-confirm-content'>
        {content}
      </div>
  </Dialog>
}